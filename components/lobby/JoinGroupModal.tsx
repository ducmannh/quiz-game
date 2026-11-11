"use client"

import { useState } from "react"
import { joinGroupByCodeAction } from "@/app/actions/group"
import {
  KeyRound,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react"

interface JoinGroupModalProps {
  userId: string
  onClose: () => void
  onSuccess: (groupId: string) => void
}

export default function JoinGroupModal({ userId, onClose, onSuccess }: JoinGroupModalProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      setError("Vui lòng nhập mã mời của nhóm!")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await joinGroupByCodeAction({
        code: cleanCode,
        userId,
      })

      if (!res.success || !res.groupId) {
        setError(res.error || "Mã nhóm không hợp lệ hoặc nhóm không tồn tại!")
        setIsSubmitting(false)
        return
      }

      onSuccess(res.groupId)
    } catch {
      setError("Đã xảy ra lỗi kết nối máy chủ khi tham gia nhóm.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border-3 border-black shadow-[10px_10px_0px_#000] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-[#0d3b44] text-white flex items-center justify-between border-b-3 border-black">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#6FEEFF] text-xs font-black uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" />
              Tham Gia Nhóm Bằng Mã
            </div>
            <h3 className="text-xl font-black text-white">Nhập Mã Mời Nhóm</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Nhập mã nhóm do Trưởng nhóm cung cấp (ví dụ: <code className="bg-slate-100 font-mono px-1 py-0.5 rounded font-bold">GR-8891</code>) để cùng thi đấu và cạnh tranh thứ hạng.
          </p>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
              Mã mời nhóm
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError(null)
              }}
              placeholder="Ví dụ: GR-9382"
              maxLength={12}
              required
              className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-black text-slate-900 placeholder-slate-400 font-mono text-base font-black uppercase focus:outline-none focus:shadow-[4px_4px_0px_#000] transition tracking-wider"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-3d btn-3d-cyan w-full py-3.5 px-4 rounded-2xl text-slate-950 font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tham gia...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gia Nhập Nhóm Ngay</span>
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

