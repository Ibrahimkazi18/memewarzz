import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export function RightPanel() {
  return (
    <div className="hidden lg:block w-72 xl:w-80 p-4 space-y-4">
      {/* Profile Preview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src="/placeholder-user.jpg" alt="@memwarzz" />
            <AvatarFallback>MW</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">MemeMaster</h3>
          <p className="text-sm text-muted-foreground">@mememaster_official</p>
          <div className="flex gap-4 mt-2 text-sm">
            <div>
              <span className="font-semibold">1.2K</span> Followers
            </div>
            <div>
              <span className="font-semibold">500</span> Following
            </div>
          </div>
          <Button size="sm" className="mt-4 w-full">
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
