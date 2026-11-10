"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw, Home, Tv } from "lucide-react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for diagnostics
    console.error("Gameshow Error Boundary caught an exception:", error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full text-center space-y-6 bg-slate-900/90 border border-red-500/30 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Studio Mascot & Icon */}
        <div className="relative inline-block">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-br from-red-500/20 via-orange-600/20 to-amber-500/20 border-2 border-red-500/40 flex items-center justify-center shadow-inner">
            <span className="text-5xl sm:text-6xl select-none animate-pulse">
              🚨
            </span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg border-2 border-slate-900">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Error Code & Message */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase bg-red-500/10 border border-red-500/30 text-red-400 rounded-full">
            Trục Trặc Tín Hiệu Sân Khấu
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sự Cố Kỹ Thuật Trường Quay!
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Hệ thống truyền hình trực tiếp gặp gián đoạn tạm thời. Đạo diễn sân khấu đang nhanh chóng khôi phục tín hiệu!
          </p>

          {error.message && (
            <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-left">
              <p className="text-xs font-mono text-red-400 break-all line-clamp-3">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  Mã lỗi (Digest): {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Thử Khôi Phục Lại
          </button>
          <Link
            href="/lobby"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
          >
            <Tv className="w-4 h-4" />
            Về Sảnh Đấu Trường
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-semibold text-sm border border-slate-800 transition-all"
          >
            <Home className="w-4 h-4" />
            Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  )
}

