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
              @{userHandle} &bull; {timeAgo}
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
            <DropdownMenuItem>
              <Bookmark className="w-4 h-4 mr-2" />
              Save
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        <Image
          src={memeImage || "/placeholder.svg"}
          width={600}
          height={400}
          alt="Meme post"
          className="object-cover w-full aspect-[4/3] bg-muted"
        />
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
          <span className="ml-auto text-sm text-muted-foreground">{likes} likes</span>
        </div>
        <div className="px-2 text-sm w-full grid gap-1.5">
          <div>
            <Link href="#" className="font-medium">
              {username}
            </Link>{" "}
            {caption}
          </div>
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
