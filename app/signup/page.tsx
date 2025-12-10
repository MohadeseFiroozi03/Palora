"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase" // adjust path if needed

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      console.error("signUp error:", error)
      setMsg("Error: " + error.message)
      return
    }

    console.log("signUp data:", data)

    // Create a row in public.users
    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
      })
      if (insertError) {
        console.error("Error inserting into public.users:", insertError)
        setMsg(
          "Sign up succeeded, but creating a profile row failed. See console for details.",
        )
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setMsg("Sign up completed. Redirecting to login...")

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push("/login")
    }, 1000)
  }

  const goToLogin = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 sm:px-8 md:px-10 bg-[#020617]">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl">
        {/* عنوان و توضیح کوتاه */}
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#6B7280] uppercase">
            palora
          </p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Create your account and start building your own safe space.
          </p>
        </div>

        <div className="w-full bg-[#020617] border border-[#1F2937] rounded-2xl p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <h1 className="text-2xl font-bold mb-2 text-[#F9FAFB] text-center">
            Sign up
          </h1>
          <p className="text-xs text-[#9CA3AF] text-center mb-6">
            We&apos;ll use your email to keep your companions and chats synced.
          </p>

          <form onSubmit={handleSignUp} className="space-y-4">
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
                placeholder="At least 6 characters"
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
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          {msg && (
            <p className="mt-3 text-sm text-center text-[#E5E7EB] bg-[#111827] border border-[#1F2937] rounded-xl py-2 px-3">
              {msg}
            </p>
          )}

          <div className="mt-6 text-center text-sm text-[#9CA3AF]">
            <span>Already have an account? </span>
            <button
              onClick={goToLogin}
              className="text-[#A5B4FC] hover:text-[#C4B5FD] hover:underline font-medium"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}