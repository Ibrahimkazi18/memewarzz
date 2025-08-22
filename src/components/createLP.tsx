"use client";

import { useEffect, useState, useRef } from "react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  SendTransactionError,
} from "@solana/web3.js";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  getTokenMetadata,
  getMetadataPointerState,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import {
  Raydium,
  TxVersion,
  type TokenInfo,
  type ApiCpmmConfigInfo,
  getCpmmPdaAmmConfigId,
  DEVNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import CreatableSelect from "react-select/creatable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Wallet } from "lucide-react";

// Optional MPL metadata lib (guarded)
let MetaplexMetadata: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MetaplexMetadata = require("@metaplex-foundation/mpl-token-metadata");
} catch (e) {
  MetaplexMetadata = null;
}

interface CreateLiquidityPoolProps {
  connection: Connection;
}

interface TokenInfoExtended extends TokenInfo {
  image?: string;
  balance?: string;
}

interface PoolFormState {
  baseToken: TokenInfoExtended | null;
  quoteToken: TokenInfoExtended | null;
  baseAmount: string;
  quoteAmount: string;
  feeTier: "0.25" | "0.3" | "0.5" | "1" | "4";
  isCreatingPool: boolean;
}

// Seed tokens for initial quote list
const defaultTokens: TokenInfoExtended[] = [
  {
    chainId: 0,
    address: "So11111111111111111111111111111111111111112",
    programId: TOKEN_PROGRAM_ID.toBase58(),
    logoURI: "",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    tags: [],
    extensions: {},
    priority: 0,
    image: "",
    balance: "0",
  },
  {
    chainId: 0,
    address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERJPJgZJDncDU",
    programId: TOKEN_PROGRAM_ID.toBase58(),
    logoURI: "",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    tags: [],
    extensions: {},
    priority: 0,
    image: "",
    balance: "0",
  },
];

const feeTierToIndex: { [key in PoolFormState["feeTier"]]: number } = {
  "0.25": 0,
  "0.3": 1,
  "0.5": 2,
  "1": 3,
  "4": 4,
};

export default function CreateLiquidityPool({
  connection,
}: CreateLiquidityPoolProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const [baseToken, setBaseToken] = useState<PoolFormState["baseToken"]>(null);
  const [quoteToken, setQuoteToken] =
    useState<PoolFormState["quoteToken"]>(null);
  const [baseAmount, setBaseAmount] =
    useState<PoolFormState["baseAmount"]>("0");
  const [quoteAmount, setQuoteAmount] =
    useState<PoolFormState["quoteAmount"]>("0");
  const [feeTier, setFeeTier] = useState<PoolFormState["feeTier"]>("0.25");
  const [isCreatingPool, setIsCreatingPool] =
    useState<PoolFormState["isCreatingPool"]>(false);

  const [tokenList, setTokenList] =
    useState<TokenInfoExtended[]>(defaultTokens);
  const [solanaTokenListMap, setSolanaTokenListMap] = useState<
    Map<string, any>
  >(new Map());
  const [raydium, setRaydium] = useState<Raydium | null>(null);

  // Metadata cache
  const metadataCache = new Map<
    string,
    { symbol?: string; name?: string; image?: string }
  >();

  // UI: popover toggles
  const [showBaseSelect, setShowBaseSelect] = useState(false);
  const [showQuoteSelect, setShowQuoteSelect] = useState(false);
  const baseSelectRef = useRef<HTMLDivElement | null>(null);
  const quoteSelectRef = useRef<HTMLDivElement | null>(null);

  // Initialize Raydium
  useEffect(() => {
    const init = async () => {
      if (raydium) return;
      if (!publicKey || !signAllTransactions) return;
      try {
        const cluster = (connection as any).rpcEndpoint?.includes("devnet")
          ? "devnet"
          : "mainnet";
        const instance = await Raydium.load({
          connection,
          cluster,
          owner: publicKey,
          signAllTransactions,
          disableFeatureCheck: true,
          disableLoadToken: true,
          blockhashCommitment: "confirmed",
        });
        setRaydium(instance);
      } catch (e) {
        console.error("Failed to load Raydium:", e);
      }
    };
    init();
  }, [connection, publicKey, signAllTransactions]);

  useEffect(() => {
    if (!raydium || !publicKey) return;
    try {
      raydium.setOwner(publicKey);
    } catch (e) {
      console.error("Failed to set owner on Raydium instance:", e);
    }
  }, [raydium, publicKey]);

  // Fetch Solana token list for metadata fallback
  useEffect(() => {
    (async () => {
      try {
        const url =
          "https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json";
        const resp = await fetch(url, { cache: "no-store" });
        const json = await resp.json();
        const entries = Array.isArray(json.tokens)
          ? json.tokens
          : json.tokens ?? [];
        const map = new Map<string, any>();
        for (const e of entries) {
          const mint = e.address || e.mint || e.tokenAddress || null;
          if (!mint) continue;
          map.set(mint, e);
        }
        setSolanaTokenListMap(map);

        // Update default tokens metadata
        setTokenList((prev) =>
          prev.map((t) => {
            const found = map.get(t.address);
            if (!found) return t;
            return {
              ...t,
              symbol: found.symbol || t.symbol,
              name: found.name || t.name,
              image: found.logoURI || found.logo || t.image,
              logoURI: found.logoURI || t.logoURI || t.logoURI,
              decimals:
                typeof found.decimals === "number"
                  ? found.decimals
                  : t.decimals,
            } as TokenInfoExtended;
          })
        );
      } catch (e) {
        console.warn("Could not fetch Solana token list:", e);
      }
    })();
  }, [connection]);

  // Update SOL balance
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!publicKey) {
        if (mounted) {
          setTokenList((prev) =>
            prev.map((t) =>
              t.address === defaultTokens[0].address
                ? { ...t, balance: "0" }
                : t
            )
          );
        }
        return;
      }
      try {
        const solBal = (
          (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL
        ).toString();
        if (mounted)
          setTokenList((prev) =>
            prev.map((t) =>
              t.address === defaultTokens[0].address
                ? { ...t, balance: solBal }
                : t
            )
          );
      } catch (e) {
        console.error("Error updating SOL balance:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [connection, publicKey]);

  // Metaplex PDA reader
  const tryFetchMetaplexMetadata = async (mintPubkey: PublicKey) => {
    if (!MetaplexMetadata) return null;
    try {
      const { Metadata } = MetaplexMetadata;
      const [pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          Metadata.PROGRAM_ID.toBuffer(),
          mintPubkey.toBuffer(),
        ],
        Metadata.PROGRAM_ID
      );
      const acc = await connection.getAccountInfo(pda, "confirmed");
      if (!acc || !acc.data) return null;
      if (typeof Metadata.deserialize === "function") {
        const [metadata] = Metadata.deserialize(acc.data);
        const md = metadata?.data;
        if (md) {
          return {
            name: (md.name || "").trim(),
            symbol: (md.symbol || "").trim(),
            uri: (md.uri || "").trim(),
          };
        }
      } else if (typeof Metadata.fromAccountInfo === "function") {
        const { metadata } = Metadata.fromAccountInfo(acc);
        if (metadata?.data) {
          const md = metadata.data;
          return {
            name: (md.name || "").trim(),
            symbol: (md.symbol || "").trim(),
            uri: (md.uri || "").trim(),
          };
        }
      }
      return null;
    } catch (e) {
      console.warn(
        `Failed to fetch Metaplex metadata for mint ${mintPubkey}:`,
        e
      );
      return null;
    }
  };

  // Fetch token info on-chain
  async function fetchTokenInfo(
    mint: string
  ): Promise<TokenInfoExtended | null> {
    try {
      const mintPubkey = new PublicKey(mint);
      const accountInfo = await connection.getAccountInfo(
        mintPubkey,
        "confirmed"
      );
      if (!accountInfo) throw new Error("Mint not found on chain.");

      const isToken2022 = accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
      const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      // Get mint info
      let decimals = 0;
      try {
        const mintInfo = await getMint(
          connection,
          mintPubkey,
          "confirmed",
          programId
        );
        decimals = mintInfo?.decimals ?? 0;
      } catch (e) {
        console.warn(`Failed to fetch mint info for ${mint}:`, e);
        decimals = 0;
      }

      let name: string | undefined;
      let symbol: string | undefined;
      let image: string | undefined;

      // Check cache first
      if (metadataCache.has(mint)) {
        const cached = metadataCache.get(mint)!;
        symbol = cached.symbol;
        name = cached.name;
        image = cached.image;
      } else {
        // Try Token Metadata Interface for Token-2022
        if (isToken2022) {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const metadataPointer = getMetadataPointerState(
                await getMint(connection, mintPubkey, "confirmed", programId)
              );
              if (metadataPointer?.metadataAddress) {
                const metadata = await getTokenMetadata(connection, mintPubkey);
                if (metadata) {
                  symbol = metadata.symbol || undefined;
                  name = metadata.name || undefined;
                  image = metadata.uri
                    ? (await (await fetch(metadata.uri)).json()).image
                    : undefined;
                  break;
                }
              }
            } catch (e) {
              console.warn(
                `Token Metadata attempt ${
                  attempt + 1
                } failed for mint ${mint}:`,
                e
              );
              if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }

        // Fallback to Metaplex for SPL tokens
        if (!symbol && !name && !isToken2022) {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const md = await tryFetchMetaplexMetadata(mintPubkey);
              if (md) {
                symbol = md.symbol || undefined;
                name = md.name || undefined;
                if (md.uri) {
                  const uriResp = await fetch(md.uri, {
                    cache: "no-store",
                  }).then((r) => r.json());
                  image =
                    uriResp?.image ||
                    uriResp?.image_url ||
                    uriResp?.logo ||
                    undefined;
                }
                break;
              }
            } catch (e) {
              console.warn(
                `Metaplex attempt ${attempt + 1} failed for mint ${mint}:`,
                e
              );
              if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }

        // Fallback to Solana token list
        if (!symbol || !name) {
          const found = solanaTokenListMap.get(mint);
          if (found) {
            symbol = found.symbol || symbol || undefined;
            name = found.name || name || undefined;
            image = found.logoURI || found.logo || image || undefined;
            decimals =
              typeof found.decimals === "number" ? found.decimals : decimals;
          }
        }

        // Final fallback
        if (!symbol) symbol = mint.slice(0, 6);
        if (!name) name = mint;

        // Cache metadata
        if (symbol || name || image) {
          metadataCache.set(mint, { symbol, name, image });
        }
      }

      // Fetch balance
      let balance = "0";
      if (publicKey) {
        try {
          const ata = await getAssociatedTokenAddress(
            mintPubkey,
            publicKey,
            false,
            programId
          );
          const account = await getAccount(
            connection,
            ata,
            "confirmed",
            programId
          );
          const raw = (account as any).amount ?? "0";
          balance = (Number(raw) / 10 ** (decimals || 0)).toString();
        } catch {
          // Ignore ATA not found
        }
      }

      return {
        chainId: 0,
        address: mint,
        programId: programId.toBase58(),
        logoURI: image,
        symbol,
        name,
        decimals,
        tags: [],
        extensions: {},
        priority: 0,
        balance,
        image,
      } as TokenInfoExtended;
    } catch (err) {
      console.error("Error fetching token info:", err);
      return null;
    }
  }

  // Handle token selection
  const handleTokenChange = async (
    selectedOption: any,
    setToken: (t: TokenInfoExtended | null) => void
  ) => {
    if (!selectedOption) {
      setToken(null);
      return;
    }

    // Pasted mint
    if (selectedOption?.__isNew__) {
      const mint = selectedOption.value;
      const info = await fetchTokenInfo(mint);
      if (!info) {
        toast.error("Failed to load token metadata for that mint.", {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-300",
        });
        return;
      }

      setTokenList((prev) =>
        prev.some((t) => t.address === info.address) ? prev : [...prev, info]
      );
      setToken(info);
      return;
    }

    // Selected from options
    const item = selectedOption;
    const built: TokenInfoExtended = {
      chainId: 0,
      address: item.value,
      programId: item.programId || TOKEN_PROGRAM_ID.toBase58(),
      logoURI: item.image || item.logoURI || "",
      symbol: item.label || item.symbol || item.value.slice(0, 6),
      name: item.name || item.label || item.value,
      decimals: item.decimals ?? 0,
      tags: item.tags || [],
      extensions: item.extensions || {},
      priority: item.priority ?? 0,
      image: item.image || item.logoURI || "",
      balance: item.balance ?? "0",
    };

    setToken(built);
  };

  // Price helper
  const initialPrice =
    baseAmount && quoteAmount && Number(baseAmount) > 0
      ? Number(quoteAmount) / Number(baseAmount)
      : null;

  // React-select styles: opaque control and menu
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "rgb(245, 245, 245) !important"
        : "rgb(255, 255, 255) !important",
      opacity: "1 !important",
      borderColor: state.isFocused ? "rgb(34 197 94)" : "rgb(200, 200, 200)",
      borderRadius: "8px",
      minHeight: "48px",
      boxShadow: state.isFocused ? "0 0 0 2px rgb(34 197 94 / 0.2)" : "none",
      "&:hover": { borderColor: "rgb(34 197 94)" },
      paddingLeft: "12px",
      "@media (prefers-color-scheme: dark)": {
        backgroundColor: state.isFocused
          ? "rgb(39, 39, 39) !important"
          : "rgb(24, 24, 24) !important",
        borderColor: state.isFocused ? "rgb(34 197 94)" : "rgb(82, 82, 82)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "rgb(255, 255, 255) !important",
      opacity: "1 !important",
      border: "1px solid rgb(200, 200, 200)",
      borderRadius: "8px",
      boxShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)",
      zIndex: 9999,
      "@media (prefers-color-scheme: dark)": {
        backgroundColor: "rgb(24, 24, 24) !important",
        border: "1px solid rgb(82, 82, 82)",
      },
    }),
    menuList: (base: any) => ({
      ...base,
      backgroundColor: "rgb(255, 255, 255) !important",
      opacity: "1 !important",
      "@media (prefers-color-scheme: dark)": {
        backgroundColor: "rgb(24, 24, 24) !important",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "rgb(34 197 94) !important"
        : state.isFocused
        ? "rgb(230, 230, 230) !important"
        : "rgb(255, 255, 255) !important",
      opacity: "1 !important",
      color: state.isSelected ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
      "&:hover": { backgroundColor: "rgb(230, 230, 230) !important" },
      "@media (prefers-color-scheme: dark)": {
        backgroundColor: state.isSelected
          ? "rgb(34 197 94) !important"
          : state.isFocused
          ? "rgb(64, 64, 64) !important"
          : "rgb(24, 24, 24) !important",
        color: state.isSelected ? "rgb(255, 255, 255)" : "rgb(229, 231, 235)",
        "&:hover": { backgroundColor: "rgb(64, 64, 64) !important" },
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "rgb(0, 0, 0)",
      opacity: "1 !important",
      paddingLeft: "12px",
      "@media (prefers-color-scheme: dark)": {
        color: "rgb(229, 231, 235)",
      },
    }),
    placeholder: (base: any, state: any) => ({
      ...base,
      color: "rgb(100, 100, 100)",
      opacity:
        state.hasValue || state.isFocused ? "0 !important" : "1 !important",
      transition: "opacity 0.2s ease",
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      "@media (prefers-color-scheme: dark)": {
        color: "rgb(156, 163, 175)",
      },
    }),
    input: (base: any) => ({
      ...base,
      color: "rgb(0, 0, 0)",
      backgroundColor: "transparent !important",
      opacity: "1 !important",
      zIndex: 1,
      paddingLeft: "12px",
      "@media (prefers-color-scheme: dark)": {
        color: "rgb(229, 231, 235)",
        backgroundColor: "transparent !important",
      },
    }),
  };

  // Build options for base and quote
  const buildOptionsBase = () =>
    tokenList
      .filter((t) => t.address !== quoteToken?.address) // Avoid selecting same token
      .map((t) => ({
        value: t.address,
        label: t.symbol,
        name: t.name,
        image: t.image || t.logoURI || "",
        decimals: t.decimals,
        programId: t.programId,
        balance: t.balance,
      }));

  const buildOptionsQuote = () =>
    tokenList
      .filter((t) => t.address !== baseToken?.address) // Avoid selecting same token
      .map((t) => ({
        value: t.address,
        label: t.symbol,
        name: t.name,
        image: t.image || t.logoURI || "",
        decimals: t.decimals,
        programId: t.programId,
        balance: t.balance,
      }));

  // Toast wrappers
  const showError = (m: string) =>
    toast.error(m, {
      className: "bg-red-500 text-white",
      progressClassName: "bg-red-300",
    });
  const showSuccess = (m: string) =>
    toast.success(m, {
      className: "bg-green-500 text-white",
      progressClassName: "bg-green-300",
    });
  const showInfo = (m: string) =>
    toast.info(m, {
      className: "bg-blue-500 text-white",
      progressClassName: "bg-blue-300",
    });

  // Create pool logic (unchanged)
  const handleCreatePool = async () => {
    if (
      !baseToken ||
      !quoteToken ||
      !baseAmount ||
      !quoteAmount ||
      !feeTier ||
      !raydium ||
      !publicKey ||
      !signTransaction
    ) {
      showError("Please connect your wallet and fill all required fields.");
      return;
    }

    setIsCreatingPool(true);
    try {
      const baseAmountNum = Number(baseAmount);
      const quoteAmountNum = Number(quoteAmount);
      if (
        isNaN(baseAmountNum) ||
        isNaN(quoteAmountNum) ||
        baseAmountNum <= 0 ||
        quoteAmountNum <= 0
      ) {
        showError("Please provide valid amounts greater than 0.");
        setIsCreatingPool(false);
        return;
      }

      // Update balance check to include feeLamports
      const balance = await connection.getBalance(publicKey);
      const feeLamports = Math.round(0.2 * LAMPORTS_PER_SOL);
      const totalSolNeeded =
        0.2 * LAMPORTS_PER_SOL +
        feeLamports +
        (baseToken.address === defaultTokens[0].address
          ? baseAmountNum * LAMPORTS_PER_SOL
          : 0) +
        (quoteToken.address === defaultTokens[0].address
          ? quoteAmountNum * LAMPORTS_PER_SOL
          : 0) +
        50000; // Buffer for tx fees
      if (balance < totalSolNeeded) {
        showError(
          `Insufficient SOL. Need about ${(
            totalSolNeeded / LAMPORTS_PER_SOL
          ).toFixed(4)} SOL.`
        );
        setIsCreatingPool(false);
        return;
      }

      // Verify fee receiver account exists
      const FEE_RECEIVER_ADDRESS = new PublicKey(
        "5Ho3jiUKmD3Ydiryq9RxEpXdQB6CKSxgiETFibMEEtUM"
      );
      const feeReceiverInfo = await connection.getAccountInfo(
        FEE_RECEIVER_ADDRESS
      );
      if (!feeReceiverInfo) {
        showError("Fee receiver account does not exist on devnet.");
        setIsCreatingPool(false);
        return;
      }

      const mintA: Pick<TokenInfo, "address" | "decimals" | "programId"> = {
        address: baseToken.address,
        programId: baseToken.programId,
        decimals: baseToken.decimals,
      };
      const mintB: Pick<TokenInfo, "address" | "decimals" | "programId"> = {
        address: quoteToken.address,
        programId: quoteToken.programId,
        decimals: quoteToken.decimals,
      };

      // Check if base token has freeze authority revoked
      try {
        const baseMintPubkey = new PublicKey(baseToken.address);
        const baseMintInfo = await getMint(
          connection,
          baseMintPubkey,
          "confirmed",
          new PublicKey(baseToken.programId)
        );
        if (baseMintInfo.freezeAuthority !== null) {
          showError("Base token must have its freeze authority revoked.");
          setIsCreatingPool(false);
          return;
        }
      } catch (e) {
        console.error("Failed to check base token freeze authority:", e);
        showError("Failed to verify base token freeze authority.");
        setIsCreatingPool(false);
        return;
      }

      const feeConfigs: ApiCpmmConfigInfo[] =
        await raydium.api.getCpmmConfigs();
      feeConfigs.forEach((config) => {
        config.id = getCpmmPdaAmmConfigId(
          DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
          config.index
        ).publicKey.toBase58();
      });
      const selectedFeeConfig = feeConfigs[feeTierToIndex[feeTier]];

      const mintAAmount = new BN(
        (Number(baseAmount) * 10 ** baseToken.decimals).toFixed(0)
      );
      const mintBAmount = new BN(
        (Number(quoteAmount) * 10 ** quoteToken.decimals).toFixed(0)
      );

      const { transaction } = await raydium.cpmm.createPool({
        programId: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
        poolFeeAccount: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC,
        mintA,
        mintB,
        mintAAmount,
        mintBAmount,
        startTime: new BN(0),
        feeConfig: selectedFeeConfig,
        associatedOnly: false,
        ownerInfo: { useSOLBalance: true },
        txVersion: TxVersion.LEGACY,
      });

      // Create fee transfer instruction
      const feeTransferIx = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: FEE_RECEIVER_ADDRESS,
        lamports: feeLamports,
      });

      // Create TransactionMessage with all instructions
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      const message = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [feeTransferIx, ...transaction.instructions],
      }).compileToV0Message();

      // Create VersionedTransaction
      const newTransaction = new VersionedTransaction(message);

      // Simulate
      const simulation = await connection.simulateTransaction(newTransaction, {
        commitment: "confirmed",
        sigVerify: false,
      });
      if (simulation.value.err) {
        showError(
          "Transaction simulation failed. Check token mints, balances, or fee receiver."
        );
        console.error("Simulation logs:", simulation.value.logs);
        setIsCreatingPool(false);
        return;
      }
      showSuccess("Simulation passed.");

      // Sign the transaction with the wallet
      const signedTx = await signTransaction(newTransaction).catch((err) => {
        throw new Error(`Failed to sign transaction: ${err.message}`);
      });

      // Send the signed transaction
      let txId: string;
      try {
        txId = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });
      } catch (err: any) {
        if (err instanceof SendTransactionError) {
          const logs = await err.getLogs(connection);
          console.error("SendTransactionError logs:", logs);
          showError(
            `Transaction failed: ${err.message}. See console for logs.`
          );
        } else {
          showError(`Failed to send transaction: ${err.message}`);
        }
        setIsCreatingPool(false);
        return;
      }

      // Confirm the transaction
      await connection.confirmTransaction(
        {
          signature: txId,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );
      showSuccess(`Pool created! Tx: ${txId}`);
    } catch (err: any) {
      console.error("Create pool failed:", err);
      showError(
        err?.message || "Failed to create pool. See console for details."
      );
    } finally {
      setIsCreatingPool(false);
    }
  };

  // Render option label
  const formatOptionLabel = (option: any, { context }: any) => {
    const showMint = context === "menu";
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3 overflow-hidden">
          {option.image ? (
            <img
              src={option.image || "/placeholder.svg"}
              alt={option.label}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
              {option.label?.slice(0, 2) ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium truncate">{option.label}</div>
            </div>
            {showMint && (
              <div className="text-xs text-muted-foreground truncate">
                {option.value}
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {option.balance || "0"}
        </div>
      </div>
    );
  };

  // Close select on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        baseSelectRef.current &&
        !baseSelectRef.current.contains(e.target as Node)
      )
        setShowBaseSelect(false);
      if (
        quoteSelectRef.current &&
        !quoteSelectRef.current.contains(e.target as Node)
      )
        setShowQuoteSelect(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Open Raydium portfolio
  const openPortfolio = (url = "https://raydium.io/portfolio/") => {
    try {
      toast.info("Opening Raydium Portfolio in a new tab...", {
        className: "bg-blue-600 text-white",
        progressClassName: "bg-blue-300",
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error("Failed to open Raydium Portfolio.", {
        className: "bg-red-500 text-white",
        progressClassName: "bg-red-300",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-10">
      <section className="bg-muted p-6 rounded-xl shadow-lg space-y-4">
        <h2 className="text-2xl font-semibold text-center">How it works</h2>
        <p className="text-muted-foreground text-left">
          <ol className="list-decimal list-inside space-y-2 text-left inline-block">
            <li>
              Select your token (SPL or Token-2022) as the{" "}
              <strong>Base Token</strong>.
            </li>
            <li>
              Enter the amount to deposit into the pool (recommended: 95%+ of
              supply).
            </li>
            <li>
              Choose a <strong>Quote Token</strong> (SOL recommended).
            </li>
            <li>
              Enter the amount of quote token to pair (recommended: 10+ SOL).
            </li>
            <li>
              Pick a <strong>Fee Tier</strong> — liquidity providers earn 84% of
              fees, Raydium receives 16%.
            </li>
            <li>
              Click <em>“Initialize Liquidity Pool”</em> and approve (~0.4 SOL
              cost).
            </li>
            <li>Receive LP tokens; burn them to lock liquidity if desired.</li>
            <li>Note: Initial quote token amount determines starting price.</li>
          </ol>
        </p>

        <div className="bg-card text-card-foreground p-3 rounded-lg text-center text-sm font-medium border">
          Pool creation fee: <span className="font-semibold">~0.4 SOL(0.2 platform fee + 0.2 for raydium)</span> +
          gas fees
        </div>
      </section>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Liquidity Pool Creator</CardTitle>
          <CardDescription>
            Configure your pool parameters and add initial liquidity
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-5">
            <Label className="text-base font-medium px-2">
              Base Token
              <div className="flex items-center ml-auto gap-2">
                <span className="text-sm gap-2 underline text-muted-foreground flex items-center">
                  <Wallet size={20} /> {baseToken?.balance || "0"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (baseToken?.balance) {
                      const halfBalance = (
                        Number(baseToken.balance) * 0.5
                      ).toString();
                      setBaseAmount(halfBalance);
                    }
                  }}
                  disabled={!baseToken?.balance}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (baseToken?.balance) {
                      setBaseAmount(baseToken.balance);
                    }
                  }}
                  disabled={!baseToken?.balance}
                >
                  100%
                </Button>
              </div>
            </Label>
            <div className="flex gap-3 bg-zinc-300 dark:bg-black p-3 rounded-xl">
              <div className="relative w-2/6" ref={baseSelectRef}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBaseSelect((s) => !s);
                    setShowQuoteSelect(false);
                  }}
                  className="w-full m-auto justify-between h-15 bg-zinc-200 dark:bg-zinc-900"
                >
                  {baseToken ? (
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          baseToken.image || "/vercel.svg?height=24&width=24"
                        }
                        alt={baseToken.symbol}
                        className="w-6 h-6 outline-black/10 outline-5 dark:outline-white/10 rounded-full"
                        onError={(e) =>
                          (e.currentTarget.src =
                            "/vercel.svg?height=24&width=24")
                        }
                      />
                      <span className="font-medium">{baseToken.symbol}</span>
                    </div>
                  ) : (
                    <span className="text-lg flex">Select base token</span>
                  )}
                  <ChevronDown className="size-6" />
                </Button>

                {showBaseSelect && (
                  <div className="absolute top-full left-0 right-0 mt-2">
                    <CreatableSelect
                      styles={selectStyles}
                      options={buildOptionsBase()}
                      onChange={(o) => {
                        handleTokenChange(o, setBaseToken);
                        setShowBaseSelect(false);
                      }}
                      formatCreateLabel={(inputValue: string) =>
                        `Add token by mint: ${inputValue}`
                      }
                      formatOptionLabel={formatOptionLabel}
                      placeholder="Search by symbol, name, or paste mint address"
                      components={{
                        DropdownIndicator: null,
                        IndicatorSeparator: null,
                      }}
                      isClearable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </div>
              <div className="items-center w-4/6 gap-3">
                <div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={baseAmount}
                    onChange={(e) => {
                      const v = e.target.value;

                      // allow empty and a lone dot while typing
                      if (v === "" || v === ".") {
                        setBaseAmount(v);
                        return;
                      }

                      // only digits + single dot
                      if (!/^\d*\.?\d*$/.test(v)) return;

                      // soft balance check (optional)
                      if (baseToken?.balance) {
                        const num = parseFloat(v);
                        if (
                          !Number.isNaN(num) &&
                          num > parseFloat(baseToken.balance)
                        )
                          return;
                      }

                      setBaseAmount(v);
                    }}
                    className="!text-lg h-15 bg-zinc-200 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <Label className="text-base px-2 font-medium">
              Quote Token
              <div className="flex items-center ml-auto gap-2">
                <span className="text-sm flex gap-2 underline items-center text-muted-foreground">
                  <Wallet size={20} /> {quoteToken?.balance || "0"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (quoteToken?.balance) {
                      const halfBalance = (
                        Number(quoteToken.balance) * 0.5
                      ).toString();
                      setQuoteAmount(halfBalance);
                    }
                  }}
                  disabled={!quoteToken?.balance}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (quoteToken?.balance) {
                      setQuoteAmount(quoteToken.balance);
                    }
                  }}
                  disabled={!quoteToken?.balance}
                >
                  100%
                </Button>
              </div>
            </Label>

            <div className="flex gap-3 bg-zinc-300 dark:bg-black p-3 rounded-xl">
              <div className="relative w-2/6" ref={quoteSelectRef}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuoteSelect((s) => !s);
                    setShowBaseSelect(false);
                  }}
                  className="w-full text-center justify-between h-15 bg-zinc-200 dark:bg-zinc-900"
                >
                  {quoteToken ? (
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          quoteToken.image || "/vercel.svg?height=24&width=24"
                        }
                        alt={quoteToken.symbol}
                        className="w-6 h-6 rounded-full outline-black/10 outline-5 dark:outline-white/10"
                        onError={(e) =>
                          (e.currentTarget.src =
                            "/vercel.svg?height=24&width=24")
                        }
                      />
                      <span className="font-medium text-lg">
                        {quoteToken.symbol}
                      </span>
                    </div>
                  ) : (
                    <span className="flex text-lg">Select quote token</span>
                  )}
                  <ChevronDown className="size-6" />
                </Button>

                {showQuoteSelect && (
                  <div className="absolute top-full left-0 right-0 mt-2">
                    <CreatableSelect
                      styles={selectStyles}
                      options={buildOptionsQuote()}
                      onChange={(o) => {
                        handleTokenChange(o, setQuoteToken);
                        setShowQuoteSelect(false);
                      }}
                      formatCreateLabel={(inputValue: string) =>
                        `Add token by mint: ${inputValue}`
                      }
                      formatOptionLabel={formatOptionLabel}
                      placeholder="Search by symbol, name, or paste mint address"
                      components={{
                        DropdownIndicator: null,
                        IndicatorSeparator: null,
                      }}
                      isClearable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </div>

              <div className="items-center w-4/6 gap-3">
                <div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={quoteAmount}
                    onChange={(e) => {
                      const v = e.target.value;

                      // allow empty and a lone dot while typing
                      if (v === "" || v === ".") {
                        setQuoteAmount(v);
                        return;
                      }

                      // only digits + single dot
                      if (!/^\d*\.?\d*$/.test(v)) return;

                      // soft balance check (optional)
                      if (quoteToken?.balance) {
                        const num = parseFloat(v);
                        if (
                          !Number.isNaN(num) &&
                          num > parseFloat(quoteToken.balance)
                        )
                          return;
                      }

                      setQuoteAmount(v);
                    }}
                    className="!text-lg h-15 bg-zinc-200 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
            <h1 className="text-center">
              Don't have tokens for quote amount?{" "}
              <a
                className="text-blue-500 underline hover:text-blue-600"
                target="_blank"
                href="https://raydium.io/swap"
              >
                Buy here
              </a>
            </h1>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Fee Tier</Label>
            <Tabs
              value={feeTier}
              onValueChange={(v) => setFeeTier(v as PoolFormState["feeTier"])}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-muted">
                {(
                  ["0.25", "0.3", "0.5", "1", "4"] as PoolFormState["feeTier"][]
                ).map((f) => (
                  <TabsTrigger
                    key={f}
                    value={f}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
                  >
                    {f}%
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium">
              Initial Price:{" "}
              <span className="font-semibold">
                {initialPrice !== null
                  ? `${initialPrice.toFixed(6)} ${
                      quoteToken?.symbol || "Quote"
                    } per ${baseToken?.symbol || "Base"}`
                  : "Enter amounts to see price"}
              </span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCreatePool}
            disabled={
              isCreatingPool ||
              !baseToken ||
              !quoteToken ||
              !baseAmount ||
              !quoteAmount
            }
          >
            {isCreatingPool ? "Creating Pool..." : "Create Liquidity Pool"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Remove Liquidity — Quick Guide
          </CardTitle>
          <CardDescription>
            Short, exact steps (from Raydium UI) to remove liquidity safely.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              Use Raydium's Portfolio UI to remove liquidity for a specific
              pool. This guide walks you from the Portfolio page — we do not
              perform removals for you.
            </p>

            <p className="mt-2 font-medium">Steps (exact):</p>
            <ol className="list-decimal list-inside ml-4 space-y-2 mt-2">
              <li>Go to Raydium.</li>
              <li>
                Click on <strong>Portfolio</strong>.
              </li>
              <li>Find the pool you want to remove from.</li>
              <li>
                Click the little <strong>minus (−)</strong> icon on that
                position.
              </li>
              <li>
                Select the amount you want to remove, then click{" "}
                <strong>Remove</strong>.
              </li>
            </ol>

            <div className="mt-4">
              <p className="font-medium">About LP tokens</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-muted-foreground">
                <li>
                  When you add liquidity Raydium mints LP tokens to your wallet
                  — these represent your share of the pool.
                </li>
                <li>
                  To remove liquidity you must hold the LP tokens for that pool.
                  Removing burns LP tokens and returns the underlying assets.
                </li>
                <li>
                  <strong>If LP tokens were burned/locked</strong> (eg. you or a
                  contract burned them to lock liquidity), you{" "}
                  <strong>cannot</strong> remove that liquidity — nor add more
                  to a pool where supply is locked. Always confirm whether LP
                  tokens are transferable before attempting add/remove.
                </li>
                <li>
                  Removing all liquidity may dramatically affect a token's
                  market (price / liquidity) — proceed with caution.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200">
              Important warnings
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 text-sm text-yellow-700 dark:text-yellow-100">
              <li>Double-check token symbols and pool id before removing.</li>
              <li>
                If liquidity is locked (LP tokens burned) you cannot remove or
                fully withdraw.
              </li>
              <li>
                We are not responsible for external site actions — you act at
                your own risk.
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() =>
                openPortfolio(
                  "https://raydium.io/portfolio/?position_tab=standard"
                )
              }
              className="w-full"
            >
              Open Raydium Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Add Liquidity — Quick Guide
          </CardTitle>
          <CardDescription>
            How to add more liquidity to an existing pool (if LP tokens are not
            locked).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              You can top up an existing pool by supplying proportional amounts
              of both tokens. Use Raydium's Portfolio or Pool UI to add
              liquidity to a pool you already have a position in (or to any
              public pool).
            </p>

            <p className="mt-2 font-medium">Steps (typical):</p>
            <ol className="list-decimal list-inside ml-4 space-y-2 mt-2">
              <li>Go to Raydium.</li>
              <li>
                Click on <strong>Portfolio</strong> (or visit the{" "}
                <strong>Liquidity / Add</strong> page).
              </li>
              <li>
                Find the pool you want to add to (or search the pair in the Add
                Liquidity UI).
              </li>
              <li>
                Click the little <strong>plus (+)</strong> or{" "}
                <strong>Add</strong> action on that pool.
              </li>
              <li>
                Enter the amounts (UI will usually auto-balance to maintain pool
                ratio) and confirm the transaction in your wallet.
              </li>
            </ol>

            <div className="mt-4">
              <p className="font-medium">
                About adding LP tokens & limitations
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-muted-foreground">
                <li>
                  Adding liquidity mints additional LP tokens to your wallet
                  (representing added share).
                </li>
                <li>
                  You can only add if the pool accepts new liquidity — if the
                  pool’s LP supply has been locked (LP tokens burned) you may be
                  unable to add more.
                </li>
                <li>
                  Adding liquidity requires proportional amounts of both tokens
                  (UI commonly helps by auto-calculating the pair amounts).
                </li>
                <li>
                  Consider impermanent loss and that fees earned are shared
                  across LP holders.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="font-semibold text-blue-800 dark:text-blue-200">
              Quick checklist before adding
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 text-sm text-blue-700 dark:text-blue-100">
              <li>Confirm pool is the correct token pair.</li>
              <li>Make sure LP tokens are mintable (not locked, i.e. not burned).</li>
              <li>Ensure you have both tokens (or swap beforehand).</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() =>
                openPortfolio(
                  "https://raydium.io/portfolio/?position_tab=standard"
                )
              }
              className="w-full"
            >
              Open Raydium Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
