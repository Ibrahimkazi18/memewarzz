'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../../utils/supabase/server'

export async function login(formData: { email : string, password: string}) {
  const supabase = await createClient();
  const email = formData.email
  const password = formData.password

  if (!email || !password) {
    console.error('Email and password are required');
  }

  // 1. Check if user is in users table
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user || userError) {
    return {success: true, error: "User not found or not registered."}
  }

  // 2. Attempt login
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) {
    return { success: false, error: loginError.message }
  }

  revalidatePath('/', 'layout');
  redirect(`/`);
}

export async function signUp(formData: { 
    email : string,
    password: string,
    username: string,
    handle: string,
    userRole: string,
    walletPublicKey: string | null;
}) {
    const supabase = await createClient();

    const email = formData.email
    const password = formData.password
    const username = formData.username
    const handle = formData.handle
    const userRole = formData.userRole
    const wallet = formData.walletPublicKey

    if (!email || !password || !username || !handle) {
        return { success: false , error : "All fields are required!"}
    }

    if (userRole === "creator" && !wallet) {
        return { success: false , error : "Wallet public key not found!"}
    }

    // 1. Register with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/confirm`, // handle confirm here
        },
    });

    if (authError) throw authError;

    const userId = authData.user?.id
    if (!userId) throw new Error("User ID not found after sign up.");

    // 2. Insert profile record
    const { error: profileError } = await supabase.from("users").insert({
        id: userId,
        email,
        role: userRole,
        username,
        handle,
        wallet_address: userRole === "creator" ? wallet : null,
    });

    if(profileError) {
        return { success: false , error : "Error creating profile!"}
    }

    revalidatePath('/', 'layout');
    redirect('/login');
}