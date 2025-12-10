"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { MessageCircle } from "lucide-react"

type Companion = {
  id: string
  name: string
  description: string
  image_url: string
  interests?: string
}

export default function HomeClient({ companions }: { companions: Companion[] }) {
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const parseInterests = (interests: string | undefined): string[] => {
    if (!interests) return []
    try {
      const parsed = JSON.parse(interests)
      return Array.isArray(parsed) ? parsed.slice(0, 4) : []
    } catch {
      return []
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {companions.map((companion) => {
        const interestsList = parseInterests(companion.interests)
        const isHovered = hoveredId === companion.id

        return (
          <div
            key={companion.id}
            onMouseEnter={() => setHoveredId(companion.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`bg-[#111827] border border-[#374151] rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.7)] cursor-pointer transition-all duration-200 overflow-hidden ${
              isHovered ? "scale-[1.02] shadow-[0_8px_24px_rgba(15,23,42,0.9)] border-[#6366F1]/50" : ""
            }`}
          >
            <div className="w-full h-48 overflow-hidden rounded-t-xl">
              <img
                src={companion.image_url || "/placeholder.svg"}
                alt={companion.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-[#F9FAFB]">{companion.name}</h2>

              {interestsList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interestsList.map((interest, idx) => (
                    <span key={idx} className="px-3 py-1 text-xs rounded-lg bg-[rgba(99,102,241,0.15)] text-[#E5E7EB]">
                      {interest}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-[#9CA3AF] leading-relaxed line-clamp-2">{companion.description}</p>

              <button
                onClick={() => router.push(`/chat/${companion.id}`)}
                className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-[#F9FAFB] h-11 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with {companion.name}</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
