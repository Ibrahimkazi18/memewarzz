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
    <Card className="w-full max-w-xl mx-auto border-none shadow-none rounded-none md:border md:shadow-sm md:rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center p-4 pb-3">
        <Link href="#" className="flex items-center gap-3 text-sm font-semibold">
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            <AvatarImage src={userAvatar || "/placeholder.svg?height=40&width=40&query=user%20avatar"} alt={username} />
            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-base">{username}</span>
            <span className="text-xs text-muted-foreground font-normal">
              @{userHandle} &bull; {timeAgo}
            </span>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 ml-auto rounded-full text-muted-foreground hover:bg-accent"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive">Report Battle</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-0.5 bg-border">
          <div className="relative group">
            <Image
              src={meme1Image || "/placeholder.svg?height=300&width=450&query=meme%20battle%20left"}
              width={450}
              height={300}
              alt="Meme 1"
              className="object-cover w-full aspect-[3/2] bg-muted group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute bottom-2 left-2 bg-background/80 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
              <ThumbsUp className="w-4 h-4 text-primary" /> {meme1Votes.toLocaleString()} Votes
            </div>
          </div>
          <div className="relative group">
            <Image
              src={meme2Image || "/placeholder.svg?height=300&width=450&query=meme%20battle%20right"}
              width={450}
              height={300}
              alt="Meme 2"
              className="object-cover w-full aspect-[3/2] bg-muted group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute bottom-2 right-2 bg-background/80 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
              <ThumbsUp className="w-4 h-4 text-primary" /> {meme2Votes.toLocaleString()} Votes
            </div>
          </div>
        </div>
        <div className="flex justify-around p-3 border-y border-border bg-muted/50">
          <Button variant="default" className="flex-1 mx-1.5 py-2 h-auto text-base">
            <ThumbsUp className="w-4 h-4 mr-2" /> Vote Left
          </Button>
          <Button variant="default" className="flex-1 mx-1.5 py-2 h-auto text-base">
            <ThumbsDown className="w-4 h-4 mr-2" /> Vote Right
          </Button>
        </div>
        {sponsorLogo && (
          <div className="p-3 flex items-center justify-center bg-muted/70 text-xs text-muted-foreground border-t border-border">
            Sponsored by:{" "}
            <Image
              src={sponsorLogo || "/placeholder.svg?height=20&width=60&query=sponsor%20logo"}
              alt="Sponsor Logo"
              width={80}
              height={25}
              className="ml-2 object-contain"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="grid gap-3 p-4 pt-3">
        <div className="flex items-center w-full">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Heart className="w-5 h-5" />
            <span className="sr-only">Like</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <MessageCircle className="w-5 h-5" />
            <span className="sr-only">Comment</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Share2 className="w-5 h-5" />
            <span className="sr-only">Share</span>
          </Button>
        </div>
        <div className="px-2 text-sm w-full grid gap-1.5">
          {comments.map((comment, index) => (
            <div key={index}>
              <Link href="#" className="font-semibold hover:underline">
                {comment.user}
              </Link>{" "}
              {comment.text}
            </div>
          ))}
          {comments.length > 0 && (
            <Link href="#" className="text-muted-foreground text-xs hover:underline mt-1">
              View all {comments.length} comments
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
