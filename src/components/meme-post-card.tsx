import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface MemePostCardProps {
  username: string
  userHandle: string
  userAvatar: string
  memeImage: string
  caption: string
  likes: number
  comments: { user: string; text: string }[]
  timeAgo: string
}

export function MemePostCard({
  username,
  userHandle,
  userAvatar,
  memeImage,
  caption,
  likes,
  comments,
  timeAgo,
}: MemePostCardProps) {
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
            <DropdownMenuItem>
              <Bookmark className="w-4 h-4 mr-2" />
              Save
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        <Image
          src={memeImage || "/placeholder.svg?height=400&width=600&query=funny%20meme"}
          width={600}
          height={400}
          alt="Meme post"
          className="object-cover w-full aspect-[4/3] bg-muted"
        />
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
          <span className="ml-auto text-sm text-muted-foreground font-medium">{likes.toLocaleString()} likes</span>
        </div>
        <div className="px-2 text-sm w-full grid gap-1.5">
          <div>
            <Link href="#" className="font-semibold hover:underline">
              {username}
            </Link>{" "}
            {caption}
          </div>
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
