import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:123456@100.86.236.104:5432/postgres?schema=public"

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function clearData() {
  console.log("🗑️  Đang dọn dẹp toàn bộ dữ liệu mẫu trong cơ sở dữ liệu...")

  // Xóa theo thứ tự ràng buộc khóa ngoại (Foreign Key)
  const delAnswers = await prisma.attemptAnswer.deleteMany({})
  console.log(`- Đã xóa ${delAnswers.count} câu trả lời chi tiết (AttemptAnswer)`)

  const delAttempts = await prisma.quizAttempt.deleteMany({})
  console.log(`- Đã xóa ${delAttempts.count} lượt thi đấu (QuizAttempt)`)

  const delParticipants = await prisma.roomParticipant.deleteMany({})
  console.log(`- Đã xóa ${delParticipants.count} thí sinh trong phòng (RoomParticipant)`)

  const delRooms = await prisma.room.deleteMany({})
  console.log(`- Đã xóa ${delRooms.count} phòng thi đấu trường (Room)`)

  const delMembers = await prisma.groupMember.deleteMany({})
  console.log(`- Đã xóa ${delMembers.count} thành viên nhóm (GroupMember)`)

  const delGroups = await prisma.group.deleteMany({})
  console.log(`- Đã xóa ${delGroups.count} nhóm thi đấu (Group)`)

  const delOptions = await prisma.option.deleteMany({})
  console.log(`- Đã xóa ${delOptions.count} phương án lựa chọn (Option)`)

  const delQuestions = await prisma.question.deleteMany({})
  console.log(`- Đã xóa ${delQuestions.count} câu hỏi (Question)`)

  const delQuizzes = await prisma.quiz.deleteMany({})
  console.log(`- Đã xóa ${delQuizzes.count} bộ đề trắc nghiệm (Quiz)`)

  const delCategories = await prisma.category.deleteMany({})
  console.log(`- Đã xóa ${delCategories.count} danh mục chủ đề (Category)`)

  const delUsers = await prisma.user.deleteMany({})
  console.log(`- Đã xóa ${delUsers.count} người dùng (User)`)

  console.log("✨ Đã xóa sạch toàn bộ dữ liệu mẫu! Cơ sở dữ liệu hiện hoàn toàn mới và sạch.")
}

clearData()
  .catch((e) => {
    console.error("❌ Lỗi khi dọn dẹp dữ liệu:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

