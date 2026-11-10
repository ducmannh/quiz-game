import { GoogleGenAI } from "@google/genai"
import { z } from "zod"

// -------------------------------------------------------------
// 1. ZOD SCHEMA: ĐẢM BẢO DỮ LIỆU AI SINH RA LUÔN ĐÚNG CẤU TRÚC
// -------------------------------------------------------------
export const GeneratedOptionSchema = z.object({
  text: z.string().min(1, "Nội dung đáp án không được để trống"),
  isCorrect: z.boolean(),
})

export const GeneratedQuestionSchema = z.object({
  text: z.string().min(3, "Câu hỏi phải có ít nhất 3 ký tự"),
  explanation: z.string().min(1, "Cần có lời giải thích chi tiết"),
  options: z
    .array(GeneratedOptionSchema)
    .length(4, "Mỗi câu hỏi phải có chính xác 4 đáp án lựa chọn")
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      "Phải có duy nhất 1 đáp án đúng trong 4 lựa chọn"
    ),
})

export const GeneratedQuizSchema = z.object({
  title: z.string().min(3, "Tiêu đề bài thi không được quá ngắn"),
  description: z.string().default("Bộ câu hỏi được tạo tự động bằng AI"),
  topic: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  timePerQuestion: z.number().default(20),
  questions: z.array(GeneratedQuestionSchema).min(1, "Phải có ít nhất 1 câu hỏi"),
})

export type GeneratedQuiz = z.infer<typeof GeneratedQuizSchema>

export interface GenerateQuizParams {
  topic: string
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  questionCount?: number
  documentText?: string
}

// -------------------------------------------------------------
// 2. MOCK GENERATOR DỰ PHÒNG (DÙNG KHI CHƯA CÓ API KEY HOẶC KEY LỖI)
// -------------------------------------------------------------
function generateFallbackQuiz(params: GenerateQuizParams): GeneratedQuiz {
  const count = params.questionCount || 5
  const topic = params.topic.trim() || "Kiến thức chung"
  const diff = params.difficulty || "MEDIUM"

  return {
    title: `Thách Đấu: ${topic}`,
    description: `Bộ ${count} câu hỏi trắc nghiệm chủ đề "${topic}" (Mức độ: ${diff}).`,
    topic,
    difficulty: diff,
    timePerQuestion: diff === "EASY" ? 15 : diff === "HARD" ? 30 : 20,
    questions: Array.from({ length: count }).map((_, index) => {
      const questionNumber = index + 1
      return {
        text: `Câu ${questionNumber}: Đây là câu hỏi thử thách số ${questionNumber} về chủ đề "${topic}"?`,
        explanation: `Lời giải thích: Đây là đáp án chính xác nhất theo kiến thức chuyên sâu về ${topic}.`,
        options: [
          { text: `Lựa chọn A (${topic} - Cơ bản)`, isCorrect: questionNumber % 4 === 1 },
          { text: `Lựa chọn B (${topic} - Nâng cao)`, isCorrect: questionNumber % 4 === 2 },
          { text: `Lựa chọn C (${topic} - Chính xác)`, isCorrect: questionNumber % 4 === 3 },
          { text: `Lựa chọn D (${topic} - Tổng quát)`, isCorrect: questionNumber % 4 === 0 },
        ],
      }
    }),
  }
}

// -------------------------------------------------------------
// 3. AI GENERATOR CHÍNH: GỌI GOOGLE GEMINI API
// -------------------------------------------------------------
export async function generateQuizWithAI(params: GenerateQuizParams): Promise<GeneratedQuiz> {
  const apiKey = process.env.GEMINI_API_KEY

  // Nếu chưa có API Key -> Sử dụng mock data để không làm gián đoạn trải nghiệm
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("AIzaSy...")) {
    console.warn("⚠️ Chưa cấu hình GEMINI_API_KEY trong .env. Sử dụng bộ sinh câu hỏi dự phòng.")
    return generateFallbackQuiz(params)
  }

  const count = params.questionCount || 5
  const difficulty = params.difficulty || "MEDIUM"
  const topic = params.topic.trim()
  const docContext = params.documentText?.trim()
    ? `\n\nNội dung tài liệu nguồn người dùng cung cấp:\n"""\n${params.documentText.slice(0, 4000)}\n"""`
    : ""

  const systemInstruction = `Bạn là chuyên gia soạn đề thi trắc nghiệm gameshow kiến thức hàng đầu.
Nhiệm vụ của bạn là tạo ra một bộ câu hỏi trắc nghiệm khách quan hấp dẫn, kịch tính, chuẩn xác 100% bằng Tiếng Việt.
Quy tắc bắt buộc:
1. Mỗi câu hỏi PHẢI có đúng 4 phương án lựa chọn (options).
2. Trong 4 phương án, PHẢI có DUY NHẤT 1 phương án có "isCorrect: true", 3 phương án còn lại "isCorrect: false".
3. Mỗi câu hỏi PHẢI có lời giải thích (explanation) ngắn gọn, súc tích và thuyết phục.
4. Đầu ra BẮT BUỘC phải là JSON hợp lệ theo đúng cấu trúc yêu cầu, không thêm Markdown hay bất kỳ văn bản nào ngoài JSON.`

  const prompt = `Hãy tạo một bộ đề trắc nghiệm gồm chính xác ${count} câu hỏi:
- Chủ đề: "${topic}"
- Mức độ khó: ${difficulty} (EASY: Dễ, kiến thức phổ thông; MEDIUM: Vừa phải, cần suy nghĩ; HARD: Khó, câu hỏi chuyên sâu hoặc mẹo)
- Thời gian đếm ngược: 20 giây mỗi câu.${docContext}

Cấu trúc JSON mong muốn:
{
  "title": "Tiêu đề bộ câu hỏi hấp dẫn",
  "description": "Mô tả ngắn gọn về bộ câu hỏi",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "timePerQuestion": 20,
  "questions": [
    {
      "text": "Nội dung câu hỏi?",
      "explanation": "Giải thích chi tiết tại sao đáp án này đúng.",
      "options": [
        { "text": "Phương án 1", "isCorrect": false },
        { "text": "Phương án 2", "isCorrect": true },
        { "text": "Phương án 3", "isCorrect": false },
        { "text": "Phương án 4", "isCorrect": false }
      ]
    }
  ]
}`

  try {
    const ai = new GoogleGenAI({ apiKey })

    // Gọi Gemini 2.5 Flash với chế độ JSON
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    })

    const rawText = response.text?.trim()
    if (!rawText) {
      throw new Error("Không nhận được phản hồi văn bản từ Gemini API.")
    }

    // Làm sạch nếu AI vô tình bọc trong markdown code block
    const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "")
    const parsedData = JSON.parse(cleanJson)

    // Kiểm tra tính hợp lệ bằng Zod Schema
    const validatedQuiz = GeneratedQuizSchema.parse(parsedData)
    return validatedQuiz
  } catch (error) {
    console.error("❌ Lỗi khi gọi Gemini API, chuyển sang mock generator:", error)
    return generateFallbackQuiz(params)
  }
}

