import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:123456@100.86.236.104:5432/postgres?schema=public"

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Bắt đầu tạo dữ liệu mẫu (Seed Data)...")

  // 1. Tạo Danh mục
  const techCategory = await prisma.category.upsert({
    where: { slug: "cong-nghe" },
    update: {},
    create: {
      name: "Công Nghệ & Lập Trình",
      slug: "cong-nghe",
      icon: "Cpu",
      description: "Các câu hỏi về lập trình web, công nghệ AI và thế giới IT.",
    },
  })

  const historyCategory = await prisma.category.upsert({
    where: { slug: "lich-su" },
    update: {},
    create: {
      name: "Lịch Sử & Văn Hóa",
      slug: "lich-su",
      icon: "Landmark",
      description: "Kiến thức lịch sử Việt Nam và thế giới.",
    },
  })

  // 2. Tạo Quiz 1: Đố vui Lập trình & Công nghệ
  const quiz1 = await prisma.quiz.create({
    data: {
      title: "Thách Đấu Đố Vui Lập Trình & Công Nghệ",
      description: "Bộ câu hỏi thử tài kiến thức về Next.js, React, JavaScript và AI.",
      topic: "Công nghệ & Lập trình",
      difficulty: "MEDIUM",
      timePerQuestion: 20,
      isAIGenerated: false,
      categoryId: techCategory.id,
      questions: {
        create: [
          {
            text: "Trong Next.js App Router, thư mục nào đại diện cho dynamic route param id?",
            explanation: "Trong Next.js, cú pháp [id] được sử dụng để định nghĩa dynamic segment (tham số động trong URL).",
            order: 1,
            options: {
              create: [
                { text: ":id", isCorrect: false },
                { text: "[id]", isCorrect: true },
                { text: "{id}", isCorrect: false },
                { text: "<id>", isCorrect: false },
              ],
            },
          },
          {
            text: "Hook nào trong React dùng để quản lý state phức tạp hoặc reducer pattern?",
            explanation: "useReducer là hook chuẩn trong React giúp quản lý state phức tạp tương tự như Redux.",
            order: 2,
            options: {
              create: [
                { text: "useState", isCorrect: false },
                { text: "useEffect", isCorrect: false },
                { text: "useReducer", isCorrect: true },
                { text: "useMemo", isCorrect: false },
              ],
            },
          },
          {
            text: "Cơ chế nào của TypeScript cho phép tạo một type mới bằng cách chọn ra một số thuộc tính từ type ban đầu?",
            explanation: "Utility type Pick<T, Keys> giúp trích xuất các thuộc tính được chỉ định từ type T.",
            order: 3,
            options: {
              create: [
                { text: "Pick<T, K>", isCorrect: true },
                { text: "Omit<T, K>", isCorrect: false },
                { text: "Partial<T>", isCorrect: false },
                { text: "Record<K, T>", isCorrect: false },
              ],
            },
          },
          {
            text: "Tailwind CSS v4 sử dụng engine nào giúp tăng tốc độ build CSS nhanh hơn gấp nhiều lần?",
            explanation: "Tailwind CSS v4 được viết lại hoàn toàn bằng Rust và sử dụng engine Lightning CSS.",
            order: 4,
            options: {
              create: [
                { text: "PostCSS legacy", isCorrect: false },
                { text: "Lightning CSS (Rust engine)", isCorrect: true },
                { text: "Webpack CSS Loader", isCorrect: false },
                { text: "Sass Compiler", isCorrect: false },
              ],
            },
          },
          {
            text: "Mô hình ngôn ngữ lớn (LLM) nào sau đây do Google phát triển?",
            explanation: "Gemini là dòng mô hình AI đa phương thức tiên tiến do Google DeepMind nghiên cứu và phát triển.",
            order: 5,
            options: {
              create: [
                { text: "Claude", isCorrect: false },
                { text: "Gemini", isCorrect: true },
                { text: "GPT-4o", isCorrect: false },
                { text: "Llama 3", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  })

  // 3. Tạo Quiz 2: Lịch sử & Đời sống
  const quiz2 = await prisma.quiz.create({
    data: {
      title: "Đấu Trường Lịch Sử & Danh Lam Việt Nam",
      description: "Thử thách kiến thức về các triều đại và địa danh lịch sử Việt Nam.",
      topic: "Lịch sử Việt Nam",
      difficulty: "EASY",
      timePerQuestion: 15,
      isAIGenerated: false,
      categoryId: historyCategory.id,
      questions: {
        create: [
          {
            text: "Kinh đô đầu tiên của nước Đại Cồ Việt sau khi Đinh Bộ Lĩnh thống nhất 12 sứ quân đặt ở đâu?",
            explanation: "Sau khi dẹp loạn 12 sứ quân, Đinh Bộ Lĩnh lên ngôi Hoàng đế và đặt kinh đô tại Hoa Lư (Ninh Bình).",
            order: 1,
            options: {
              create: [
                { text: "Cổ Loa", isCorrect: false },
                { text: "Hoa Lư (Ninh Bình)", isCorrect: true },
                { text: "Thăng Long (Hà Nội)", isCorrect: false },
                { text: "Phú Xuân (Huế)", isCorrect: false },
              ],
            },
          },
          {
            text: "Vị vua nào đã ban hành 'Chiếu dời đô' từ Hoa Lư về thành Đại La vào năm 1010?",
            explanation: "Vào mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ (Lý Công Uẩn) đã ban Chiếu dời đô về Thăng Long.",
            order: 2,
            options: {
              create: [
                { text: "Lý Thái Tổ", isCorrect: true },
                { text: "Lê Thái Tổ", isCorrect: false },
                { text: "Trần Hưng Đạo", isCorrect: false },
                { text: "Quang Trung", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  })

  // 4. Tạo Phòng thi mẫu (Mô hình 10 bục Gameshow Arena)
  await prisma.room.upsert({
    where: { code: "888999" },
    update: {},
    create: {
      code: "888999",
      title: "Trường Quay Đấu Trường Công Nghệ #01",
      quizId: quiz1.id,
      status: "WAITING",
      maxPodiums: 10,
    },
  })

  console.log("✅ Đã tạo dữ liệu mẫu thành công!")
  console.log(`- Quiz 1: ${quiz1.title} (${quiz1.id})`)
  console.log(`- Quiz 2: ${quiz2.title} (${quiz2.id})`)
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed dữ liệu:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

