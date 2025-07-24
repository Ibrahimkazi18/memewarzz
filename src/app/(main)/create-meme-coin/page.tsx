"use client";

import type React from "react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DropletIcon, DropletOff, Upload, Coins, Flame } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function TokenManagementPage() {
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    decimals: 6,
    description: "",
    file: null as File | null,
    totalSupply: "",
    revokeMint: false,
    revokeMintLater: false,
    revokeFreeze: true,
  });

  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const ConnectWalletSection = () => {
    return (
      <div className="flex justify-center py-6">
        <WalletMultiButton />
      </div>
    );
  };

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Token name is required.";
    if (!formData.symbol.trim()) newErrors.symbol = "Symbol is required.";
    if (formData.symbol.length > 8)
      newErrors.symbol = "Symbol cannot exceed 8 characters.";
    if (!formData.decimals || formData.decimals < 1 || formData.decimals > 9)
      newErrors.decimals = "Decimals must be between 1 and 9.";
    if (formData.file === null) newErrors.file = "Image is required.";
    if (!formData.description.trim())
      newErrors.description = "Description is required.";
    if (formData.description.length > 300)
      newErrors.description = "Description cannot exceed 300 characters.";
    if (!formData.totalSupply) {
      newErrors.totalSupply = "Supply is required.";
    } else {
      const supply = Number.parseFloat(formData.totalSupply);
      if (isNaN(supply) || supply <= 0) {
        newErrors.totalSupply = "Enter a valid supply.";
      } else {
        const decimal = formData.decimals;
        const maxSupply =
          decimal <= 4
            ? 1_844_674_407_370_955
            : decimal <= 7
            ? 1_844_674_407_370
            : decimal === 8
            ? 184_467_440_737
            : 18_446_744_073;
        if (supply > maxSupply) {
          newErrors.totalSupply = `For decimals ${decimal}, max supply is ${maxSupply.toLocaleString()}`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "image/png") {
        alert("Only PNG files are allowed.");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setImageFile(null);
        setFileName(null);
        setPreviewUrl(null);

        return;
      }
      setImageFile(file);
      setFileName(file.name);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!validate()) return;
    alert("Validated successfully!");
    console.log(formData);
    console.log(publicKey);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Hero Section */}
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Meme Coin Tools
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your meme tokens and liquidity pools with ease.
        </p>
        <ConnectWalletSection />
      </section>

      <Tabs defaultValue="create-token" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-12">
          <TabsTrigger
            value="create-token"
            className="text-base flex items-center gap-2"
          >
            <Coins className="w-4 h-4" /> Create Token
          </TabsTrigger>
          <TabsTrigger
            value="burn-coin"
            className="text-base flex items-center gap-2"
          >
            <Flame className="w-4 h-4" /> Burn Coin
          </TabsTrigger>
          <TabsTrigger
            value="add-liquidity"
            className="text-base flex items-center gap-2"
          >
            <DropletIcon className="w-4 h-4" /> Add Liquidity
          </TabsTrigger>
          <TabsTrigger
            value="remove-liquidity"
            className="text-base flex items-center gap-2"
          >
            <DropletOff className="w-4 h-4" /> Remove Liquidity
          </TabsTrigger>
        </TabsList>

        {/* Create Token Tab Content */}
        <TabsContent value="create-token" className="mt-8 space-y-8">
          <section className="bg-muted p-6 rounded-xl shadow-lg space-y-4">
            <h2 className="text-2xl font-semibold text-center">How it works</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>Connect your Solana wallet.</li>
              <li>Enter your Token Name</li>
              <li>Choose a Symbol (max 8 characters)</li>
              <li>Select Decimals (recommended: 6)</li>
              <li>Add a description (optional)</li>
              <li>Upload a PNG image (token logo)</li>
              <li>Enter total Supply</li>
              <li>Click Create – confirm the transaction</li>
            </ol>
            <div className="bg-card text-card-foreground p-3 rounded-lg text-center text-sm font-medium border border-primary/20">
              Total cost:{" "}
              <span className="font-semibold text-primary">0.3 SOL</span> –
              includes all creation fees.
            </div>
          </section>

          <section>
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Token Creator</CardTitle>
                <CardDescription>
                  Fill in the details to create your new token.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="token-name">
                      Token Name (Max 32 Characters)
                    </Label>
                    <Input
                      id="token-name"
                      placeholder="Eg: MemeToken"
                      maxLength={32}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                    {errors.name && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-symbol">
                      Token Symbol (Max 8 Characters)
                    </Label>
                    <Input
                      id="token-symbol"
                      placeholder="Eg: MEME"
                      maxLength={8}
                      value={formData.symbol}
                      onChange={(e) =>
                        setFormData({ ...formData, symbol: e.target.value })
                      }
                    />
                    {errors.symbol && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.symbol}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decimals">Decimals (Range 1-9)</Label>
                    <Input
                      id="decimals"
                      type="number"
                      placeholder="Decimals"
                      value={formData.decimals}
                      min={1}
                      max={9}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          decimals: Number.parseInt(e.target.value || "0"),
                        })
                      }
                    />
                    {errors.decimals && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.decimals}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total-supply">Total Supply</Label>
                    <Input
                      id="total-supply"
                      type="number"
                      placeholder="Eg: 1000000000"
                      value={formData.totalSupply}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalSupply: e.target.value,
                        })
                      }
                    />
                    {errors.totalSupply && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.totalSupply}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Eg: This is just a meme token made for fun :P"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Token Logo (PNG)</Label>
                  <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors">
                    <span className="text-sm font-medium text-muted-foreground">
                      {previewUrl ? (
                        <div>
                          <img
                            src={previewUrl}
                            alt="Selected Preview"
                            className="mx-auto h-32 w-32 object-cover rounded-md border"
                          />
                          {fileName && (
                            <p className="text-sm mt-2">
                              Selected file: {fileName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="grid-cols-1">
                          <Upload className="w-10 mx-auto justify-center h-10 text-muted-foreground mb-2" />
                          Click to upload or drag and drop
                        </div>
                      )}
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/png"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                    />
                  </div>
                  {errors.file && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.file}
                    </p>
                  )}
                </div>

                {/* Freeze Authority Switch */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="space-y-1">
                    <Label htmlFor="revoke-freeze" className="text-base">
                      Revoke Freeze Authority
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Required for creating a liquidity pool. This ensures no
                      one can freeze token accounts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="revoke-freeze" checked disabled />
                    <span className="text-sm text-muted-foreground">
                      (0.1 SOL)
                    </span>
                  </div>
                </div>

                {/* Mint Authority Switch */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="space-y-1">
                    <Label htmlFor="revoke-mint" className="text-base">
                      Revoke Mint Authority
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Prevents any further minting of tokens – useful for
                      building trust. Optional.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="revoke-mint"
                      checked={formData.revokeMint}
                      onCheckedChange={(val) =>
                        setFormData({ ...formData, revokeMint: val })
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      (0.1 SOL)
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleSubmit}
                >
                  Create Token
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Mint Revoke For Deployed Tokens Section*/}
          <section className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Revoke Mint Authority (Deployed Tokens)
                </CardTitle>
                <CardDescription>
                  For tokens already created without mint authority revoked.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  You can revoke minting permissions after token creation if not
                  done earlier.
                </p>
                <div className="flex justify-center items-center gap-2">
                  <Switch
                    checked={formData.revokeMintLater}
                    onCheckedChange={(val) =>
                      setFormData({ ...formData, revokeMintLater: val })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    (0.1 SOL)
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Burn Coin Tab Content */}
        <TabsContent value="burn-coin" className="mt-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Burn Meme Coin</CardTitle>
              <CardDescription>
                Reduce the total supply of your token by burning a specified
                amount.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token-address-burn">Token Address</Label>
                <Input
                  id="token-address-burn"
                  placeholder="Enter token address (e.g., 7x...)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount-to-burn">Amount to Burn</Label>
                <Input
                  id="amount-to-burn"
                  type="number"
                  placeholder="e.g., 1000000"
                  min="0"
                />
              </div>
              <Button className="w-full" size="lg">
                Burn Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Liquidity Pool Tab Content */}
        <TabsContent value="add-liquidity" className="mt-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Add Liquidity Pool</CardTitle>
              <CardDescription>
                Create or add liquidity to a trading pair for your token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token-address-lp">Your Token Address</Label>
                <Input
                  id="token-address-lp"
                  placeholder="Enter your token address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sol-amount">SOL Amount</Label>
                <Input
                  id="sol-amount"
                  type="number"
                  placeholder="e.g., 10"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-amount">Your Token Amount</Label>
                <Input
                  id="token-amount"
                  type="number"
                  placeholder="e.g., 10000000"
                  min="0"
                />
              </div>
              <Button className="w-full" size="lg">
                Add Liquidity
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Remove Liquidity Pool Tab Content */}
        <TabsContent value="remove-liquidity" className="mt-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Remove Liquidity Pool</CardTitle>
              <CardDescription>
                Withdraw your assets from an existing liquidity pool.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="lp-token-address">LP Token Address</Label>
                <Input
                  id="lp-token-address"
                  placeholder="Enter LP token address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lp-amount">Amount of LP Tokens to Remove</Label>
                <Input
                  id="lp-amount"
                  type="number"
                  placeholder="e.g., 50"
                  min="0"
                />
              </div>
              <Button className="w-full" size="lg">
                Remove Liquidity
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
