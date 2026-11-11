"use client"

import { useState, useEffect } from "react"
import { getRoomLeaderboardAndStatsAction, RoomParticipantRankItem } from "@/app/actions/group"
import {
  Trophy,
  X,
  Flame,
  Clock,
  CheckCircle2,
  Users,
  RotateCcw,
  Sparkles,
  Loader2,
  Medal,
} from "lucide-react"

interface RoomStatsData {
  roomId: string
  roomCode: string
  title: string
  topic: string
  quizTitle: string
  totalQuestions: number
  totalAttempts: number
  totalParticipants: number
  rankings: RoomParticipantRankItem[]
}

interface RoomStatsModalProps {
  roomId: string
  onClose: () => void
  onJoinRoom: (code: string) => void
}

export default function RoomStatsModal({ roomId, onClose, onJoinRoom }: RoomStatsModalProps) {
  const [data, setData] = useState<RoomStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    Promise.resolve().then(() => {
      setIsLoading(true)
      setError(null)
    })

    getRoomLeaderboardAndStatsAction(roomId).then((res) => {
      if (ignore) return
      if (res.success && res.data) {
        setData(res.data as RoomStatsData)
      } else {
        setError(res.error || "Không thể tải dữ liệu xếp hạng phòng này.")
      }
      setIsLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [roomId])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border-3 border-black shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0d3b44] text-white flex items-center justify-between border-b-3 border-black">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#6FEEFF] text-xs font-black uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#FFB800]" />
              Thống Kê &amp; Bảng Vàng Phòng Thi
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white line-clamp-1">
              {data?.title || "Đang tải dữ liệu..."}
            </h3>
            {data && (
              <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                <span className="px-2 py-0.5 rounded-lg bg-[#00a76d] text-white font-mono">
                  Mã PIN: {data.roomCode}
                </span>
                <span>•</span>
                <span>Chủ đề: {data.topic}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#00a76d]" />
              <span className="text-sm font-bold">Đang tổng hợp số lượt thi và bảng xếp hạng...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold text-center">
              ⚠️ {error}
            </div>
          ) : data ? (
            <>
              {/* Thống Kê Tổng Quan 3 Ô */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FFFDF4] border-2 border-black shadow-[3px_3px_0px_#000] text-center">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-[#00a76d]" />
                    Lượt Thi
                  </div>
                  <div className="text-2xl font-black text-slate-950 mt-1">
                    {data.totalAttempts}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF4] border-2 border-black shadow-[3px_3px_0px_#000] text-center">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5 text-cyan-600" />
                    Thí Sinh
                  </div>
                  <div className="text-2xl font-black text-slate-950 mt-1">
                    {data.totalParticipants}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF4] border-2 border-black shadow-[3px_3px_0px_#000] text-center">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Điểm Kỷ Lục
                  </div>
                  <div className="text-2xl font-black text-[#00a76d] mt-1">
                    {data.rankings[0]?.bestScore || 0}
                  </div>
                </div>
              </div>

              {/* Bảng Xếp Hạng Chi Tiết */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Medal className="w-4 h-4 text-amber-500" />
                    Bảng Xếp Hạng Thành Tích
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    Sắp xếp theo Điểm cao nhất
                  </span>
                </div>

                {data.rankings.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 text-center text-slate-500 text-xs font-bold space-y-2">
                    <div className="text-3xl">🎯</div>
                    <p>Phòng này chưa có thí sinh nào hoàn thành bài thi!</p>
                    <p className="text-slate-400">Hãy là người đầu tiên vào thi và ghi tên lên bảng vàng.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.rankings.map((item) => {
                      const isTop1 = item.rank === 1
                      const isTop2 = item.rank === 2
                      const isTop3 = item.rank === 3

                      return (
                        <div
                          key={item.userId}
                          className={`p-3 sm:p-4 rounded-2xl border-2 border-black flex items-center justify-between gap-3 transition ${
                            isTop1
                              ? "bg-amber-50 shadow-[4px_4px_0px_#000]"
                              : isTop2
                              ? "bg-slate-100 shadow-[3px_3px_0px_#000]"
                              : isTop3
                              ? "bg-orange-50 shadow-[3px_3px_0px_#000]"
                              : "bg-white shadow-[2px_2px_0px_#000]"
                          }`}
                        >
                          {/* Rank Icon / Number */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center font-black text-xs shrink-0 ${
                                isTop1
                                  ? "bg-[#FFB800] text-black shadow-[2px_2px_0px_#000]"
                                  : isTop2
                                  ? "bg-slate-300 text-black shadow-[2px_2px_0px_#000]"
                                  : isTop3
                                  ? "bg-amber-600 text-white shadow-[2px_2px_0px_#000]"
                                  : "bg-white text-slate-700"
                              }`}
                            >
                              {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${item.rank}`}
                            </div>

                            {/* User Avatar Initials & Name */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#00a76d] border border-black text-white font-black text-xs flex items-center justify-center shrink-0">
                                {item.username ? item.username.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-2">
                                  <span>{item.name || item.username}</span>
                                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono font-bold">
                                    Đã thi {item.attemptsCount} lần
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-500 font-mono">
                                  @{item.username}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stats on the right */}
                          <div className="text-right shrink-0 flex items-center gap-4">
                            <div className="hidden sm:block text-right">
                              <div className="text-xs font-black text-orange-600 flex items-center justify-end gap-1">
                                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                                Chuỗi {item.highestStreak}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {item.minTimeSpent}s
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-base sm:text-lg font-black text-[#00a76d]">
                                {item.bestScore} <span className="text-xs text-slate-600">điểm</span>
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#00a76d]" />
                                {item.bestCorrectCount}/{data.totalQuestions} câu
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t-2 border-black flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-white border-2 border-black text-xs font-black text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Đóng
          </button>
          {data && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onJoinRoom(data.roomCode)
              }}
              className="btn-3d btn-3d-green px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Vào Thi Để Thách Đấu Kỷ Lục</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
