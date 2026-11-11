"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getStoredPlayer, clearStoredPlayer, PlayerProfile } from "@/lib/player"
import { logoutAction } from "@/app/actions/auth"
import QuizLogo from "@/components/QuizLogo"
import {
  Trophy,
  Sparkles,
  Users,
  Home,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  PlusCircle,
} from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Đồng bộ người dùng và đóng dropdown khi chuyển route
    Promise.resolve().then(() => {
      setPlayer(getStoredPlayer())
      setIsDropdownOpen(false)
    })

    // Lắng nghe sự kiện đăng nhập / đăng xuất tức thì
    const handleAuthChange = () => {
      setPlayer(getStoredPlayer())
    }
    window.addEventListener("funquiz:auth-change", handleAuthChange)
    window.addEventListener("storage", handleAuthChange)

    return () => {
      window.removeEventListener("funquiz:auth-change", handleAuthChange)
      window.removeEventListener("storage", handleAuthChange)
    }
  }, [pathname])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleLogout = async () => {
    setIsDropdownOpen(false)
    await logoutAction()
    clearStoredPlayer()
    setPlayer(null)
    router.push("/login")
  }

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
              <Users className="w-3.5 h-3.5 text-[#00a76d]" />
              <span>Nhóm Thi Đấu</span>
            </Link>

            {/* Ô TÀI KHOẢN NGƯỜI DÙNG: CHƯA ĐĂNG NHẬP HOẶC ĐÃ ĐĂNG NHẬP THÀNH CÔNG */}
            {player ? (
              /* GIAO DIỆN ĐĂNG NHẬP THÀNH CÔNG (Neo-brutalist User Badge with Dropdown) */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-black text-xs font-black text-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer"
                >
                  {/* Avatar Initials Badge */}
                  <div className="w-6 h-6 rounded-lg bg-[#00a76d] border border-black flex items-center justify-center text-white text-[11px] font-black shadow-[1px_1px_0px_#000] shrink-0">
                    {player.username ? player.username.charAt(0).toUpperCase() : "U"}
                  </div>

                  {/* Display Name */}
                  <span className="max-w-[85px] sm:max-w-[120px] truncate text-slate-950 font-black">
                    {player.nickname || player.name || player.username}
                  </span>

                  {/* Status Indicator Dot */}
                  <span className="w-2 h-2 rounded-full bg-[#00a76d] animate-pulse shrink-0" />

                  {/* Chevron Icon */}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu khi bấm vào */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] p-3.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Header thông tin tài khoản */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-[#00a76d] border-2 border-black flex items-center justify-center text-white text-base font-black shadow-[2px_2px_0px_#000] shrink-0">
                        {player.username ? player.username.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="truncate flex-1">
                        <div className="text-sm font-black text-slate-950 truncate">
                          {player.nickname || player.name || player.username}
                        </div>
                        <div className="text-xs font-bold text-slate-500 font-mono truncate">
                          @{player.username}
                        </div>
                      </div>
                    </div>

                    {/* Tag trạng thái */}
                    <div className="my-2.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00a76d] shrink-0" />
                      <span>Đã đăng nhập thành công</span>
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="space-y-1 pt-1">
                      <Link
                        href="/lobby"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-black hover:bg-slate-100 transition"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sảnh Đấu Trực Tuyến</span>
                      </Link>

                      <Link
                        href="/quiz/create"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-black hover:bg-slate-100 transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tạo Đề Thi Bằng AI</span>
                      </Link>

                      <Link
                        href="/leaderboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-black hover:bg-slate-100 transition"
                      >
                        <Trophy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Bảng Vàng Xếp Hạng</span>
                      </Link>
                    </div>

                    {/* Divider & Nút Đăng Xuất */}
                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng Xuất Khỏi Tài Khoản</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* GIAO DIỆN CHƯA ĐĂNG NHẬP */
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-black text-xs font-bold text-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
              >
                <User className="w-3.5 h-3.5 text-slate-700" />
                <span>Đăng Nhập</span>
              </Link>
            )}
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
