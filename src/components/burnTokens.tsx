import React, { useEffect, useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getMetadataPointerState,
  getTokenMetadata,
  createBurnInstruction,
} from "@solana/spl-token";
import { Metaplex } from "@metaplex-foundation/js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

type DisplayToken = {
  pubkey: string;
  mint: string;
  amount: string;
  decimals?: number;
  programId: string;
  symbol?: string;
  name?: string;
  image?: string;
  source?: "spl" | "token2022";
  isRaydiumLp?: boolean;
};

interface TokenInventoryProps {
  connection: Connection;
}

function shorten(mint: string, left = 6, right = 4) {
  if (!mint || mint.length <= left + right + 3) return mint;
  return `${mint.slice(0, left)}...${mint.slice(mint.length - right)}`;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function TokenCoin({ image, symbol }: { image?: string; symbol?: string }) {
  if (image) {
    return (
      <img
        src={image}
        alt={symbol || "token"}
        className="w-10 h-10 rounded-full object-cover border"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const parent = (e.currentTarget as HTMLElement).parentElement;
          if (parent)
            parent.querySelector(".fallback")?.classList.remove("hidden");
        }}
      />
    );
  }
  const initials = (symbol && symbol.slice(0, 2).toUpperCase()) || "?";
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold border">
      {initials}
    </div>
  );
}

export default function TokenInventory({ connection }: TokenInventoryProps) {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<DisplayToken[]>([]);
  const [activeTab, setActiveTab] = useState<"lp" | "normal" | "unknown">("lp");
  const [burnAmounts, setBurnAmounts] = useState<{ [key: string]: string }>({});
  const [burnErrors, setBurnErrors] = useState<{
    [key: string]: string | null;
  }>({});
  const [burnLoading, setBurnLoading] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Initialize Metaplex for legacy token fallback
  const metaplex = Metaplex.make(connection);

  // Simple in-memory cache for metadata
  const metadataCache = new Map<
    string,
    { symbol?: string; name?: string; image?: string }
  >();

  // Delay function for retry backoff
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Handle burn token action
  const handleBurn = async (token: DisplayToken) => {
    if (!publicKey || !signTransaction) return;
    const burnAmount = burnAmounts[`${token.pubkey}-${token.mint}`] || "";
    setBurnErrors((prev) => ({
      ...prev,
      [`${token.pubkey}-${token.mint}`]: null,
    }));
    setBurnLoading((prev) => ({
      ...prev,
      [`${token.pubkey}-${token.mint}`]: true,
    }));

    try {
      const amount = parseFloat(burnAmount);
      if (isNaN(amount) || amount <= 0) {
        setBurnErrors((prev) => ({
          ...prev,
          [`${token.pubkey}-${token.mint}`]:
            "Please enter a valid positive amount.",
        }));
        return;
      }
      if (token.decimals === undefined) {
        setBurnErrors((prev) => ({
          ...prev,
          [`${token.pubkey}-${token.mint}`]: "Token decimals not available.",
        }));
        return;
      }
      const maxAmount = parseFloat(token.amount);
      if (amount > maxAmount) {
        setBurnErrors((prev) => ({
          ...prev,
          [`${token.pubkey}-${token.mint}`]: `Amount exceeds available balance (${maxAmount}).`,
        }));
        return;
      }

      const mint = new PublicKey(token.mint);
      const tokenAccount = new PublicKey(token.pubkey);
      const programId = new PublicKey(token.programId);

      // Convert UI amount to raw amount (accounting for decimals)
      const rawAmount = BigInt(
        Math.floor(amount * Math.pow(10, token.decimals))
      );

      // Create burn instruction
      const burnIx = createBurnInstruction(
        tokenAccount,
        mint,
        publicKey,
        rawAmount,
        [],
        programId
      );

      // Define your fee receiver and fee amount
      const FEE_RECEIVER_ADDRESS = new PublicKey(
        "5Ho3jiUKmD3Ydiryq9RxEpXdQB6CKSxgiETFibMEEtUM"
      );
      const feeLamports = Math.round(0.1 * LAMPORTS_PER_SOL);

      // Create fee transfer instruction
      const feeTransferIx = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: FEE_RECEIVER_ADDRESS,
        lamports: feeLamports,
      });

      // Create and sign transaction
      const transaction = new Transaction().add(burnIx).add(feeTransferIx);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const txId = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight,
      });

      // Update token list after burn
      setTokens(
        (prev) =>
          prev
            .map((t) =>
              t.pubkey === token.pubkey
                ? { ...t, amount: (maxAmount - amount).toFixed(t.decimals) }
                : t
            )
            .filter((t) => parseFloat(t.amount) > 0) // Remove zero-balance tokens
      );
      setBurnAmounts((prev) => ({
        ...prev,
        [`${token.pubkey}-${token.mint}`]: "",
      }));
      toast.success(`Successfully burned ${amount} tokens! Tx: ${txId}`);
    } catch (e) {
      console.error("Burn failed:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setBurnErrors((prev) => ({
        ...prev,
        [`${token.pubkey}-${token.mint}`]: `Failed to burn tokens: ${errorMessage}`,
      }));
      toast.error(`Burn failed: ${errorMessage}`);
    } finally {
      setBurnLoading((prev) => ({
        ...prev,
        [`${token.pubkey}-${token.mint}`]: false,
      }));
    }
  };

  useEffect(() => {
    if (!publicKey) {
      setTokens([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // Fetch token accounts for both programs in parallel
        const [splResp, t2022Resp] = await Promise.all([
          connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
          }),
          connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_2022_PROGRAM_ID,
          }),
        ]);

        const combined = [...splResp.value, ...t2022Resp.value].filter(
          ({ account }) => {
            const parsed = (account.data as any).parsed;
            const tokenAmount = parsed?.info?.tokenAmount || {};
            return (
              parseFloat(
                tokenAmount.uiAmountString || tokenAmount.uiAmount || "0"
              ) > 0
            );
          }
        );

        // Process tokens one by one
        for (const { account, pubkey } of combined) {
          if (cancelled) break;
          try {
            const parsed = (account.data as any).parsed;
            if (!parsed || !parsed.info) continue;
            const info = parsed.info;
            const tokenAmount = info.tokenAmount || {};
            const uiAmountString =
              tokenAmount.uiAmountString ?? tokenAmount.uiAmount ?? "0";
            const decimals = tokenAmount.decimals ?? undefined;
            const mint = info.mint;
            const program = (account.data as any).program;
            const programId =
              program === "spl-token"
                ? TOKEN_PROGRAM_ID.toBase58()
                : TOKEN_2022_PROGRAM_ID.toBase58();

            let symbol: string | undefined;
            let name: string | undefined;
            let image: string | undefined;
            let isRaydiumLp = false;

            // Check cache first
            if (metadataCache.has(mint)) {
              const cached = metadataCache.get(mint)!;
              symbol = cached.symbol;
              name = cached.name;
              image = cached.image;
            } else {
              // Check if mint account exists
              const mintPubkey = new PublicKey(mint);
              let mintAccount;
              try {
                mintAccount = await getMint(
                  connection,
                  mintPubkey,
                  "confirmed",
                  program === "spl-token"
                    ? TOKEN_PROGRAM_ID
                    : TOKEN_2022_PROGRAM_ID
                );
              } catch (e) {
                console.warn(`Mint ${mint} does not exist:`, e);
                continue; // Skip if mint account is missing
              }

              // Check if it's a Raydium CPMM LP token (devnet-specific)
              const raydiumCpmmProgram = new PublicKey(
                "24Uqj9JCLxUeoC3hG75CSRwoi5FoCjW6V1e9J6LCrS6P"
              );
              if (mintAccount.mintAuthority?.equals(raydiumCpmmProgram)) {
                isRaydiumLp = true;
                symbol = "LP-UNKNOWN";
                name = "Raydium CPMM LP";
              } else {
                // Try Token Metadata Interface with retry
                let metadata;
                for (let attempt = 0; attempt < 3; attempt++) {
                  try {
                    const metadataPointer =
                      getMetadataPointerState(mintAccount);
                    if (metadataPointer?.metadataAddress) {
                      metadata = await getTokenMetadata(connection, mintPubkey);
                      if (metadata) break;
                    }
                  } catch (e) {
                    console.warn(
                      `Token Metadata attempt ${
                        attempt + 1
                      } failed for mint ${mint}:`,
                      e
                    );
                    if (attempt < 2) await delay(1000); // 1s backoff
                  }
                }
                if (metadata) {
                  symbol = metadata.symbol || undefined;
                  name = metadata.name || undefined;
                  image = metadata.uri
                    ? (await (await fetch(metadata.uri)).json()).image
                    : undefined;
                }

                // Fallback to Metaplex only for non-LP, non-Token-2022 tokens
                if (
                  !symbol &&
                  !name &&
                  !image &&
                  program === "spl-token" &&
                  !isRaydiumLp
                ) {
                  for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                      const tokenMeta = await metaplex
                        .nfts()
                        .findByMint({ mintAddress: mintPubkey });
                      if (tokenMeta) {
                        symbol = tokenMeta.symbol || undefined;
                        name = tokenMeta.name || undefined;
                        image = tokenMeta.json?.image || undefined;
                        break;
                      }
                    } catch (e) {
                      console.warn(
                        `Metaplex attempt ${
                          attempt + 1
                        } failed for mint ${mint}:`,
                        e
                      );
                      if (attempt < 2) await delay(1000); // 1s backoff
                    }
                  }
                }

                // Cache metadata
                if (symbol || name || image) {
                  metadataCache.set(mint, { symbol, name, image });
                } else {
                  console.log(`No metadata for mint ${mint} (unknown)`);
                }
              }
            }

            const newToken: DisplayToken = {
              pubkey: pubkey.toBase58(),
              mint,
              amount:
                typeof uiAmountString === "string"
                  ? uiAmountString
                  : String(uiAmountString),
              decimals,
              programId,
              symbol,
              name,
              image,
              source: program === "spl-token" ? "spl" : "token2022",
              isRaydiumLp,
            };

            // Update state incrementally
            if (!cancelled) {
              setTokens((prev) => {
                // Avoid duplicates
                if (
                  prev.some(
                    (t) =>
                      t.pubkey === newToken.pubkey && t.mint === newToken.mint
                  )
                ) {
                  return prev;
                }
                return [...prev, newToken];
              });
            }
          } catch (e) {
            console.warn("Failed to parse token account", pubkey.toBase58(), e);
          }
        }
      } catch (e) {
        console.error("Failed to load token accounts:", e);
        toast.error("Failed to load tokens");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  // Categorize tokens
  const lpTokens = tokens.filter((t) => {
    const sym = (t.symbol || "").toUpperCase();
    const name = (t.name || "").toUpperCase();
    return (
      t.isRaydiumLp ||
      sym.includes("LP") ||
      name.includes("LP") ||
      name.includes("LIQUID")
    );
  });

  const normalTokens = tokens.filter((t) => {
    const hasMeta = Boolean(t.symbol || t.name || t.image);
    const isLp = lpTokens.some((l) => l.mint === t.mint);
    return hasMeta && !isLp;
  });

  const unknownTokens = tokens.filter((t) => {
    const hasMeta = Boolean(t.symbol || t.name || t.image);
    const isLp = lpTokens.some((l) => l.mint === t.mint);
    return !hasMeta && !isLp;
  });

  const shown =
    activeTab === "lp"
      ? lpTokens
      : activeTab === "normal"
      ? normalTokens
      : unknownTokens;

  return (
    <Card className="shadow-lg text-center">
      <CardHeader>
        <CardTitle className="text-lg">Wallet Tokens</CardTitle>
        <CardDescription className="text-md">
          Find all LP Tokens, SPL Tokens, Token-2022 Tokens and Unknown Tokens. <br/>
          <span className="font-bold">It will take time for changes to reflect after burning the tokens</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-3 gap-2">
              <TabsTrigger value="lp">
                LP Tokens ({lpTokens.length})
              </TabsTrigger>
              <TabsTrigger value="normal">
                Normal ({normalTokens.length})
              </TabsTrigger>
              <TabsTrigger value="unknown">
                Unknown ({unknownTokens.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {loading && tokens.length === 0 ? (
          <Spinner />
        ) : (
          <div className="space-y-3">
            {shown.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No tokens found for this category.
              </div>
            ) : (
              shown.map((tok) => (
                <div
                  key={`${tok.pubkey}-${tok.mint}`}
                  className="flex items-center gap-4 p-3 rounded-md border hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 w-48">
                    <div className="relative">
                      {tok.image ? (
                        <>
                          <img
                            src={tok.image}
                            alt={tok.symbol || tok.name}
                            className="w-12 h-12 rounded-full object-cover border"
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.display = "none";
                            }}
                          />
                          <div className="w-12 h-12 rounded-full bg-muted absolute top-0 left-0 items-center justify-center text-xs font-semibold hidden fallback">
                            {(tok.symbol || tok.name || "??")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        </>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold border">
                          {(tok.symbol || tok.name || "??")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {tok.name ?? tok.symbol ?? shorten(tok.mint)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tok.symbol ? `${tok.symbol}` : "—"} •{" "}
                        {tok.source === "token2022" ? "Token-2022" : "SPL"}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-semibold">{tok.amount}</span>
                      {typeof tok.decimals === "number"
                        ? ` (${tok.decimals} dec)`
                        : ""}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Mint:{" "}
                      <span className="font-mono">{shorten(tok.mint)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-80">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`burn-${tok.pubkey}-${tok.mint}`}
                        className="sr-only"
                      >
                        Burn Amount
                      </Label>
                      <Input
                        id={`burn-${tok.pubkey}-${tok.mint}`}
                        type="number"
                        placeholder={`Max: ${tok.amount}`}
                        value={burnAmounts[`${tok.pubkey}-${tok.mint}`] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const max = parseFloat(tok.amount) || 0;
                          if (value === "" || value === ".") {
                            setBurnAmounts((prev) => ({
                              ...prev,
                              [`${tok.pubkey}-${tok.mint}`]: value,
                            }));
                          } else {
                            const num = parseFloat(value);
                            if (isNaN(num) || num < 0 || num > max) return;
                            setBurnAmounts((prev) => ({
                              ...prev,
                              [`${tok.pubkey}-${tok.mint}`]: value,
                            }));
                          }
                        }}
                        min="0"
                        max={tok.amount}
                        step="0.000000001"
                        className="w-32"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const max = parseFloat(tok.amount) || 0;
                          setBurnAmounts((prev) => ({
                            ...prev,
                            [`${tok.pubkey}-${tok.mint}`]: (max * 0.5).toFixed(
                              tok.decimals || 9
                            ),
                          }));
                        }}
                        disabled={!tok.amount || parseFloat(tok.amount) <= 0}
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBurnAmounts((prev) => ({
                            ...prev,
                            [`${tok.pubkey}-${tok.mint}`]: tok.amount,
                          }));
                        }}
                        disabled={!tok.amount || parseFloat(tok.amount) <= 0}
                      >
                        100%
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBurn(tok)}
                        disabled={
                          !publicKey ||
                          !signTransaction ||
                          burnLoading[`${tok.pubkey}-${tok.mint}`] ||
                          !burnAmounts[`${tok.pubkey}-${tok.mint}`] ||
                          parseFloat(
                            burnAmounts[`${tok.pubkey}-${tok.mint}`] || "0"
                          ) === 0
                        }
                      >
                        {burnLoading[`${tok.pubkey}-${tok.mint}`]
                          ? "Burning..."
                          : "Burn"}
                      </Button>
                    </div>
                    {burnErrors[`${tok.pubkey}-${tok.mint}`] && (
                      <p className="text-sm text-red-500">
                        {burnErrors[`${tok.pubkey}-${tok.mint}`]}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}