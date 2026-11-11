"use client"

import { useState, useEffect, useCallback, use, Suspense } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { getStoredPlayer, PlayerProfile } from "@/lib/player"
import {
  getGroupDetailAction,
  addMemberByUsernameAction,
} from "@/app/actions/group"
import SceneTransitionPortal from "@/components/wuxia/SceneTransitionPortal"
import CreateGroupRoomModal from "@/components/lobby/CreateGroupRoomModal"
import RoomStatsModal from "@/components/lobby/RoomStatsModal"
import { Loader2, ArrowLeft } from "lucide-react"

// Dynamically import ThreeGroupWorld with ssr: false for Three.js
const ThreeGroupWorld = dynamic(
  () => import("@/components/wuxia/ThreeGroupWorld"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-[#0C1117] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#FFC857] mb-3" />
        <p className="text-xs font-serif font-black tracking-widest text-[#FFC857] uppercase">
          Đang khởi tạo Tông Đường Bang Hội 3D...
        </p>
      </div>
    ),
  }
)

interface GroupMemberItem {
  id: string
  role: string
  joinedAt: Date
  user: {
    id: string
    username: string
    name: string
    avatar?: string | null
  }
}

interface GroupRoomItem {
  id: string
  code: string
  title: string
  topic?: string | null
  status: string
  maxPodiums: number
  quiz: {
    id: string
    title: string
    topic: string
    difficulty: string
    timePerQuestion: number
    _count: {
      questions: number
    }
  }
  _count?: {
    participants?: number
    attempts?: number
  }
}

interface GroupDetailData {
  id: string
  name: string
  code: string
  description?: string | null
  leaderId: string
  leader: {
    id: string
    username: string
    name: string
    avatar?: string | null
  }
  members: GroupMemberItem[]
  rooms: GroupRoomItem[]
}

function GroupWorldContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()

  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [group, setGroup] = useState<GroupDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Transition animation
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionMsg, setTransitionMsg] = useState("")

  // Modals
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false)
  const [statsRoomId, setStatsRoomId] = useState<string | null>(null)

  // Load group detail
  const loadGroup = useCallback(() => {
    const curPlayer = getStoredPlayer()
    if (!curPlayer?.id) {
      router.replace("/login")
      return
    }

    setIsLoading(true)
    setError(null)

    getGroupDetailAction(groupId, curPlayer.id).then((res) => {
      if (res.success && res.data) {
        setGroup(res.data as unknown as GroupDetailData)
      } else {
        setError(res.error || "Không thể tải thông tin bang hội này!")
      }
      setIsLoading(false)
    })
  }, [groupId, router])

  useEffect(() => {
    Promise.resolve().then(() => {
      const curPlayer = getStoredPlayer()
      if (!curPlayer?.id) {
        router.replace("/login")
        return
      }
      setPlayer(curPlayer)
      loadGroup()
    })
  }, [loadGroup, router])

  // Return to grand lobby
  const handleBackToLobby = () => {
    setTransitionMsg("Vận chuyển kiếm khí... Đang trở về Sảnh Võ Lâm")
    setIsTransitioning(true)
    setTimeout(() => {
      router.push("/lobby")
    }, 900)
  }

  // Join a room (step onto podium)
  const handleJoinRoom = (roomCode: string) => {
    setTransitionMsg("Bước lên lôi đài tỉ thí... Đang tiến vào trường thi")
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(`/room/${roomCode}`)
    }, 800)
  }

  // Leader adds member by username
  const handleAddMember = async (username: string) => {
    if (!player?.id || !group?.id) return { success: false, error: "Lỗi phiên đăng nhập" }

    const res = await addMemberByUsernameAction({
      groupId: group.id,
      username,
      leaderUserId: player.id,
    })

    if (res.success) {
      loadGroup()
      return { success: true }
    } else {
      return { success: false, error: res.error || "Không thể kết nạp đệ tử này" }
    }
  }

  // Create room success
  const handleCreateRoomSuccess = (roomCode: string) => {
    setIsCreateRoomOpen(false)
    loadGroup()
    setTransitionMsg("Lôi đài mới đã khai mở! Đang tiến vào trường thi")
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(`/room/${roomCode}`)
    }, 900)
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#0C1117] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#FFC857] mb-3" />
        <p className="text-xs font-serif font-black tracking-widest text-[#FFC857] uppercase">
          Đang tiến vào Tông Đường Bang Hội...
        </p>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="w-full h-screen bg-[#0C1117] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#9B2226] border-2 border-[#FFC857] flex items-center justify-center text-3xl mb-4">
          ⚔️
        </div>
        <h2 className="text-lg font-serif font-black text-[#FFC857] uppercase mb-2">
          Không Thể Tiến Vào Tông Đường
        </h2>
        <p className="text-xs text-slate-300 max-w-sm mb-6">
          {error || "Bạn không thuộc bang hội này hoặc bang hội không còn tồn tại."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/lobby")}
          className="btn-3d btn-3d-green px-5 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trở Về Sảnh Võ Lâm</span>
        </button>
      </div>
    )
  }

  const isLeader = player?.id === group.leaderId

  return (
    <>
      <ThreeGroupWorld
        player={player}
        group={group}
        isLeader={isLeader}
        onBackToLobby={handleBackToLobby}
        onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
        onOpenRoomStats={(roomId) => setStatsRoomId(roomId)}
        onJoinRoom={handleJoinRoom}
        onAddMember={handleAddMember}
      />

      {/* Modal Tạo Lôi Đài Mới Trong Nhóm */}
      {isCreateRoomOpen && player && (
        <CreateGroupRoomModal
          groupId={group.id}
          groupName={group.name}
          userId={player.id}
          onClose={() => setIsCreateRoomOpen(false)}
          onSuccess={handleCreateRoomSuccess}
        />
      )}

      {/* Modal Thống Kê & Xếp Hạng Lôi Đài */}
      {statsRoomId && (
        <RoomStatsModal
          roomId={statsRoomId}
          onClose={() => setStatsRoomId(null)}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {/* Portal Dịch Chuyển Càn Khôn */}
      <SceneTransitionPortal
        isActive={isTransitioning}
        message={transitionMsg}
      />
    </>
  )
}

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-[#0C1117] flex flex-col items-center justify-center p-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#FFC857] mb-3" />
          <p className="text-xs font-serif font-black tracking-widest text-[#FFC857] uppercase">
            Đang tải dữ liệu...
          </p>
        </div>
      }
    >
      <GroupWorldContent params={params} />
    </Suspense>
  )
}
