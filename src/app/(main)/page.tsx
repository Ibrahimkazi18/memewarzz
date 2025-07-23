import { MemePostCard } from "@/components/meme-post-card"
import { MemeBattleCard } from "@/components/meme-battle-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProtectedRoute from "@/components/protected-route"

export default function HomePage() {
  return (
    <ProtectedRoute>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        {" "}
        {/* Adjust height based on header */}
        <div className="flex flex-col gap-6 p-4 mb-16">
          <h2 className="text-2xl font-bold mb-4">Your Feed</h2>

          <MemePostCard
            username="MemeLord"
            userHandle="memelord"
            userAvatar="/placeholder-user.jpg"
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
            userAvatar="/placeholder-user.jpg"
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
            userAvatar="/placeholder-user.jpg"
            memeImage="/placeholder.svg?height=400&width=600"
            caption="My reaction to Monday mornings vs. Friday evenings."
            likes={245}
            comments={[{ user: "WeekendVibes", text: "So true! 😂" }]}
            timeAgo="Yesterday"
            />

          <MemeBattleCard
            username="MemeDuelist"
            userHandle="meme_duelist"
            userAvatar="/placeholder-user.jpg"
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
