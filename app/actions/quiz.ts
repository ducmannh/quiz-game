"use server"

import { prisma } from "@/lib/prisma"
import { generateQuizWithAI, GenerateQuizParams } from "@/lib/ai/generate-quiz"
import { checkAIRateLimit } from "@/lib/ratelimit"
import { revalidatePath } from "next/cache"

// -------------------------------------------------------------
// TẠO BỘ ĐỀ QUIZ BẰNG AI VÀ LƯU VÀO DATABASE
// -------------------------------------------------------------
export async function createQuizWithAIAction(params: GenerateQuizParams) {
  try {
    if (!params.topic || params.topic.trim().length === 0) {
      return { success: false, error: "Vui lòng nhập chủ đề câu hỏi muốn tạo!" }
    }

    // Kiểm tra giới hạn tần suất gọi AI (Rate Limiter)
    const rateCheck = checkAIRateLimit()
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Bạn đã tạo quá nhiều bộ đề liên tục. Vui lòng nghỉ ngơi và thử lại sau ${rateCheck.resetInMinutes} phút!`,
      }
    }

    // 1. Gọi AI sinh câu hỏi (đã validate qua Zod Schema)
    const generated = await generateQuizWithAI(params)

    // 2. Tìm hoặc tạo category mặc định theo chủ đề
    let category = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { contains: generated.topic, mode: "insensitive" } },
          { slug: "ai-generated" },
        ],
      },
    })

    if (!category) {
      category = await prisma.category.upsert({
        where: { slug: "ai-generated" },
        update: {},
        create: {
          name: "Bộ Đề AI Tạo",
          slug: "ai-generated",
          icon: "Sparkles",
          description: "Các bộ câu hỏi được sinh tự động bởi trí tuệ nhân tạo.",
        },
      })
    }

    // 3. Lưu vào Database PostgreSQL thông qua Prisma 7
    const newQuiz = await prisma.quiz.create({
      data: {
        title: generated.title,
        description: generated.description,
        topic: generated.topic,
        difficulty: generated.difficulty,
        timePerQuestion: generated.timePerQuestion,
        isAIGenerated: true,
        categoryId: category.id,
        questions: {
          create: generated.questions.map((q, idx) => ({
            text: q.text,
            explanation: q.explanation,
            order: idx + 1,
            options: {
              create: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    // 4. Tự động mở sẵn một phòng thi đấu Gameshow Arena (10 bục) cho bộ đề này
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString()
    const newRoom = await prisma.room.create({
      data: {
        code: roomCode,
        title: `Đấu Trường: ${newQuiz.title}`,
        quizId: newQuiz.id,
        status: "WAITING",
        maxPodiums: 10,
      },
    })

    revalidatePath("/quiz")
    revalidatePath("/lobby")

    return {
      success: true,
      quizId: newQuiz.id,
      roomCode: newRoom.code,
      quiz: newQuiz,
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo Quiz bằng AI:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tạo câu hỏi.",
    }
  }
}

// -------------------------------------------------------------
// LẤY DANH SÁCH BỘ ĐỀ QUIZ CHO TRANG CHỦ / LOBBY
// -------------------------------------------------------------
export async function getQuizzesAction() {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        category: true,
        _count: {
          select: { questions: true, attempts: true, rooms: true },
        },
      },
    })
    return { success: true, data: quizzes }
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách Quiz:", error)
    return { success: false, error: "Không thể tải danh sách câu hỏi." }
  }
}

// -------------------------------------------------------------
// LẤY CHI TIẾT BỘ ĐỀ QUIZ
// -------------------------------------------------------------
export async function getQuizDetailAction(quizId: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        category: true,
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: true,
          },
        },
      },
    })

    if (!quiz) {
      return { success: false, error: "Không tìm thấy bộ câu hỏi này." }
    }

    return { success: true, data: quiz }
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết Quiz:", error)
    return { success: false, error: "Lỗi truy vấn bộ câu hỏi." }
  }
}

