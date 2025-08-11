"use client";

import { useState, useEffect } from "react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
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
  TokenInfo,
  ApiCpmmConfigInfo,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreatableSelect from "react-select/creatable";

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
    image: "...",
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
    image: "...",
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
  const [baseAmount, setBaseAmount] = useState<PoolFormState["baseAmount"]>("");
  const [quoteAmount, setQuoteAmount] =
    useState<PoolFormState["quoteAmount"]>("");
  const [feeTier, setFeeTier] = useState<PoolFormState["feeTier"]>("0.25");
  const [isCreatingPool, setIsCreatingPool] =
    useState<PoolFormState["isCreatingPool"]>(false);
  const [tokenList, setTokenList] =
    useState<TokenInfoExtended[]>(defaultTokens);
  const [raydium, setRaydium] = useState<Raydium | null>(null);

  // Initialize Raydium (unchanged behavior) — create instance once
  useEffect(() => {
    const initRaydium = async () => {
      if (raydium) return;
      if (!publicKey) {
        console.error("Wallet not connected");
        return;
      }
      try {
        const instance = await Raydium.load({
          connection,
          cluster: "devnet",
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
    initRaydium();
    // keep dependency same as original intent
  }, [connection, raydium]);

  // Ensure Raydium knows the owner (wallet) — setOwner when wallet connects
  useEffect(() => {
    if (!raydium) return;
    if (!publicKey) return;
    try {
      // Raydium#setOwner expects a PublicKey (or a string in some versions)
      raydium.setOwner(publicKey);
    } catch (e) {
      console.error("Failed to set owner on Raydium instance:", e);
    }
  }, [raydium, publicKey]);

  useEffect(() => {
    let isMounted = true;

    const fetchTokens = async () => {
      if (!publicKey) return;
      let solBalance = "0";

      try {
        solBalance = (
          (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL
        ).toString();
      } catch (e) {
        console.error("Error fetching SOL balance:", e);
      }

      const updatedDefaultTokens = defaultTokens.map((token) =>
        token.symbol === "SOL" ? { ...token, balance: solBalance } : token
      );

      try {
        const response = await fetch(
          "https://api-v3-devnet.raydium.io/mint/list"
        );
        const data = await response.json();

        // Robust handling for different possible response shapes.
        let tokenEntries: any[] = [];
        if (Array.isArray(data)) {
          tokenEntries = data;
        } else if (data && Array.isArray(data.data)) {
          tokenEntries = data.data;
        } else if (data && data.data && typeof data.data === "object") {
          // sometimes data.data is an object keyed by mint
          tokenEntries = Object.values(data.data);
        } else if (data && Array.isArray((data as any).list)) {
          tokenEntries = (data as any).list;
        } else if (data && Array.isArray((data as any).mints)) {
          tokenEntries = (data as any).mints;
        } else if (data && Array.isArray((data as any).result)) {
          tokenEntries = (data as any).result;
        } else {
          // fallback: try to find any array inside the response object
          const foundArray = Object.values(data || {}).find((v) =>
            Array.isArray(v)
          );
          if (Array.isArray(foundArray)) tokenEntries = foundArray as any[];
        }

        if (!Array.isArray(tokenEntries) || tokenEntries.length === 0) {
          console.warn("Unexpected token list format from Raydium API:", data);
          if (isMounted) setTokenList(updatedDefaultTokens);
          return;
        }

        const tokens: TokenInfoExtended[] = (
          await Promise.all(
            tokenEntries.map(async (token: any) => {
              try {
                const mintAddress =
                  token.mint || token.address || token.key || token[0] || null;
                if (!mintAddress) return null;

                const mintPubkey = new PublicKey(mintAddress);

                // Determine program id (prefer explicit property, fallback to TOKEN_2022)
                let programIdPublicKey = TOKEN_2022_PROGRAM_ID;
                if (token.programId || token.tokenProgram) {
                  try {
                    programIdPublicKey = new PublicKey(
                      token.programId || token.tokenProgram
                    );
                  } catch (e) {
                    // keep default if parsing fails
                    programIdPublicKey = TOKEN_2022_PROGRAM_ID;
                  }
                }

                let balance = "0";
                try {
                  const ata = await getAssociatedTokenAddress(
                    mintPubkey,
                    publicKey,
                    false,
                    programIdPublicKey
                  );
                  const account = await getAccount(
                    connection,
                    ata,
                    "confirmed",
                    programIdPublicKey
                  );
                  // account.amount is a bigint-like BN or string depending on version
                  const num =
                    Number((account as any).amount) /
                    10 ** (token.decimals ?? token.decimal ?? (0 || 0));
                  balance = num.toString();
                } catch (e) {
                  console.log(e);
                }

                const decimals =
                  token.decimals ??
                  token.decimal ??
                  (typeof token.decimals === "number" ? token.decimals : 0);

                return {
                  chainId: 0,
                  address: mintAddress,
                  programId: programIdPublicKey.toBase58(),
                  logoURI: token.icon || token.logoURI || "",
                  symbol: token.symbol || token.ticker || `TKN`,
                  name: token.name || token.title || mintAddress,
                  decimals:
                    typeof decimals === "number"
                      ? decimals
                      : Number(decimals) || 0,
                  tags: [],
                  extensions: {},
                  priority: 0,
                  image: token.icon || token.logoURI || "",
                  balance,
                } as TokenInfoExtended;
              } catch (e) {
                console.warn("skipping token due to parse error", e, token);
                return null;
              }
            })
          )
        ).filter(Boolean) as TokenInfoExtended[];

        const combinedTokens = [
          ...updatedDefaultTokens,
          ...tokens.filter(
            (t) => !updatedDefaultTokens.some((dt) => dt.address === t.address)
          ),
        ];
        if (isMounted) setTokenList(combinedTokens);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        if (isMounted) setTokenList(updatedDefaultTokens);
      }
    };

    fetchTokens();
    return () => {
      isMounted = false;
    };
  }, [publicKey, connection]);

  const handleTokenChange = async (
    selectedOption: any,
    setToken: (token: TokenInfoExtended | null) => void
  ) => {
    if (selectedOption?.__isNew__) {
      const mint = selectedOption.value;
      const tokenInfo = await fetchTokenInfo(mint);
      if (tokenInfo) {
        setToken(tokenInfo);
      } else {
        setToken(null);
        toast.error("Invalid token mint address.");
      }
    } else {
      setToken(
        selectedOption
          ? {
              chainId: 0,
              address: selectedOption.value,
              programId:
                selectedOption.programId || TOKEN_2022_PROGRAM_ID.toBase58(),
              logoURI: selectedOption.image || "",
              symbol: selectedOption.label,
              name: selectedOption.name,
              decimals: selectedOption.decimals,
              tags: [],
              extensions: {},
              priority: 0,
              image: selectedOption.image,
              balance: selectedOption.balance,
            }
          : null
      );
    }
  };

  async function fetchTokenInfo(
    mint: string
  ): Promise<TokenInfoExtended | null> {
    try {
      const mintPubkey = new PublicKey(mint);
      const accountInfo = await connection.getAccountInfo(mintPubkey);
      if (!accountInfo) throw new Error("Mint not found.");

      const programIdObj = accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
        ? TOKEN_2022_PROGRAM_ID
        : accountInfo.owner.equals(TOKEN_PROGRAM_ID)
        ? TOKEN_PROGRAM_ID
        : null;
      if (!programIdObj) throw new Error("Unsupported token program.");

      const programId = programIdObj.toBase58();

      const mintInfo = await getMint(
        connection,
        mintPubkey,
        undefined,
        programIdObj
      );
      let balance = "0";
      if (publicKey) {
        try {
          const ata = await getAssociatedTokenAddress(
            mintPubkey,
            publicKey,
            false,
            programIdObj
          );
          const account = await getAccount(
            connection,
            ata,
            "confirmed",
            programIdObj
          );
          balance = (
            Number((account as any).amount) /
            10 ** mintInfo.decimals
          ).toString();
        } catch (e) {}
      }

      return {
        chainId: 0,
        address: mint,
        programId,
        logoURI: "",
        symbol: `CT-${mint.slice(0, 4)}`,
        name: `Custom Token-${mint.slice(0, 8)}...`,
        decimals: mintInfo.decimals,
        tags: [],
        extensions: {},
        priority: 0,
        balance,
      };
    } catch (error) {
      console.error("Error fetching token info:", error);
      return null;
    }
  }

  const initialPrice =
    baseAmount && quoteAmount && Number(baseAmount) > 0
      ? Number(quoteAmount) / Number(baseAmount)
      : null;

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
      toast.error("Missing required fields or wallet not connected.");
      return;
    }

    setIsCreatingPool(true);
    try {
      const baseAmountNum = Number(baseAmount);
      const quoteAmountNum = Number(quoteAmount);
      if (baseAmountNum <= 0 || quoteAmountNum <= 0)
        throw new Error("Amounts must be > 0.");

      const balance = await connection.getBalance(publicKey);
      const totalSolNeeded =
        0.3 * LAMPORTS_PER_SOL +
        (baseToken.address === "So11111111111111111111111111111111111111112"
          ? baseAmountNum * LAMPORTS_PER_SOL
          : 0) +
        (quoteToken.address === "So11111111111111111111111111111111111111112"
          ? quoteAmountNum * LAMPORTS_PER_SOL
          : 0);
      if (balance < totalSolNeeded)
        throw new Error(
          `Insufficient SOL. Need ~${(
            totalSolNeeded / LAMPORTS_PER_SOL
          ).toFixed(4)} SOL.`
        );

      // Prepare mints
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

      // Fetch fee configs for devnet
      let feeConfigs: ApiCpmmConfigInfo[] = await raydium.api.getCpmmConfigs();
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

      // Simulate the transaction
      const simulation = await connection.simulateTransaction(transaction, {
        commitment: "confirmed",
        sigVerify: false,
      });
      console.log("Simulation Result:", simulation.value);
      if (simulation.value.err) {
        console.error("Simulation Logs:", simulation.value.logs);
        throw new Error(
          `Simulation failed: ${JSON.stringify(simulation.value.err)}`
        );
      }
      toast.success("Simulation passed!");

      // Execute the transaction
      const { txId } = await execute({ sendAndConfirm: true });
      toast.success(`Pool created successfully! TxId: ${txId}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setIsCreatingPool(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="text-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-3xl font-bold">
          Create Liquidity Pool
        </CardTitle>
        <CardDescription className="text-lg mt-2 text-gray-200">
          Add liquidity to a new pool on Solana Devnet
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded-lg text-sm">
          Note: A creation fee of ~0.2 SOL is required. Ensure sufficient SOL
          balance.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label
              htmlFor="base-token"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Base Token
            </Label>
            <CreatableSelect
              id="base-token"
              options={tokenList.map((token) => ({
                value: token.address,
                label: token.symbol,
                name: token.name,
                image: token.image,
                decimals: token.decimals,
                programId: token.programId,
                balance: token.balance,
              }))}
              value={
                baseToken
                  ? {
                      value: baseToken.address,
                      label: baseToken.symbol,
                      name: baseToken.name,
                      image: baseToken.image,
                      decimals: baseToken.decimals,
                      programId: baseToken.programId,
                      balance: baseToken.balance,
                    }
                  : null
              }
              onChange={(selectedOption) =>
                handleTokenChange(selectedOption, setBaseToken)
              }
              placeholder="Select or paste token address"
              isClearable
              isSearchable
              formatCreateLabel={(inputValue: string) =>
                `Use custom address: ${inputValue}`
              }
              className="w-full"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#e5e7eb",
                  borderRadius: "0.375rem",
                  boxShadow: "none",
                  backgroundColor: "#ffffff",
                  "&:hover": { borderColor: "#d1d5db" },
                  "&:focus-within": {
                    borderColor: "#3b82f6",
                    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
                  },
                  ...(typeof window !== "undefined" &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                      .matches && {
                      backgroundColor: "#1f2937",
                      borderColor: "#4b5563",
                      "&:hover": { borderColor: "#6b7280" },
                    }),
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: "0.375rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  backgroundColor: "#ffffff",
                  ...(typeof window !== "undefined" &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                      .matches && {
                      backgroundColor: "#1f2937",
                    }),
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected
                    ? "#3b82f6"
                    : isFocused
                    ? "#f3f4f6"
                    : "white",
                  color: isSelected ? "white" : "#374151",
                  "&:active": { backgroundColor: "#3b82f6" },
                  ...(typeof window !== "undefined" &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                      .matches && {
                      backgroundColor: isSelected
                        ? "#3b82f6"
                        : isFocused
                        ? "#374151"
                        : "#1f2937",
                      color: isSelected ? "white" : "#d1d5db",
                    }),
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "#374151",
                  ...(typeof window !== "undefined" &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                      .matches && { color: "#d1d5db" }),
                }),
              }}
              formatOptionLabel={(option) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {option.image && (
                      <img
                        src={option.image}
                        alt={option.label}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        {option.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {option.balance || "0"}
                  </span>
                </div>
              )}
            />
          </div>
          <div className="space-y-4">
            <Label
              htmlFor="quote-token"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Quote Token
            </Label>
            <CreatableSelect
              id="quote-token"
              options={tokenList.map((token) => ({
                value: token.address,
                label: token.symbol,
                name: token.name,
                image: token.image,
                decimals: token.decimals,
                programId: token.programId,
                balance: token.balance,
              }))}
              value={
                quoteToken
                  ? {
                      value: quoteToken.address,
                      label: quoteToken.symbol,
                      name: quoteToken.name,
                      image: quoteToken.image,
                      decimals: quoteToken.decimals,
                      programId: quoteToken.programId,
                      balance: quoteToken.balance,
                    }
                  : null
              }
              onChange={(selectedOption) =>
                handleTokenChange(selectedOption, setQuoteToken)
              }
              placeholder="Select or paste token address"
              isClearable
              isSearchable
              formatCreateLabel={(inputValue: string) =>
                `Use custom address: ${inputValue}`
              }
              className="w-full"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#e5e7eb",
                  borderRadius: "0.375rem",
                  boxShadow: "none",
                  backgroundColor: "#ffffff",
                  "&:hover": { borderColor: "#d1d5db" },
                  "&:focus-within": {
                    borderColor: "#3b82f6",
                    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
                  },
                  ...(typeof window !== "undefined" &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                      .matches && {
                      backgroundColor: "#1f2937",
                      borderColor: "#4b5563",
                      "&:hover": { borderColor: "#6b7280" },
                    }),
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: "0.375rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  backgroundColor: "#ffffff",
                  ...(typeof window !== "undefined" &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                      .matches && {
                      backgroundColor: "#1f2937",
                    }),
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected
                    ? "#3b82f6"
                    : isFocused
                    ? "#f3f4f6"
                    : "white",
                  color: isSelected ? "white" : "#374151",
                  "&:active": { backgroundColor: "#3b82f6" },
                  ...(typeof window !== "undefined" &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                      .matches && {
                      backgroundColor: isSelected
                        ? "#3b82f6"
                        : isFocused
                        ? "#374151"
                        : "#1f2937",
                      color: isSelected ? "white" : "#d1d5db",
                    }),
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "#374151",
                  ...(typeof window !== "undefined" &&
                    window.matchMedia("(prefers-color-scheme: dark)")
                      .matches && { color: "#d1d5db" }),
                }),
              }}
              formatOptionLabel={(option) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {option.image && (
                      <img
                        src={option.image}
                        alt={option.label}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        {option.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {option.balance || "0"}
                  </span>
                </div>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label
              htmlFor="base-amount"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Base Token Amount
            </Label>
            <Input
              id="base-amount"
              type="number"
              placeholder="e.g., 1000"
              min="0"
              step="0.000001"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 rounded-md shadow-sm"
            />
          </div>
          <div className="space-y-4">
            <Label
              htmlFor="quote-amount"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Quote Token Amount
            </Label>
            <Input
              id="quote-amount"
              type="number"
              placeholder="e.g., 1000"
              min="0"
              step="0.000001"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 rounded-md shadow-sm"
            />
          </div>
        </div>
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fee Tier
          </Label>
          <Tabs
            value={feeTier}
            onValueChange={(value) =>
              setFeeTier(value as "0.25" | "0.3" | "0.5" | "1" | "4")
            }
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <TabsTrigger
                value="0.25"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                0.25%
              </TabsTrigger>
              <TabsTrigger
                value="0.3"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                0.3%
              </TabsTrigger>
              <TabsTrigger
                value="0.5"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                0.5%
              </TabsTrigger>
              <TabsTrigger
                value="1"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                1%
              </TabsTrigger>
              <TabsTrigger
                value="4"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                4%
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Initial Price:{" "}
          {initialPrice !== null
            ? `${initialPrice.toFixed(6)} ${
                quoteToken?.symbol || "Quote"
              } per ${baseToken?.symbol || "Base"}`
            : "N/A"}
        </div>
        <Button
          className="w-full bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 py-3 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-md"
          onClick={handleCreatePool}
          disabled={
            !publicKey ||
            !baseToken ||
            !quoteToken ||
            !baseAmount ||
            !quoteAmount ||
            isCreatingPool
          }
        >
          {isCreatingPool ? "Creating Pool..." : "Create Pool"}
        </Button>
      </CardContent>
    </Card>
  );
}
