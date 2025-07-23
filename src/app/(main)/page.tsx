import { MemePostCard } from "@/components/meme-post-card"
import { MemeBattleCard } from "@/components/meme-battle-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <ProtectedRoute>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8 mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Your Feed</h2>

          {/* Quick Actions / Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-primary/10 to-background border-primary/20 shadow-md">
              <PlusCircle className="w-8 h-8 text-primary mb-3" />
              <CardTitle className="text-xl mb-2">Create New Meme</CardTitle>
              <CardDescription className="mb-4">Share your latest masterpiece with the community.</CardDescription>
              <Button asChild>
                <Link href="/create-meme">Upload Meme</Link>
              </Button>
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

          {/* Feed Content */}
          <MemePostCard
            username="MemeLord"
            userHandle="memelord"
            userAvatar="/placeholder.svg?height=40&width=40"
            memeImage="/placeholder.svg?height=400&width=600"
            caption="Just dropped this gem! 😂 What do you guys think?"
            likes={123}
            comments={[
              { user: "LaughTrack", text: "Hahaha, this is gold!" },
              { user: "MemeQueen", text: "Relatable content right here." },
            ]}
            timeAgo="1 hour ago"
          />
          <MemeBattleCard
            username="BattleMaster"
            userHandle="battle_master"
            userAvatar="/placeholder.svg?height=40&width=40"
            meme1Image="/placeholder.svg?height=300&width=450"
            meme2Image="/placeholder.svg?height=300&width=450"
            meme1Votes={75}
            meme2Votes={50}
            sponsorLogo="/placeholder.svg?height=20&width=60"
            timeAgo="3 hours ago"
            comments={[
              { user: "VoteForLeft", text: "Left one all the way!" },
              { user: "TeamRight", text: "Right meme is superior, no contest." },
            ]}
          />
          <MemePostCard
            username="DailyMeme"
            userHandle="daily_meme"
            userAvatar="/placeholder.svg?height=40&width=40"
            memeImage="/placeholder.svg?height=400&width=600"
            caption="My reaction to Monday mornings vs. Friday evenings."
            likes={245}
            comments={[{ user: "WeekendVibes", text: "So true! 😂" }]}
            timeAgo="Yesterday"
          />
          <MemeBattleCard
            username="MemeDuelist"
            userHandle="meme_duelist"
            userAvatar="/placeholder.svg?height=40&width=40"
            meme1Image="/placeholder.svg?height=300&width=450"
            meme2Image="/placeholder.svg?height=300&width=450"
            meme1Votes={120}
            meme2Votes={180}
            timeAgo="2 days ago"
            comments={[
              { user: "CatLover", text: "The cat meme always wins!" },
              { user: "SpongeFan", text: "Spongebob is iconic though." },
            ]}
          />
        </div>
      </ScrollArea>
    </ProtectedRoute>
  )
}
