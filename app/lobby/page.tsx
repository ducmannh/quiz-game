"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { getMyGroupsAction } from "@/app/actions/group"
import { getStoredPlayer, clearStoredPlayer, PlayerProfile } from "@/lib/player"
import { logoutAction } from "@/app/actions/auth"
import CreateGroupModal from "@/components/lobby/CreateGroupModal"
import JoinGroupModal from "@/components/lobby/JoinGroupModal"
import SceneTransitionPortal from "@/components/wuxia/SceneTransitionPortal"
import {
  Users,
  KeyRound,
  PlusCircle,
  Crown,
  Gamepad2,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react"

// Dynamic import ThreeLobbyWorld with ssr: false for WebGL
const ThreeLobbyWorld = dynamic(
  () => import("@/components/wuxia/ThreeLobbyWorld"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-[#0E141A] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#FFC857] mb-3" />
        <p className="text-xs font-serif font-black tracking-widest text-[#FFC857] uppercase">
          Đang khởi tạo Sảnh Chờ Võ Lâm 3D...
        </p>
      </div>
    ),
  }
)

interface GroupSummary {
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
  _count: {
    members: number
    rooms: number
  }
  members: { role: string }[]
}

export default function LobbyPage() {
  const router = useRouter()
  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Groups
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [isGroupLoading, setIsGroupLoading] = useState(false)

  // Modals
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false)
  const [isMyGroupsOpen, setIsMyGroupsOpen] = useState(false)

  // Transition Portal
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionMsg, setTransitionMsg] = useState("")

  // Check login
  useEffect(() => {
    Promise.resolve().then(() => {
      const curPlayer = getStoredPlayer()
      if (!curPlayer || !curPlayer.id) {
        router.replace("/login")
        return
      }
      setPlayer(curPlayer)
      setCheckingAuth(false)
    })
  }, [router])

  // Fetch groups
  const fetchMyGroups = useCallback(() => {
    const curPlayer = getStoredPlayer()
    if (!curPlayer?.id) return

    setIsGroupLoading(true)
    getMyGroupsAction(curPlayer.id).then((res) => {
      if (res.success && res.data) {
        setGroups(res.data as unknown as GroupSummary[])
      }
      setIsGroupLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!checkingAuth && player) {
      Promise.resolve().then(() => {
        fetchMyGroups()
      })
    }
  }, [checkingAuth, player, fetchMyGroups])

  // Logout
  const handleLogout = async () => {
    await logoutAction()
    clearStoredPlayer()
    setPlayer(null)
    router.replace("/")
  }

  // Teleport to Group Hall
  const handleTeleportToGroup = (groupId: string, customMsg?: string) => {
    setIsCreateGroupOpen(false)
    setIsJoinGroupOpen(false)
    setIsMyGroupsOpen(false)

    setTransitionMsg(customMsg || "Càn khôn dịch chuyển... Đang tiến vào Tông Đường Bang Hội!")
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(`/group/${groupId}`)
    }, 900)
  }

  if (checkingAuth) {
    return (
      <div className="w-full h-screen bg-[#0E141A] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#FFC857] mb-3" />
        <p className="text-xs font-serif font-black tracking-widest text-[#FFC857] uppercase">
          Đang xác nhận danh tính hiệp khách...
        </p>
      </div>
    )
  }

  return (
    <>
      <ThreeLobbyWorld
        player={player}
        groupsCount={groups.length}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
        onOpenMyGroups={() => setIsMyGroupsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Modal Lập Bang Hội Mới */}
      {isCreateGroupOpen && player && (
        <CreateGroupModal
          userId={player.id}
          onClose={() => setIsCreateGroupOpen(false)}
          onSuccess={(groupId) =>
            handleTeleportToGroup(groupId, "Khai môn lập phái thành công! Đang tiến vào Tông Đường Bang Hội...")
          }
        />
      )}

      {/* Modal Bái Nhập Môn Phái (Vào bằng mã) */}
      {isJoinGroupOpen && player && (
        <JoinGroupModal
          userId={player.id}
          onClose={() => setIsJoinGroupOpen(false)}
          onSuccess={(groupId) =>
            handleTeleportToGroup(groupId, "Bái nhập môn phái thành công! Đang tiến vào Tông Đường Bang Hội...")
          }
        />
      )}

      {/* Modal Danh Sách Bang Hội Của Ta */}
      {isMyGroupsOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="w-full max-w-xl bg-[#0D1217] rounded-3xl border-3 border-[#FFC857] shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#9B2226] to-[#581216] border-b-2 border-[#FFC857] text-[#FFFDF4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="text-lg font-serif font-black text-[#FFC857] uppercase tracking-wider">
                    Bang Hội Của Ta ({groups.length})
                  </h3>
                  <p className="text-xs text-amber-100/80">
                    Chọn bang hội để dịch chuyển thẳng đến Tông Đường
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMyGroupsOpen(false)}
                className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List Content */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
              {isGroupLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FFC857] mb-2" />
                  <p className="text-xs text-slate-400">Đang tra cứu sổ bộ môn phái...</p>
                </div>
              ) : groups.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border-2 border-dashed border-[#7A4B1F]/60 bg-[#161D24] p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#9B2226]/30 border border-[#FFC857] flex items-center justify-center text-2xl">
                    🥋
                  </div>
                  <h4 className="text-sm font-serif font-bold text-[#FFC857]">
                    Bạn chưa gia nhập môn phái hay bang hội nào!
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Hiệp khách có thể tự lập bang phái riêng (nhập mã 230400 để nhận quyền Trưởng nhóm) hoặc nhập mã để bái sơn gia nhập môn phái huynh đệ.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMyGroupsOpen(false)
                        setIsCreateGroupOpen(true)
                      }}
                      className="px-4 py-2 rounded-xl bg-[#9B2226] hover:bg-[#B23A22] border-2 border-[#FFC857] text-white text-xs font-black shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      + Lập Môn Phái Mới
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMyGroupsOpen(false)
                        setIsJoinGroupOpen(true)
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#2D6A4F] border-2 border-[#FFC857] text-white text-xs font-black shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      Nhập Mã Gia Nhập
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((grp) => {
                    const isLeader = grp.leaderId === player?.id
                    return (
                      <div
                        key={grp.id}
                        onClick={() => handleTeleportToGroup(grp.id)}
                        className="p-4 rounded-2xl bg-[#161D24] border-2 border-[#7A4B1F] hover:border-[#FFC857] transition flex items-center justify-between gap-3 shadow-[4px_4px_0px_#000] cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white group-hover:text-[#FFC857] transition">
                              {grp.name}
                            </h4>
                            {isLeader ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#9B2226] text-[#FFC857] text-[10px] font-black uppercase flex items-center gap-1 border border-[#FFC857]/40">
                                <Crown className="w-3 h-3" /> Tông Chủ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#1B4D3E] text-[#6FEEFF] text-[10px] font-bold uppercase border border-[#2D6A4F]">
                                Đệ Tử
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[#FFC857]" />
                              {grp._count.members} Huynh đệ
                            </span>
                            <span className="flex items-center gap-1">
                              <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
                              {grp._count.rooms} Lôi đài
                            </span>
                            <span className="font-mono text-slate-500">Mã: {grp.code}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-[#1B4D3E] group-hover:bg-[#2D6A4F] border-2 border-[#FFC857] text-[#FFFDF4] text-xs font-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5 transition shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
                          <span>Vào Tông Đường</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {groups.length > 0 && (
              <div className="p-4 bg-[#11171D] border-t border-[#7A4B1F]/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMyGroupsOpen(false)
                    setIsCreateGroupOpen(true)
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#9B2226] hover:bg-[#B23A22] text-[#FFFDF4] text-xs font-black cursor-pointer flex items-center gap-1.5 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#FFC857]" />
                  <span>+ Lập Thêm Môn Phái</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMyGroupsOpen(false)
                    setIsJoinGroupOpen(true)
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#2D6A4F] text-[#FFFDF4] text-xs font-black cursor-pointer flex items-center gap-1.5 transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#FFC857]" />
                  <span>Vào Bằng Mã Khác</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scene Transition Portal */}
      <SceneTransitionPortal
        isActive={isTransitioning}
        message={transitionMsg}
      />
    </>
  )
}
