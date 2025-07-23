"use client"

import type React from "react"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

interface MemePostCardProps {
  id: string
  username: string
  userHandle: string
  userAvatar: string | null
  memeImage: string
  caption: string | null
  likes: number
  comments: { user: string; text: string }[]
  timeAgo: string 
  hasLiked: boolean 
  onLike: (postId: string, type: "meme" | "battle") => Promise<void>
  onComment: (postId: string, type: "meme" | "battle", content: string) => Promise<void>
}

export function MemePostCard({
  id,
  username,
  userHandle,
  userAvatar,
  memeImage,
  caption,
  likes,
  comments,
  timeAgo,
  onLike,
  onComment,
  hasLiked = false,
}: MemePostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(hasLiked)
  const [likeCount, setLikeCount] = useState(likes)

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (commentText.trim()) {
      await onComment(id, "meme", commentText)
      setCommentText("")
    }
  }

  const handleLike = async () => {
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((prev) => prev + (newLiked ? 1 : -1))

    try {
      await onLike(id, "meme")
    } catch (err) {
      setLiked(!newLiked)
      setLikeCount((prev) => prev + (newLiked ? -1 : 1))
      console.error("Failed to like:", err)
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto border-none shadow-none rounded-none md:border md:shadow-sm md:rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center p-4 pb-3">
        <Link href={`/profile/${userHandle}`} className="flex items-center gap-3 text-sm font-semibold">
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            <AvatarImage src={userAvatar || "/placeholder-user.jpg"} alt={`@${userHandle}`} />
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
      <CardFooter className="grid gap-2 p-4 pt-3">
        <div className="flex items-center w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={liked ? "text-red-500" : "text-muted-foreground hover:text-primary"}
          >
            <Heart className="w-5 h-5 fill-current" fill={liked ? "currentColor" : "none"} />
            <span className="sr-only">Like</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <MessageCircle className="w-5 h-5" />
            <span className="sr-only">Comment</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Send className="w-5 h-5" />
            <span className="sr-only">Share</span>
          </Button>
          <span className="ml-auto text-sm text-muted-foreground font-medium">{likeCount.toLocaleString()} likes</span>
        </div>
        <div className="px-2 text-sm w-full grid gap-1.5">
          {caption && (
            <div>
              <Link href={`/profile/${userHandle}`} className="font-semibold hover:underline">
                {username}
              </Link>{" "}
              {caption}
            </div>
          )}
          {comments.map((comment, index) => (
            <div key={index}>
              <Link href={`/profile/${comment.user}`} className="font-semibold hover:underline">
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
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
        <form onSubmit={handleCommentSubmit} className="flex gap-2 px-2">
          <input
            type="text"
            placeholder="Add a comment..."
            className="flex-1 p-2 text-sm border rounded-md"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <Button type="submit" variant="ghost">
            Post
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
