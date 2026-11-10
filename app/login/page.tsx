"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AVATAR_LIST, getStoredPlayer, saveStoredPlayer, PlayerProfile } from "@/lib/player"
import QuizLogo from "@/components/QuizLogo"
import { Sparkles, ArrowRight, UserCheck, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState(() => getStoredPlayer()?.nickname || "")
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    const existing = getStoredPlayer()
    return AVATAR_LIST.find((a) => a.emoji === existing?.avatar) || AVATAR_LIST[0]
  })
  const [error, setError] = useState<string | null>(null)

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = nickname.trim()

    if (!cleanName) {
      setError("Vui lòng nhập Biệt danh / Tên của bạn!")
      return
    }

    if (cleanName.length < 2 || cleanName.length > 20) {
      setError("Biệt danh nên từ 2 đến 20 ký tự.")
      return
    }

    const playerProfile: PlayerProfile = {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      nickname: cleanName,
      avatar: selectedAvatar.emoji,
      title: selectedAvatar.name,
    }

    saveStoredPlayer(playerProfile)
    router.push("/lobby")
  }

  return (
    <div className="min-h-screen bg-[#FFFDF4] text-slate-900 flex flex-col items-center justify-center p-4 relative">
      {/* Back button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang Chủ</span>
        </Link>
        <QuizLogo size="sm" />
      </div>

      <div className="w-full max-w-md">
        {/* Card Form Quiz.com Style */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-3 border-black shadow-[8px_8px_0px_#000]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d3b44] text-[#6FEEFF] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#FFB800]" />
              Hồ Sơ Thí Sinh
            </div>
            <h1 className="text-2xl font-black font-heading text-slate-900">
              Đăng Nhập / Tạo Hồ Sơ
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Nhập tên và chọn linh vật để lưu lại điểm số và tham gia thi đấu
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleStart} className="space-y-5">
            {/* Input Nickname */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                Biệt danh (Nickname)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setError(null)
                }}
                placeholder="Ví dụ: Hoàng Nam, ProGamer, Trí Tuệ..."
                maxLength={20}
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-black text-slate-900 placeholder-slate-400 focus:outline-none focus:shadow-[4px_4px_0px_#000] text-sm font-bold transition"
              />
            </div>

            {/* Choose Avatar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Chọn Linh Vật
                </label>
                <span className="text-xs font-bold text-slate-500">{selectedAvatar.name}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_LIST.map((av) => {
                  const isSelected = selectedAvatar.id === av.id
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`h-12 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-2 border-black bg-[#6FEEFF] shadow-[3px_3px_0px_#000] scale-105"
                          : "border-2 border-slate-200 bg-white hover:border-black hover:bg-slate-50"
                      }`}
                      title={av.name}
                    >
                      {av.emoji}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Preview Card */}
            <div className="p-3.5 rounded-2xl bg-[#FFFDF4] border-2 border-black shadow-[3px_3px_0px_#000] flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
                {selectedAvatar.emoji}
              </div>
              <div className="flex-1 truncate">
                <div className="text-sm font-black text-slate-900 truncate">
                  {nickname.trim() || "Tên của bạn"}
                </div>
                <div className="text-[11px] font-bold text-slate-500">
                  Danh xưng: {selectedAvatar.name}
                </div>
              </div>
            </div>

            {/* Nút vào sảnh */}
            <button
              type="submit"
              className="btn-3d btn-3d-green w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Xác Nhận & Vào Sảnh Chơi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
