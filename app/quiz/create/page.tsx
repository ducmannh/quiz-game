"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createQuizWithAIAction } from "@/app/actions/quiz"
import {
  Sparkles,
  Brain,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
} from "lucide-react"

const POPULAR_TOPICS = [
  "Lập trình Next.js & React",
  "Lịch sử Việt Nam hào hùng",
  "Khám phá Vũ trụ & Thiên văn",
  "Trí tuệ Nhân tạo & Tương lai",
  "Thế giới Động vật kỳ thú",
  "Điện ảnh & Phim Hoạt Hình",
]

export default function CreateQuizPage() {
  const router = useRouter()

  const [mode, setMode] = useState<"topic" | "document">("topic")
  const [topic, setTopic] = useState("")
  const [documentText, setDocumentText] = useState("")
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM")
  const [questionCount, setQuestionCount] = useState<number>(5)

  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [createdResult, setCreatedResult] = useState<{
    quizId: string
    roomCode: string
    title: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const finalTopic =
      mode === "topic"
        ? topic.trim()
        : topic.trim() || "Trắc nghiệm từ tài liệu đính kèm"

    if (!finalTopic) {
      setError("Vui lòng nhập chủ đề bạn muốn AI tạo câu hỏi!")
      return
    }

    if (mode === "document" && (!documentText || documentText.trim().length < 50)) {
      setError("Đoạn văn bản/tài liệu cần có ít nhất 50 ký tự để AI có thể phân tích câu hỏi!")
      return
    }

    setIsLoading(true)
    setLoadingStep("🤖 AI đang phân tích ngữ cảnh và kiến thức...")

    const timer1 = setTimeout(() => {
      setLoadingStep("⚡ Đang tạo các phương án A-B-C-D và lời giải thích...")
    }, 1500)

    const timer2 = setTimeout(() => {
      setLoadingStep("🎮 Đang khởi tạo phòng thi trắc nghiệm trên cơ sở dữ liệu...")
    }, 3000)

    try {
      const res = await createQuizWithAIAction({
        topic: finalTopic,
        difficulty,
        questionCount,
        documentText: mode === "document" ? documentText : undefined,
      })

      clearTimeout(timer1)
      clearTimeout(timer2)

      if (!res.success || !res.quizId) {
        setError(res.error || "Không thể tạo bộ câu hỏi. Vui lòng thử lại!")
        setIsLoading(false)
        return
      }

      setCreatedResult({
        quizId: res.quizId,
        roomCode: res.roomCode || "",
        title: res.quiz?.title || finalTopic,
      })
    } catch {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setError("Đã xảy ra lỗi không xác định khi kết nối với AI.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#00a76d]" />
            Trình Sinh Đề Bằng Trí Tuệ Nhân Tạo
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950">
            Tạo Bộ Đề Thi Bằng AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            Nhập bất kỳ chủ đề hoặc dán bài học của bạn, Gemini AI sẽ tự động sinh câu hỏi trắc nghiệm kèm 4 đáp án và lời giải trong tích tắc.
          </p>
        </div>

        {/* Modal Thành Công */}
        {createdResult && (
          <div className="p-8 rounded-3xl bg-white border-3 border-black shadow-[8px_8px_0px_#000] text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#00a76d]/15 border-2 border-black text-[#00a76d] flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-[#00a76d] tracking-wider">Thành công rực rỡ</span>
              <h2 className="text-2xl font-black text-slate-950">Đã Tạo Xong Bộ Câu Hỏi!</h2>
              <p className="text-sm font-bold text-slate-700">{createdResult.title}</p>
            </div>

            <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#0d3b44] border-2 border-black text-white font-mono text-sm shadow-[3px_3px_0px_#000]">
              <span className="text-slate-300">Mã PIN phòng thi:</span>
              <strong className="text-xl text-[#6FEEFF] font-black">{createdResult.roomCode}</strong>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => router.push(`/room/${createdResult.roomCode}`)}
                className="btn-3d btn-3d-green px-6 py-3.5 text-xs flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Vào Làm Bài Thi Ngay</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                onClick={() => {
                  setCreatedResult(null)
                  setTopic("")
                  setDocumentText("")
                }}
                className="btn-3d btn-3d-white px-5 py-3.5 text-xs flex items-center justify-center"
              >
                Tạo Thêm Đề Khác
              </button>
            </div>
          </div>
        )}

        {/* Form Container */}
        {!createdResult && (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-3xl bg-white border-3 border-black shadow-[8px_8px_0px_#000] space-y-6"
          >
            {/* Mode Selector Tabs */}
            <div className="flex p-1.5 rounded-2xl bg-[#FFFDF4] border-2 border-black">
              <button
                type="button"
                onClick={() => setMode("topic")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                  mode === "topic"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-black"
                }`}
              >
                <Brain className="w-4 h-4" />
                Theo Chủ Đề Tự Do
              </button>
              <button
                type="button"
                onClick={() => setMode("document")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                  mode === "document"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-black"
                }`}
              >
                <FileText className="w-4 h-4" />
                Từ Tài Liệu / Bài Viết
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Topic Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                {mode === "topic" ? "Chủ đề muốn thử thách" : "Tiêu đề tài liệu (Tùy chọn)"}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  mode === "topic"
                    ? "Ví dụ: Lịch sử triều đại nhà Trần, Lập trình React, Địa lý thế giới..."
                    : "Nhập tên hoặc chủ đề của bài học bên dưới..."
                }
                disabled={isLoading}
                className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-black text-slate-900 font-bold placeholder:text-slate-400 text-sm shadow-[2px_2px_0px_#000] outline-none"
              />

              {/* Topic Suggestions */}
              {mode === "topic" && (
                <div className="mt-3">
                  <p className="text-[11px] font-black uppercase text-slate-500 mb-2">Gợi ý chủ đề nhanh:</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TOPICS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTopic(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#FFFDF4] hover:bg-slate-100 border-2 border-black text-slate-900 text-xs font-extrabold shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Document Textarea */}
            {mode === "document" && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Dán nội dung văn bản / tài liệu ôn tập
                </label>
                <textarea
                  rows={5}
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Dán đoạn văn bản, tóm tắt bài giảng hoặc ghi chú ôn thi vào đây để AI tự sinh bộ câu hỏi trắc nghiệm tương ứng..."
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-black text-slate-900 font-medium placeholder:text-slate-400 text-sm shadow-[2px_2px_0px_#000] outline-none resize-y"
                />
              </div>
            )}

            {/* Grid 2 Cột: Độ Khó & Số Lượng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Độ khó */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00a76d]" />
                  Mức độ khó
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "EASY", label: "Dễ" },
                      { key: "MEDIUM", label: "Vừa" },
                      { key: "HARD", label: "Khó" },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setDifficulty(lvl.key)}
                      className={`py-2.5 px-3 rounded-2xl border-2 border-black text-xs font-black transition cursor-pointer ${
                        difficulty === lvl.key
                          ? "bg-[#00a76d] text-white shadow-[2px_2px_0px_#000]"
                          : "bg-white text-slate-800 shadow-[2px_2px_0px_#000] hover:bg-slate-50"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Số lượng */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00C2CB]" />
                  Số lượng câu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`py-2.5 px-3 rounded-2xl border-2 border-black text-xs font-black transition cursor-pointer ${
                        questionCount === count
                          ? "bg-[#6FEEFF] text-slate-950 shadow-[2px_2px_0px_#000]"
                          : "bg-white text-slate-800 shadow-[2px_2px_0px_#000] hover:bg-slate-50"
                      }`}
                    >
                      {count} Câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-3d btn-3d-cyan py-4 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingStep || "Đang xử lý..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Sinh Đề Bằng AI & Mở Phòng Thi</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
