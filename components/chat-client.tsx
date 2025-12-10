"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, MoreVertical, ChevronDown, X, Smile } from "lucide-react"
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
    <div className="fixed inset-0 flex flex-col bg-[#020617]">
      <div className="bg-[#020617] px-4 py-3 flex items-center gap-3 border-b border-[#1F2937]">
        <button
          onClick={() => router.push("/home")}
          className="text-[#F9FAFB] text-xl hover:text-[#6366F1] transition-colors active:scale-95"
          aria-label="Back"
        >
          ←
        </button>

        <button
          onClick={() => setShowAvatarInfo(true)}
          className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          <img
            src={headerAvatar || "/placeholder.svg"}
            alt={headerName}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <h1 className="text-base font-semibold text-[#F9FAFB] truncate">
            {headerName}
          </h1>
        </button>

        <button
          className="text-[#E5E7EB] hover:text-[#6366F1] transition-colors p-2 active:scale-95"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          className="text-[#E5E7EB] hover:text-[#6366F1] transition-colors p-2 active:scale-95"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: showEmojiPicker ? "300px" : "150px" }}
      >
        <div className="max-w-md mx-auto">
          {initialLoading && (
            <div className="text-sm text-[#6B7280] text-center mt-8">
              Loading chat...
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 text-center mt-4">
              {error}
            </div>
          )}

          {!initialLoading && messages.length === 0 && !error && (
            <div className="flex items-center justify-center h-[50vh]">
              <p className="text-[#6B7280] text-sm text-center">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}

          <div className="space-y-2">
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
                    className={`max-w-[75%] px-4 py-2.5 rounded-[14px] text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-[#4C1D95] text-[#E5E7EB]" // purple-900 برای کاربر
                        : "bg-[#111827] text-[#E5E7EB]" // برای AI
                    }`}
                  >
                    <div>{message.content}</div>
                    {timeLabel && (
                      <div className="mt-1 text-[10px] text-[#9CA3AF] text-right">
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
                <div className="max-w-[50%] px-3 py-2 rounded-[14px] bg-[#111827] text-[#9CA3AF] text-xs flex gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-150">●</span>
                  <span className="animate-pulse delay-300">●</span>
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
          className="fixed bottom-36 right-6 bg-[#111827] text-[#E5E7EB] p-3 rounded-full shadow-lg hover:bg-[#1F2937] active:scale-95 transition-all z-20"
          aria-label="Scroll to latest"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-28 left-0 right-0 bg-[#020617] border-t border-[#1F2937] shadow-[0_-4px_16px_rgba(15,23,42,0.7)] overflow-hidden">
          <div className="max-w-md mx-auto p-4">
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:scale-125 transition-transform active:scale-110 p-2"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-14 left-0 right-0 bg-[#020617] px-4 py-3 border-t border-[#1F2937]">
        <div className="max-w-md mx-auto flex gap-2 items-end">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
              showEmojiPicker
                ? "text-[#6366F1] bg-[#6366F1]/10"
                : "text-[#E5E7EB] hover:text-[#6366F1]"
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
            className="flex-1 bg-[#020617] text-[#F9FAFB] placeholder:text-[#6B7280] px-4 py-2.5 rounded-xl text-sm outline-none border border-[#374151] focus:border-[#6366F1] resize-none overflow-y-auto transition-all"
            style={{
              minHeight: "42px",
              maxHeight: "96px",
            }}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-[#6366F1] hover:bg-[#5558E3] disabled:opacity-50 active:scale-95 text-[#F9FAFB] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
            style={{ minHeight: "42px" }}
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