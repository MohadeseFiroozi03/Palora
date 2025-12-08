"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, User, FileText } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: "/home", label: "Home", Icon: Home },
    { href: "/profile", label: "Profile", Icon: User },
    { href: "/report", label: "Report", Icon: FileText },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-[#020617] border-t border-[#1F2937]">
      <div className="flex justify-around items-center h-full">
        {links.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + "/")

          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center justify-center gap-1 px-6 h-full transition-colors ${
                isActive ? "text-[#6366F1]" : "text-[#9CA3AF] hover:text-[#E5E7EB]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
