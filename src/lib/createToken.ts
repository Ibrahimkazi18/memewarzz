import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
  createMintToCheckedInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  createUpdateAuthorityInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { WalletAdapter } from "@solana/wallet-adapter-base";

type CreateTokenParams = {
  name: string;
  symbol: string;
  metadataUri: string;
  decimals: number;
  supply: bigint;
  userWallet: WalletAdapter;
  revokeMint: boolean;
  revokeFreeze: boolean;
  revokeUpdate: boolean;
};

export const createTokenWithMetadata = async ({
  name,
  symbol,
  metadataUri,
  decimals,
  supply,
  userWallet,
  revokeMint,
  revokeFreeze,
  revokeUpdate,
}: CreateTokenParams) => {
  // Step 1: Set up Umi for wallet integration
  const umi = createUmi("https://api.devnet.solana.com").use(
    walletAdapterIdentity(userWallet)
  );
  const payer = umi.identity;

  // Step 2: Establish connection to Solana devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Step 3: Validate metadata URI
  if (!metadataUri.startsWith("https://")) {
    throw new Error("Invalid metadata URI: Must start with https://");
  }
  console.log("Valid Metadata URI:", metadataUri);

  // Step 4: Generate new keypair for Mint Account
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Step 5: Convert Umi PublicKey to web3.js PublicKey
  const payerPublicKey = new PublicKey(payer.publicKey);

  // Step 6: Define metadata
  const metaData: TokenMetadata = {
    updateAuthority: payerPublicKey,
    mint: mint,
    name,
    symbol,
    uri: metadataUri,
    additionalMetadata: [],
  };

  // Step 7: Calculate mint size and lamports
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  const metadataLen = pack(metaData).length;
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen
  );

  // Step 8: Build instructions
  // Create account
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payerPublicKey,
    newAccountPubkey: mint,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  // Initialize MetadataPointer
  const initializeMetadataPointerInstruction =
    createInitializeMetadataPointerInstruction(
      mint,
      payerPublicKey,
      mint,
      TOKEN_2022_PROGRAM_ID
    );

  // Initialize Mint
  const initializeMintInstruction = createInitializeMintInstruction(
    mint,
    decimals,
    payerPublicKey,
    revokeFreeze ? null : payerPublicKey,
    TOKEN_2022_PROGRAM_ID
  );

  // Initialize Metadata
  const initializeMetadataInstruction = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint,
    updateAuthority: payerPublicKey,
    mint: mint,
    mintAuthority: payerPublicKey,
    name: metaData.name,
    symbol: metaData.symbol,
    uri: metaData.uri,
  });

  // Create ATA
  const ata = getAssociatedTokenAddressSync(
    mint,
    payerPublicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  const createAtaInstruction = createAssociatedTokenAccountInstruction(
    payerPublicKey,
    ata,
    payerPublicKey,
    mint,
    TOKEN_2022_PROGRAM_ID
  );

  const mintInstruction = createMintToCheckedInstruction(
    mint,
    ata,
    payerPublicKey,
    supply,
    decimals,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  // Conditionally add revoke mint authority
  let revokeMintAuthorityIx;
  if (revokeMint) {
    revokeMintAuthorityIx = createSetAuthorityInstruction(
      mint,
      payerPublicKey,
      AuthorityType.MintTokens,
      null,
      [],
      TOKEN_2022_PROGRAM_ID
    );
  }

  // Conditionally add revoke update authority
  let revokeUpdateAuthorityIx;
  if (revokeUpdate) {
    revokeUpdateAuthorityIx = createUpdateAuthorityInstruction({
      metadata: mint,
      oldAuthority: payerPublicKey,
      newAuthority: null,
      programId: TOKEN_2022_PROGRAM_ID,
    });
  }

  // Step 9: Build transaction
  const transaction = new Transaction().add(
    createAccountInstruction,
    initializeMetadataPointerInstruction,
    initializeMintInstruction,
    initializeMetadataInstruction,
    createAtaInstruction,
    mintInstruction
  );

  // Add revoke instructions conditionally
  if (revokeMint && revokeMintAuthorityIx) {
    transaction.add(revokeMintAuthorityIx);
  }
  if (revokeUpdate && revokeUpdateAuthorityIx) {
    transaction.add(revokeUpdateAuthorityIx);
  }
  // Step 10: Simulate transaction
  console.log("Simulating transaction...");
  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  // Convert to VersionedTransaction for simulation
  const message = new TransactionMessage({
    payerKey: payerPublicKey,
    recentBlockhash: blockhash,
    instructions: [
      createAccountInstruction,
      initializeMetadataPointerInstruction,
      initializeMintInstruction,
      initializeMetadataInstruction,
      createAtaInstruction,
      mintInstruction,
      ...(revokeMint && revokeMintAuthorityIx ? [revokeMintAuthorityIx] : []),
      ...(revokeUpdate && revokeUpdateAuthorityIx
        ? [revokeUpdateAuthorityIx]
        : []),
    ],
  }).compileToV0Message();
  const versionedTransaction = new VersionedTransaction(message);

  // Sign for simulation
  versionedTransaction.sign([mintKeypair]);
  const simulation = await connection.simulateTransaction(
    versionedTransaction,
    {
      commitment: "confirmed",
      sigVerify: false,
    }
  );

  console.log("Simulation Result:", JSON.stringify(simulation.value, null, 2));
  if (simulation.value.err) {
    console.error("Simulation failed:", simulation.value.err);
    console.log("Simulation Logs:", simulation.value.logs);
    throw new Error(
      `Simulation failed: ${JSON.stringify(simulation.value.err)}`
    );
  } else {
    console.log("Simulation Logs:", simulation.value.logs);
    console.log("Simulation successful, proceeding with transaction...");
  }

  // Step 11: Sign and send transaction
  try {
    // Use wallet adapter's sendTransaction to sign and send
    const transactionSignature = await userWallet.sendTransaction(
      transaction,
      connection,
      {
        signers: [mintKeypair],
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }
    );

    // Confirm the transaction
    const { blockhash: latestBlockhash } = await connection.getLatestBlockhash(
      "confirmed"
    );
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
      mintAddress: mint,
      explorerLink: `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`,
    };
  } catch (error) {
    console.error("Token creation failed:", error);
    throw error;
  }
};
