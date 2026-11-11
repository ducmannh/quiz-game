"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { LEADER_PASSCODE } from "@/lib/group"

export interface CreateGroupPayload {
  name: string
  description?: string
  isLeader: boolean
  leaderPasscode?: string
  userId: string
}

export interface GroupActionResult {
  success: boolean
  error?: string
  groupId?: string
  groupCode?: string
  data?: unknown
}

// -------------------------------------------------------------
// 1. TẠO NHÓM MỚI (CÓ OPTION TRƯỞNG NHÓM & MÃ XÁC THỰC 230400)
// -------------------------------------------------------------
export async function createGroupAction(payload: CreateGroupPayload): Promise<GroupActionResult> {
  try {
    const cleanName = payload.name?.trim()
    if (!cleanName) {
      return { success: false, error: "Vui lòng nhập tên nhóm (Ví dụ: Nhóm A, Nhóm B...)!" }
    }

    if (!payload.userId) {
      return { success: false, error: "Bạn cần đăng nhập để tạo nhóm!" }
    }

    // Xác thực mã Trưởng Nhóm: Nếu chọn là Trưởng nhóm, bắt buộc mã phải là 230400
    if (payload.isLeader) {
      const code = payload.leaderPasscode?.trim()
      if (code !== LEADER_PASSCODE) {
        return {
          success: false,
          error: "Mã xác thực Trưởng Nhóm không chính xác! Vui lòng nhập đúng mã quy định (230400).",
        }
      }
    }

    // Đảm bảo user tồn tại trong DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return { success: false, error: "Tài khoản người dùng không tồn tại!" }
    }

    // Sinh mã nhóm ngẫu nhiên duy nhất (ví dụ: GR-8392)
    let groupCode = ""
    let isUnique = false
    while (!isUnique) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
      groupCode = `GR-${randomSuffix}`
      const existing = await prisma.group.findUnique({ where: { code: groupCode } })
      if (!existing) isUnique = true
    }

    // Tạo nhóm mới và gán người tạo vào danh sách thành viên
    const newGroup = await prisma.group.create({
      data: {
        name: cleanName,
        code: groupCode,
        description: payload.description?.trim() || null,
        leaderId: payload.userId,
        members: {
          create: {
            userId: payload.userId,
            role: payload.isLeader ? "LEADER" : "MEMBER",
          },
        },
      },
      include: {
        leader: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        members: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
      },
    })

    revalidatePath("/lobby")

    return {
      success: true,
      groupId: newGroup.id,
      groupCode: newGroup.code,
      data: newGroup,
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhóm:", error)
    return { success: false, error: "Đã xảy ra lỗi máy chủ khi tạo nhóm. Vui lòng thử lại!" }
  }
}

// -------------------------------------------------------------
// 2. GIA NHẬP NHÓM BẰNG MÃ MỜI (GROUP CODE)
// -------------------------------------------------------------
export async function joinGroupByCodeAction(payload: {
  code: string
  userId: string
}): Promise<GroupActionResult> {
  try {
    const cleanCode = payload.code?.trim().toUpperCase()
    if (!cleanCode) {
      return { success: false, error: "Vui lòng nhập mã mời nhóm!" }
    }

    if (!payload.userId) {
      return { success: false, error: "Bạn cần đăng nhập để tham gia nhóm!" }
    }

    // Tìm nhóm theo mã mời
    const group = await prisma.group.findUnique({
      where: { code: cleanCode },
    })

    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm với mã mời này!" }
    }

    // Kiểm tra xem đã là thành viên của nhóm chưa
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: payload.userId,
        },
      },
    })

    if (existingMember) {
      return {
        success: true,
        groupId: group.id,
        error: "Bạn đã là thành viên của nhóm này rồi!",
        data: group,
      }
    }

    // Thêm vào nhóm với vai trò MEMBER
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: payload.userId,
        role: "MEMBER",
      },
    })

    revalidatePath("/lobby")

    return {
      success: true,
      groupId: group.id,
      groupCode: group.code,
      data: group,
    }
  } catch (error) {
    console.error("❌ Lỗi khi gia nhập nhóm bằng mã:", error)
    return { success: false, error: "Không thể tham gia nhóm. Vui lòng thử lại!" }
  }
}

// -------------------------------------------------------------
// 3. TRƯỞNG NHÓM THÊM THÀNH VIÊN TRỰC TIẾP BẰNG USERNAME
// -------------------------------------------------------------
export async function addMemberByUsernameAction(payload: {
  groupId: string
  username: string
  leaderUserId: string
}): Promise<GroupActionResult> {
  try {
    const cleanUsername = payload.username?.trim().toLowerCase()
    if (!cleanUsername) {
      return { success: false, error: "Vui lòng nhập tên tài khoản của thành viên!" }
    }

    // Kiểm tra nhóm và quyền của Trưởng nhóm
    const group = await prisma.group.findUnique({
      where: { id: payload.groupId },
    })

    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm này!" }
    }

    if (group.leaderId !== payload.leaderUserId) {
      return {
        success: false,
        error: "Chỉ Trưởng Nhóm mới có quyền thêm thành viên trực tiếp vào nhóm!",
      }
    }

    // Tìm người dùng theo username
    const targetUser = await prisma.user.findFirst({
      where: { username: cleanUsername },
    })

    if (!targetUser) {
      return {
        success: false,
        error: `Không tìm thấy tài khoản thí sinh với tên: @${cleanUsername}`,
      }
    }

    // Kiểm tra xem người này đã trong nhóm chưa
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: targetUser.id,
        },
      },
    })

    if (existing) {
      return {
        success: false,
        error: `Thí sinh @${cleanUsername} đã là thành viên của nhóm này rồi!`,
      }
    }

    // Thêm vào nhóm
    const newMember = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: targetUser.id,
        role: "MEMBER",
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
      },
    })

    revalidatePath("/lobby")

    return {
      success: true,
      data: newMember,
    }
  } catch (error) {
    console.error("❌ Lỗi khi thêm thành viên vào nhóm:", error)
    return { success: false, error: "Không thể thêm thành viên. Vui lòng thử lại!" }
  }
}

// -------------------------------------------------------------
// 4. LẤY DANH SÁCH TẤT CẢ CÁC NHÓM CỦA NGƯỜI DÙNG HIỆN TẠI
// -------------------------------------------------------------
export async function getMyGroupsAction(userId: string) {
  try {
    if (!userId) return { success: false, error: "Chưa đăng nhập", data: [] }

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { leaderId: userId },
          { members: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        leader: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        _count: {
          select: {
            members: true,
            rooms: true,
          },
        },
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    })

    return { success: true, data: groups }
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nhóm:", error)
    return { success: false, error: "Lỗi truy vấn danh sách nhóm.", data: [] }
  }
}

// -------------------------------------------------------------
// 5. LẤY CHI TIẾT NHÓM KÈM PHÒNG THI THEO CHỦ ĐỀ VÀ THÀNH VIÊN
// -------------------------------------------------------------
export async function getGroupDetailAction(groupId: string, userId: string) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        leader: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        members: {
          orderBy: { joinedAt: "asc" },
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
        rooms: {
          orderBy: { createdAt: "desc" },
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                topic: true,
                timePerQuestion: true,
                _count: { select: { questions: true } },
              },
            },
            _count: {
              select: {
                participants: true,
                attempts: true,
              },
            },
          },
        },
      },
    })

    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm thi đấu!" }
    }

    // Kiểm tra xem user có quyền xem nhóm không
    const isMember = group.members.some((m) => m.userId === userId) || group.leaderId === userId
    if (!isMember) {
      return { success: false, error: "Bạn không phải là thành viên của nhóm này!" }
    }

    return { success: true, data: group }
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết nhóm:", error)
    return { success: false, error: "Lỗi kết nối máy chủ." }
  }
}

// -------------------------------------------------------------
// 6. TẠO PHÒNG THI MỚI CHO NHÓM THEO CHỦ ĐỀ
// -------------------------------------------------------------
export async function createGroupRoomAction(payload: {
  groupId: string
  title: string
  topic: string
  quizId?: string
  userId: string
}) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: payload.groupId },
      include: { members: true },
    })

    if (!group) {
      return { success: false, error: "Nhóm không tồn tại!" }
    }

    // Đảm bảo người tạo là thành viên hoặc trưởng nhóm
    const isMember = group.members.some((m) => m.userId === payload.userId) || group.leaderId === payload.userId
    if (!isMember) {
      return { success: false, error: "Chỉ thành viên nhóm mới có thể tạo phòng thi!" }
    }

    // Tìm bộ đề quiz phù hợp hoặc lấy bộ đề gần nhất
    let targetQuizId = payload.quizId

    if (!targetQuizId) {
      // Tìm bộ đề có chủ đề tương tự
      const matchedQuiz = await prisma.quiz.findFirst({
        where: {
          OR: [
            { topic: { contains: payload.topic, mode: "insensitive" } },
            { title: { contains: payload.topic, mode: "insensitive" } },
          ],
        },
      })

      if (matchedQuiz) {
        targetQuizId = matchedQuiz.id
      } else {
        // Lấy bất kỳ bộ đề nào có sẵn làm fallback
        const fallbackQuiz = await prisma.quiz.findFirst({
          orderBy: { createdAt: "desc" },
        })

        if (!fallbackQuiz) {
          return {
            success: false,
            error: "Hệ thống chưa có bộ đề nào sẵn sàng. Vui lòng tạo đề AI trước!",
          }
        }
        targetQuizId = fallbackQuiz.id
      }
    }

    // Sinh mã PIN phòng 6 chữ số
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString()

    const newRoom = await prisma.room.create({
      data: {
        code: roomCode,
        title: payload.title.trim() || `Phòng Thi: ${payload.topic}`,
        topic: payload.topic.trim(),
        quizId: targetQuizId,
        groupId: group.id,
        hostId: payload.userId,
        status: "WAITING",
        maxPodiums: 10,
      },
    })

    revalidatePath("/lobby")

    return {
      success: true,
      roomCode: newRoom.code,
      data: newRoom,
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo phòng thi cho nhóm:", error)
    return { success: false, error: "Không thể tạo phòng thi cho nhóm này." }
  }
}

// -------------------------------------------------------------
// 7. LẤY THỐNG KÊ SỐ LẦN THI & BẢNG XẾP HẠNG CỦA PHÒNG THI
// -------------------------------------------------------------
export interface RoomParticipantRankItem {
  rank: number
  userId: string
  name: string
  username: string
  avatar: string
  attemptsCount: number
  bestScore: number
  bestCorrectCount: number
  highestStreak: number
  minTimeSpent: number
  lastAttemptAt: Date
}

export async function getRoomLeaderboardAndStatsAction(roomId: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        quiz: {
          select: {
            title: true,
            topic: true,
            timePerQuestion: true,
            _count: { select: { questions: true } },
          },
        },
        attempts: {
          orderBy: { score: "desc" },
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    if (!room) {
      return { success: false, error: "Phòng thi không tồn tại!" }
    }

    const totalAttempts = room.attempts.length

    // Nhóm các lượt thi theo từng người dùng để tính thống kê
    const userStatsMap = new Map<
      string,
      {
        userId: string
        name: string
        username: string
        avatar: string
        attemptsCount: number
        bestScore: number
        bestCorrectCount: number
        highestStreak: number
        minTimeSpent: number
        lastAttemptAt: Date
      }
    >()

    for (const att of room.attempts) {
      const uId = att.userId || "anonymous"
      const uName = att.user?.name || "Thí Sinh Ẩn Danh"
      const uUsername = att.user?.username || "thissinh"
      const uAvatar = att.user?.avatar || "🎓"

      const existing = userStatsMap.get(uId)
      if (!existing) {
        userStatsMap.set(uId, {
          userId: uId,
          name: uName,
          username: uUsername,
          avatar: uAvatar,
          attemptsCount: 1,
          bestScore: att.score,
          bestCorrectCount: att.correctCount,
          highestStreak: att.highestStreak,
          minTimeSpent: att.timeSpent,
          lastAttemptAt: att.completedAt,
        })
      } else {
        existing.attemptsCount += 1
        if (att.score > existing.bestScore) {
          existing.bestScore = att.score
          existing.bestCorrectCount = att.correctCount
          existing.minTimeSpent = att.timeSpent
        } else if (att.score === existing.bestScore && att.timeSpent < existing.minTimeSpent) {
          existing.minTimeSpent = att.timeSpent
        }
        if (att.highestStreak > existing.highestStreak) {
          existing.highestStreak = att.highestStreak
        }
        if (new Date(att.completedAt) > new Date(existing.lastAttemptAt)) {
          existing.lastAttemptAt = att.completedAt
        }
      }
    }

    // Sắp xếp bảng xếp hạng: Điểm cao nhất giảm dần, rồi đến thời gian hoàn thành ngắn nhất
    const sortedUsers = Array.from(userStatsMap.values()).sort((a, b) => {
      if (b.bestScore !== a.bestScore) {
        return b.bestScore - a.bestScore
      }
      return a.minTimeSpent - b.minTimeSpent
    })

    const rankings: RoomParticipantRankItem[] = sortedUsers.map((item, index) => ({
      rank: index + 1,
      ...item,
    }))

    return {
      success: true,
      data: {
        roomId: room.id,
        roomCode: room.code,
        title: room.title,
        topic: room.topic || room.quiz.topic,
        quizTitle: room.quiz.title,
        totalQuestions: room.quiz._count.questions,
        totalAttempts,
        totalParticipants: rankings.length,
        rankings,
      },
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy bảng xếp hạng phòng thi:", error)
    return { success: false, error: "Không thể lấy bảng xếp hạng phòng thi." }
  }
}

