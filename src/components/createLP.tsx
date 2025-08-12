"use client";

import { useEffect, useState, useRef } from "react";
import { type Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
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

// seed tokens kept only for quote list; base will exclude them
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

  // tokenList used for quote + general lookup. Base options filtered to token-2022 only.
  const [tokenList, setTokenList] =
    useState<TokenInfoExtended[]>(defaultTokens);

  // canonical tokenlist map for metadata lookup
  const [solanaTokenListMap, setSolanaTokenListMap] = useState<
    Map<string, any>
  >(new Map());

  const [raydium, setRaydium] = useState<Raydium | null>(null);

  // UI: popover toggles to show creatable selects inline
  const [showBaseSelect, setShowBaseSelect] = useState(false);
  const [showQuoteSelect, setShowQuoteSelect] = useState(false);
  const baseSelectRef = useRef<HTMLDivElement | null>(null);
  const quoteSelectRef = useRef<HTMLDivElement | null>(null);

  // initialize Raydium (as before)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, publicKey, signAllTransactions]);

  useEffect(() => {
    if (!raydium || !publicKey) return;
    try {
      raydium.setOwner(publicKey);
    } catch (e) {
      console.error("Failed to set owner on Raydium instance:", e);
    }
  }, [raydium, publicKey]);

  // fetch canonical tokenlist for metadata lookup (fallbacks)
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

        // refresh default tokens metadata if present
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

  // update SOL balance for seed in tokenList
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
      const acc = await connection.getAccountInfo(pda);
      if (!acc || !acc.data) return null;
      if (typeof Metadata.deserialize === "function") {
        // @ts-ignore
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
        // @ts-ignore
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
    } catch {
      return null;
    }
  };

  // fetch token info on-chain (used when user pastes mint)
  async function fetchTokenInfo(
    mint: string
  ): Promise<TokenInfoExtended | null> {
    try {
      const mintPubkey = new PublicKey(mint);
      const accountInfo = await connection.getAccountInfo(mintPubkey);
      if (!accountInfo) throw new Error("Mint not found on chain.");

      const isToken2022 = accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
      const programIdForMint = isToken2022
        ? TOKEN_2022_PROGRAM_ID
        : TOKEN_PROGRAM_ID;

      let decimals = 0;
      try {
        const mintInfo = await getMint(
          connection,
          mintPubkey,
          undefined,
          programIdForMint
        );
        decimals = mintInfo?.decimals ?? 0;
      } catch {
        decimals = 0;
      }

      let name = "";
      let symbol = "";
      let image = "";

      try {
        const md = await tryFetchMetaplexMetadata(mintPubkey);
        if (md) {
          name = md.name || "";
          symbol = md.symbol || "";
          if (md.uri) {
            try {
              const uriResp = await fetch(md.uri, { cache: "no-store" })
                .then((r) => r.json())
                .catch(() => null);
              if (uriResp)
                image =
                  uriResp.image || uriResp.image_url || uriResp.logo || "";
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }

      if ((!name || !symbol) && solanaTokenListMap.size > 0) {
        const found = solanaTokenListMap.get(mint);
        if (found) {
          name = name || found.name || "";
          symbol = symbol || found.symbol || "";
          image = image || found.logoURI || found.logo || "";
          decimals =
            typeof found.decimals === "number" ? found.decimals : decimals;
        }
      }

      if (!symbol) symbol = mint.slice(0, 6);
      if (!name) name = mint;

      let balance = "0";
      if (publicKey) {
        try {
          const ata = await getAssociatedTokenAddress(
            mintPubkey,
            publicKey,
            false,
            programIdForMint
          );
          const account = await getAccount(
            connection,
            ata,
            "confirmed",
            programIdForMint
          );
          const raw = (account as any).amount ?? "0";
          balance = (Number(raw) / 10 ** (decimals || 0)).toString();
        } catch {
          // ignore
        }
      }

      return {
        chainId: 0,
        address: mint,
        programId: programIdForMint.toBase58(),
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

  // handle create/pick selection (same logic, with user-friendly toasts)
  const handleTokenChange = async (
    selectedOption: any,
    setToken: (t: TokenInfoExtended | null) => void
  ) => {
    if (!selectedOption) {
      setToken(null);
      return;
    }

    // creatable -> pasted mint
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

      const wantsBase = setToken === setBaseToken;
      if (wantsBase && info.programId !== TOKEN_2022_PROGRAM_ID.toBase58()) {
        // still add for quote usage
        setTokenList((prev) =>
          prev.some((t) => t.address === info.address) ? prev : [...prev, info]
        );
        toast.error(
          "Base token must be token-2022. This token was added to the quote list.",
          {
            className: "bg-red-500 text-white",
            progressClassName: "bg-red-300",
          }
        );
        return;
      }

      setTokenList((prev) =>
        prev.some((t) => t.address === info.address) ? prev : [...prev, info]
      );
      setToken(info);
      return;
    }

    // selected from built options
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

    if (
      setToken === setBaseToken &&
      built.programId !== TOKEN_2022_PROGRAM_ID.toBase58()
    ) {
      toast.error(
        "Base token must be token-2022. Please choose another token or paste a token-2022 mint.",
        {
          className: "bg-red-500 text-white",
          progressClassName: "bg-red-300",
        }
      );
      return;
    }

    setToken(built);
  };

  // price helper
  const initialPrice =
    baseAmount && quoteAmount && Number(baseAmount) > 0
      ? Number(quoteAmount) / Number(baseAmount)
      : null;

  // react-select styles: match slate + green active
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "hsl(var(--background))",
      borderColor: state.isFocused ? "rgb(34 197 94)" : "hsl(var(--border))",
      borderRadius: "8px",
      minHeight: "48px",
      boxShadow: state.isFocused ? "0 0 0 2px rgb(34 197 94 / 0.2)" : "none",
      "&:hover": { borderColor: "rgb(34 197 94)" },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "hsl(var(--popover))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "8px",
      boxShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)",
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "rgb(34 197 94)"
        : state.isFocused
        ? "hsl(var(--accent))"
        : "transparent",
      color: state.isSelected ? "#fff" : "hsl(var(--foreground))",
      "&:hover": { backgroundColor: "hsl(var(--accent))" },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "hsl(var(--foreground))",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
    }),
    input: (base: any) => ({
      ...base,
      color: "hsl(var(--foreground))",
    }),
  };

  // build options: quote includes default tokens; base filters out SOL/USDC seeds and only includes token-2022 programId entries if programId is present.
  const buildOptionsQuote = () =>
    tokenList.map((t) => ({
      value: t.address,
      label: t.symbol,
      name: t.name,
      image: t.image || t.logoURI || "",
      decimals: t.decimals,
      programId: t.programId,
      balance: t.balance,
    }));

  const buildOptionsBase = () =>
    tokenList
      .filter((t) => {
        // exclude seed SOL/USDC for base (they are not token-2022)
        if (
          t.address === defaultTokens[0].address ||
          t.address === defaultTokens[1].address
        )
          return false;
        // prefer tokens with programId known token-2022; if unknown, exclude (we require token-2022)
        return t.programId === TOKEN_2022_PROGRAM_ID.toBase58();
      })
      .map((t) => ({
        value: t.address,
        label: t.symbol,
        name: t.name,
        image: t.image || t.logoURI || "",
        decimals: t.decimals,
        programId: t.programId,
        balance: t.balance,
      }));

  // small wrappers for toasts matching your project's theme
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

  // create pool logic (keeps same Raydium usage)
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

      const balance = await connection.getBalance(publicKey);
      const totalSolNeeded =
        0.3 * LAMPORTS_PER_SOL +
        (baseToken.address === defaultTokens[0].address
          ? baseAmountNum * LAMPORTS_PER_SOL
          : 0) +
        (quoteToken.address === defaultTokens[0].address
          ? quoteAmountNum * LAMPORTS_PER_SOL
          : 0);
      if (balance < totalSolNeeded) {
        showError(
          `Insufficient SOL. Need about ${(
            totalSolNeeded / LAMPORTS_PER_SOL
          ).toFixed(4)} SOL.`
        );
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

      const feeConfigs: ApiCpmmConfigInfo[] =
        await raydium.api.getCpmmConfigs();
      feeConfigs.forEach((config) => {
        config.id = getCpmmPdaAmmConfigId(
          DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
          config.index
        ).publicKey.toBase58();
      });
      const selectedFeeConfig = feeConfigs[feeTierToIndex[feeTier]];

      const mintAAmount = new BN(baseAmountNum * 10 ** baseToken.decimals);
      const mintBAmount = new BN(quoteAmountNum * 10 ** quoteToken.decimals);

      const { execute, transaction } = await raydium.cpmm.createPool({
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
        txVersion: TxVersion.V0,
      });

      // simulate
      const simulation = await connection.simulateTransaction(transaction, {
        commitment: "confirmed",
        sigVerify: false,
      });
      if (simulation.value.err) {
        showError(
          "Transaction simulation failed. Check token mints and balances."
        );
        console.error("Simulation logs:", simulation.value.logs);
        setIsCreatingPool(false);
        return;
      }
      showSuccess("Simulation passed.");

      // execute
      const { txId } = await execute({ sendAndConfirm: true });
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

  // render option label: mint only shown in menu (the "meta.context" param is provided by react-select)
  const formatOptionLabel = (option: any, { context }: any) => {
    const showMint = context === "menu"; // Only show mint in dropdown menu, not in selected value
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

  // close select on outside click (simple)
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

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-10">
      <section className="bg-muted p-6 rounded-xl shadow-lg space-y-4">
        <h2 className="text-2xl font-semibold text-center">
          How it works
        </h2>
        <p className="text-muted-foreground text-left">
          <ol className="list-decimal list-inside space-y-2 text-left inline-block">
            <li>
              Select your Token 2022 as the <strong>Base Token</strong>.
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
              Click <em>“Initialize Liquidity Pool”</em> and approve (~0.5 SOL
              cost).
            </li>
            <li>Receive LP tokens; burn them to lock liquidity if desired.</li>
            <li>Note: Initial quote token amount determines starting price.</li>
          </ol>
        </p>

        <div className="bg-card text-card-foreground p-3 rounded-lg text-center text-sm font-medium border">
          Pool creation fee: <span className="font-semibold">~0.2 SOL</span> +
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
              Base Token (Token 2022)
              <div className="flex items-center ml-auto gap-2">
                <span className="text-sm gap-2 underline text-muted-foreground flex items-center">
                  <Wallet size={20}/> {baseToken?.balance || "0"}
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
                  )}<ChevronDown className="size-6"/>
                </Button>

                {showBaseSelect && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-[9999]">
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
                    placeholder="0.0"
                    value={baseAmount}
                    inputMode="decimal"
                    min="0"
                    max={baseToken?.balance || "0"}
                    onChange={(e) => {
                      const value = Math.max(0, Number(e.target.value));
                      setBaseAmount(value.toString());
                    }}
                    className="!text-lg h-15 bg-zinc-200 dark:bg-zinc-900 "
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quote section styled same as Base */}
          <div className="space-y-5">
            <Label className="text-base px-2 font-medium">
              Quote Token
              <div className="flex items-center ml-auto gap-2">
                <span className="text-sm flex gap-2 underline items-center text-muted-foreground">
                  <Wallet size={20}/> {quoteToken?.balance || "0"}
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
                      <span className="font-medium text-lg">{quoteToken.symbol}</span>
                    </div>
                  ) : (
                    <span className="flex text-lg">Select quote token</span>
                  )}<ChevronDown className="size-6"/>
                </Button>

                {showQuoteSelect && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-[9999]">
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
                    min="0"
                    max={quoteToken?.balance || "0"}
                    onChange={(e) => {
                      const value = Math.max(0, Number(e.target.value));
                      setQuoteAmount(value.toString());
                    }}
                    className="!text-lg h-15 bg-zinc-200 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
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
    </div>
  );
}
