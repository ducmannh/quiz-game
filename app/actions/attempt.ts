"use server"

import { prisma } from "@/lib/prisma"

export interface SaveAttemptAnswerItem {
  questionId: string
  selectedOptionId?: string | null
  isCorrect: boolean
  timeTaken: number
}

export interface SaveAttemptPayload {
  userId?: string | null
  quizId: string
  roomId?: string | null
  score: number
  totalQuestions: number
  correctCount: number
  timeSpent: number
  highestStreak: number
  answers: SaveAttemptAnswerItem[]
}

// -------------------------------------------------------------
// LƯU KẾT QUẢ BÀI THI VÀO POSTGRESQL THÔNG QUA PRISMA 7
// -------------------------------------------------------------
export async function saveQuizAttemptAction(payload: SaveAttemptPayload) {
  try {
    let validUserId: string | null = null
    if (payload.userId) {
      const user = await prisma.user.upsert({
        where: { id: payload.userId },
        update: {},
        create: {
          id: payload.userId,
          name: "Thí Sinh",
          avatar: "🎓",
        },
      })
      validUserId = user.id
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: validUserId,
        quizId: payload.quizId,
        roomId: payload.roomId || null,
        score: payload.score,
        totalQuestions: payload.totalQuestions,
        correctCount: payload.correctCount,
        timeSpent: payload.timeSpent,
        highestStreak: payload.highestStreak,
        answers: {
          create: payload.answers.map((ans) => ({
            questionId: ans.questionId,
            selectedOptionId: ans.selectedOptionId || null,
            isCorrect: ans.isCorrect,
            timeTaken: ans.timeTaken,
          })),
        },
      },
      include: {
        answers: true,
      },
    })

    return { success: true, attemptId: attempt.id }
  } catch (error) {
    console.error("❌ Lỗi khi lưu kết quả bài thi:", error)
    return { success: false, error: "Không thể lưu kết quả bài thi vào database." }
  }
}

// -------------------------------------------------------------
// LẤY CHI TIẾT BÀI THI KÈM ĐÁP ÁN ĐỂ XEM LẠI (REVIEW)
// -------------------------------------------------------------
export async function getAttemptDetailAction(attemptId: string) {
  try {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: { order: "asc" },
            },
          },
        },
        answers: {
          include: {
            selectedOption: true,
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    })

    if (!attempt) {
      return { success: false, error: "Không tìm thấy kết quả bài thi." }
    }

    return { success: true, data: attempt }
  } catch (error) {
    console.error("❌ Lỗi khi tải chi tiết bài thi:", error)
    return { success: false, error: "Lỗi truy vấn kết quả." }
  }
}

