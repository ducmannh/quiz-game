"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// -------------------------------------------------------------
// LẤY DANH SÁCH TẤT CẢ PHÒNG THI ĐẤU CHO SẢNH CHỜ (LOBBY)
// -------------------------------------------------------------
export async function getRoomsListAction() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        quiz: {
          select: {
            title: true,
            topic: true,
            difficulty: true,
            timePerQuestion: true,
            _count: {
              select: { questions: true },
            },
          },
        },
        participants: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            role: true,
            podiumNumber: true,
          },
        },
      },
    })

    return { success: true, data: rooms }
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách phòng:", error)
    return { success: false, error: "Không thể kết nối đến máy chủ để tải danh sách phòng." }
  }
}

// -------------------------------------------------------------
// LẤY CHI TIẾT PHÒNG THI VÀ BỘ CÂU HỎI THEO MÃ PIN (ROOM CODE)
// -------------------------------------------------------------
export async function getRoomDetailAction(code: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: true,
              },
            },
          },
        },
        participants: {
          orderBy: { podiumNumber: "asc" },
        },
      },
    })

    if (!room) {
      return { success: false, error: "Không tìm thấy phòng thi với mã PIN này!" }
    }

    return { success: true, data: room }
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông tin phòng:", error)
    return { success: false, error: "Lỗi truy vấn dữ liệu phòng thi." }
  }
}

// -------------------------------------------------------------
// THAM GIA VÀO PHÒNG (LÊN BỤC THÍ SINH HOẶC VÀO KHÁN ĐÀI)
// -------------------------------------------------------------
export interface JoinRoomPayload {
  code: string
  userId: string
  nickname: string
  avatar: string
  preferredRole?: "PLAYER" | "SPECTATOR"
}

export async function joinRoomAction(payload: JoinRoomPayload) {
  try {
    const room = await prisma.room.findUnique({
      where: { code: payload.code },
      include: {
        participants: true,
      },
    })

    if (!room) {
      return { success: false, error: "Phòng thi không tồn tại!" }
    }

    // 1. Đảm bảo User luôn tồn tại trong DB trước khi gán khóa ngoại RoomParticipant.userId
    let validUserId: string | null = null
    if (payload.userId) {
      const user = await prisma.user.upsert({
        where: { id: payload.userId },
        update: {
          name: payload.nickname || "Thí Sinh",
          avatar: payload.avatar || "🎓",
        },
        create: {
          id: payload.userId,
          name: payload.nickname || "Thí Sinh",
          avatar: payload.avatar || "🎓",
        },
      })
      validUserId = user.id
    }

    // 2. Kiểm tra xem người này đã ở trong phòng chưa
    const existing = room.participants.find((p) => p.userId === validUserId)
    if (existing) {
      return { success: true, participant: existing, room }
    }

    // Đếm số lượng thí sinh đang chiếm bục
    const occupiedPodiums = room.participants
      .filter((p) => p.role === "PLAYER" && p.podiumNumber !== null)
      .map((p) => p.podiumNumber as number)

    let assignedRole: "PLAYER" | "SPECTATOR" = payload.preferredRole || "PLAYER"
    let assignedPodium: number | null = null

    if (assignedRole === "PLAYER") {
      // Tìm bục trống đầu tiên từ 1 -> 10
      for (let i = 1; i <= (room.maxPodiums || 10); i++) {
        if (!occupiedPodiums.includes(i)) {
          assignedPodium = i
          break
        }
      }

      // Nếu cả 10 bục đã kín -> Tự động chuyển thành Khán giả cổ vũ
      if (assignedPodium === null) {
        assignedRole = "SPECTATOR"
      }
    }

    const newParticipant = await prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: validUserId,
        nickname: payload.nickname,
        avatar: payload.avatar,
        role: assignedRole,
        podiumNumber: assignedPodium,
        score: 0,
        streak: 0,
      },
    })

    // Chỉ revalidate lobby để tránh reload lặp lại màn hình thi đấu
    revalidatePath("/lobby")

    return {
      success: true,
      participant: newParticipant,
      room,
    }
  } catch (error) {
    console.error("❌ Lỗi khi tham gia phòng:", error)
    return { success: false, error: "Không thể tham gia phòng thi đấu." }
  }
}

