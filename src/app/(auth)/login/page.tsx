"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "../../../../utils/supabase/client"

const supabase = createClient();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    setLoading(true);
    e.preventDefault()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error("Login failed: " + error.message);
    } else {
      toast.success("Logged in successfully!");
      console.log("User:", data.user);
      router.push("/");
    }

    setLoading(false);
  }

  return (
    <Card className="w-full max-w-4xl lg:grid lg:grid-cols-2 xl:min-h-[600px] overflow-hidden">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto w-[350px] space-y-6">
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Login to Memwarzz</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your details below
            </CardDescription>
          </div>
          <div className="space-y-4">
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
            
            <Button type="submit" className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? "Loging in..." : "Login"}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
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
