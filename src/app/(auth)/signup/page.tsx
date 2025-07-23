"use client"

import { useState, useEffect } from "react"

import Image from "next/image"
import Link from "next/link"

import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

import { createClient } from "../../../../utils/supabase/client"

const supabase = createClient();

export default function SignupPage() {
  const [userRole, setUserRole] = useState<"viewer" | "creator">("viewer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [handle, setHandle] = useState("");

  const [loading, setLoading] = useState(false);
  const wallet = useWallet();

  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);

    try {
      if (!email || !password || !username || !handle) {
        toast.warning('All fields are required');
        return
      }

      if (userRole === "creator" && !wallet.publicKey) {
        toast.warning("Creators must connect a Solana wallet.")
        return
      }

      // 1. Register with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError;

      const userId = authData.user?.id
      if (!userId) throw new Error("User ID not found after sign up.");

      // 2. Insert profile record
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        username,
        handle,
        role: userRole,
        solana_wallet_address: userRole === "creator" ? wallet.publicKey?.toBase58() : null,
      });

      if (profileError) throw profileError;

      toast.success("Signup successful! Redirecting")

      router.push("/login");
    
    } catch (err: any) {
      toast.error(err.message || "Something went wrong during sign up.");

    } finally {
      setLoading(false);
    }
  }

  return (
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
            
            <Button type="submit" className="w-full" onClick={handleSignUp} disabled={loading}>
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
  )
}
