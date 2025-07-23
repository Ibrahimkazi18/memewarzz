"use client"

import { Calendar, Home, Compass, Settings, PlusCircle, User, Trophy, Sun, Moon, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("Logout error:", error.message)
    toast.error("Failed to log out.")
  } else {
    toast.success("Logging Out...")
    window.location.href = "/login"
  }
}

// Menu items.
const mainItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Explore",
    url: "/explore",
    icon: Compass,
  },
  {
    title: "Recreate Meme",
    url: "/recreate-meme",
    icon: Trophy,
  },
  {
    title: "Create Meme Coin",
    url: "/create-meme-coin",
    icon: PlusCircle,
  },
  {
    title: "Sponsor",
    url: "/sponsor",
    icon: Calendar,
  },
]

const accountItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) {
        console.error("Error getting user:", userError.message)
        return
      }
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single()
      if (profileError) {
        console.error("Error fetching profile:", profileError.message)
      } else {
        setProfile(profileData)
      }
    }
    fetchUserProfile()
  }, [])

  return (
    <Sidebar collapsible="icon" className="overflow-x-hidden border-r">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-start gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                >
                  <Avatar className="size-9 border-2 border-primary/50">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@memwarzz" />
                    <AvatarFallback>{profile?.username ? profile.username.charAt(0) : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                    <span className="font-semibold truncate">{profile?.username || "Guest User"}</span>
                    <span className="text-xs text-muted-foreground truncate">@{profile?.handle || "guest"}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="w-4 h-4 mr-2" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full justify-start gap-3 px-4 py-2 rounded-lg">
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5 text-primary" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="my-4" />
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full justify-start gap-3 px-4 py-2 rounded-lg">
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5 text-primary" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="my-4" />
        {/* Theme Toggle in Sidebar */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Appearance
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                <Label htmlFor="sidebar-dark-mode">{theme === "dark" ? "Dark" : "Light"} Mode</Label>
              </div>
              <Switch
                id="sidebar-dark-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="my-4" />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
