import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MoreHorizontal, ThumbsUp, ThumbsDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MemeBattleCardProps {
  username: string
  userHandle: string
  userAvatar: string
  meme1Image: string
  meme2Image: string
  meme1Votes: number
  meme2Votes: number
  sponsorLogo?: string
  timeAgo: string
  comments: { user: string; text: string }[]
}

export function MemeBattleCard({
  username,
  userHandle,
  userAvatar,
  meme1Image,
  meme2Image,
  meme1Votes,
  meme2Votes,
  sponsorLogo,
  timeAgo,
  comments,
}: MemeBattleCardProps) {
  return (
    <Card className="w-full max-w-xl mx-auto border-none shadow-none rounded-none md:border md:shadow-sm md:rounded-lg">
      <CardHeader className="flex flex-row items-center p-4 pb-2">
        <Link href="#" className="flex items-center gap-2 text-sm font-semibold">
          <Avatar className="w-9 h-9 border">
            <AvatarImage src={userAvatar || "/placeholder.svg"} alt={username} />
            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span>{username}</span>
            <span className="text-xs text-muted-foreground font-normal">
              @{userHandle} • {timeAgo}
            </span>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 ml-auto rounded-full">
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Report Battle</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-0.5 bg-border">
          <div className="relative">
            <Image
              src={meme1Image || "/placeholder.svg"}
              width={300}
              height={200}
              alt="Meme 1"
              className="object-cover w-full aspect-[3/2] bg-muted"
            />
            <div className="absolute bottom-2 left-2 bg-background/70 px-2 py-1 rounded-md text-xs font-medium">
              {meme1Votes} Votes
            </div>
          </div>
          <div className="relative">
            <Image
              src={meme2Image || "/placeholder.svg"}
              width={300}
              height={200}
              alt="Meme 2"
              className="object-cover w-full aspect-[3/2] bg-muted"
            />
            <div className="absolute bottom-2 right-2 bg-background/70 px-2 py-1 rounded-md text-xs font-medium">
              {meme2Votes} Votes
            </div>
          </div>
        </div>
        <div className="flex justify-around p-2 border-t border-b border-border">
          <Button variant="outline" className="flex-1 mx-1 bg-transparent">
            <ThumbsUp className="w-4 h-4 mr-2" /> Vote Left
          </Button>
          <Button variant="outline" className="flex-1 mx-1 bg-transparent">
            <ThumbsDown className="w-4 h-4 mr-2" /> Vote Right
          </Button>
        </div>
        {sponsorLogo && (
          <div className="p-2 flex items-center justify-center bg-muted/50 text-xs text-muted-foreground">
            Sponsored by:{" "}
            <Image
              src={sponsorLogo || "/placeholder.svg"}
              alt="Sponsor Logo"
              width={60}
              height={20}
              className="ml-2 object-contain"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="grid gap-2 p-4 pt-2">
        <div className="flex items-center w-full">
          <Button variant="ghost" size="icon">
            <Heart className="w-5 h-5" />
            <span className="sr-only">Like</span>
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="w-5 h-5" />
            <span className="sr-only">Comment</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="w-5 h-5" />
            <span className="sr-only">Share</span>
          </Button>
        </div>
        <div className="px-2 text-sm w-full grid gap-1.5">
          {comments.map((comment, index) => (
            <div key={index}>
              <Link href="#" className="font-medium">
                {comment.user}
              </Link>{" "}
              {comment.text}
            </div>
          ))}
          {comments.length > 0 && (
            <Link href="#" className="text-muted-foreground text-xs hover:underline">
              View all {comments.length} comments
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
