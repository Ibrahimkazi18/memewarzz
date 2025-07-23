"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import useProfile from "@/hooks/useProfile"
import { useRouter } from "next/navigation"
import useFollowStats from "@/hooks/useFollows"
import { MessageCircle, Heart, PlusCircle } from "lucide-react"
import { formatNumberShort } from "../../utils/helper"

export function RightPanel() {
  const { profile } = useProfile()
  const { followersCount, followingCount } = useFollowStats(profile?.id)
  const router = useRouter()

  return (
    <div className="hidden lg:block w-72 xl:w-80 p-4 space-y-6 overflow-hidden">
      {/* Profile Preview Card */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="text-xl">Your Profile</CardTitle>
          <CardDescription>Quick overview of your Memwarzz presence.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24 border-2 border-primary/50 shadow-sm">
            <AvatarImage
              src={profile?.avatar || "/placeholder.svg?height=100&width=100&query=user%20avatar"}
              alt="@memwarzz"
            />
            <AvatarFallback>{profile?.username ? profile.username.charAt(0) : "U"}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">{profile?.username || "Guest User"}</h3>
            <p className="text-sm text-muted-foreground">@{profile?.handle || "guest"}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex flex-col items-center">
              <span className="font-semibold text-base">{formatNumberShort(followersCount)}</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-base">{formatNumberShort(followingCount)}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
          </div>
          <Button className="w-full mt-4" onClick={() => router.push("/profile")}>
            View Profile
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full flex items-center justify-start gap-3 bg-transparent" variant="outline" asChild>
            <Link href="/create-meme">
              <PlusCircle className="w-5 h-5 text-primary" /> Create New Meme
            </Link>
          </Button>
          <Button className="w-full flex items-center justify-start gap-3 bg-transparent" variant="outline" asChild>
            <Link href="/create-meme-coin">
              <PlusCircle className="w-5 h-5 text-primary" /> Create Meme Coin
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity Card
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@user1" />
              <AvatarFallback>U1</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p>
                <Link href="#" className="font-semibold hover:underline">
                  @user1
                </Link>{" "}
                liked your post.
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                <Heart className="w-3 h-3 inline-block mr-1" />2 hours ago
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@user2" />
              <AvatarFallback>U2</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p>
                <Link href="#" className="font-semibold hover:underline">
                  @user2
                </Link>{" "}
                commented on your battle.
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                <MessageCircle className="w-3 h-3 inline-block mr-1" />5 hours ago
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@user3" />
              <AvatarFallback>U3</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p>
                <Link href="#" className="font-semibold hover:underline">
                  @user3
                </Link>{" "}
                started a new meme battle.
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                <PlusCircle className="w-3 h-3 inline-block mr-1" />1 day ago
              </p>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
