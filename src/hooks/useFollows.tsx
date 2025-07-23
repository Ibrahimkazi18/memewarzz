"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function useFollowStats(userId?: string) {
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    if (!userId) return;

    const fetchFollowStats = async () => {
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", userId)

      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId)

      setFollowersCount(followers || 0)
      setFollowingCount(following || 0)
    }

    fetchFollowStats()
  }, [userId])

  return { followersCount, followingCount }
}
