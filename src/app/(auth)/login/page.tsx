"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [userRole, setUserRole] = useState<"viewer" | "creator">("viewer")

  return (
    <Card className="w-full max-w-4xl lg:grid lg:grid-cols-2 xl:min-h-[600px] overflow-hidden">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto w-[350px] space-y-6">
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Login to Memwarzz</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your details below or connect your wallet
            </CardDescription>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required />
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
            <Button type="submit" className="w-full">
              Login
            </Button>
            {userRole === "creator" && (
              <Button variant="outline" className="w-full bg-transparent">
                Connect Solana Wallet
              </Button>
            )}
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="#" className="underline">
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
