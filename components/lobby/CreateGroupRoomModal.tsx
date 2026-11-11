"use client"

import { useState } from "react"
import { createGroupRoomAction } from "@/app/actions/group"
import {
  Gamepad2,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react"

interface CreateGroupRoomModalProps {
  groupId: string
  groupName: string
  userId: string
  onClose: () => void
  onSuccess: (roomCode: string) => void
}

const SUGGESTED_TOPICS = [
  "Lập trình Next.js & React",
  "Khoa Học & Đời Sống",
  "Lịch Sử & Văn Hóa",
  "Địa Lý Thế Giới",
  "Toán Học & Tư Duy Logic",
  "Tiếng Anh Chuyên Ngành",
  "Công Nghệ & Trí Tuệ Nhân Tạo AI",
  "Đố Vui Trí Tuệ & IQ",
]

export default function CreateGroupRoomModal({
  groupId,
  groupName,
  userId,
  onClose,
  onSuccess,
}: CreateGroupRoomModalProps) {
  const [topic, setTopic] = useState("")
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectTopic = (t: string) => {
    setTopic(t)
    if (!title || title.startsWith("Phòng Thi:")) {
      setTitle(`Phòng Thi: ${t}`)
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanTopic = topic.trim()
    if (!cleanTopic) {
      setError("Vui lòng chọn hoặc nhập chủ đề cho phòng thi!")
      return
    }

    const cleanTitle = title.trim() || `Phòng Thi: ${cleanTopic}`

    setIsSubmitting(true)

    try {
      const res = await createGroupRoomAction({
        groupId,
        title: cleanTitle,
        topic: cleanTopic,
        userId,
      })

      if (!res.success || !res.roomCode) {
        setError(res.error || "Không thể tạo phòng thi cho nhóm. Vui lòng thử lại!")
        setIsSubmitting(false)
        return
      }

      onSuccess(res.roomCode)
    } catch {
      setError("Đã xảy ra sự cố kết nối máy chủ.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border-3 border-black shadow-[10px_10px_0px_#000] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0d3b44] text-white flex items-center justify-between border-b-3 border-black">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#6FEEFF] text-xs font-black uppercase tracking-wider">
              <Gamepad2 className="w-3.5 h-3.5" />
              Thêm Phòng Thi Cho Nhóm
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Tạo Phòng Thi Theo Chủ Đề
            </h3>
            <p className="text-xs text-slate-300 font-medium">Nhóm: {groupName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn chủ đề nhanh */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
              Gợi ý chủ đề trắc nghiệm
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {SUGGESTED_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSelectTopic(t)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                    topic === t
                      ? "bg-[#00a76d] text-white border-black shadow-[2px_2px_0px_#000]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-black hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Ô nhập chủ đề tự do */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
              Chủ đề phòng thi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value)
                  setError(null)
                  if (!title || title.startsWith("Phòng Thi:")) {
                    setTitle(`Phòng Thi: ${e.target.value}`)
                  }
                }}
                placeholder="Ví dụ: Lập trình Next.js, Vật lý lượng tử..."
                maxLength={60}
                required
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-black text-slate-900 placeholder-slate-400 focus:outline-none focus:shadow-[4px_4px_0px_#000] text-sm font-bold transition"
              />
            </div>
          </div>

          {/* Tên phòng thi */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
              Tên phòng thi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Đấu Trường Trí Tuệ: Lập Trình Next.js"
              maxLength={80}
              className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-black text-slate-900 placeholder-slate-400 focus:outline-none focus:shadow-[4px_4px_0px_#000] text-sm font-bold transition"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-3d btn-3d-green w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang mở phòng thi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Mở Phòng Thi Cho Nhóm Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
