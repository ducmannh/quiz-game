"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getRoomsListAction } from "@/app/actions/room"
import { getStoredPlayer, getOrCreateDefaultPlayer, PlayerProfile } from "@/lib/player"
import {
  Users,
  KeyRound,
  PlusCircle,
  Play,
  RefreshCw,
  Crown,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
} from "lucide-react"

interface RoomItem {
  id: string
  code: string
  title: string
  status: string
  maxPodiums: number
  quiz: {
    title: string
    topic: string
    difficulty: string
    timePerQuestion: number
    _count: {
      questions: number
    }
  }
  participants: {
    id: string
    nickname: string
    avatar: string
    role: string
  }[]
}

export default function LobbyPage() {
  const router = useRouter()
  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [pinCode, setPinCode] = useState("")
  const [pinError, setPinError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.resolve().then(() => {
      setPlayer(getStoredPlayer() || getOrCreateDefaultPlayer())
    })
  }, [])

  const fetchRooms = () => {
    setIsLoading(true)
    getRoomsListAction().then((res) => {
      if (res.success && res.data) {
        setRooms(res.data as unknown as RoomItem[])
      }
      setIsLoading(false)
    })
  }

  useEffect(() => {
    let ignore = false
    getRoomsListAction().then((res) => {
      if (!ignore) {
        if (res.success && res.data) {
          setRooms(res.data as unknown as RoomItem[])
        }
        setIsLoading(false)
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault()
    setPinError(null)
    const cleanPin = pinCode.trim()

    if (!cleanPin) {
      setPinError("Vui lòng nhập mã PIN phòng!")
      return
    }

    router.push(`/room/${cleanPin}`)
  }

  return (
    <div className="min-h-screen bg-[#FFFDF4] text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Profile Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/login"
            className="flex items-center gap-3.5 hover:opacity-90 transition group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#00C2CB]/20 border-2 border-black flex items-center justify-center text-3xl shadow-[2px_2px_0px_#000]">
              {player?.avatar || "🦁"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 group-hover:text-[#00a76d] transition">
                  {player?.nickname || "Thí Sinh"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold">
                  Đổi tên
                </span>
              </div>
              <div className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                {player?.title || "Thành Viên Sẵn Sàng"}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/quiz/create"
              className="flex-1 sm:flex-none btn-3d btn-3d-green px-5 py-3 text-xs flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo Phòng AI Mới</span>
            </Link>
            <button
              onClick={fetchRooms}
              className="p-3 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 hover:bg-slate-50 text-slate-900 transition cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Join by PIN Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d3b44] border-3 border-black shadow-[6px_6px_0px_#000] text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#6FEEFF] text-xs font-black uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" />
              Vào Nhanh Bằng Mã PIN
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Bạn có mã PIN phòng thi từ bạn bè?</h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Nhập mã phòng 6 số để bay thẳng vào làm bài trắc nghiệm ngay lập tức.
            </p>
          </div>

          <form onSubmit={handleJoinByPin} className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                maxLength={10}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Nhập mã PIN..."
                className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-black text-slate-900 font-black placeholder:text-slate-400 text-sm font-mono shadow-[2px_2px_0px_#000] outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto btn-3d btn-3d-cyan px-6 py-3.5 text-xs flex items-center justify-center gap-2 shrink-0"
            >
              <span>Vào Phòng</span>
              <ArrowRight className="w-4 h-4 stroke-3" />
            </button>
          </form>
        </div>

        {pinError && (
          <div className="p-3 rounded-2xl bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold text-center">
            {pinError}
          </div>
        )}

        {/* Room Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00a76d]/15 border-2 border-black flex items-center justify-center text-sm shadow-[2px_2px_0px_#000]">
              🎮
            </div>
            <h3 className="text-lg font-black text-slate-950">Các Phòng Thi Đang Mở</h3>
          </div>
          <span className="text-xs font-black text-slate-500 px-3 py-1 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_#000]">
            {rooms.length} phòng sẵn sàng
          </span>
        </div>

        {/* Room Cards Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500 text-sm font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#00a76d]" />
            Đang tải dữ liệu phòng thi...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-4 max-w-lg mx-auto">
            <div className="text-5xl">🎪</div>
            <h4 className="text-xl font-black text-slate-900">Chưa có phòng thi đấu nào!</h4>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Hãy là người đầu tiên tạo phòng thi mới bằng AI để thử tài kiến thức cùng bạn bè.
            </p>
            <div className="pt-2">
              <Link
                href="/quiz/create"
                className="btn-3d btn-3d-green px-6 py-3.5 text-xs inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tạo Phòng Bằng AI Ngay</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rooms.map((room) => {
              const participantCount = room.participants?.length || 0

              return (
                <div
                  key={room.id}
                  className="p-6 rounded-3xl bg-white border-3 border-black shadow-[5px_5px_0px_#000] hover:shadow-[7px_7px_0px_#000] hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-black shadow-[2px_2px_0px_#000]">
                        PIN: {room.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-[#00a76d]/15 border-2 border-black text-[#00a76d] text-xs font-black">
                        {room.quiz.topic}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-[#00a76d] transition line-clamp-1">
                        {room.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mt-1.5">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          {room.quiz._count.questions} câu hỏi
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {room.quiz.timePerQuestion}s/câu
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {participantCount} người
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/room/${room.code}`}
                      className="w-full btn-3d btn-3d-green py-3.5 text-xs flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Vào Chơi Ngay</span>
                    </Link>
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
