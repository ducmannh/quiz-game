"use client"

import { useState } from "react"
import { Clock, HelpCircle, X, Check, Filter } from "lucide-react"

export interface ReviewQuestionItem {
  questionId: string
  order: number
  text: string
  explanation?: string | null
  options: { id: string; text: string; isCorrect: boolean }[]
  selectedOptionId: string | null
  isCorrect: boolean
  timeTaken: number
}

interface QuizReviewModalProps {
  isOpen: boolean
  onClose: () => void
  quizTitle: string
  questions: ReviewQuestionItem[]
}

const OPTION_LETTERS = ["A", "B", "C", "D"]

export default function QuizReviewModal({
  isOpen,
  onClose,
  quizTitle,
  questions,
}: QuizReviewModalProps) {
  const [filter, setFilter] = useState<"ALL" | "CORRECT" | "WRONG">("ALL")

  if (!isOpen) return null

  const filteredQuestions = questions.filter((q) => {
    if (filter === "CORRECT") return q.isCorrect
    if (filter === "WRONG") return !q.isCorrect
    return true
  })

  const totalCorrect = questions.filter((q) => q.isCorrect).length
  const accuracy = Math.round((totalCorrect / questions.length) * 100) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white border-3 border-black rounded-3xl shadow-[10px_10px_0px_#000] flex flex-col overflow-hidden relative">
        {/* Header Modal Quiz.com Style */}
        <div className="p-4 sm:p-6 border-b-2 border-black flex items-center justify-between gap-3 bg-[#FFFDF4]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0d3b44] text-[#6FEEFF] text-[10px] font-black uppercase tracking-wider mb-1">
              Chi Tiết Bài Làm & Đáp Án
            </div>
            <h3 className="text-base sm:text-lg font-black font-heading text-slate-900 line-clamp-1">
              {quizTitle}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="font-bold text-[#00a76d]">
                ✓ Đúng {totalCorrect}/{questions.length} câu ({accuracy}%)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] hover:bg-slate-100 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] text-slate-900 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#FFFDF4] border-b-2 border-black flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-bold text-slate-700 mr-1">Bộ lọc:</span>
          {(
            [
              { key: "ALL", label: `Tất cả (${questions.length})` },
              { key: "CORRECT", label: `Đúng (${totalCorrect})` },
              { key: "WRONG", label: `Sai (${questions.length - totalCorrect})` },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                filter === item.key
                  ? "bg-black text-white shadow-[2px_2px_0px_#00a76d]"
                  : "bg-white text-slate-700 border-2 border-slate-300 hover:border-black"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* List of Questions Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
          {filteredQuestions.map((q) => {
            return (
              <div
                key={q.questionId}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition ${
                  q.isCorrect
                    ? "bg-emerald-50/50 border-[#00a76d] shadow-[3px_3px_0px_#00a76d]"
                    : "bg-red-50/50 border-[#FF6B4A] shadow-[3px_3px_0px_#FF6B4A]"
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border border-black ${
                        q.isCorrect
                          ? "bg-[#00a76d] text-white"
                          : "bg-[#FF6B4A] text-white"
                      }`}
                    >
                      {q.isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="text-xs font-black text-slate-800 font-mono">
                      Câu {q.order}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-300">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{q.timeTaken}s</span>
                  </div>
                </div>

                {/* Question Text */}
                <h4 className="text-sm sm:text-base font-black text-slate-900 mb-3">
                  {q.text}
                </h4>

                {/* Options 4 Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, oIdx) => {
                    const letter = OPTION_LETTERS[oIdx] || ""
                    const isSelectedByPlayer = q.selectedOptionId === opt.id
                    const isTheCorrectOne = opt.isCorrect

                    let optionBorder = "border-slate-200 bg-white text-slate-700"
                    if (isTheCorrectOne) {
                      optionBorder = "border-2 border-[#00a76d] bg-emerald-100 text-emerald-950 font-black shadow-[2px_2px_0px_#00a76d]"
                    } else if (isSelectedByPlayer && !isTheCorrectOne) {
                      optionBorder = "border-2 border-[#FF6B4A] bg-red-100 text-red-950 font-black shadow-[2px_2px_0px_#FF6B4A]"
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${optionBorder}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-white border border-black flex items-center justify-center font-mono font-black text-[10px]">
                            {letter}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {isTheCorrectOne && (
                          <span className="text-[10px] text-[#00a76d] font-black shrink-0 flex items-center gap-0.5">
                            <Check className="w-3 h-3 stroke-[3]" /> Đáp án đúng
                          </span>
                        )}
                        {isSelectedByPlayer && !isTheCorrectOne && (
                          <span className="text-[10px] text-[#FF6B4A] font-black shrink-0">
                            Bạn chọn sai
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3.5 rounded-xl bg-[#FFFDF4] border-2 border-black text-xs text-slate-800 flex items-start gap-2 shadow-[2px_2px_0px_#000]">
                    <HelpCircle className="w-4 h-4 text-[#00a76d] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block mb-0.5 font-black">
                        Giải thích từ AI:
                      </strong>
                      <span className="font-medium text-slate-700">{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t-2 border-black bg-[#FFFDF4] flex justify-end">
          <button
            onClick={onClose}
            className="btn-3d btn-3d-black px-6 py-2.5 rounded-2xl text-white font-black text-xs uppercase tracking-wide"
          >
            Đóng Xem Lại
          </button>
        </div>
      </div>
    </div>
  )
}
