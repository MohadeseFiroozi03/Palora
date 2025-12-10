"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MoreVertical,
  ChevronDown,
  X,
  Smile,
  ArrowLeft,
  MessageCircle,
} from "lucide-react"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { useSupabaseAuth } from "../app/hooks/useSupabaseAuth"

const EMOJIS = [
  "😊",
  "😂",
  "🥰",
  "😍",
  "🤗",
  "😢",
  "😭",
  "😔",
  "😞",
  "😟",
  "😌",
  "😎",
  "🤔",
  "😴",
  "🥱",
  "😷",
  "🤒",
  "🤕",
  "🤩",
  "🥳",
  "👍",
  "👎",
  "👏",
  "🙏",
  "❤️",
  "💔",
  "💕",
  "💖",
  "✨",
  "🌟",
  "🎉",
  "🎊",
  "🔥",
  "💯",
  "🌈",
  "☀️",
  "🌙",
  "⭐",
  "💫",
  "🌺",
]

type Role = "user" | "ai"

interface UiMessage {
  id: string
  role: Role
  content: string
  createdAt?: string // برای نمایش ساعت
}

interface CompanionData {
  name: string
  avatar: string
  description?: string | null
  interests?: string | null
}

interface ChatClientProps {
  companionId: string
}

export default function ChatClient({ companionId }: ChatClientProps) {
  console.log("ChatClient companionId:", companionId)

  const router = useRouter()
  const { user, loading: authLoading } = useSupabaseAuth()
  const userId = user?.id ?? null

  const [companion, setCompanion] = useState<CompanionData | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAvatarInfo, setShowAvatarInfo] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)

  // state و ref برای isTyping
  const [isAiTyping, setIsAiTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // state برای context menu پیام
  const [contextMenuMessageId, setContextMenuMessageId] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)

  // ref برای long-press روی موبایل
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    const scrollHeight = textarea.scrollHeight
    const maxHeight = 96 // ~4 lines
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
  }, [input])

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
  }

  const checkIfNearBottom = () => {
    const container = messagesContainerRef.current
    if (!container) return true

    const threshold = 100
    const position = container.scrollTop + container.clientHeight
    const bottom = container.scrollHeight
    return bottom - position < threshold
  }

  const handleScroll = () => {
    const nearBottom = checkIfNearBottom()
    setIsNearBottom(nearBottom)
    setShowScrollButton(!nearBottom && messages.length > 0)
  }

  useEffect(() => {
    if (!initialLoading && messages.length > 0) {
      if (isNearBottom) {
        setTimeout(() => scrollToBottom(true), 100)
      }
    }
  }, [messages, initialLoading, isNearBottom])

  useEffect(() => {
    if (!initialLoading) {
      scrollToBottom(false)
    }
  }, [initialLoading])

  useEffect(() => {
    // تا وقتی auth لود نشده، یا userId نداریم، هیچی لود نکن
    if (authLoading || !userId) return

    const fetchData = async () => {
      try {
        setInitialLoading(true)
        setError(null)

        // ۱) گرفتن companion از supabase
        const { data: cData, error: cError } = await supabase
          .from("companions")
          .select("id, name, image_url, description, interests")
          .eq("id", companionId)

        console.log("Companion raw data:", cData)

        if (cError) {
          console.error("Companion fetch error:", cError)
          throw new Error("Failed to fetch companion")
        }
        if (!cData || cData.length === 0) {
          throw new Error("Companion not found")
        }
        if (cData.length > 1) {
          console.warn("More than one companion with this id:", companionId, cData)
        }

        const c = cData[0]
        setCompanion({
          name: c.name,
          avatar: c.image_url || "/placeholder.svg",
          description: c.description,
          interests: c.interests,
        })

        // ۲) گرفتن پیام‌ها
        const { data: mData, error: mError } = await supabase
          .from("messages")
          .select("id, sender, text, created_at")
          .eq("user_id", userId)
          .eq("companion_id", companionId)
          .order("created_at", { ascending: true })

        if (mError) {
          console.error("Messages fetch error:", mError)
          throw new Error(`Failed to fetch messages: ${mError.message}`)
        }

        const uiMessages: UiMessage[] = (mData || []).map((m: any) => ({
          id: m.id,
          role: m.sender as Role,
          content: m.text,
          createdAt: m.created_at, // برای ساعت
        }))

        setMessages(uiMessages)
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Could not load chat.")
        setMessages([
          {
            id: "welcome-error",
            role: "ai",
            content: "Hey, something went wrong loading history. But you can still talk to me.",
          },
        ])
      } finally {
        setInitialLoading(false)
      }
    }

    fetchData()
  }, [companionId, userId, authLoading])

  const insertMessage = async (sender: Role, text: string) => {
    if (!userId) throw new Error("No user id")

    console.log("Inserting message with:", {
      userId,
      companionId,
      sender,
      text,
    })

    const { data: sessionData } = await supabase.auth.getSession()
    console.log("Current session in insertMessage:", sessionData)

    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        companion_id: companionId,
        sender,
        text,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to insert message: ${error.message}`)
    }

    const created = data
    const uiMsg: UiMessage = {
      id: created.id,
      role: created.sender as Role,
      content: created.text,
      createdAt: created.created_at, // برای ساعت
    }

    setMessages((prev) => [...prev, uiMsg])
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const text = input.trim()
    setInput("")
    setLoading(true)
    setError(null)
    setShowEmojiPicker(false) // Close emoji picker on send

    try {
      await insertMessage("user", text)

      // بعد از ارسال پیام کاربر، منتظر جواب AI هستیم
      setIsAiTyping(true)

      // اگر تایمر قبلی هست، پاکش کن
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // اگر تا مثلا 25 ثانیه جوابی نیاد، خودمون isAiTyping رو خاموش می‌کنیم
      typingTimeoutRef.current = setTimeout(() => {
        setIsAiTyping(false)
        typingTimeoutRef.current = null
      }, 25000)

      setTimeout(() => scrollToBottom(true), 100)
    } catch (err) {
      console.error(err)
      setError("Could not send your message.")
      setIsAiTyping(false)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = input.substring(0, start) + emoji + input.substring(end)
    setInput(newValue)

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  // هندل long-press روی موبایل
  const handleTouchStartMessage = (messageId: string) => {
    // اگر قبلاً تایمر هست، پاکش کن
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
    }

    // اگر کاربر حدود 500ms نگه داشت، منو رو باز کن
    touchTimeoutRef.current = setTimeout(() => {
      setContextMenuMessageId(messageId)
      setContextMenuPosition(null) // روی موبایل، منو رو پایین صفحه نشون می‌دیم
      console.log("Long press context menu for message:", messageId)
    }, 500)
  }

  const handleTouchEndMessage = () => {
    // اگر قبل از 500ms انگشت رو برداشت، long-press حساب نشه
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }
  }

  // Polling پیام‌ها + مدیریت isAiTyping
  useEffect(() => {
    if (authLoading || !userId) return

    let isMounted = true

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, sender, text, created_at")
          .eq("user_id", userId)
          .eq("companion_id", companionId)
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Polling messages error:", error)
          return
        }

        const uiMessages: UiMessage[] = (data || []).map((m: any) => ({
          id: m.id,
          role: m.sender as Role,
          content: m.text,
          createdAt: m.created_at,
        }))

        if (isMounted) {
          setMessages(uiMessages)

          // اگر آخرین پیام از طرف AI بود → جواب رسیده → isTyping خاموش + تایمر پاک
          if (uiMessages.length > 0) {
            const last = uiMessages[uiMessages.length - 1]
            if (last.role === "ai") {
              setIsAiTyping(false)
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = null
              }
            }
          }
        }
      } catch (e) {
        console.error("Polling error", e)
      }
    }, 1500)

    return () => {
      isMounted = false
      clearInterval(interval)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [companionId, userId, authLoading])


    const headerName = companion?.name || "Companion"
  const headerAvatar = companion?.avatar || "/placeholder.svg"

  // لیست علایق از رشته‌ی interests (بر اساس کاما)
  const interestsList =
    companion?.interests
      ?.split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0) ?? []

  // --- Auth guard ---
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#020617] text-[#E5E7EB]">
        Loading...
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#020617] text-[#E5E7EB]">
        <p className="mb-4">You need to log in to chat.</p>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 rounded-lg bg-[#6366F1] text-[#F9FAFB]"
        >
          Go to login
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#020617] bg-gradient-to-b from-slate-950 via-slate-950/80 to-[#030712] text-slate-100">
      <div className="sticky top-0 z-30 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.7)]">
        <div className="max-w-md w-full mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/home")}
            className="h-10 w-10 rounded-full border border-slate-800/80 bg-slate-900/70 text-slate-100 flex items-center justify-center hover:border-slate-700 hover:bg-slate-800/80 transition-all active:scale-95 shadow-sm"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowAvatarInfo(true)}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-all text-left"
          >
            <div className="relative">
              <img
                src={headerAvatar || "/placeholder.svg"}
                alt={headerName}
                className="w-12 h-12 rounded-2xl border border-slate-800/70 shadow-lg shadow-indigo-900/40 object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_0_3px_rgba(2,6,23,0.7)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-slate-50 truncate">
                {headerName}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                AI companion · Always here for you
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              className="h-10 w-10 rounded-full border border-slate-800/80 bg-slate-900/70 text-slate-200 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition-all active:scale-95 flex items-center justify-center shadow-sm"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="h-10 w-10 rounded-full border border-slate-800/80 bg-slate-900/70 text-slate-200 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition-all active:scale-95 flex items-center justify-center shadow-sm"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 relative"
        style={{ paddingBottom: showEmojiPicker ? "300px" : "150px" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_35%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.05),transparent_35%)] blur-3xl" />
        <div className="max-w-md mx-auto relative">
          {initialLoading && (
            <div className="text-sm text-[#9CA3AF] text-center mt-8">
              Loading chat...
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 text-center mt-4">
              {error}
            </div>
          )}

          {!initialLoading && messages.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-slate-900/70 border border-slate-800/70 flex items-center justify-center shadow-inner shadow-indigo-900/40">
                <MessageCircle className="w-7 h-7 text-indigo-300" />
              </div>
              <p className="text-base text-slate-200">No messages yet</p>
              <p className="text-xs text-slate-400">
                Say hello to start the conversation.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((message) => {
              // فرمت ساده‌ی زمان: HH:MM
              let timeLabel = ""
              if (message.createdAt) {
                const d = new Date(message.createdAt)
                const hh = d.getHours().toString().padStart(2, "0")
                const mm = d.getMinutes().toString().padStart(2, "0")
                timeLabel = `${hh}:${mm}`
              }

              // هندل context menu (right-click) برای دسکتاپ
              const handleContextMenu = (e: React.MouseEvent) => {
                e.preventDefault()
                setContextMenuMessageId(message.id)
                setContextMenuPosition({ x: e.clientX, y: e.clientY })
                console.log("Open context menu for message:", message.id)
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                  onContextMenu={handleContextMenu} // لپ‌تاپ / دسکتاپ
                  onTouchStart={() => handleTouchStartMessage(message.id)} // موبایل long-press
                  onTouchEnd={handleTouchEndMessage}
                  onTouchCancel={handleTouchEndMessage}
                >
                  <div
                    className={`group max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg border ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-indigo-600 via-indigo-600/90 to-indigo-700 text-slate-50 border-indigo-500/30 shadow-indigo-900/40"
                        : "bg-slate-800/80 text-slate-100 border-slate-700/60 shadow-black/30 backdrop-blur-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {timeLabel && (
                      <div className="mt-2 text-[10px] text-slate-400/90 text-right">
                        {timeLabel}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* AI is typing indicator */}
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="max-w-[55%] px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-[#cbd5e1] text-xs flex items-center gap-2 shadow-lg shadow-black/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-200 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-200 animate-pulse delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-200 animate-pulse delay-300" />
                  <span className="text-[11px] text-slate-400">Typing...</span>
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-32 right-6 h-11 w-11 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white flex items-center justify-center rounded-full shadow-lg shadow-indigo-900/50 border border-indigo-400/30 hover:-translate-y-0.5 active:scale-95 transition-all z-20"
          aria-label="Scroll to latest"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-28 left-0 right-0 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/80 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] overflow-hidden rounded-t-3xl">
          <div className="max-w-md mx-auto p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-[0.14em]">
              <span className="font-semibold text-slate-300">Reactions</span>
              <span className="text-slate-500">Pick an emoji</span>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:scale-125 transition-transform active:scale-110 p-2 rounded-xl hover:bg-slate-800/70"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-14 left-0 right-0 px-4 py-4 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent">
        <div className="max-w-md mx-auto flex gap-3 items-end rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl px-3 py-3 shadow-2xl shadow-black/40">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`h-11 w-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 border ${
              showEmojiPicker
                ? "text-indigo-300 bg-indigo-900/40 border-indigo-500/40 shadow-inner shadow-indigo-900/40"
                : "text-slate-200 bg-slate-800/80 border-slate-700 hover:text-white hover:border-slate-600"
            }`}
            aria-label="Toggle emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-[#F9FAFB] placeholder:text-slate-500 px-4 py-2.5 rounded-2xl text-sm outline-none border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 resize-none overflow-y-auto transition-all"
            style={{
              minHeight: "42px",
              maxHeight: "96px",
            }}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="min-h-[42px] px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-500 to-indigo-400 hover:from-indigo-500 hover:via-indigo-500 hover:to-indigo-300 disabled:opacity-60 active:scale-95 transition-all shadow-md shadow-indigo-900/40 flex-shrink-0"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>

      {/* پنجره اطلاعات آواتار */}
      {showAvatarInfo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* بک‌دراپ تار کننده پشت پنجره */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAvatarInfo(false)}
          />

          {/* خود پنجره (bottom sheet) */}
          <div className="relative bg-[#020617] rounded-t-3xl w-full max-w-md p-6 shadow-[0_-4px_16px_rgba(15,23,42,0.7)] animate-slide-up border-t border-[#1F2937]">
            {/* هندل بالای شیت (خط خاکستری) */}
            <div className="w-12 h-1 bg-[#374151] rounded-full mx-auto mb-6" />

            {/* دکمه بستن */}
            <button
              onClick={() => setShowAvatarInfo(false)}
              className="absolute top-4 right-4 text-[#E5E7EB] hover:text-[#F9FAFB] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              {/* آواتار – کمی بزرگ‌تر */}
              <img
                src={headerAvatar || "/placeholder.svg"}
                alt={headerName}
                className="w-28 h-28 rounded-xl object-cover"
              />

              {/* اسم آواتار */}
              <h2 className="text-xl font-bold text-[#F9FAFB]">
                {headerName}
              </h2>

              {/* توضیحات (description) */}
              <p className="text-sm text-[#E5E7EB] leading-relaxed">
                {companion?.description ||
                  "An AI companion ready to chat with you."}
              </p>

              {/* بخش Interests */}
              {interestsList.length > 0 && (
                <div className="w-full mt-2 text-left space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Interests:
                  </p>
                  <p className="text-sm text-[#E5E7EB] leading-relaxed">
                    {interestsList.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu برای پیام‌ها */}
      {contextMenuMessageId && (
        <>
          {/* بک‌دراپ برای بستن منو با کلیک بیرون */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setContextMenuMessageId(null)
              setContextMenuPosition(null)
            }}
          />

          {/* خود منو */}
          <div
            className="fixed z-50 min-w-[160px] bg-[#111827] border border-[#374151] rounded-xl shadow-lg text-sm text-[#E5E7EB] py-1"
            style={
              contextMenuPosition
                ? {
                    top: contextMenuPosition.y,
                    left: contextMenuPosition.x,
                    transform: "translate(-50%, 0)",
                  }
                : {
                    // روی موبایل (long-press): پایین صفحه وسط
                    bottom: "80px",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }
            }
          >
            <button
              className="w-full text-left px-3 py-2 hover:bg-[#1F2937]"
              onClick={() => {
                const msg = messages.find(
                  (m) => m.id === contextMenuMessageId
                )
                if (msg) {
                  navigator.clipboard?.writeText(msg.content).catch(() => {})
                }
                console.log("Copy text of message:", contextMenuMessageId)
                setContextMenuMessageId(null)
                setContextMenuPosition(null)
              }}
            >
              Copy text
            </button>

            {/* گزینه‌های مخصوص پیام‌های کاربر */}
            {messages.find((m) => m.id === contextMenuMessageId)?.role ===
              "user" && (
              <>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-[#1F2937]"
                  onClick={() => {
                    console.log(
                      "Edit message (coming soon):",
                      contextMenuMessageId,
                    )
                    setContextMenuMessageId(null)
                    setContextMenuPosition(null)
                  }}
                >
                  Edit (coming soon)
                </button>

                <button
                  className="w-full text-left px-3 py-2 hover:bg-[#1F2937] text-red-400"
                  onClick={() => {
                    console.log(
                      "Delete message (coming soon):",
                      contextMenuMessageId,
                    )
                    setContextMenuMessageId(null)
                    setContextMenuPosition(null)
                  }}
                >
                  Delete (coming soon)
                </button>
              </>
            )}
          </div>
        </>
      )}

      <Navigation />
    </div>
  )
}