"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import { Loader } from "lucide-react"
import { toast } from "sonner"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        toast.warning("User not logged in. Please login to enter.")
        router.replace("/login") 
      } else {
        setIsAuthenticated(true)
      }

      setIsLoading(false)
    }

    checkSession()
  }, [router])

  if (isLoading) return <Loader className="animate-spin transition duration-100" />

  if (!isAuthenticated) return null 

  return <>{children}</>
}
