"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      console.error("login error:", error)
      setMsg("Error: " + error.message)
      return
    }

    console.log("login data:", data)
    // Redirect to home after successful login
    router.push("/home")
  }

  const goToSignup = () => {
    router.push("/signup")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#020617]">
      <div className="w-full max-w-md">
        {/* App title / tagline */}
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#6B7280] uppercase">
            palora
          </p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Log in to keep your conversations in one place.
          </p>
        </div>

        <div className="bg-[#020617] border border-[#1F2937] rounded-2xl p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <h1 className="text-2xl font-bold mb-2 text-[#F9FAFB] text-center">
            Welcome back
          </h1>
          <p className="text-xs text-[#9CA3AF] text-center mb-6">
            Enter your email and password to continue.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs text-[#9CA3AF]">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-[#374151] text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent placeholder:text-[#6B7280]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#9CA3AF]">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-[#374151] text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent placeholder:text-[#6B7280]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5458e4] hover:to-[#7c4ff0] text-[#F9FAFB] h-11 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(79,70,229,0.5)]"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {msg && (
            <p className="mt-3 text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2 px-3">
              {msg}
            </p>
          )}

          <div className="mt-6 text-center text-sm text-[#9CA3AF]">
            <span>Don&apos;t have an account? </span>
            <button
              onClick={goToSignup}
              className="text-[#A5B4FC] hover:text-[#C4B5FD] hover:underline font-medium"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}