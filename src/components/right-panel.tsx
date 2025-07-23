"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import useProfile from "@/hooks/useProfile"
import { useRouter } from "next/navigation";
import useFollowStats from "@/hooks/useFollows";
import { formatNumberShort } from "../../utils/helper";

export function RightPanel() {
  const {profile} = useProfile();
  const { followersCount, followingCount } = useFollowStats(profile?.id)

  const router = useRouter();

  return (
    <div className="hidden lg:block w-72 xl:w-80 p-4 space-y-4">
      {/* Profile Preview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Profile</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={profile?.avatar || "/placeholder-user.jpg"} alt="@memwarzz" />
            <AvatarFallback>{profile?.username.split(" ")[0][0]}</AvatarFallback>
          </Avatar>

          <h3 className="font-semibold text-lg">{profile?.username}</h3>

          <p className="text-sm text-muted-foreground">@{profile?.handle}</p>

          <div className="flex gap-4 mt-2 text-sm">
            <div>
              <span className="font-semibold">{formatNumberShort(followersCount)}</span> Followers
            </div>

            <div>
              <span className="font-semibold">{formatNumberShort(followingCount)}</span> Following
            </div>
          </div>

          <Button size="sm" className="mt-4 w-full" onClick={() => router.push("/profile")}>
            View Profile
          </Button>

        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="@user1" />
              <AvatarFallback>U1</AvatarFallback>
            </Avatar>
            <div>
              <Link href="#" className="font-medium hover:underline">
                @user1
              </Link>{" "}
              liked your post.
              <p className="text-muted-foreground text-xs">2 hours ago</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="@user2" />
              <AvatarFallback>U2</AvatarFallback>
            </Avatar>
            <div>
              <Link href="#" className="font-medium hover:underline">
                @user2
              </Link>{" "}
              commented on your battle.
              <p className="text-muted-foreground text-xs">5 hours ago</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="@user3" />
              <AvatarFallback>U3</AvatarFallback>
            </Avatar>
            <div>
              <Link href="#" className="font-medium hover:underline">
                @user3
              </Link>{" "}
              started a new meme battle.
              <p className="text-muted-foreground text-xs">1 day ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
