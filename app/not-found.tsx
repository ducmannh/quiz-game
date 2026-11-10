import Link from "next/link"
import { Sparkles, Home, Tv, ShieldAlert } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full text-center space-y-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Studio Mascot & Icon */}
        <div className="relative inline-block">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 via-purple-600/20 to-pink-500/20 border-2 border-amber-500/40 flex items-center justify-center shadow-inner">
            <span className="text-5xl sm:text-6xl select-none animate-bounce">
              🎭
            </span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg border-2 border-slate-900">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Error Code & Message */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
            Lỗi 404 • Hậu Trường Kỹ Thuật
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Lạc Khỏi Trường Quay!
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Khu vực bạn vừa bước vào là phòng đạo cụ cánh gà. Trường quay chính và 10 bục thí sinh đang sáng đèn ở sảnh thi đấu!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/lobby"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Tv className="w-4 h-4" />
            Vào Sảnh Đấu Trường
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
          >
            <Home className="w-4 h-4" />
            Trang Chủ
          </Link>
          <Link
            href="/quiz/create"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold text-sm border border-purple-500/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Tạo Đề Thi AI
          </Link>
        </div>
      </div>
    </div>
  )
}

