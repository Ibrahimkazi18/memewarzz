import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getUserId() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const supabase = createServerClient(supabaseUrl, supabaseKey, { cookies: await cookies() });
  
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return data.user.id
}