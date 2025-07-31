import {
  createV1,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  setAuthority,
  AuthorityType,
} from "@metaplex-foundation/mpl-toolbox";
import {
  percentAmount,
  signerIdentity,
  Signer,
  generateSigner,
  transactionBuilder,
  publicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";

type CreateTokenParams = {
  name: string;
  symbol: string;
  metadataUri: string;
  decimals: number;
  supply: bigint;
  userWallet: Signer;
  revokeMint: boolean;
};

export const createTokenWithMetadata = async ({
  name,
  symbol,
  metadataUri,
  decimals,
  supply,
  userWallet,
  revokeMint,
}: CreateTokenParams) => {
  const umi = createUmi("https://api.devnet.solana.com").use(mplTokenMetadata());
  umi.use(signerIdentity(userWallet));

  const mintSigner = generateSigner(umi);
  const token2022ProgramId = publicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

  try {
    // Step 1: Create Token-2022 fungible token with metadata
    const createTokenIx = createV1(umi, {
      mint: mintSigner,
      name,
      symbol,
      uri: metadataUri,
      decimals,
      sellerFeeBasisPoints: percentAmount(0),
      splTokenProgram: token2022ProgramId,
      tokenStandard: TokenStandard.Fungible,
      authority: userWallet,
      updateAuthority: userWallet,
    });

    // Step 2: Create Associated Token Account (ATA) for Token-2022
    const ata = findAssociatedTokenPda(umi, {
      mint: mintSigner.publicKey,
      owner: userWallet.publicKey,
      tokenProgramId: token2022ProgramId, // Token program for the mint
    });

    // Step 3: Mint tokens to user's ATA
    const mintTokensIx = mintV1(umi, {
      mint: mintSigner.publicKey,
      token: ata,
      amount: supply,
      authority: userWallet,
      tokenOwner: userWallet.publicKey,
      tokenStandard: TokenStandard.Fungible,
      splTokenProgram: token2022ProgramId,
    });

    // Step 4: Send and confirm the creation and minting transaction
    const createTx = await transactionBuilder()
      .add(createTokenIx)
      .add(mintTokensIx)
      .sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    const signature = base58.deserialize(createTx.signature)[0];

    // Step 5: Revoke authorities (freeze always, mint conditionally)
    const revokeFreezeIx = setAuthority(umi, {
      owned: mintSigner.publicKey,
      owner: userWallet.publicKey,
      authorityType: AuthorityType.FreezeAccount,
      newAuthority: null,
    });

    const revokeBuilder = transactionBuilder().add(revokeFreezeIx);

    if (revokeMint) {
      const revokeMintIx = setAuthority(umi, {
        owned: mintSigner.publicKey,
        owner: userWallet.publicKey,
        authorityType: AuthorityType.MintTokens,
        newAuthority: null,
      });
      revokeBuilder.add(revokeMintIx);
    }

    await revokeBuilder.sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    return {
      signature,
      mintAddress: mintSigner.publicKey.toString(),
      explorerLink: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    };
  } catch (error: any) {
    console.error("Error creating token:", error);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    throw new Error(`Failed to create token: ${error.message}`);
  }
};