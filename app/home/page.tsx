"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/navigation"
import HomeClient from "@/components/home-client"

// test deploy new

type Companion = {
  id: string
  name: string
  description: string
  image_url: string
  interests?: string
}

export default function HomeScreen() {
  const [companions, setCompanions] = useState<Companion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // خواندن از env (همان‌هایی که در .env.local گذاشتی)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  useEffect(() => {
    let mounted = true

    async function fetchCompanions() {
      try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          throw new Error("Supabase env variables are missing")
        }

        const url = `${SUPABASE_URL}/rest/v1/companions?select=id,name,description,image_url,interests`
        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        })

        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`Status ${res.status}: ${txt}`)
        }

        const data = await res.json()
        if (mounted) setCompanions(data || [])
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to fetch companions")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchCompanions()

    return () => {
      mounted = false
    }
  }, [SUPABASE_URL, SUPABASE_ANON_KEY])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-3 text-[#9CA3AF] text-sm">
          <div className="w-7 h-7 border-2 border-[#4B5563] border-t-[#6366F1] rounded-full animate-spin" />
          <span>Loading companions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 bg-[#020617]">
      {/* Header / Title */}
      <div className="border-b border-[#111827] bg-gradient-to-b from-[#020617] via-[#020617] to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold tracking-[0.25em] text-[#6B7280] uppercase">
              your space
            </p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#F9FAFB]">
              Choose your AI companion
            </h1>
            <p className="text-sm md:text-base text-[#9CA3AF] max-w-2xl mx-auto">
              Pick who you feel like talking to today. You can switch anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-10">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-xl mb-4 text-center text-sm shadow-[0_8px_30px_rgba(15,23,42,0.8)]">
            <p className="font-medium mb-1">Error loading companions</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        ) : companions.length === 0 ? (
          <div className="bg-[#020617] border border-dashed border-[#374151] px-6 py-8 rounded-2xl text-center shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
            <p className="text-[#9CA3AF] text-sm mb-1">No companions found</p>
            <p className="text-[#6B7280] text-xs">
              Check your Supabase data, then refresh this page.
            </p>
          </div>
        ) : (
          <HomeClient companions={companions} />
        )}
      </div>

      <Navigation />
    </div>
  )
}