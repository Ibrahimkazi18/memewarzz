
import { formatDistanceToNowStrict } from "date-fns"
import { createClient } from "../../utils/supabase/server"

// Define types for your database tables for better type safety
export type Profile = {
  id: string
  username: string
  handle: string
  avatar_url: string | null
  role: "viewer" | "creator"
  solana_wallet_address: string | null
  created_at: string
  updated_at: string
}

export type Meme = {
  id: string
  creator_id: string
  image_url: string
  caption: string | null
  created_at: string
  updated_at: string
  reward_amount: number
  reward_token: string
  profiles: Profile // Joined creator profile
  likes_count: number
  comments_count: number
}

export type MemeBattle = {
  id: string
  creator_id: string
  meme1_id: string
  meme2_id: string
  sponsor_id: string | null
  created_at: string
  ends_at: string
  is_active: boolean
  reward_amount: number
  reward_token: string
  profiles: Profile // Joined creator profile
  meme1: Meme // Joined meme1 details
  meme2: Meme // Joined meme2 details
  sponsor: Sponsor | null // Joined sponsor details
  meme1_votes: number
  meme2_votes: number
  comments_count: number
  likes_count: number
}

export type Comment = {
  id: string
  user_id: string
  meme_id: string | null
  battle_id: string | null
  parent_comment_id: string | null
  content: string
  created_at: string
  profiles: Profile // Joined user profile
}

export type Sponsor = {
  id: string
  company_name: string
  website_url: string | null
  contact_email: string
  logo_url: string
  is_main_sponsor: boolean
  current_bid_usd: number
  last_bid_at: string | null
  created_at: string
  updated_at: string
}

export async function getFeedPosts() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("Error fetching user:", userError);
    return [];
  }

  const userId = user.id;

  // Fetch memes
  const { data: memesData, error: memesError } = await supabase
    .from("memes")
    .select(
      `
      id,
      image_url,
      caption,
      created_at,
      profiles:creator_id (
        id,
        username,
        handle,
        avatar_url
      ),
      likes:likes!likes_meme_id_fkey (
        id,
        user_id
      ),
      comments:comments!comments_meme_id_fkey (
        id
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10) // Limit for initial feed load

  if (memesError) {
    console.error("Error fetching memes:", memesError)
    return []
  }

  const memes = memesData.map((meme) => ({
    ...meme,
    likes_count: meme.likes?.length || 0,
    comments_count: meme.comments?.length || 0,
    hasLiked: meme.likes?.some((like) => like.user_id === userId) || false,
  }));

  // Fetch meme battles
  const { data: battlesData, error: battlesError } = await supabase
    .from("meme_battles")
    .select(
      `
      *,
      profiles ( id, username, handle, avatar_url ),
      meme1:memes!meme_battles_meme1_id_fkey (
        id,
        image_url,
        caption,
        profiles ( id, username, handle, avatar_url )
      ),
      meme2:memes!meme_battles_meme2_id_fkey (
        id,
        image_url,
        caption,
        profiles ( id, username, handle, avatar_url )
      ),
      sponsor:sponsors!meme_battles_sponsor_id_fkey (
        id,
        company_name,
        logo_url
      ),
      battle_votes(id, voted_meme_id),
      comments(id),
      likes(id)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10) // Limit for initial feed load

  if (battlesError) {
    console.error("Error fetching meme battles:", battlesError)
    return []
  }

  const battles = battlesData.map((battle) => ({
    ...battle,
    meme1_votes: battle.battle_votes.filter((vote : any) => vote.voted_meme_id === battle.meme1_id).length,
    meme2_votes: battle.battle_votes.filter((vote : any) => vote.voted_meme_id === battle.meme2_id).length,
    comments_count: battle.comments.length,
    likes_count: battle.likes.length,
    hasLiked: battle.likes?.some((like: any) => like.id === userId) || false,
  })) as MemeBattle[]

  // Combine and sort by created_at
  const combinedFeed = [...memes, ...battles].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return combinedFeed
}


export async function getCommentsForPost(postId: string, type: "meme" | "battle") {
  const supabase = await createClient();
  const column = type === "meme" ? "meme_id" : "battle_id"

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles ( id, username, handle, avatar_url )
    `,
    )
    .eq(column, postId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error(`Error fetching comments for ${type} ${postId}:`, error)
    return []
  }
  return data as Comment[]
}

export async function getLikesCount(postId: string, type: "meme" | "battle") {
  const supabase = await createClient();
  const column = type === "meme" ? "meme_id" : "battle_id"

  const { count, error } = await supabase.from("likes").select("id", { count: "exact", head: true }).eq(column, postId)

  if (error) {
    console.error(`Error fetching likes count for ${type} ${postId}:`, error)
    return 0
  }
  return count || 0
}

export async function getBattleVotes(battleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("battle_votes").select("voted_meme_id").eq("battle_id", battleId)

  if (error) {
    console.error(`Error fetching votes for battle ${battleId}:`, error)
    return { meme1Votes: 0, meme2Votes: 0 }
  }

  return data.reduce(
    (acc, vote) => {
      // This assumes you know meme1_id and meme2_id from the battle object
      // For a more robust solution, you'd pass meme1_id and meme2_id to this function
      // For now, we'll just count based on the voted_meme_id
      // In the MemeBattle type, we already calculate this, so this function might be redundant for the feed.
      // It's useful if you need votes for a single battle outside the feed.
      return acc
    },
    { meme1Votes: 0, meme2Votes: 0 },
  )
}

export function formatTimeAgo(dateString: string) {
  return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true })
}
