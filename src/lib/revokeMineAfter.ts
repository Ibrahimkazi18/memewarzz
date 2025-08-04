import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { WalletAdapter } from "@solana/wallet-adapter-base";
import { AuthorityType, createSetAuthorityInstruction, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

type RevokeAfterParams = {
  mint: PublicKey;
  userWallet: WalletAdapter;
};

export const revokeMintAfter = async ({
  mint,
  userWallet,
}: RevokeAfterParams) => {
  // Step 1: Set up Umi for wallet integration
  const umi = createUmi("https://api.devnet.solana.com").use(
    walletAdapterIdentity(userWallet)
  );
  const payer = umi.identity;
  const payerPublicKey = new PublicKey(payer.publicKey);

  // Step 2: Establish connection to Solana devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Step 3: Validate mint address
  try {
    new PublicKey(mint);
  } catch (error) {
    console.error("Invalid mint address:", error);
    throw new Error("Invalid mint address provided");
  }

  // Step 4: Create setAuthority instruction to revoke mint authority
  const revokeMintAuthorityIx = createSetAuthorityInstruction(
    mint,
    payerPublicKey,
    AuthorityType.MintTokens,
    null,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  // Step 5: Build transaction
  const transaction = new Transaction().add(revokeMintAuthorityIx);

  // Step 6: Simulate transaction
  console.log("Simulating mint authority revocation...");
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({
    payerKey: payerPublicKey,
    recentBlockhash: blockhash,
    instructions: [revokeMintAuthorityIx],
  }).compileToV0Message();
  const versionedTransaction = new VersionedTransaction(message);

  const simulation = await connection.simulateTransaction(versionedTransaction, {
    commitment: "confirmed",
    sigVerify: false,
  });

  console.log("Simulation Result:", JSON.stringify(simulation.value, null, 2));
  if (simulation.value.err) {
    console.error("Simulation failed:", simulation.value.err);
    console.log("Simulation Logs:", simulation.value.logs);
    throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
  } else {
    console.log("Simulation Logs:", simulation.value.logs);
    console.log("Simulation successful, proceeding with revocation...");
  }

  // Step 7: Sign and send transaction
  try {
    const transactionSignature = await userWallet.sendTransaction(
      transaction,
      connection,
      {
        signers: [],
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }
    );

    // Confirm the transaction
    const { blockhash: latestBlockhash } = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction(
      {
        signature: transactionSignature,
        blockhash: latestBlockhash,
        lastValidBlockHeight: (
          await connection.getLatestBlockhash("confirmed")
        ).lastValidBlockHeight,
      },
      "confirmed"
    );

    return {
      signature: transactionSignature,
      explorerLink: `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`,
    };
  } catch (error) {
    console.error("Mint authority revocation failed:", error);
    throw error; // Rethrow for frontend handling
  }
};