import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ProtectedRoute from "@/components/protected-route"

export default function CreateMemeCoinPage() {
  return (
    <ProtectedRoute>
      <div className="p-4 md:p-6 lg:p-8 w-full">
        {" "}
        {/* Removed max-w-2xl mx-auto */}
        <h1 className="text-3xl font-bold mb-6 text-center">Create Your Meme Coin</h1>
        <Card className="max-w-2xl mx-auto">
          {" "}
          {/* Kept max-w-2xl on the Card for form readability */}
          <CardHeader>
            <CardTitle>Meme Coin Details</CardTitle>
            <CardDescription>Fill in the details to launch your very own meme coin on Solana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="coin-name">Coin Name</Label>
              <Input id="coin-name" placeholder="e.g., DogeCoin 2.0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coin-symbol">Coin Symbol (Ticker)</Label>
              <Input id="coin-symbol" placeholder="e.g., DOGE2" maxLength={10} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata / Description</Label>
              <Textarea
                id="metadata"
                placeholder="A brief description of your meme coin, its purpose, or its meme origin."
                rows={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-supply">Total Supply</Label>
              <Input id="total-supply" type="number" placeholder="e.g., 1000000000" min="1" required />
              <p className="text-sm text-muted-foreground">This is the total number of coins that will ever exist.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial-liquidity">Initial Liquidity (USD)</Label>
              <Input id="initial-liquidity" type="number" placeholder="e.g., 10000" min="0" required />
              <p className="text-sm text-muted-foreground">
                The amount of USD to provide as initial liquidity for trading.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coin-logo">Coin Logo (Image Upload)</Label>
              <Input id="coin-logo" type="file" accept="image/*" />
              <p className="text-sm text-muted-foreground">Upload a square image for your coin's logo.</p>
            </div>
            <Button type="submit" className="w-full">
              Launch Meme Coin
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
