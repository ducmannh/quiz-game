"use client"

import { useState } from "react"
import { createGroupAction } from "@/app/actions/group"
import { LEADER_PASSCODE } from "@/lib/group"
import {
  Users,
  X,
  Crown,
  KeyRound,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react"

interface CreateGroupModalProps {
  userId: string
  onClose: () => void
  onSuccess: (groupId: string) => void
}

export default function CreateGroupModal({ userId, onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLeader, setIsLeader] = useState(false)
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanName = name.trim()
    if (!cleanName) {
      setError("Vui lòng nhập tên nhóm (Ví dụ: Nhóm A, Nhóm B, Đội 1...)!")
      return
    }

    // Kiểm tra mã trưởng nhóm: Nếu tích làm trưởng nhóm, bắt buộc mã phải là 230400
    if (isLeader) {
      if (passcode.trim() !== LEADER_PASSCODE) {
        setError(`Mã xác thực Trưởng Nhóm không chính xác! Vui lòng nhập đúng mã quy định (${LEADER_PASSCODE}).`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const res = await createGroupAction({
        name: cleanName,
        description: description.trim() || undefined,
        isLeader,
        leaderPasscode: isLeader ? passcode.trim() : undefined,
        userId,
      })

      if (!res.success || !res.groupId) {
        setError(res.error || "Không thể tạo nhóm. Vui lòng thử lại!")
        setIsSubmitting(false)
        return
      }

      onSuccess(res.groupId)
    } catch {
      setError("Đã xảy ra lỗi máy chủ trong quá trình tạo nhóm.")
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
              <Users className="w-3.5 h-3.5" />
              Tạo Nhóm Thi Đấu Mới
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Khởi Tạo Nhóm (Ví dụ: Nhóm A, B, C...)
            </h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tên nhóm */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
              Tên nhóm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="Ví dụ: Nhóm A, Nhóm B, Đội Công Nghệ..."
              maxLength={50}
              required
              className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-black text-slate-900 placeholder-slate-400 focus:outline-none focus:shadow-[4px_4px_0px_#000] text-sm font-bold transition"
            />
          </div>

          {/* Mô tả nhóm */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
              Mô tả ngắn về nhóm (Tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Nhóm ôn thi kiến thức Lập trình & Khoa học máy tính..."
              maxLength={200}
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-black text-slate-900 placeholder-slate-400 focus:outline-none focus:shadow-[4px_4px_0px_#000] text-xs font-bold transition resize-none"
            />
          </div>

          {/* Option: Checkbox Tôi là Trưởng Nhóm */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-black shadow-[3px_3px_0px_#000] space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isLeader}
                onChange={(e) => {
                  setIsLeader(e.target.checked)
                  setError(null)
                }}
                className="w-5 h-5 rounded-lg border-2 border-black text-[#00a76d] focus:ring-0 mt-0.5 cursor-pointer accent-[#00a76d]"
              />
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Đăng ký tôi là Trưởng Nhóm</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Trưởng nhóm có quyền thêm thành viên bằng username và tạo phòng thi đa chủ đề cho nhóm.
                </p>
              </div>
            </label>

            {/* Ô nhập mã xác thực khi tích chọn Trưởng nhóm */}
            {isLeader && (
              <div className="pt-2 border-t border-amber-200 space-y-1.5 animate-in fade-in-50 duration-150">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Mã xác thực Trưởng Nhóm (Bắt buộc là 230400)
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value)
                    setError(null)
                  }}
                  placeholder="Nhập mã bảo mật (230400)..."
                  maxLength={20}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-black text-slate-900 placeholder-slate-400 font-mono text-sm font-bold focus:outline-none focus:shadow-[3px_3px_0px_#000]"
                />
                <span className="text-[10px] text-amber-700 font-bold block">
                  💡 Nhập đúng mã xác thực cố định <code className="bg-amber-100 px-1 py-0.5 rounded border border-amber-300 font-bold">230400</code> để hoàn tất quyền quản trị nhóm.
                </span>
              </div>
            )}
          </div>

          {/* Footer Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-3d btn-3d-green w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo nhóm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Xác Nhận &amp; Tạo Nhóm</span>
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

