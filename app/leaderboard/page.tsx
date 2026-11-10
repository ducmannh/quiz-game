"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getLeaderboardAction, LeaderboardEntry } from "@/app/actions/leaderboard"
import { ACHIEVEMENTS_LIST, getUnlockedAchievements } from "@/lib/achievements"
import {
  Trophy,
  Flame,
  Zap,
  Award,
  Crown,
  RefreshCw,
  Lock,
  CheckCircle2,
} from "lucide-react"

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"RANKING" | "BADGES">("RANKING")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [unlockedBadges] = useState<string[]>(() => getUnlockedAchievements())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    getLeaderboardAction().then((res) => {
      if (!ignore) {
        if (res.success && res.data) {
          setLeaderboard(res.data)
        }
        setIsLoading(false)
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  const top1 = leaderboard[0]
  const top2 = leaderboard[1]
  const top3 = leaderboard[2]
  const restList = leaderboard.slice(3)

  return (
    <div className="min-h-screen bg-[#FFFDF4] text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0d3b44] text-[#6FEEFF] text-xs font-black uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-[#FFB800]" />
            Bảng Vàng Đấu Trường
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-slate-900">
            Bảng Xếp Hạng Toàn Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Vinh danh những cao thủ có điểm số và chuỗi trả lời đúng cao nhất
          </p>

          {/* Tab Switcher Quiz.com Style */}
          <div className="inline-flex p-1.5 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_#000] mt-6 gap-2">
            <button
              onClick={() => setActiveTab("RANKING")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "RANKING"
                  ? "bg-black text-white shadow-[2px_2px_0px_#00a76d]"
                  : "text-slate-600 hover:text-black hover:bg-slate-100"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-[#FFB800]" />
              Bảng Xếp Hạng Điểm
            </button>
            <button
              onClick={() => setActiveTab("BADGES")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "BADGES"
                  ? "bg-black text-white shadow-[2px_2px_0px_#00a76d]"
                  : "text-slate-600 hover:text-black hover:bg-slate-100"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#6FEEFF]" />
              Huy Hiệu Của Bạn ({unlockedBadges.length}/{ACHIEVEMENTS_LIST.length})
            </button>
          </div>
        </div>

        {/* TAB 1: BẢNG XẾP HẠNG */}
        {activeTab === "RANKING" && (
          <>
            {isLoading ? (
              <div className="py-20 text-center text-slate-600 text-sm flex items-center justify-center gap-2 font-bold">
                <RefreshCw className="w-4 h-4 animate-spin text-[#00a76d]" />
                Đang tải bảng xếp hạng...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-10 sm:p-12 text-center rounded-3xl bg-white border-3 border-black shadow-[8px_8px_0px_#000] my-8">
                <div className="text-5xl mb-3">🏆</div>
                <h4 className="text-lg font-black text-slate-900 mb-1">
                  Chưa có lượt thi đấu nào trên bảng vàng!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-sm mx-auto">
                  Hãy là người đầu tiên tham gia thi đấu hoặc tạo bộ câu hỏi bằng AI để ghi danh.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/lobby"
                    className="btn-3d btn-3d-green px-6 py-3 rounded-2xl text-white font-black text-xs uppercase"
                  >
                    Vào Sảnh Thi Đấu
                  </Link>
                  <Link
                    href="/quiz/create"
                    className="btn-3d btn-3d-cyan px-6 py-3 rounded-2xl text-slate-900 font-black text-xs uppercase"
                  >
                    Tạo Đề Thi Bằng AI
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Top 3 Bục Vinh Danh Quiz.com Style */}
                <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10 pt-6 px-2">
                  {/* Hạng 2 (Silver) */}
                  {top2 && (
                    <div className="flex flex-col items-center flex-1 max-w-40">
                      <div className="relative mb-2">
                        <div className="w-16 h-16 rounded-2xl bg-white border-3 border-black flex items-center justify-center text-3xl shadow-[4px_4px_0px_#000]">
                          {top2.avatar}
                        </div>
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-200 border-2 border-black text-slate-900 font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_#000]">
                          2
                        </div>
                      </div>
                      <div className="text-xs font-black text-slate-900 truncate max-w-full text-center">
                        {top2.nickname}
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-600">
                        {top2.score.toLocaleString()}đ
                      </div>
                      <div className="w-full h-24 rounded-t-2xl bg-slate-100 border-t-3 border-x-3 border-black mt-2 flex flex-col items-center justify-center shadow-[4px_0px_0px_#000]">
                        <span className="text-2xl">🥈</span>
                        <span className="text-[10px] font-black uppercase text-slate-600">Á Quân</span>
                      </div>
                    </div>
                  )}

                  {/* Hạng 1 (Gold - Quán Quân) */}
                  {top1 && (
                    <div className="flex flex-col items-center flex-1 max-w-47.5 -mt-6">
                      <div className="relative mb-2">
                        <div className="w-20 h-20 rounded-3xl bg-[#FFDE6A] border-3 border-black flex items-center justify-center text-4xl shadow-[6px_6px_0px_#000]">
                          {top1.avatar}
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black text-[#FFB800] border-2 border-black font-black text-[10px] uppercase flex items-center gap-1 shadow-[2px_2px_0px_#000]">
                          <Crown className="w-3 h-3 text-[#FFB800] fill-[#FFB800]" />
                          Quán Quân
                        </div>
                      </div>
                      <div className="text-sm font-black text-slate-900 truncate max-w-full text-center">
                        {top1.nickname}
                      </div>
                      <div className="text-sm font-mono font-black text-[#00a76d] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-[#FFB800] fill-[#FFB800]" />
                        {top1.score.toLocaleString()}đ
                      </div>
                      <div className="w-full h-32 rounded-t-3xl bg-[#FFDE6A] border-t-3 border-x-3 border-black mt-2 flex flex-col items-center justify-center shadow-[6px_0px_0px_#000]">
                        <span className="text-3xl">🥇</span>
                        <span className="text-xs font-black uppercase text-slate-900">Vô Địch</span>
                      </div>
                    </div>
                  )}

                  {/* Hạng 3 (Bronze) */}
                  {top3 && (
                    <div className="flex flex-col items-center flex-1 max-w-40">
                      <div className="relative mb-2">
                        <div className="w-16 h-16 rounded-2xl bg-[#FFE0B2] border-3 border-black flex items-center justify-center text-3xl shadow-[4px_4px_0px_#000]">
                          {top3.avatar}
                        </div>
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#FFB800] border-2 border-black text-slate-900 font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_#000]">
                          3
                        </div>
                      </div>
                      <div className="text-xs font-black text-slate-900 truncate max-w-full text-center">
                        {top3.nickname}
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-600">
                        {top3.score.toLocaleString()}đ
                      </div>
                      <div className="w-full h-20 rounded-t-2xl bg-[#FFE0B2] border-t-3 border-x-3 border-black mt-2 flex flex-col items-center justify-center shadow-[4px_0px_0px_#000]">
                        <span className="text-2xl">🥉</span>
                        <span className="text-[10px] font-black uppercase text-slate-700">Hạng Ba</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bảng Danh Sách Thứ Hạng 4 -> ... */}
                <div className="p-4 sm:p-6 rounded-3xl bg-white border-3 border-black shadow-[8px_8px_0px_#000]">
                  <div className="flex items-center justify-between pb-3 px-3 border-b-2 border-black text-xs font-black text-slate-700 uppercase tracking-wider">
                    <span>Hạng & Thí Sinh</span>
                    <div className="flex items-center gap-6">
                      <span className="hidden sm:inline">Chuỗi Đúng</span>
                      <span>Tổng Điểm</span>
                    </div>
                  </div>

                  <div className="divide-y-2 divide-slate-100">
                    {restList.map((entry) => (
                      <div
                        key={entry.id}
                        className="py-3 px-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-300 font-mono font-black text-xs text-slate-700 flex items-center justify-center">
                            #{entry.rank}
                          </span>
                          <div className="w-10 h-10 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_#000]">
                            {entry.avatar}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                              {entry.nickname}
                            </div>
                            <div className="text-[11px] font-bold text-slate-500 line-clamp-1">
                              {entry.quizTitle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="hidden sm:flex items-center gap-1 text-xs text-[#FF7A00] font-black">
                            <Flame className="w-3.5 h-3.5 fill-[#FF7A00]" />
                            {entry.highestStreak}
                          </div>
                          <div className="font-mono text-sm font-black text-[#00a76d]">
                            {entry.score.toLocaleString()}đ
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* TAB 2: BỘ SƯU TẬP HUY HIỆU */}
        {activeTab === "BADGES" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACHIEVEMENTS_LIST.map((ach) => {
              const isUnlocked = unlockedBadges.includes(ach.id)
              return (
                <div
                  key={ach.id}
                  className={`p-5 rounded-3xl transition-all flex items-start gap-4 ${
                    isUnlocked
                      ? "bg-white border-3 border-black shadow-[6px_6px_0px_#000]"
                      : "bg-slate-100/70 border-2 border-dashed border-slate-300 opacity-60"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                      isUnlocked
                        ? "bg-white border-2 border-black shadow-[3px_3px_0px_#000]"
                        : "bg-slate-200 text-slate-400 grayscale"
                    }`}
                  >
                    {ach.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900">{ach.title}</h4>
                      {isUnlocked ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#00a76d] border border-emerald-300 text-[10px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#00a76d]" /> Đã Đạt
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Chưa Đạt
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
