import {
  createFungible,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mintTokensTo,
} from "@metaplex-foundation/mpl-toolbox";
import {
  percentAmount,
  signerIdentity,
  Signer,
  generateSigner,
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
};

export const createTokenWithMetadata = async ({
  name,
  symbol,
  metadataUri,
  decimals,
  supply,
  userWallet,
}: CreateTokenParams) => {
  const umi = createUmi("https://api.devnet.solana.com").use(
    mplTokenMetadata()
  );
  umi.use(signerIdentity(userWallet));

  const mintSigner = generateSigner(umi);

  // Create mint
  const createFungibleIx = createFungible(umi, {
    mint: mintSigner,
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals,
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
  const tx = await createFungibleIx
    .add(createTokenIx)
    .add(mintTokensIx)
    .sendAndConfirm(umi);

  const signature = base58.deserialize(tx.signature)[0];
  return {
    signature,
    mintAddress: mintSigner.publicKey.toString(),
    explorerLink: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  };
};