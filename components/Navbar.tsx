"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getStoredPlayer, PlayerProfile } from "@/lib/player"
import QuizLogo from "@/components/QuizLogo"
import {
  Trophy,
  Sparkles,
  Users,
  Home,
  User,
  KeyRound,
} from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const [player, setPlayer] = useState<PlayerProfile | null>(null)

  useEffect(() => {
    Promise.resolve().then(() => {
      setPlayer(getStoredPlayer())
    })
  }, [])

  // Không hiển thị navbar khi đang ở trong phòng thi đấu
  if (pathname.startsWith("/room/")) return null

  interface NavItem {
    href: string
    label: string
    icon: typeof Home
    badge?: string
  }

  const navLinks: NavItem[] = [
    { href: "/", label: "Trang Chủ", icon: Home },
    { href: "/lobby", label: "Sảnh Đấu", icon: Users },
    { href: "/leaderboard", label: "Xếp Hạng", icon: Trophy },
    { href: "/quiz/create", label: "Tạo Đề AI", icon: Sparkles, badge: "AI" },
  ]

  return (
    <>
      {/* Top Header Navbar */}
      <nav className="w-full bg-[#FFFDF4]/90 border-b border-[#E5E0D0] backdrop-blur-xl sticky top-0 z-40 select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <QuizLogo size="md" />

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 relative ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-black hover:bg-[#F3F0E6]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#6FEEFF]" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#00a76d] text-[9px] font-black text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right Action: Join by PIN & User Profile */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/lobby"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-white hover:bg-slate-50 text-xs font-bold text-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#00a76d]" />
              <span>Nhập mã PIN</span>
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-black text-xs font-bold text-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
            >
              {player ? (
                <>
                  <span className="text-base">{player.avatar}</span>
                  <span className="max-w-22.5 sm:max-w-30 truncate">{player.nickname}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-slate-700" />
                  <span>Đăng Nhập</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-[#FFFDF4]/95 border-t border-[#E5E0D0] backdrop-blur-xl z-50 px-2 py-2 flex items-center justify-around pb-safe shadow-lg">
        {navLinks.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold transition ${
                isActive
                  ? "text-[#00a76d] font-black"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
