"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import ProtectedRoute from "@/components/protected-route"
import useProfile from "@/hooks/useProfile"
import { Key, Bell, Palette, User, LogOut } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { profile } = useProfile()

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>

        {/* General Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="w-6 h-6 text-primary" /> General Settings
            </CardTitle>
            <CardDescription>Manage your account preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                defaultValue={profile?.username || "Your Username"}
                placeholder="Enter your username"
              />
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Palette className="w-6 h-6 text-primary" /> Theme
            </CardTitle>
            <CardDescription>Customize the look and feel of Memwarzz.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between p-6">
            <Label htmlFor="dark-mode" className="text-base">
              Dark Mode
            </Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Bell className="w-6 h-6 text-primary" /> Notifications
            </CardTitle>
            <CardDescription>Control how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-base">
                Email Notifications
              </Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-base">
                Push Notifications
              </Label>
              <Switch id="push-notifications" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="battle-alerts" className="text-base">
                Meme Battle Alerts
              </Label>
              <Switch id="battle-alerts" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Key className="w-6 h-6 text-primary" /> Security
            </CardTitle>
            <CardDescription>Manage your account security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full flex items-center gap-2 bg-transparent">
              Change Password
            </Button>
            <Button variant="outline" className="w-full flex items-center gap-2 bg-transparent">
              Manage Connected Wallets
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full flex items-center gap-2">
              Delete Account
            </Button>
            <Button variant="secondary" className="w-full flex items-center gap-2">
              <LogOut className="w-5 h-5" /> Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
