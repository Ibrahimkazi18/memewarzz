import { MemePostCard } from "@/components/meme-post-card"
import { MemeBattleCard } from "@/components/meme-battle-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProtectedRoute from "@/components/protected-route"
import { likePost, voteMeme, addComment } from "@/app/actions"
import { formatTimeAgo, getFeedPosts, type Meme, type MemeBattle } from "@/app/data"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { PlusCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CreateMemeModal } from "@/components/create-meme-modal" // Import the new modal

// Define prop types for your existing components
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
  onLike: (postId: string, type: "meme" | "battle") => Promise<void>
  onComment: (postId: string, type: "meme" | "battle", content: string) => Promise<void>
  hasLiked: boolean
}

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
  meme1Id: string // Added for voting
  meme2Id: string // Added for voting
  hasLiked: boolean
}

export default async function HomePage() {
  const feedItems = await getFeedPosts()

  // These functions will be passed to the client components
  const handleLike = async (postId: string, type: "meme" | "battle") => {
    "use server"
    await likePost(postId, type)
  }

  const handleVote = async (battleId: string, votedMemeId: string) => {
    "use server"
    await voteMeme(battleId, votedMemeId)
  }

  const handleComment = async (postId: string, type: "meme" | "battle", content: string) => {
    "use server"
    await addComment(postId, type, content)
  }

  console.log("feed items:", feedItems);

  return (
    <ProtectedRoute>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-6 p-4 mb-16">
          <h2 className="text-2xl font-bold mb-4">Your Feed</h2>
          {/* Quick Actions / Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-primary/10 to-background border-primary/20 shadow-md">
              <PlusCircle className="w-8 h-8 text-primary mb-3" />
              <CardTitle className="text-xl mb-2">Create New Meme</CardTitle>
              <CardDescription className="mb-4">Share your latest masterpiece with the community.</CardDescription>
              {/* Changed to open the modal */}
              <CreateMemeModal>
                <Button>Upload Meme</Button>
              </CreateMemeModal>
            </Card>
            <Card className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-accent/10 to-background border-accent/20 shadow-md">
              <TrendingUp className="w-8 h-8 text-accent-foreground mb-3" />
              <CardTitle className="text-xl mb-2">Trending Battles</CardTitle>
              <CardDescription className="mb-4">See what's hot and cast your vote!</CardDescription>
              <Button variant="outline" asChild>
                <Link href="/battles">View Battles</Link>
              </Button>
            </Card>
          </div>
          {feedItems.length === 0 && (
            <p className="text-center text-muted-foreground">
              No posts yet. Be the first to create a meme or start a battle!
            </p>
          )}
          {feedItems.map((item: any) => {
            if ("meme1_id" in item) {
              // It's a MemeBattle
              const battle = item as MemeBattle
              return (
                <MemeBattleCard
                  key={battle.id}
                  id={battle.id}
                  username={battle.profiles?.username || "Unknown User"}
                  userHandle={battle.profiles?.handle || "unknown_handle"}
                  userAvatar={battle.profiles?.avatar_url || "/placeholder-user.jpg"}
                  meme1Image={battle.meme1?.image_url || "/placeholder.svg?height=300&width=450"}
                  meme2Image={battle.meme2?.image_url || "/placeholder.svg?height=300&width=450"}
                  meme1Votes={battle.meme1_votes}
                  meme2Votes={battle.meme2_votes}
                  sponsorLogo={battle.sponsor?.logo_url || null}
                  timeAgo={formatTimeAgo(battle.created_at)}
                  comments={[]} // Comments will be fetched dynamically if needed, or passed from a more complex join
                  onVote={handleVote}
                  onLike={handleLike}
                  onComment={handleComment}
                  meme1CreatorUsername={battle.meme1?.profiles?.username || "Unknown"}
                  meme2CreatorUsername={battle.meme2?.profiles?.username || "Unknown"}
                  meme1Id={battle.meme1_id}
                  meme2Id={battle.meme2_id}
                />
              )
            } else {
              // It's a MemePost
              const meme = item as any
              return (
                <MemePostCard
                  key={meme.id}
                  id={meme.id}
                  username={meme.profiles?.username || "Unknown User"}
                  userHandle={meme.profiles?.handle || "unknown_handle"}
                  userAvatar={meme.profiles?.avatar_url || "/placeholder-user.jpg"}
                  memeImage={meme.image_url}
                  caption={meme.caption}
                  likes={meme.likes_count}
                  comments={[]} // Comments will be fetched dynamically if needed, or passed from a more complex join
                  timeAgo={formatTimeAgo(meme.created_at)}
                  onLike={handleLike}
                  onComment={handleComment}
                  hasLiked={meme.hasLiked}
                />
              )
            }
          })}
        </div>
      </ScrollArea>
    </ProtectedRoute>
  )
}
