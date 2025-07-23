"use client"

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const useProfile = () => {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
            console.error("Error getting user:", userError.message)
            return
        }

        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user?.id)
            .single()

        if (profileError) {
            console.error("Error fetching profile:", profileError.message)
        } else {
            setProfile(profileData);
        }
        }

        fetchUserProfile();
    }, []);

    return { profile }
}

export default useProfile