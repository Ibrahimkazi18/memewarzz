"use client"

import type React from "react"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"

interface MemeBattleCardProps {
  id: string
  username: string
  userHandle: string
  userAvatar: string | null
  meme1Image: string
  meme2Image: string
  meme1Votes: number
  meme2Votes: number
  sponsorLogo: string | null
  timeAgo: string
  comments: { user: string; text: string }[]
  onVote: (battleId: string, votedMemeId: string) => Promise<void>
  onLike: (postId: string, type: "meme" | "battle") => Promise<void>
  onComment: (postId: string, type: "meme" | "battle", content: string) => Promise<void>
  meme1CreatorUsername: string
  meme2CreatorUsername: string
  meme1Id: string
  meme2Id: string
}

export function MemeBattleCard({
  id,
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
  onVote,
  onLike,
  onComment,
  meme1CreatorUsername,
  meme2CreatorUsername,
  meme1Id,
  meme2Id,
}: MemeBattleCardProps) {
  const [commentText, setCommentText] = useState("")

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (commentText.trim()) {
      await onComment(id, "battle", commentText)
      setCommentText("")
    }
  }

  return (
    <Card className="border-0 rounded-none shadow-none">
      <CardHeader className="flex flex-row items-center p-4">
        <Link href={`/profile/${userHandle}`} className="flex items-center gap-2 text-sm font-semibold">
          <Avatar className="w-8 h-8 border">
            <AvatarImage src={userAvatar || "/placeholder-user.jpg"} alt={`@${userHandle}`} />
            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
          </Avatar>
          {username}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 ml-auto rounded-full">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Save</DropdownMenuItem>
            <DropdownMenuItem>Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-2 p-2">
          <div className="flex flex-col items-center gap-2">
            <Image
              src={meme1Image || "/placeholder.svg"}
              width={450}
              height={300}
              alt="Meme 1"
              className="object-cover w-full aspect-[3/2] rounded-md"
            />
            <p className="text-sm font-medium">by {meme1CreatorUsername}</p>
            <Button onClick={() => onVote(id, meme1Id)} className="w-full">
              Vote ({meme1Votes})
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Image
              src={meme2Image || "/placeholder.svg"}
              width={450}
              height={300}
              alt="Meme 2"
              className="object-cover w-full aspect-[3/2] rounded-md"
            />
            <p className="text-sm font-medium">by {meme2CreatorUsername}</p>
            <Button onClick={() => onVote(id, meme2Id)} className="w-full">
              Vote ({meme2Votes})
            </Button>
          </div>
        </div>
        {sponsorLogo && (
          <div className="flex justify-center p-2">
            <Image
              src={sponsorLogo || "/placeholder.svg"}
              width={60}
              height={20}
              alt="Sponsor Logo"
              className="object-contain"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="grid gap-2 p-2 pb-4">
        <div className="flex items-center w-full">
          <Button variant="ghost" size="icon" onClick={() => onLike(id, "battle")}>
            <Heart className="w-4 h-4" />
            <span className="sr-only">Like</span>
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="w-4 h-4" />
            <span className="sr-only">Comment</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Send className="w-4 h-4" />
            <span className="sr-only">Share</span>
          </Button>
          <Button variant="ghost" size="icon" className="ml-auto">
            <Bookmark className="w-4 h-4" />
            <span className="sr-only">Bookmark</span>
          </Button>
        </div>
        <div className="px-2 text-sm w-full grid gap-1.5">
          <div className="text-xs text-gray-500">{timeAgo}</div>
          {comments.map((comment, index) => (
            <div key={index}>
              <Link href={`/profile/${comment.user}`} className="font-medium">
                {comment.user}
              </Link>{" "}
              {comment.text}
            </div>
          ))}
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
