"use server"

import { prisma } from "@/lib/prisma"

export interface LeaderboardEntry {
  id: string
  rank: number
  nickname: string
  avatar: string
  score: number
  highestStreak: number
  accuracy: number
  quizTitle: string
  completedAt: Date
}

// -------------------------------------------------------------
// LẤY BẢNG XẾP HẠNG TOÀN HỆ THỐNG TỪ POSTGRESQL
// -------------------------------------------------------------
export async function getLeaderboardAction() {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      orderBy: { score: "desc" },
      take: 15,
      include: {
        quiz: {
          select: { title: true, topic: true },
        },
        user: {
          select: { name: true, avatar: true },
        },
      },
    })

    const dbEntries: LeaderboardEntry[] = attempts.map((att, idx) => ({
      id: att.id,
      rank: idx + 1,
      nickname: att.user?.name || `Thí Sinh #${att.id.slice(-4)}`,
      avatar: att.user?.avatar || "🦁",
      score: att.score,
      highestStreak: att.highestStreak,
      accuracy: att.totalQuestions > 0 ? Math.round((att.correctCount / att.totalQuestions) * 100) : 0,
      quizTitle: att.quiz.title,
      completedAt: att.completedAt,
    }))

    return { success: true, data: dbEntries }
  } catch (error) {
    console.error("❌ Lỗi khi lấy Bảng Xếp Hạng:", error)
    return { success: false, error: "Không thể tải bảng xếp hạng." }
  }
}

