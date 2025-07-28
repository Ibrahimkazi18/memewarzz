"use client"

import { useState, useMemo } from "react"

import Image from "next/image"
import Link from "next/link"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { signUp } from "../actions"

export default function SignupPage() {
  const [userRole, setUserRole] = useState<"viewer" | "creator">("viewer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [handle, setHandle] = useState("");

  const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const walletPublicKey = useMemo(() => wallet.publicKey?.toBase58(), [wallet.publicKey]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
    setLoading(true);
    const data = { email, password, username, handle, userRole, walletPublicKey: walletPublicKey ? walletPublicKey : null };

    try {
      const result = await signUp(data);
    
    } catch (err: any) {
      toast.error(err.message || "Something went wrong during sign up.");

    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-4xl lg:grid lg:grid-cols-2 xl:min-h-[600px] overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto w-[350px] space-y-6">
            <div className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold">Sign Up to Memwarzz</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your details below
              </CardDescription>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Username</Label>
                <Input id="username" type="text" onChange={e => setUsername(e.target.value)} placeholder="JohnDoe" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle">Handle (unique)</Label>
                <Input id="handle" value={handle} onChange={e => setHandle(e.target.value)} placeholder="yourname" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" onChange={e => setEmail(e.target.value)} placeholder="m@example.com" required />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input id="password" type="password"  onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" required />
              </div>

              <div className="space-y-2">
                <Label>I am a:</Label>
                <RadioGroup
                  defaultValue="viewer"
                  onValueChange={(value: "viewer" | "creator") => setUserRole(value)}
                  className="flex gap-4"
                  >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="viewer" id="viewer" />
                    <Label htmlFor="viewer">Viewer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="creator" id="creator" />
                    <Label htmlFor="creator">Creator</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing up..." : "Sign Up"}
              </Button>

              {userRole === "creator" && (
                <div className="space-y-2 min-w-[100px] w-full">
                  <Label>Connect Wallet</Label>
                  <WalletMultiButton className="w-full justify-center" />
                </div>
              )}
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden bg-muted lg:block">
          <Image
            src="/placeholder.svg?height=1080&width=1920"
            alt="Abstract background"
            width="1920"
            height="1080"
            className="h-full w-full object-cover"
            />
        </div>
      </Card>
    </form>
  )
}
