"use client"

import { useRouter } from "next/navigation"

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#020617] relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6366F1]/20 rounded-full blur-3xl" />
      <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#EC4899]/15 rounded-full blur-3xl" />

      <div className="text-center max-w-md w-full relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#6366F1] to-[#EC4899] bg-clip-text text-transparent">
          PALORA
        </h1>

        <p className="text-base md:text-lg mb-12 text-[#9CA3AF] leading-relaxed max-w-sm mx-auto">
          Talk, unwind, and feel less alone, with a listener for every thought.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="w-[85%] bg-[#6366F1] hover:bg-[#5558E3] active:scale-[0.97] active:bg-[#4F52D9] text-[#F9FAFB] h-12 rounded-xl font-semibold transition-all shadow-lg shadow-[#6366F1]/30"
        >
          Start
        </button>
      </div>
    </div>
  )
}
