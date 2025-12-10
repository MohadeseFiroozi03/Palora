"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { User as UserIcon } from "lucide-react"

interface UserData {
  email: string | null
  id: string
}

export default function ProfileScreen() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        // ۱) گرفتن session / user فعلی از Auth
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          console.error("getUser error:", error)
          setError("خطا در گرفتن اطلاعات کاربر.")
          return
        }
        if (!data.user) {
          // کاربر لاگین نیست
          setError("شما وارد نشده‌اید.")
          return
        }

        // فعلاً فقط از خود Auth ایمیل و id را می‌گیریم
     setUser({
  email: data.user.email ?? null,
  id: data.user.id,
})
      } catch (err: any) {
        console.error(err)
        setError("Could not load profile.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const email = user?.email || "unknown@example.com"

  return (
    <div className="min-h-screen pb-24 bg-[#020617]">
      {/* Header */}
      <div className="bg-[#020617] px-4 sm:px-6 md:px-8 py-4 border-b border-[#1F2937]">
        <h1 className="text-xl md:text-2xl font-bold text-[#F9FAFB] text-center">
          Profile
        </h1>
      </div>

      <div className="px-4 sm:px-6 md:px-8 py-8 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        {/* حالت لودینگ */}
        {loading && (
          <div className="flex flex-col items-center gap-3 text-[#9CA3AF] text-sm">
            <div className="w-7 h-7 border-2 border-[#4B5563] border-t-[#6366F1] rounded-full animate-spin" />
            <span>Loading profile...</span>
          </div>
        )}

        {/* حالت ارور */}
        {error && !loading && (
          <div className="w-full space-y-4">
            <div className="text-sm text-red-400 text-center bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/25">
              {error}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-[#F9FAFB] h-12 rounded-xl font-semibold hover:from-[#5458e4] hover:to-[#7c4ff0] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(79,70,229,0.5)]"
            >
              رفتن به صفحه ورود
            </button>
          </div>
        )}

        {/* حالت نرمال */}
        {!loading && !error && user && (
          <div className="w-full space-y-6">
            {/* آواتار کاربر (placeholder) */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280] uppercase">
                  account
                </p>
                <p className="text-base font-semibold text-[#F9FAFB]">
                  {email}
                </p>
              </div>
            </div>

            {/* اطلاعات کاربر */}
            <div className="space-y-4">
              <div className="bg-[#020617] border border-[#1F2937] p-4 rounded-2xl shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
                <div className="text-xs font-semibold text-[#9CA3AF] mb-1 uppercase tracking-wide">
                  Email
                </div>
                <div className="text-[#F9FAFB] text-sm">{email}</div>
              </div>

              <div className="bg-[#020617] border border-[#1F2937] p-4 rounded-2xl shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
                <div className="text-xs font-semibold text-[#9CA3AF] mb-1 uppercase tracking-wide">
                  User ID
                </div>
                <div className="text-[#F9FAFB] text-[11px] break-all">
                  {user.id}
                </div>
              </div>
            </div>

            {/* دکمه‌ها */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push("/home")}
                className="w-full bg-transparent border border-[#374151] text-[#E5E7EB] h-11 rounded-xl font-semibold transition-all hover:bg-[#111827] active:scale-[0.98]"
              >
                Back to Home
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-[#F9FAFB] h-11 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(239,68,68,0.5)]"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  )
}