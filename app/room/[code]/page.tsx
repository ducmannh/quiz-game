"use client"

import { useState, useEffect, useCallback, use, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { getStoredPlayer, PlayerProfile } from "@/lib/player"
import { getRoomDetailAction, joinRoomAction } from "@/app/actions/room"
import { saveQuizAttemptAction } from "@/app/actions/attempt"
import { calculateQuestionScore } from "@/lib/scoring"
import ConfettiEffect from "@/components/arena/ConfettiEffect"
import QuizReviewModal, { ReviewQuestionItem } from "@/components/arena/QuizReviewModal"
import { sounds } from "@/lib/sound"

const ThreeExamHall = dynamic(
  () => import("@/components/arena/ThreeExamHall"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[65vh] sm:h-[72vh] md:h-[78vh] bg-slate-950 rounded-3xl flex flex-col items-center justify-center border-3 border-black shadow-[8px_8px_0px_#000]">
        <div className="w-8 h-8 border-4 border-[#00C2CB] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-300">Đang khởi tạo không gian trường thi 3D...</p>
      </div>
    ),
  }
)
import {
  RotateCcw,
  Home,
  Loader2,
  FileSearch,
  Share2,
  Check,
  Flame,
} from "lucide-react"

interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

interface QuestionItem {
  id: string
  text: string
  explanation?: string | null
  order: number
  options: QuestionOption[]
}

interface RoomData {
  id: string
  code: string
  title: string
  quiz: {
    id: string
    title: string
    topic: string
    timePerQuestion: number
    questions: QuestionItem[]
  }
}

interface UserAnswerRecord extends ReviewQuestionItem {
  earnedPoints: number
}

function RoomGameplayContent({ params }: { params: Promise<{ code: string }> }) {
  const { code: roomCode } = use(params)
  const router = useRouter()

  // User State
  const [player, setPlayer] = useState<PlayerProfile | null>(null)

  // Room & Quiz Data
  const [room, setRoom] = useState<RoomData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Gameplay State
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(20)
  const [isRevealed, setIsRevealed] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [myStreak, setMyStreak] = useState(0)
  const [highestStreak, setHighestStreak] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Detailed History of User Answers
  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([])
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const isSavedRef = useRef(false)

  // 1. Tải thông tin phòng thi (YÊU CẦU ĐÃ ĐĂNG NHẬP)
  useEffect(() => {
    async function initRoom() {
      setIsLoading(true)
      const userProfile = getStoredPlayer()

      // BẮT BUỘC ĐĂNG NHẬP: Nếu chưa đăng nhập hoặc không có username hợp lệ -> chuyển hướng sang /login
      if (!userProfile || !userProfile.id || !userProfile.username) {
        router.replace(`/login?redirect=${encodeURIComponent(`/room/${roomCode}`)}`)
        return
      }

      setPlayer(userProfile)

      const res = await getRoomDetailAction(roomCode)

      if (!res.success || !res.data) {
        setError(res.error || "Không tìm thấy phòng thi với mã này!")
        setIsLoading(false)
        return
      }

      const roomData = res.data as unknown as RoomData
      setRoom(roomData)
      setTimeRemaining(roomData.quiz.timePerQuestion || 20)

      // Ghi danh người chơi vào phòng
      await joinRoomAction({
        code: roomCode,
        userId: userProfile.id,
        nickname: userProfile.nickname || userProfile.name || userProfile.username,
        avatar: userProfile.avatar || "🎓",
      })

      setIsLoading(false)
    }

    initRoom()
  }, [roomCode, router])

  const questions = room?.quiz.questions || []
  const currentQuestion = questions[currentIdx]
  const totalQuestions = questions.length
  const maxQuestionTime = room?.quiz.timePerQuestion || 20

  // 2. Chốt đáp án & hiển thị kết quả
  const handleRevealAnswer = useCallback(() => {
    if (isRevealed || !currentQuestion) return

    setIsRevealed(true)
    const correctOption = currentQuestion.options.find((o) => o.isCorrect)
    const isCorrect = selectedOptionId ? selectedOptionId === correctOption?.id : false
    const timeTaken = Math.max(1, maxQuestionTime - timeRemaining)

    // Tính điểm thưởng theo tốc độ và chuỗi đúng
    const scoreResult = calculateQuestionScore(
      isCorrect,
      timeTaken,
      maxQuestionTime,
      myStreak
    )

    if (isCorrect) {
      sounds.playCorrect()
      const newStreak = myStreak + 1
      setMyScore((prev) => prev + scoreResult.earnedPoints)
      setMyStreak(newStreak)
      if (newStreak > highestStreak) {
        setHighestStreak(newStreak)
      }
    } else {
      sounds.playWrong()
      setMyStreak(0)
    }

    // Lưu lại lịch sử câu trả lời
    const record: UserAnswerRecord = {
      questionId: currentQuestion.id,
      order: currentIdx + 1,
      text: currentQuestion.text,
      explanation: currentQuestion.explanation,
      options: currentQuestion.options,
      selectedOptionId,
      isCorrect,
      timeTaken,
      earnedPoints: scoreResult.earnedPoints,
    }
    setUserAnswers((prev) => [...prev, record])
  }, [currentQuestion, isRevealed, selectedOptionId, maxQuestionTime, timeRemaining, myStreak, highestStreak, currentIdx])

  // 3. Đồng hồ đếm ngược
  useEffect(() => {
    if (isLoading || isRevealed || isGameOver || !currentQuestion) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleRevealAnswer()
          return 0
        }
        sounds.playTick(prev <= 4)
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLoading, isRevealed, isGameOver, currentQuestion, handleRevealAnswer])

  // 4. Chọn đáp án
  const handleSelectOption = (optionId: string) => {
    if (isRevealed || timeRemaining <= 0) return
    sounds.playBuzzer()
    setSelectedOptionId(optionId)
  }

  // 5. Chuyển sang câu hỏi tiếp theo hoặc kết thúc
  const handleNextQuestion = () => {
    if (currentIdx + 1 < totalQuestions) {
      setCurrentIdx((prev) => prev + 1)
      setSelectedOptionId(null)
      setIsRevealed(false)
      setTimeRemaining(maxQuestionTime)
    } else {
      // Hết bài thi -> Màn hình tổng kết
      setIsGameOver(true)
      sounds.playVictory()
    }
  }

  // 6. Tự động lưu kết quả vào PostgreSQL khi Game Over
  useEffect(() => {
    if (!isGameOver || !room || isSavedRef.current) return
    isSavedRef.current = true

    const totalCorrect = userAnswers.filter((a) => a.isCorrect).length
    const totalTime = userAnswers.reduce((acc, a) => acc + a.timeTaken, 0)

    saveQuizAttemptAction({
      userId: player?.id || "guest",
      quizId: room.quiz.id,
      roomId: room.id,
      score: myScore,
      highestStreak,
      totalQuestions: userAnswers.length,
      correctCount: totalCorrect,
      timeSpent: totalTime,
      answers: userAnswers.map((a) => ({
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        isCorrect: a.isCorrect,
        timeTaken: a.timeTaken,
      })),
    })
  }, [isGameOver, room, userAnswers, player, myScore, highestStreak])

  // 7. Bàn phím tắt A-B-C-D / 1-4 & Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return

      if (isRevealed) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleNextQuestion()
        }
        return
      }

      if (!currentQuestion) return

      const options = currentQuestion.options
      if (e.key === "1" || e.key.toUpperCase() === "A") {
        if (options[0]) handleSelectOption(options[0].id)
      } else if (e.key === "2" || e.key.toUpperCase() === "B") {
        if (options[1]) handleSelectOption(options[1].id)
      } else if (e.key === "3" || e.key.toUpperCase() === "C") {
        if (options[2]) handleSelectOption(options[2].id)
      } else if (e.key === "4" || e.key.toUpperCase() === "D") {
        if (options[3]) handleSelectOption(options[3].id)
      } else if (e.key === "Enter" && selectedOptionId) {
        handleRevealAnswer()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  // Sao chép bảng điểm
  const handleCopyScore = () => {
    const totalCorrect = userAnswers.filter((a) => a.isCorrect).length
    const shareText = `🎯 Mình vừa đạt ${myScore.toLocaleString()} điểm trong bài thi "${room?.quiz.title}" trên Quiz.com AI!\n✅ Đúng ${totalCorrect}/${totalQuestions} câu • 🔥 Combo: ${highestStreak}\n👉 Tham gia ngay tại: ${window.location.origin}/room/${roomCode}`
    navigator.clipboard.writeText(shareText)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2500)
  }

  // Chơi lại
  const handleRestart = () => {
    setCurrentIdx(0)
    setTimeRemaining(maxQuestionTime)
    setIsRevealed(false)
    setSelectedOptionId(null)
    setMyScore(0)
    setMyStreak(0)
    setHighestStreak(0)
    setUserAnswers([])
    setIsGameOver(false)
    isSavedRef.current = false
  }

  // Bật/tắt âm thanh
  const handleToggleSound = () => {
    const next = sounds.toggleMute()
    setIsMuted(next)
  }

  // ------------------ MÀN HÌNH LOADING / LỖI ------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF4] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#00a76d]" />
        <p className="text-base font-black text-slate-900">Đang khởi tạo bài trắc nghiệm...</p>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#FFFDF4] p-6 flex items-center justify-center">
        <div className="p-8 rounded-3xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] text-center max-w-md w-full space-y-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-black text-slate-950">Không Tìm Thấy Phòng!</h2>
          <p className="text-xs text-slate-600 font-medium">{error || "Mã PIN không tồn tại hoặc bài thi đã kết thúc."}</p>
          <Link href="/lobby" className="btn-3d btn-3d-green w-full py-3.5 text-xs">
            Về Sảnh Đấu Trường
          </Link>
        </div>
      </div>
    )
  }

  // ------------------ MÀN HÌNH TỔNG KẾT (GAME OVER) ------------------
  if (isGameOver) {
    const totalCorrect = userAnswers.filter((a) => a.isCorrect).length
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    const avgTime = userAnswers.length > 0
      ? (userAnswers.reduce((acc, a) => acc + a.timeTaken, 0) / userAnswers.length).toFixed(1)
      : "0"

    return (
      <div className="min-h-screen bg-[#FFFDF4] text-slate-900 p-4 sm:p-8 flex items-center justify-center relative overflow-hidden select-none">
        <ConfettiEffect />

        <div className="w-full max-w-2xl bg-white border-3 border-black rounded-3xl p-6 sm:p-10 shadow-[8px_8px_0px_#000] relative z-10 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 border-2 border-black flex items-center justify-center text-4xl shadow-[3px_3px_0px_#000]">
            🏆
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#00a76d]">
              Hoàn Thành Bài Thi
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-950">
              {room.quiz.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Thí sinh: <strong>{player?.nickname}</strong>
            </p>
          </div>

          {/* 4 Chỉ Số Kết Quả */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-[#FFFDF4] border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="text-2xl font-black text-[#00a76d] font-mono">
                {myScore.toLocaleString()}đ
              </div>
              <span className="text-[11px] font-black uppercase text-slate-500">Tổng Điểm</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF4] border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="text-2xl font-black text-blue-600 font-mono">
                {totalCorrect}/{totalQuestions}
              </div>
              <span className="text-[11px] font-black uppercase text-slate-500">Đúng ({accuracy}%)</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF4] border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="text-2xl font-black text-orange-500 font-mono flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
                {highestStreak}
              </div>
              <span className="text-[11px] font-black uppercase text-slate-500">Max Combo</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF4] border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="text-2xl font-black text-purple-600 font-mono">
                {avgTime}s
              </div>
              <span className="text-[11px] font-black uppercase text-slate-500">Tốc Độ TB</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsReviewOpen(true)}
              className="w-full sm:w-auto btn-3d btn-3d-white px-5 py-3 text-xs flex items-center justify-center gap-2"
            >
              <FileSearch className="w-4 h-4 text-slate-700" />
              <span>Xem Lời Giải Chi Tiết</span>
            </button>

            <button
              onClick={handleCopyScore}
              className="w-full sm:w-auto btn-3d btn-3d-cyan px-5 py-3 text-xs flex items-center justify-center gap-2"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{isCopied ? "Đã Sao Chép!" : "Chia Sẻ Điểm Số"}</span>
            </button>

            <button
              onClick={handleRestart}
              className="w-full sm:w-auto btn-3d btn-3d-green px-5 py-3 text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại</span>
            </button>
          </div>

          <div className="pt-2">
            <Link
              href="/lobby"
              className="text-xs font-black text-slate-600 hover:text-black hover:underline inline-flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Quay về Sảnh Đấu</span>
            </Link>
          </div>
        </div>

        {/* Modal Xem Lại Chi Tiết Từng Câu */}
        <QuizReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          quizTitle={room.quiz.title}
          questions={userAnswers}
        />
      </div>
    )
  }

  // ------------------ MÀN HÌNH GAMEPLAY CHÍNH (FULL SCREEN 3D VIRTUAL EXAM HALL) ------------------
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#132230] select-none">
      <ThreeExamHall
        player={player}
        currentQuestion={currentQuestion}
        currentIdx={currentIdx}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining}
        maxQuestionTime={maxQuestionTime}
        isRevealed={isRevealed}
        selectedOptionId={selectedOptionId}
        onSelectOption={handleSelectOption}
        myScore={myScore}
        myStreak={myStreak}
        topic={room.quiz.topic}
        roomCode={roomCode}
        onToggleSound={handleToggleSound}
        isMuted={isMuted}
        onNextQuestion={handleNextQuestion}
      />
    </div>
  )
}

export default function RoomArenaPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFDF4] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#00a76d]" />
          <p className="text-sm font-black text-slate-900">Đang chuẩn bị bài thi...</p>
        </div>
      }
    >
      <RoomGameplayContent params={params} />
    </Suspense>
  )
}
