import {
  createAndMint,
  createMetadataAccountV3,
  createV1,
  findMetadataPda,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  setAuthority,
  AuthorityType,
  setComputeUnitLimit,
  createAssociatedToken,
  SPL_TOKEN_PROGRAM_ID,
  SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  mintTokensTo,
  createAccount,
  createMint,
  findAssociatedTokenPda,
} from "@metaplex-foundation/mpl-toolbox";
import {
  percentAmount,
  signerIdentity,
  Signer,
  generateSigner,
  transactionBuilder,
  none,
  publicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  WalletAdapter,
  walletAdapterIdentity,
} from "@metaplex-foundation/umi-signer-wallet-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";

type CreateTokenParams = {
  name: string;
  symbol: string;
  metadataUri: string;
  decimals: number;
  supply: bigint;
  userWallet: WalletAdapter;
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
  const umi = createUmi("https://api.devnet.solana.com")
    .use(walletAdapterIdentity(userWallet))
    .use(mplTokenMetadata());

  if (!metadataUri.startsWith("https://")) {
    throw new Error("Invalid metadata URI: Must start with https://");
  } else {
    console.log("Valid Metadata URI : ", metadataUri);
  }
  const token2022ProgramId = publicKey(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
  );
  const mint = generateSigner(umi);

  // Step 1: Create Token-2022 fungible token with metadata
  const createTokenIx = createV1(umi, {
    mint: mint,
    name,
    symbol,
    uri: metadataUri,
    decimals,
    sellerFeeBasisPoints: percentAmount(0),
    splTokenProgram: token2022ProgramId,
    tokenStandard: TokenStandard.Fungible,
    authority: umi.identity,
    updateAuthority: umi.identity,
  });

  // Step 2: Create Associated Token Account (ATA) for Token-2022
  const ata = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
    tokenProgramId: token2022ProgramId, // Token program for the mint
  });

  // Step 3: Mint tokens to user's ATA
  const mintTokensIx = mintV1(umi, {
    mint: mint.publicKey,
    token: ata,
    amount: supply,
    authority: umi.identity,
    tokenOwner: umi.identity.publicKey,
    tokenStandard: TokenStandard.Fungible,
    splTokenProgram: token2022ProgramId,
  });

  try {
    // Build and simulate the transaction
    const builder = transactionBuilder()
      .add(createTokenIx)
      .add(mintTokensIx)
    const builderWithBlockhash = await builder.setLatestBlockhash(umi);
    const transaction = builderWithBlockhash.build(umi);

    const simulation = await umi.rpc.simulateTransaction(transaction, {
      commitment: "confirmed",
    });

    console.log("Simulation Result:", simulation);
    console.log("Simulation Logs:", simulation.logs);
    if (simulation.err) {
      console.error("Simulation failed:", simulation.err);
      throw new Error(`Simulation failed: ${JSON.stringify(simulation.err)}`);
    }

    // Execute the transaction
    const tx = await transactionBuilder()
      .add(createTokenIx)
      .add(mintTokensIx)
      .sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    const signature = base58.deserialize(tx.signature)[0];
    const signatureForTx = tx.signature;

    // Debug: Check metadata account
    const metadataPda = findMetadataPda(umi, { mint: mint.publicKey });
    const metadataAccount = await umi.rpc.getAccount(metadataPda[0]);
    if (metadataAccount.exists) {
      console.log("Metadata Account Exists!");
      console.log("Metadata Account Data:", metadataAccount.data.toString());
    } else {
      console.error("Metadata Account does not exist!");
    }

    // Debug: Fetch transaction logs
    const transactionDetails = await umi.rpc.getTransaction(signatureForTx);
    if (transactionDetails && transactionDetails.meta) {
      console.log("Transaction Logs:", transactionDetails.meta.logs);
    } else {
      console.log("No transaction details available. Retrying after delay...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const retryDetails = await umi.rpc.getTransaction(signatureForTx);
      console.log(
        "Retry Transaction Logs:",
        retryDetails?.meta?.logs || "Still unavailable"
      );
    }

    return {
      signature,
      mintAddress: mint.publicKey.toString(),
      explorerLink: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    };
  } catch (error) {
    console.error("Token creation failed:", error);
    throw error;
  }
};

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
