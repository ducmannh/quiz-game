"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { saveStoredPlayer, PlayerProfile } from "@/lib/player"
import { loginAction, registerAction } from "@/app/actions/auth"
import QuizLogo from "@/components/QuizLogo"
import {
  LogIn,
  UserPlus,
  ArrowRight,
  KeyRound,
  User,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Flame,
} from "lucide-react"

export default function WuxiaAuthGate() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams?.get("redirect") || "/lobby"

  const [mode, setMode] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    const cleanUsername = username.trim()
    if (!cleanUsername) {
      setError("Vui lòng nhập tên tài khoản hiệp khách!")
      return
    }

    if (!password) {
      setError("Vui lòng nhập khẩu quyết (mật khẩu)!")
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === "login") {
        const res = await loginAction({
          username: cleanUsername,
          password: password,
        })

        if (!res.success || !res.user) {
          setError(res.error || "Tên tài khoản hoặc mật khẩu không chính xác!")
          setIsSubmitting(false)
          return
        }

        const playerProfile: PlayerProfile = {
          id: res.user.id,
          username: res.user.username,
          nickname: res.user.name,
          name: res.user.name,
          avatar: res.user.avatar || "⚔️",
          title: "Hiệp Khách Xuất Sơn",
        }

        saveStoredPlayer(playerProfile)
        setSuccessMsg("Điểm danh thành công! Đang tiến vào sảnh võ lâm...")

        setTimeout(() => {
          router.push(redirectTarget)
        }, 500)
      } else {
        if (password.length < 6) {
          setError("Mật khẩu phải có độ dài tối thiểu 6 ký tự!")
          setIsSubmitting(false)
          return
        }

        if (password !== confirmPassword) {
          setError("Xác nhận mật khẩu không khớp!")
          setIsSubmitting(false)
          return
        }

        const res = await registerAction({
          username: cleanUsername,
          password: password,
          name: displayName.trim() || cleanUsername,
        })

        if (!res.success || !res.user) {
          setError(res.error || "Ghi danh thất bại. Vui lòng thử lại!")
          setIsSubmitting(false)
          return
        }

        const playerProfile: PlayerProfile = {
          id: res.user.id,
          username: res.user.username,
          nickname: res.user.name,
          name: res.user.name,
          avatar: res.user.avatar || "⚔️",
          title: "Tân Thủ Võ Lâm",
        }

        saveStoredPlayer(playerProfile)
        setSuccessMsg("Ghi danh thành công! Đang bước vào giang hồ...")

        setTimeout(() => {
          router.push(redirectTarget)
        }, 600)
      }
    } catch {
      setError("Đã xảy ra sự cố kết nối tới máy chủ. Vui lòng thử lại!")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#11171D] text-slate-100 flex flex-col items-center justify-start pt-6 sm:pt-10 pb-12 px-4 relative overflow-hidden selection:bg-[#B23A22] selection:text-white">
      {/* Background Cổ Phong Kiếm Hiệp: Sương mù, vân mây và ánh hoàng kim */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-[#B23A22]/25 via-[#D4AF37]/15 to-transparent blur-3xl rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-[#1B4D3E]/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-[#8B5A2B]/20 blur-3xl rounded-full" />
      </div>

      {/* Hoa văn mây cuộn trào & Ngôi sao kiếm khí */}
      <div className="w-full max-w-md mb-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#9B2226] border border-[#FFC857] flex items-center justify-center text-[#FFC857] shadow-md font-serif font-black text-sm">
            武
          </div>
          <span className="text-xs font-black tracking-widest uppercase text-[#FFC857] drop-shadow">
            Võ Lâm Đấu Trường
          </span>
        </div>
        <QuizLogo size="sm" />
      </div>

      {/* Cuộn Tranh / Bảng Hoành Phi Thư Pháp Kiếm Hiệp */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF6EE] text-[#1F1610] border-4 border-[#7A4B1F] shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_2px_#D4AF37] relative overflow-hidden">
          {/* Họa tiết trang trí 4 góc sơn mài */}
          <div className="absolute top-2 left-2 text-[#7A4B1F] opacity-40 text-xs font-serif font-black pointer-events-none">
            ❖
          </div>
          <div className="absolute top-2 right-2 text-[#7A4B1F] opacity-40 text-xs font-serif font-black pointer-events-none">
            ❖
          </div>
          <div className="absolute bottom-2 left-2 text-[#7A4B1F] opacity-40 text-xs font-serif font-black pointer-events-none">
            ❖
          </div>
          <div className="absolute bottom-2 right-2 text-[#7A4B1F] opacity-40 text-xs font-serif font-black pointer-events-none">
            ❖
          </div>

          {/* Header Bảng Hoành Phi */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#9B2226] text-[#FFFDF4] border border-[#FFC857] text-xs font-black uppercase tracking-widest shadow-sm mb-3">
              <Flame className="w-3.5 h-3.5 text-[#FFC857] fill-[#FFC857]" />
              <span>Cổng Vào Võ Lâm Thi Đường</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-[#161A1D]">
              {mode === "login" ? "Điểm Danh Hiệp Khách" : "Ghi Danh Xuất Sơn"}
            </h1>
            <p className="text-xs text-[#5C4D3C] mt-1.5 font-bold">
              {mode === "login"
                ? "Nhập danh tính và mật khẩu để bước vào giang hồ so tài"
                : "Tạo danh tính mới để lập bang hội và tranh tài cao thấp"}
            </p>
          </div>

          {/* Tab Chuyển Đổi: Điểm Danh / Ghi Danh */}
          <div className="flex p-1.5 bg-[#EFE7D5] rounded-2xl border-2 border-[#7A4B1F] mb-5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setError(null)
                setSuccessMsg(null)
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-[#9B2226] text-[#FFFDF4] border-2 border-[#FFC857] shadow-[2px_2px_0px_#5A1215]"
                  : "text-[#5C4D3C] hover:text-[#161A1D]"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Điểm Danh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register")
                setError(null)
                setSuccessMsg(null)
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-[#9B2226] text-[#FFFDF4] border-2 border-[#FFC857] shadow-[2px_2px_0px_#5A1215]"
                  : "text-[#5C4D3C] hover:text-[#161A1D]"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Ghi Danh</span>
            </button>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-100/90 border-2 border-[#9B2226] text-[#9B2226] text-xs font-black flex items-start gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Thông báo thành công */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-100/90 border-2 border-[#1B4D3E] text-[#1B4D3E] text-xs font-black flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1B4D3E]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên tài khoản */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#3D2E1E] mb-1.5">
                Tên tài khoản (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A4B1F]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError(null)
                  }}
                  placeholder={mode === "login" ? "Nhập tên tài khoản của bạn" : "Ví dụ: manh123 (viết liền không dấu)"}
                  maxLength={30}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F4EEDD] border-2 border-[#7A4B1F] text-[#161A1D] placeholder-[#8C7A65] focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#7A4B1F] text-sm font-bold transition"
                />
              </div>
            </div>

            {/* Tên hiển thị (chỉ hiện khi Ghi danh) */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3D2E1E] mb-1.5">
                  Hiệp danh / Tên hiển thị võ lâm
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A4B1F]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ví dụ: Hoàng Nam, Độc Cô Cầu Bại..."
                    maxLength={30}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F4EEDD] border-2 border-[#7A4B1F] text-[#161A1D] placeholder-[#8C7A65] focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#7A4B1F] text-sm font-bold transition"
                  />
                </div>
              </div>
            )}

            {/* Mật khẩu */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#3D2E1E] mb-1.5">
                Khẩu quyết (Mật khẩu)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A4B1F]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  placeholder={mode === "login" ? "Nhập mật khẩu" : "Tối thiểu 6 ký tự"}
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-[#F4EEDD] border-2 border-[#7A4B1F] text-[#161A1D] placeholder-[#8C7A65] focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#7A4B1F] text-sm font-bold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A4B1F] hover:text-[#161A1D] transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu (chỉ hiện khi Ghi danh) */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3D2E1E] mb-1.5">
                  Xác nhận khẩu quyết
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A4B1F]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError(null)
                    }}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F4EEDD] border-2 border-[#7A4B1F] text-[#161A1D] placeholder-[#8C7A65] focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#7A4B1F] text-sm font-bold transition"
                  />
                </div>
              </div>
            )}

            {/* Nút Submit Sơn Mài Viền Hoàng Kim */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#9B2226] via-[#B23A22] to-[#9B2226] border-2 border-[#FFC857] text-[#FFFDF4] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0px_#5A1215] active:translate-y-1 active:shadow-none hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFC857]" />
                    <span>Đang xác thực danh tính...</span>
                  </>
                ) : mode === "login" ? (
                  <>
                    <LogIn className="w-4 h-4 text-[#FFC857]" />
                    <span>Bước Vào Giang Hồ</span>
                    <ArrowRight className="w-4 h-4 text-[#FFC857]" />
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-[#FFC857]" />
                    <span>Ghi Danh &amp; Xuất Sơn</span>
                    <ArrowRight className="w-4 h-4 text-[#FFC857]" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Chuyển đổi nhanh chế độ */}
          <div className="mt-5 pt-4 border-t border-[#D5C9B3] text-center text-xs font-bold text-[#5C4D3C]">
            {mode === "login" ? (
              <p>
                Chưa có danh tính hiệp khách?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register")
                    setError(null)
                    setSuccessMsg(null)
                  }}
                  className="text-[#9B2226] hover:underline font-black cursor-pointer"
                >
                  Ghi danh ngay tại đây &rarr;
                </button>
              </p>
            ) : (
              <p>
                Đã có danh tính từ trước?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login")
                    setError(null)
                    setSuccessMsg(null)
                  }}
                  className="text-[#9B2226] hover:underline font-black cursor-pointer"
                >
                  Điểm danh ngay &rarr;
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
