"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import QuizLogo from "@/components/QuizLogo"
import {
  Sparkles,
  Users,
  ArrowRight,
  KeyRound,
  FileText,
} from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [pinCode, setPinCode] = useState("")

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPin = pinCode.trim()
    if (cleanPin) {
      router.push(`/room/${cleanPin}`)
    } else {
      router.push("/lobby")
    }
  }

  const categories = [
    { name: "Công Nghệ", icon: "💻", color: "bg-blue-100 text-blue-800 border-blue-300" },
    { name: "Khoa Học", icon: "🔬", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    { name: "Lịch Sử", icon: "🏛️", color: "bg-amber-100 text-amber-800 border-amber-300" },
    { name: "Địa Lý", icon: "🌍", color: "bg-green-100 text-green-800 border-green-300" },
    { name: "Giải Trí & Phim", icon: "🎬", color: "bg-purple-100 text-purple-800 border-purple-300" },
    { name: "Thể Thao", icon: "⚽", color: "bg-orange-100 text-orange-800 border-orange-300" },
    { name: "Tiếng Anh", icon: "🇬🇧", color: "bg-pink-100 text-pink-800 border-pink-300" },
    { name: "Đố Vui Mẹo", icon: "💡", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  ]

  return (
    <div className="min-h-screen bg-[#FFFDF4] text-slate-900 flex flex-col justify-between selection:bg-[#6FEEFF] selection:text-black">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex items-center justify-between">
        <QuizLogo size="lg" />

        <div className="flex items-center gap-3">
          <Link
            href="/quiz/create"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-black text-xs font-extrabold text-slate-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00a76d]" />
            Tạo Đề Bằng AI
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00a76d] hover:bg-[#00925f] border-2 border-black text-xs font-extrabold text-white shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
          >
            <Users className="w-3.5 h-3.5" />
            Đăng Nhập
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:py-10 space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black tracking-wide uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a76d] animate-pulse" />
            Nền Tảng Trắc Nghiệm Đố Vui Trực Tuyến
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-tight">
            Chơi &amp; Tạo Bài Trắc Nghiệm <br className="hidden sm:inline" />
            <span className="text-[#00a76d]">Cực Kỳ Thú Vị</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Thử thách kiến thức cùng bạn bè trên mọi thiết bị. Tạo bộ đề thi tự động bằng AI trong vài giây hoặc tham gia ngay bằng mã PIN!
          </p>

          {/* Quick PIN Join Bar (Thanh Nhập PIN Phong Cách Quiz.com) */}
          <div className="max-w-xl mx-auto pt-2">
            <form
              onSubmit={handleQuickJoin}
              className="p-2 sm:p-2.5 rounded-3xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="flex items-center gap-2.5 px-3 py-2 w-full sm:flex-1">
                <KeyRound className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  maxLength={10}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Nhập mã PIN phòng thi (ví dụ: 123456)..."
                  className="w-full bg-transparent border-none outline-none font-black text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 btn-3d btn-3d-green text-sm flex items-center justify-center gap-2 shrink-0"
              >
                <span>Vào Chơi Ngay</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          </div>
        </div>

        {/* Category Carousel Pills */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Khám Phá Theo Chủ Đề
            </h3>
            <Link href="/lobby" className="text-xs font-extrabold text-[#00a76d] hover:underline">
              Xem tất cả phòng &rarr;
            </Link>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => router.push(`/quiz/create?topic=${encodeURIComponent(cat.name)}`)}
                className="px-4 py-2.5 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] active:translate-y-0.5 transition shrink-0 flex items-center gap-2 text-xs font-black text-slate-900 cursor-pointer"
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2 Signature Quiz.com Feature Banners (2 Thẻ Đặc Trưng Của Quiz.com) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner 1: Quiz Editor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0d3b44] border-3 border-black shadow-[6px_6px_0px_#000] text-white flex flex-col justify-between gap-6 relative overflow-hidden group">
            <div className="space-y-3 relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#6FEEFF] text-xs font-black uppercase tracking-wider">
                Trình Soạn Đề Thi
              </span>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
                Tạo Bài Trắc Nghiệm Của Riêng Bạn
              </h2>
              <p className="text-sm text-slate-300 font-medium max-w-sm">
                Tùy biến câu hỏi, thời gian và đáp án. Chia sẻ mã PIN để mọi người cùng chơi miễn phí!
              </p>
            </div>

            <div className="relative z-10 pt-2">
              <Link
                href="/quiz/create"
                className="btn-3d btn-3d-green px-6 py-3.5 text-sm inline-flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Mở Trình Soạn Đề</span>
              </Link>
            </div>

            {/* Decorative background element */}
            <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-[#00a76d]/20 blur-2xl pointer-events-none" />
          </div>

          {/* Banner 2: AI Generator */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0d3b44] border-3 border-black shadow-[6px_6px_0px_#000] text-white flex flex-col justify-between gap-6 relative overflow-hidden group">
            <div className="space-y-3 relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#6FEEFF] text-xs font-black uppercase tracking-wider">
                Trí Tuệ Nhân Tạo A.I.
              </span>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
                Sinh Bộ Câu Hỏi Siêu Tốc Bằng AI
              </h2>
              <p className="text-sm text-slate-300 font-medium max-w-sm">
                Chỉ cần nhập bất kỳ chủ đề hoặc dán văn bản bài học, Gemini AI sẽ tạo ngay đề thi chuẩn 100%.
              </p>
            </div>

            <div className="relative z-10 pt-2">
              <Link
                href="/quiz/create"
                className="btn-3d btn-3d-cyan px-6 py-3.5 text-sm inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sinh Đề Bằng AI</span>
              </Link>
            </div>

            {/* Decorative background element */}
            <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-[#6FEEFF]/20 blur-2xl pointer-events-none" />
          </div>
        </div>

        {/* 3 Value Proposition Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
          <div className="p-6 rounded-3xl bg-white border-2 border-black shadow-[4px_4px_0px_#000] space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00C2CB]/15 border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              ⚡
            </div>
            <h4 className="text-base font-black text-slate-900">Vào Chơi Tức Thì</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Không cần cài đặt, không cần thủ tục rườm rà. Chỉ cần nhập mã PIN là vào ngay phòng thi.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border-2 border-black shadow-[4px_4px_0px_#000] space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7A00]/15 border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              🤖
            </div>
            <h4 className="text-base font-black text-slate-900">AI Soạn Đề Chuẩn Xác</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Tự động tạo 4 phương án lựa chọn kèm lời giải thích chi tiết, chuẩn ngữ pháp tiếng Việt.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border-2 border-black shadow-[4px_4px_0px_#000] space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00C853]/15 border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              🏆
            </div>
            <h4 className="text-base font-black text-slate-900">Bảng Vàng Xếp Hạng</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Tính điểm thời gian thực, chuỗi Combo Streak và vinh danh những người chơi xuất sắc nhất.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t-2 border-[#E5E0D0] bg-[#FAF8EE] p-6 text-center text-xs text-slate-600 font-semibold">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <QuizLogo size="sm" />
          <p>© 2026 Fun Quiz • Thiết kế theo phong cách Quiz.com • Hỗ trợ AI tự động</p>
        </div>
      </footer>
    </div>
  )
}
