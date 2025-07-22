'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function TokenCreatorPage() {

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 6,
    description: '',
    file: null as File | null,
    totalSupply: '',
    revokeMint: false,
    revokeMintLater: false,
    revokeFreeze: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = 'Token name is required.';
    if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required.';
    if (formData.symbol.length > 8) newErrors.symbol = 'Symbol cannot exceed 8 characters.';
    if (!formData.decimals || formData.decimals < 1 || formData.decimals > 9)
      newErrors.decimals = 'Decimals must be between 1 and 9.';
    if (formData.file === null) newErrors.file = "Image is required." ;
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (formData.description.length > 300) newErrors.description = "Description cannot exceed 300 characters.";
    if (!formData.totalSupply) {
      newErrors.totalSupply = 'Supply is required.';
    } else {
      const supply = parseFloat(formData.totalSupply);
      if (isNaN(supply) || supply <= 0) {
        newErrors.totalSupply = 'Enter a valid supply.';
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const handleSubmit = () => {
    if (!validate()) return;
    alert('Validated successfully!');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

      {/* Hero Section */}
      <section className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create Meme Token</h1>
        <p className="text-gray-700 dark:text-zinc-100">
          Create your own solana meme token without coding anything in 8 easy steps!
        </p>
        <p className="text-sm text-gray-600 dark:text-zinc-300">
          Takes less than 5 minutes, fully on-chain.
        </p>
      </section>

      {/* Instructions */}
      <section className="bg-muted p-4 rounded-xl shadow space-y-2">
        <h2 className="text-xl font-semibold text-center">How it works</h2>
        <ol className="list-decimal list-inside text-gray-700 dark:text-zinc-300 space-y-1">
          <li>Connect your Solana wallet.</li>
          <li>Enter your Token Name</li>
          <li>Choose a Symbol (max 8 characters)</li>
          <li>Select Decimals (recommended: 6)</li>
          <li>Add a description (optional)</li>
          <li>Upload a PNG image (token logo)</li>
          <li>Enter total Supply</li>
          <li>Click Create – confirm the transaction</li>
        </ol>
        <p className="text-sm dark:bg-white bg-zinc-950 p-2 rounded-t-md rounded-b-2xl dark:text-zinc-950 text-zinc-200 text-center">
          Total cost: 0.3 SOL – includes all creation fees.
        </p>
      </section>

      {/* Form Section */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Token Creator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CardTitle>Token Name (Max 32 Characters)</CardTitle>
                <Input
                  placeholder="Eg: MemeToken"
                  maxLength={32}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <CardTitle>Token Symbol (Max 8 Characters)</CardTitle>
                <Input
                  placeholder="Eg: MEME"
                  maxLength={8}
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                />
                {errors.symbol && <p className="text-red-500 text-sm mt-1">{errors.symbol}</p>}
              </div>

              <div>
                <CardTitle>Decimals (Range 1-9)</CardTitle>
                <Input
                  type="number"
                  placeholder="Decimals"
                  value={formData.decimals}
                  min={1}
                  max={9}
                  onChange={(e) =>
                    setFormData({ ...formData, decimals: parseInt(e.target.value || '0') })
                  }
                />
                {errors.decimals && <p className="text-red-500 text-sm mt-1">{errors.decimals}</p>}
              </div>

              <div>
                <CardTitle>Total Supply</CardTitle>
                <Input
                  type="number"
                  placeholder="Eg: 1000000000"
                  value={formData.totalSupply}
                  onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                />
                {errors.totalSupply && <p className="text-red-500 text-sm mt-1">{errors.totalSupply}</p>}
              </div>
            </div>

            <div>
            <CardTitle>Description</CardTitle>
            <Textarea
              placeholder="Eg: This is just a meme token made for fun :P"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* File Upload */}
            <label className="grid grid-cols-1 text-center mx-auto items-center gap-2 p-2 border rounded cursor-pointer w-fit h-50 bg-muted hover:bg-accent text-sm dark:text-white">
              <Upload className="w-10 h-10 mx-auto" />
              <span>{formData.file?.name || 'Upload Token Logo (PNG)'}</span>
              <input required type="file" accept="image/png" className="hidden grow" onChange={handleFileUpload} />
              {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
            </label>

            {/* Freeze Authority Switch */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Revoke Freeze Authority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-center text-sm text-gray-700 dark:text-white">
                <p>
                  Required for creating a liquidity pool. This ensures no one can freeze token accounts.
                </p>
                <div className="flex justify-center items-center gap-2">
                  <Switch checked disabled/>
                  <span>(0.1 SOL)</span>
                </div>
              </CardContent>
            </Card>

            {/* Mint Authority Switch */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Revoke Mint Authority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-center text-sm text-gray-700 dark:text-white">
                <p>
                  Prevents any further minting of tokens – useful for building trust. Optional.
                </p>
                <div className="flex justify-center items-center gap-2">
                  <Switch className='cursor-pointer'
                    checked={formData.revokeMint}
                    onCheckedChange={(val) => setFormData({ ...formData, revokeMint: val })}
                  />
                  <span>(0.1 SOL)</span>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full mt-4 cursor-pointer" onClick={handleSubmit}>
              Create Token
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Mint Revoke For Deployed Tokens Section*/}
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Revoke Mint Authority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-center text-sm text-gray-700 dark:text-white">
            <p>
              You can revoke minting permissions after token creation if not done earlier.
            </p>
            <div className="flex justify-center items-center gap-2">
              <Switch className='cursor-pointer'
                checked={formData.revokeMintLater}
                onCheckedChange={(val) => setFormData({ ...formData, revokeMintLater: val })}
              />
              <span>(0.1 SOL)</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
