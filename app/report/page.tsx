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
    <div className="min-h-screen pb-20 bg-[#020617] relative">
      {/* Toast موفقیت ثابت بالای صفحه */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 px-4">
          <div className="bg-green-500/10 border border-green-500/40 text-green-200 px-4 py-3 rounded-xl text-sm shadow-lg backdrop-blur-sm">
            Feedback sent successfully!
          </div>
        </div>
      )}

      <div className="bg-[#020617] px-4 py-4 border-b border-[#1F2937]">
        <h1 className="text-xl font-bold text-[#F9FAFB] text-center">Send Feedback</h1>
      </div>

      <div className="px-4 py-8 max-w-md mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="w-full bg-[#111827] p-4 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.7)] space-y-4 border border-[#374151]">
          <div>
            <label className="text-sm font-semibold text-[#E5E7EB] mb-2 block">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "bug" | "feedback" | "feature_request")}
              className="w-full bg-[#020617] text-[#F9FAFB] px-4 h-12 rounded-xl text-sm outline-none border border-[#374151] focus:border-[#6366F1] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] transition-all"
            >
              <option value="feedback">Feedback</option>
              <option value="bug">Bug</option>
              <option value="feature_request">Feature Request</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#E5E7EB] mb-2 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full bg-[#020617] text-[#F9FAFB] placeholder:text-[#6B7280] px-4 h-12 rounded-xl text-sm outline-none border border-[#374151] focus:border-[#6366F1] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#E5E7EB] mb-2 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your feedback..."
              rows={6}
              className="w-full bg-[#020617] text-[#F9FAFB] placeholder:text-[#6B7280] px-4 py-3 rounded-xl text-sm outline-none border border-[#374151] focus:border-[#6366F1] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] resize-none transition-all"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full bg-[#6366F1] hover:bg-[#5558E3] disabled:opacity-50 active:scale-[0.98] text-[#F9FAFB] h-12 rounded-xl font-semibold transition-all"
          >
            {loading ? "Sending..." : "Send"}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-center text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  )
}
