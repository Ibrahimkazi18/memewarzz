"use server"

import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "../../utils/supabase/server";

export async function createMeme(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" }
  }

  const imageFile = formData.get("image") as File
  const caption = formData.get("caption") as string

  if (!imageFile) {
    return { error: "Image file is required" }
  }

  const fileExt = imageFile.name.split(".").pop()
  const filePath = `${user.id}/${uuidv4()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("memes") // Assuming you have a storage bucket named 'memes'
    .upload(filePath, imageFile, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    console.error("Error uploading image:", uploadError)
    return { error: "Failed to upload image." }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("memes").getPublicUrl(filePath)

  const { error: insertError } = await supabase.from("memes").insert({
    creator_id: user.id,
    image_url: publicUrl,
    caption: caption || null,
  })

  if (insertError) {
    console.error("Error creating meme:", insertError)
    return { error: "Failed to create meme." }
  }

  revalidatePath("/") // Revalidate the home page to show new meme
  return { success: true }
}

export async function startBattle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  const meme1Id = formData.get("meme1Id") as string
  const meme2Id = formData.get("meme2Id") as string
  const endsAt = formData.get("endsAt") as string // Expecting ISO string or similar

  if (!meme1Id || !meme2Id || !endsAt) {
    return { error: "Meme IDs and end time are required." }
  }

  const { error } = await supabase.from("meme_battles").insert({
    creator_id: user.id,
    meme1_id: meme1Id,
    meme2_id: meme2Id,
    ends_at: new Date(endsAt).toISOString(),
    is_active: true,
  })

  if (error) {
    console.error("Error starting battle:", error)
    return { error: "Failed to start battle." }
  }

  revalidatePath("/")
  return { success: true }
}

export async function voteMeme(battleId: string, votedMemeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Check if user has already voted in this battle
  const { data: existingVote, error: voteCheckError } = await supabase
    .from("battle_votes")
    .select("id")
    .eq("battle_id", battleId)
    .eq("voter_id", user.id)
    .single()

  if (voteCheckError && voteCheckError.code !== "PGRST116") {
    // PGRST116 means no rows found
    console.error("Error checking existing vote:", voteCheckError)
    return { error: "Failed to check existing vote." }
  }

  if (existingVote) {
    return { error: "You have already voted in this battle." }
  }

  const { error } = await supabase.from("battle_votes").insert({
    battle_id: battleId,
    voter_id: user.id,
    voted_meme_id: votedMemeId,
  })

  if (error) {
    console.error("Error voting meme:", error)
    return { error: "Failed to cast vote." }
  }

  revalidatePath("/")
  return { success: true }
}

export async function likePost(postId: string, type: "meme" | "battle") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  const column = type === "meme" ? "meme_id" : "battle_id"

  // Check if user has already liked this post
  const { data: existingLike, error: likeCheckError } = await supabase
    .from("likes")
    .select("id")
    .eq(column, postId)
    .eq("user_id", user.id)
    .single()

  if (likeCheckError && likeCheckError.code !== "PGRST116") {
    console.error("Error checking existing like:", likeCheckError)
    return { error: "Failed to check existing like." }
  }

  if (existingLike) {
    // If already liked, unlike it
    const { error: deleteError } = await supabase.from("likes").delete().eq(column, postId).eq("user_id", user.id)

    if (deleteError) {
      console.error("Error unliking post:", deleteError)
      return { error: "Failed to unlike post." }
    }
  } else {
    // If not liked, like it
    const { error: insertError } = await supabase.from("likes").insert({
      user_id: user.id,
      [column]: postId,
    })

    if (insertError) {
      console.error("Error liking post:", insertError)
      return { error: "Failed to like post." }
    }
  }

  revalidatePath("/")
  return { success: true }
}

export async function addComment(postId: string, type: "meme" | "battle", content: string, parentCommentId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  if (!content.trim()) {
    return { error: "Comment content cannot be empty." }
  }

  const column = type === "meme" ? "meme_id" : "battle_id"

  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    [column]: postId,
    content: content.trim(),
    parent_comment_id: parentCommentId || null,
  })

  if (error) {
    console.error("Error adding comment:", error)
    return { error: "Failed to add comment." }
  }

  revalidatePath("/")
  return { success: true }
}

export async function winBattle(battleId: string, winningMemeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // In a real application, you'd likely have more robust logic
  // to determine a winner (e.g., based on votes after battle ends)
  // and potentially a server function/trigger in Supabase to handle rewards.
  // For this example, we'll just mark the battle as inactive.
  const { error } = await supabase
    .from("meme_battles")
    .update({ is_active: false })
    .eq("id", battleId)
    .eq("creator_id", user.id) // Only battle creator can mark as won (example)

  if (error) {
    console.error("Error marking battle as won:", error)
    return { error: "Failed to mark battle as won." }
  }

  revalidatePath("/")
  return { success: true }
}

// Example of a delete function
export async function deleteMeme(memeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  // Ensure only the creator can delete their meme
  const { error } = await supabase.from("memes").delete().eq("id", memeId).eq("creator_id", user.id)

  if (error) {
    console.error("Error deleting meme:", error)
    return { error: "Failed to delete meme." }
  }

  revalidatePath("/")
  return { success: true }
}
