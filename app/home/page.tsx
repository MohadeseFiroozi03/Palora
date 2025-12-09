// "use client"

// import { useEffect, useState } from "react"
// import Navigation from "@/components/navigation"
// import HomeClient from "@/components/home-client"

// type Companion = {
//   id: string
//   name: string
//   description: string
//   image_url: string
//   interests?: string
// }

// export default function HomeScreen() {
//   const [companions, setCompanions] = useState<Companion[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   // خواندن از env (همان‌هایی که در .env.local گذاشتی)
//   const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
//   const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

//   useEffect(() => {
//     let mounted = true

//     async function fetchCompanions() {
//       try {
//         if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
//           throw new Error("Supabase env variables are missing")
//         }

//         const url = `${SUPABASE_URL}/rest/v1/companions?select=id,name,description,image_url,interests`

//         const res = await fetch(url, {
//           headers: {
//             apikey: SUPABASE_ANON_KEY,
//             Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
//           },
//         })

//         if (!res.ok) {
//           const txt = await res.text()
//           throw new Error(`Status ${res.status}: ${txt}`)
//         }

//         const data = await res.json()
//         if (mounted) setCompanions(data || [])
//       } catch (err: any) {
//         if (mounted) setError(err.message || "Failed to fetch companions")
//       } finally {
//         if (mounted) setLoading(false)
//       }
//     }

//     fetchCompanions()

//     return () => {
//       mounted = false
//     }
//   }, [SUPABASE_URL, SUPABASE_ANON_KEY])

//   if (loading)
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#020617]">
//         <div className="text-sm text-[#9CA3AF]">Loading...</div>
//       </div>
//     )

//   return (
//     <div className="min-h-screen pb-20 bg-[#020617]">
//       <div className="max-w-md mx-auto px-4 py-6">
//         <h1 className="text-xl md:text-2xl font-bold mb-6 text-[#F9FAFB] text-center">
//           Choose your AI companion
//         </h1>

//         {error ? (
//           <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-center text-sm">
//             Error loading companions: {error}
//           </div>
//         ) : companions.length === 0 ? (
//           <div className="bg-[#0B1120] px-6 py-8 rounded-xl text-center shadow-lg">
//             <p className="text-[#9CA3AF] text-sm">No companions found</p>
//           </div>
//         ) : (
//           <HomeClient companions={companions} />
//         )}
//       </div>

//       <Navigation />
//     </div>
//   )
// }



"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/navigation"
import HomeClient from "@/components/home-client"

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-sm text-[#9CA3AF]">Loading...</div>
      </div>
    )

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col">
      {/* محتوای اصلی */}
      <main className="flex-1 flex justify-center pb-20">
        <div className="w-full max-w-md md:max-w-4xl px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-[#F9FAFB] text-center md:text-left">
            Choose your AI companion
          </h1>

          <div className="md:grid md:grid-cols-2 md:gap-6">
            {error ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-center text-sm md:col-span-2">
                Error loading companions: {error}
              </div>
            ) : companions.length === 0 ? (
              <div className="bg-[#0B1120] px-6 py-8 rounded-xl text-center shadow-lg md:col-span-2">
                <p className="text-[#9CA3AF] text-sm">No companions found</p>
              </div>
            ) : (
              // HomeClient خودش می‌تونه لیست رو موبایل‌فرندلی رندر کنه
              <div className="md:col-span-2">
                <HomeClient companions={companions} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ناوبری پایین (مثلاً bottom nav) */}
      <Navigation />
    </div>
  )
}