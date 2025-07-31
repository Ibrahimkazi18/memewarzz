import {
  createFungible,
  mplTokenMetadata,
  updateV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mintTokensTo,
  setAuthority,
  AuthorityType,
} from "@metaplex-foundation/mpl-toolbox";
import {
  percentAmount,
  signerIdentity,
  Signer,
  generateSigner,
  transactionBuilder,
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
  revokeMint?: boolean; // Optional, defaults to false
};

export const createTokenWithMetadata = async ({
  name,
  symbol,
  metadataUri,
  decimals,
  supply,
  userWallet,
  revokeMint = false,
}: CreateTokenParams) => {
  const umi = createUmi("https://api.devnet.solana.com").use(
    mplTokenMetadata()
  );
  umi.use(signerIdentity(userWallet));

  const mintSigner = generateSigner(umi);

  // Create mint with metadata
  const createFungibleIx = createFungible(umi, {
    mint: mintSigner,
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals,
    updateAuthority: userWallet.publicKey,
  });

  // Create ATA if needed
  const createTokenIx = createTokenIfMissing(umi, {
    mint: mintSigner.publicKey,
    owner: userWallet.publicKey,
    ataProgram: getSplAssociatedTokenProgramId(umi),
  });

  // Mint tokens to user's ATA
  const mintTokensIx = mintTokensTo(umi, {
    mint: mintSigner.publicKey,
    token: findAssociatedTokenPda(umi, {
      mint: mintSigner.publicKey,
      owner: userWallet.publicKey,
    }),
    amount: supply,
  });

  // Send transaction
  const tx = await transactionBuilder()
    .add(createFungibleIx)
    .add(createTokenIx)
    .add(mintTokensIx)
    .sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

  const signature = base58.deserialize(tx.signature)[0];

  // Revoke authorities (commented out as requested)
  /*
  const revokeFreezeIx = setAuthority(umi, {
    owned: mintSigner.publicKey,
    owner: userWallet.publicKey,
    authorityType: AuthorityType.FreezeAccount,
    newAuthority: none(),
  });

  const revokeBuilder = transactionBuilder().add(revokeFreezeIx);

  if (revokeMint) {
    const revokeMintIx = setAuthority(umi, {
      owned: mintSigner.publicKey,
      owner: userWallet.publicKey,
      authorityType: AuthorityType.MintTokens,
      newAuthority: none(),
    });
    revokeBuilder.add(revokeMintIx);
  }

  await revokeBuilder.sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
  */

  return {
    signature,
    mintAddress: mintSigner.publicKey.toString(),
    explorerLink: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  };
};