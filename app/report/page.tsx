"use client"
import { useState } from "react"
import Navigation from "@/components/navigation"
import { useSupabaseAuth } from "@/app/hooks/useSupabaseAuth"
import { supabase } from "@/lib/supabase"

export default function ReportScreen() {
  const { user, loading: authLoading } = useSupabaseAuth()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<"bug" | "feedback" | "feature_request">("feedback")
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!subject.trim() || !message.trim() || loading) return

    if (authLoading) {
      console.log("Auth still loading, skipping send")
      return
    }

    if (!user) {
      setError("برای ارسال فیدبک باید وارد حساب کاربری‌ات شوی.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("Sending report with user_id:", user.id)

      const { data, error: insertError } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          body: message.trim(),
          type: type,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Supabase insert error:", insertError)
        throw insertError
      }

      console.log("Inserted report:", data)

      // نمایش toast موفقیت
      setShowSuccess(true)
      setSubject("")
      setMessage("")
      setType("feedback")

      // بعد از ۳ ثانیه toast رو ببند
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err: any) {
      console.error("handleSend error:", err)
      setError("Could not send feedback.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-[#020617] via-[#020617] to-[#020617]/95 relative flex flex-col">
      {/* Toast موفقیت ثابت بالای صفحه */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 px-4 sm:px-0">
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/40 text-green-100 px-4 py-3 rounded-2xl text-sm shadow-xl backdrop-blur-md">
            <span className="text-lg">✅</span>
            <div className="flex flex-col">
              <span className="font-semibold">Feedback sent successfully</span>
              <span className="text-xs text-green-200/80">
                Thanks for helping us improve your experience.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* هدر بالای صفحه */}
      <div className="bg-[#020617]/80 backdrop-blur-sm px-4 sm:px-6 md:px-8 py-4 border-b border-[#111827] sticky top-0 z-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-[#F9FAFB] text-center">
            Send Feedback
          </h1>
          <p className="mt-1 text-xs md:text-sm text-[#9CA3AF] text-center">
            Tell us what&apos;s working well or what needs improvement.
          </p>
        </div>
      </div>

      {/* محتوای اصلی */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 flex items-center justify-center">
        <div className="w-full max-w-3xl md:max-w-xl relative">
          {/* حلقه‌ی گرادیان ظریف دور کارت */}
          <div
            className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#6366F1]/40 via-transparent to-[#EC4899]/40 opacity-60 blur-md"
            aria-hidden="true"
          />
          {/* کارت اصلی */}
          <div className="relative w-full bg-[#020617] p-6 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.9)] space-y-5 border border-[#1F2937]">
            {/* توضیح کوتاه بالای فرم */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#E5E7EB]">
                We read every message carefully.
              </p>
              <p className="text-xs text-[#9CA3AF]">
                Choose a type, add a clear subject, and explain your feedback in detail.
              </p>
            </div>

            {/* فیلد Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1D5DB] uppercase tracking-wide">
                Type
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "bug" | "feedback" | "feature_request")
                }
                className="w-full bg-[#020617] text-[#F9FAFB] px-4 h-11 rounded-xl text-sm outline-none border border-[#374151] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 focus:ring-offset-0 focus:ring-offset-transparent transition-all"
              >
                <option value="feedback">Feedback</option>
                <option value="bug">Bug / Problem</option>
                <option value="feature_request">Feature Request</option>
              </select>
              <p className="text-[11px] text-[#6B7280]">
                This helps us route your message to the right place.
              </p>
            </div>

            {/* فیلد Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1D5DB] uppercase tracking-wide">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe your feedback..."
                className="w-full bg-[#020617] text-[#F9FAFB] placeholder:text-[#6B7280] px-4 h-11 rounded-xl text-sm outline-none border border-[#374151] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 focus:ring-offset-0 focus:ring-offset-transparent transition-all"
              />
            </div>

            {/* فیلد Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1D5DB] uppercase tracking-wide">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share as much detail as you like..."
                rows={6}
                className="w-full bg-[#020617] text-[#F9FAFB] placeholder:text-[#6B7280] px-4 py-3 rounded-xl text-sm outline-none border border-[#374151] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 focus:ring-offset-0 focus:ring-offset-transparent resize-none transition-all"
              />
              <p className="text-[11px] text-[#6B7280]">
                Please avoid sharing sensitive personal information.
              </p>
            </div>

            {/* دکمه ارسال و خطا */}
            <div className="space-y-3 pt-1">
              <button
                onClick={handleSend}
                disabled={loading || !subject.trim() || !message.trim()}
                className="w-full h-11 rounded-xl font-semibold text-sm text-[#F9FAFB] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E3] hover:to-[#7C3AED] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97] transition-all shadow-[0_10px_30px_rgba(88,80,236,0.45)] flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : "Send feedback"}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  )
}