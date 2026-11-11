"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import * as THREE from "three"
import { PlayerProfile } from "@/lib/player"
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Camera,
  Compass,
  Clock,
  ArrowRight,
  Sparkles,
  Minimize2,
  Armchair,
  Sliders,
  Eye,
  RotateCcw,
  Check,
  X,
} from "lucide-react"

export interface QuestionData {
  id: string
  text: string
  explanation?: string | null
  order: number
  options: {
    id: string
    text: string
    isCorrect: boolean
  }[]
}

interface ThreeExamHallProps {
  player: PlayerProfile | null
  currentQuestion: QuestionData | null
  currentIdx: number
  totalQuestions: number
  timeRemaining: number
  maxQuestionTime: number
  isRevealed: boolean
  selectedOptionId: string | null
  onSelectOption: (optionId: string) => void
  myScore: number
  myStreak: number
  topic?: string
  roomCode?: string
  onLeaveRoom?: () => void
  onToggleSound?: () => void
  isMuted?: boolean
  onNextQuestion?: () => void
}

// 4 Color Themes for Options A, B, C, D on the Big Screen
const OPTION_THEMES = [
  { letter: "A", color: "#FF6B4A", name: "Coral" },
  { letter: "B", color: "#00C2CB", name: "Cyan" },
  { letter: "C", color: "#FFB800", name: "Amber" },
  { letter: "D", color: "#00C853", name: "Green" },
]

// Exact Canvas Coordinates for Click Detection & Rendering on 1024x512 Screen
const OPTION_RECTS = [
  { id: 0, x: 35, y: 245, w: 460, h: 88 }, // A
  { id: 1, x: 529, y: 245, w: 460, h: 88 }, // B
  { id: 2, x: 35, y: 348, w: 460, h: 88 }, // C
  { id: 3, x: 529, y: 348, w: 460, h: 88 }, // D
]

const NEXT_BTN_RECT = { x: 730, y: 446, w: 259, h: 54 }

// Danh sách cấu hình 10 bàn thi đấu và NPC trong trường thi 3D
const DESK_CONFIGS = [
  { x: -5, z: -2.2, num: 1, emoji: "🦁", name: "Thí Sinh #01", quote: "Đề thi hôm nay kịch tính thật đấy!" },
  { x: -2.5, z: -2.2, num: 2, emoji: "🐼", name: "Thí Sinh #02", quote: "Cố gắng đạt 100% điểm nhé bạn ơi!" },
  { x: 0, z: -2.2, num: 3, emoji: "🦊", name: "Bàn Thi #03 (Của Bạn)", quote: "Bàn thi chính thức của bạn. Bấm ngồi để mở đề thi." },
  { x: 2.5, z: -2.2, num: 4, emoji: "🐰", name: "Thí Sinh #04", quote: "Chuẩn bị vào câu tiếp theo chưa?" },
  { x: 5, z: -2.2, num: 5, emoji: "🐯", name: "Thí Sinh #05", quote: "Tập trung cao độ, đừng để bị phân tâm!" },
  { x: -5, z: 1.2, num: 6, emoji: "🐻", name: "Thí Sinh #06", quote: "Màn hình 3D trường thi xịn sò quá!" },
  { x: -2.5, z: 1.2, num: 7, emoji: "🐱", name: "Thí Sinh #07", quote: "Chúc bạn leo top bảng vàng thành công!" },
  { x: 0, z: 1.2, num: 8, emoji: "🐶", name: "Thí Sinh #08", quote: "Câu hỏi tiếp theo chắc sẽ bất ngờ lắm đây!" },
  { x: 2.5, z: 1.2, num: 9, emoji: "🐨", name: "Thí Sinh #09", quote: "Ánh sáng phòng thi hiện đại và sáng rõ thật!" },
  { x: 5, z: 1.2, num: 10, emoji: "🦊", name: "Thí Sinh #10", quote: "Bấm đáp án thật cẩn thận nha bạn!" },
]

export interface NearbyTarget {
  type: "MY_DESK" | "NPC"
  deskNum: number
  name: string
  emoji: string
  quote?: string
}

// Cấu hình góc nhìn POV và điều khiển chuột
export interface PovSettings {
  fov: number // 50° - 95° (mặc định 70° góc rộng)
  cameraDist: number // 3.5m - 9.0m (mặc định 5.6m)
  mouseControl: "FREE_LOOK" | "DRAG_TO_LOOK" // "FREE_LOOK": chỉ cần quay chuột, không cần giữ
  mouseSensitivity: number // 0.5x - 2.5x
}

const DEFAULT_POV_SETTINGS: PovSettings = {
  fov: 70, // Góc nhìn POV rộng hơn theo yêu cầu người dùng
  cameraDist: 5.6,
  mouseControl: "FREE_LOOK", // Chỉ cần di chuột là xoay, không cần giữ phím hay chuột
  mouseSensitivity: 1.0,
}

export default function ThreeExamHall({
  player,
  currentQuestion,
  currentIdx,
  totalQuestions,
  timeRemaining,
  maxQuestionTime,
  isRevealed,
  selectedOptionId,
  onSelectOption,
  myScore,
  myStreak,
  topic = "Kiến Thức Tổng Hợp",
  onToggleSound,
  isMuted = false,
  onNextQuestion,
}: ThreeExamHallProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [cameraMode, setCameraMode] = useState<"FOLLOW" | "OVERVIEW">("FOLLOW")
  const [isSeated, setIsSeated] = useState(true)
  const isSeatedRef = useRef(isSeated)
  const myDeskMeshRef = useRef<THREE.Mesh | null>(null)
  const myDeskObjectsRef = useRef<THREE.Object3D[]>([])
  const myDeskBadgeRef = useRef<THREE.Sprite | null>(null)
  const npcSpritesRef = useRef<{ [key: number]: THREE.Sprite }>({})

  // Cài đặt góc nhìn POV & Điều khiển (Khởi tạo lười từ localStorage)
  const [povSettings, setPovSettings] = useState<PovSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fun_quiz_pov_settings")
        if (saved) {
          return { ...DEFAULT_POV_SETTINGS, ...JSON.parse(saved) }
        }
      } catch {
        // Bỏ qua lỗi parse
      }
    }
    return DEFAULT_POV_SETTINGS
  })
  const povSettingsRef = useRef<PovSettings>(DEFAULT_POV_SETTINGS)
  const [showPovSettings, setShowPovSettings] = useState(false)
  const showPovSettingsRef = useRef(showPovSettings)

  useEffect(() => {
    showPovSettingsRef.current = showPovSettings
  }, [showPovSettings])

  useEffect(() => {
    povSettingsRef.current = povSettings
  }, [povSettings])

  const updatePovSetting = <K extends keyof PovSettings>(key: K, value: PovSettings[K]) => {
    setPovSettings((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem("fun_quiz_pov_settings", JSON.stringify(next))
      } catch {
        // Bỏ qua
      }
      return next
    })
  }

  const resetPovSettings = () => {
    setPovSettings(DEFAULT_POV_SETTINGS)
    try {
      localStorage.setItem("fun_quiz_pov_settings", JSON.stringify(DEFAULT_POV_SETTINGS))
    } catch {
      // Bỏ qua
    }
  }

  // Proximity Interaction Target (Chỉ hiển thị thông báo khi lại gần bàn hoặc NPC)
  const [nearbyTarget, setNearbyTarget] = useState<NearbyTarget | null>(null)
  const nearbyTargetRef = useRef<NearbyTarget | null>(null)

  // 3rd Person Orbit Camera Controls (Giữ chuột hoặc tự do di chuột để xoay quanh nhân vật)
  const cameraYawRef = useRef(0) // Góc quay ngang (0 = nhìn thẳng về sân khấu)
  const cameraPitchRef = useRef(0.28) // Góc nghiêng dọc (~16 độ)
  const isPointerDownRef = useRef(false)
  const isDraggingCameraRef = useRef(false)
  const pointerDownPosRef = useRef({ x: 0, y: 0 })
  const lastPointerPosRef = useRef({ x: 0, y: 0 })

  const [virtualJoystickActive, setVirtualJoystickActive] = useState(false)
  const joystickVectorRef = useRef({ x: 0, y: 0 })
  const joystickStartRef = useRef<{ x: number; y: number } | null>(null)
  const [joystickThumbPos, setJoystickThumbPos] = useState({ x: 0, y: 0 })

  // Props Refs to guarantee raycaster & animation loop always read latest state without re-creating scene
  const currentQuestionRef = useRef(currentQuestion)
  const isRevealedRef = useRef(isRevealed)
  const onSelectOptionRef = useRef(onSelectOption)
  const onNextQuestionRef = useRef(onNextQuestion)
  const selectedOptionIdRef = useRef(selectedOptionId)
  const timeRemainingRef = useRef(timeRemaining)
  const maxQuestionTimeRef = useRef(maxQuestionTime)
  const currentIdxRef = useRef(currentIdx)
  const totalQuestionsRef = useRef(totalQuestions)
  const myScoreRef = useRef(myScore)
  const myStreakRef = useRef(myStreak)
  const topicRef = useRef(topic)
  const cameraModeRef = useRef(cameraMode)
  const playerRef = useRef(player)
  const playerSpriteRef = useRef<THREE.Sprite | null>(null)
  const updateJumbotronTextureRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    isSeatedRef.current = isSeated
  }, [isSeated])

  useEffect(() => {
    currentQuestionRef.current = currentQuestion
    isRevealedRef.current = isRevealed
    onSelectOptionRef.current = onSelectOption
    onNextQuestionRef.current = onNextQuestion
    selectedOptionIdRef.current = selectedOptionId
    timeRemainingRef.current = timeRemaining
    maxQuestionTimeRef.current = maxQuestionTime
    currentIdxRef.current = currentIdx
    totalQuestionsRef.current = totalQuestions
    myScoreRef.current = myScore
    myStreakRef.current = myStreak
    topicRef.current = topic
    cameraModeRef.current = cameraMode
    playerRef.current = player
  }, [
    currentQuestion,
    isRevealed,
    onSelectOption,
    onNextQuestion,
    selectedOptionId,
    timeRemaining,
    maxQuestionTime,
    currentIdx,
    totalQuestions,
    myScore,
    myStreak,
    topic,
    cameraMode,
    player,
  ])

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const screenMeshRef = useRef<THREE.Mesh | null>(null)
  const jumbotronCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const jumbotronTextureRef = useRef<THREE.CanvasTexture | null>(null)

  // Character State in 3D Scene
  const playerMeshRef = useRef<THREE.Group | null>(null)
  const playerPosRef = useRef({ x: 0, y: 0, z: 1.5 })
  const playerTargetPosRef = useRef<{ x: number; z: number } | null>(null)
  const playerRotationRef = useRef(0)
  const keysPressedRef = useRef<{ [key: string]: boolean }>({})
  const animFrameIdRef = useRef<number | null>(null)

  // Desk lamps map
  const deskLampsRef = useRef<{ [key: number]: { light: THREE.PointLight; mesh: THREE.Mesh } }>({})

  // -------------------------------------------------------------
  // 1. DRAW DYNAMIC JUMBOTRON 2D CANVAS TEXTURE (MÀN HÌNH ĐEN LỚN 3D)
  // Toàn bộ thông tin câu hỏi, đồng hồ, 4 đáp án & lời giải hiển thị tại đây!
  // -------------------------------------------------------------
  const updateJumbotronTexture = useCallback(() => {
    const canvas = jumbotronCanvasRef.current
    const texture = jumbotronTextureRef.current
    if (!canvas || !texture) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    // Màn hình đen công nghệ cao (Deep Cyber Black / Petrol Screen)
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, "#0e222f")
    grad.addColorStop(1, "#051119")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Lưới vi mạch chìm (Cyber Grid)
    ctx.strokeStyle = "rgba(111, 238, 255, 0.09)"
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    // Viền phát sáng màn hình (Neon Cyan Bezel)
    ctx.strokeStyle = "#00E5FF"
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, W - 8, H - 8)

    // Dải Ribbon Tiêu Đề Trên Cùng (Header)
    ctx.fillStyle = "rgba(15, 66, 78, 0.95)"
    ctx.fillRect(14, 14, W - 28, 56)
    ctx.strokeStyle = "#00C853"
    ctx.lineWidth = 2
    ctx.strokeRect(14, 14, W - 28, 56)

    const q = currentQuestion || currentQuestionRef.current
    const idx = currentIdx ?? currentIdxRef.current ?? 0
    const total = totalQuestions || totalQuestionsRef.current || 5
    const timeRem = timeRemaining ?? timeRemainingRef.current ?? 20
    const maxTime = maxQuestionTime || maxQuestionTimeRef.current || 20
    const revealed = isRevealed ?? isRevealedRef.current ?? false
    const selOptId = selectedOptionId ?? selectedOptionIdRef.current
    const score = myScore ?? myScoreRef.current ?? 0
    const streak = myStreak ?? myStreakRef.current ?? 0
    const top = topic || topicRef.current || "KIẾN THỨC TỔNG HỢP"

    // Thông tin Tiến độ & Chủ đề
    ctx.font = "bold 22px 'Space Grotesk', sans-serif"
    ctx.fillStyle = "#6FEEFF"
    ctx.fillText(`CÂU ${idx + 1}/${total} • ${top.toUpperCase()}`, 32, 49)

    // Điểm số & Chuỗi thắng trên màn hình
    ctx.fillStyle = "#FFB800"
    ctx.fillText(`ĐIỂM: ${score.toLocaleString()}đ`, W - 330, 49)
    if (streak > 1) {
      ctx.fillStyle = "#FF6B4A"
      ctx.fillText(`x${streak} 🔥`, W - 120, 49)
    }

    // Thanh năng lượng đếm ngược (Timer Bar)
    const timerRatio = Math.max(0, Math.min(1, timeRem / maxTime))
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
    ctx.fillRect(14, 70, W - 28, 10)
    ctx.fillStyle = timeRem <= 4 ? "#FF4D4D" : timeRem <= 8 ? "#FFB800" : "#00C853"
    ctx.fillRect(14, 70, (W - 28) * timerRatio, 10)

    // Đồng hồ đếm ngược số ở giữa (Timer Center Pill)
    ctx.fillStyle = timeRem <= 4 ? "#FF4D4D" : "#111827"
    ctx.fillRect(W / 2 - 45, 20, 90, 44)
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 3
    ctx.strokeRect(W / 2 - 45, 20, 90, 44)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 24px 'JetBrains Mono', monospace"
    ctx.textAlign = "center"
    ctx.fillText(`${timeRem}s`, W / 2, 51)
    ctx.textAlign = "left"

    if (q) {
      // -------------------------------------------------------------
      // NỘI DUNG CÂU HỎI TRỰC TIẾP TRÊN MÀN HÌNH ĐEN
      // -------------------------------------------------------------
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif"
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)"
      ctx.shadowBlur = 6

      const words = q.text.split(" ")
      let line = ""
      let lineY = 125
      const maxWidth = W - 80

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " "
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, 40, lineY)
          line = words[n] + " "
          lineY += 38
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, 40, lineY)
      ctx.shadowBlur = 0

      // Dòng hướng dẫn người chơi bấm trên màn hình đen
      ctx.fillStyle = "#6FEEFF"
      ctx.font = "bold 15px 'Space Grotesk', sans-serif"
      ctx.fillText("👉 BẤM CHUỘT TRỰC TIẾP VÀO CÁC Ô ĐÁP ÁN DƯỚI ĐÂY HOẶC DÙNG PHÍM 1-4 / A-D:", 40, 225)

      // -------------------------------------------------------------
      // 4 Ô ĐÁP ÁN A - B - C - D TRỰC TIẾP TRÊN MÀN HÌNH ĐEN
      // -------------------------------------------------------------
      q.options.forEach((opt, optIdx) => {
        const rect = OPTION_RECTS[optIdx]
        if (!rect) return

        const theme = OPTION_THEMES[optIdx] || OPTION_THEMES[0]
        const isSelected = selOptId === opt.id
        const isCorrect = opt.isCorrect

        let boxBg = theme.color
        let textColor = "#111827"
        let strokeColor = "#000000"
        let strokeWidth = 3

        if (revealed) {
          if (isCorrect) {
            boxBg = "#00C853"
            textColor = "#FFFFFF"
            strokeColor = "#FFFFFF"
            strokeWidth = 4
          } else if (isSelected && !isCorrect) {
            boxBg = "#FF4D4D"
            textColor = "#FFFFFF"
            strokeColor = "#FFFFFF"
            strokeWidth = 4
          } else {
            boxBg = "rgba(255, 255, 255, 0.12)"
            textColor = "#94a3b8"
            strokeColor = "rgba(255, 255, 255, 0.2)"
            strokeWidth = 2
          }
        } else if (isSelected) {
          boxBg = "#FFFFFF"
          textColor = "#000000"
          strokeColor = "#FFB800"
          strokeWidth = 6
        }

        // Khung nút bấm đáp án
        ctx.fillStyle = boxBg
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = strokeWidth
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)

        // Ô chữ cái A, B, C, D
        ctx.fillStyle = isSelected && !revealed ? "#FFB800" : "#000000"
        ctx.fillRect(rect.x + 10, rect.y + 10, 50, rect.h - 20)
        ctx.fillStyle = isSelected && !revealed ? "#000000" : "#FFFFFF"
        ctx.font = "bold 28px 'Space Grotesk', sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(theme.letter, rect.x + 35, rect.y + rect.h / 2 + 10)
        ctx.textAlign = "left"

        // Nội dung đáp án (màu sắc ô thể hiện trạng thái chọn & đúng/sai)
        ctx.fillStyle = textColor
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif"
        const optText = opt.text.length > 38 ? opt.text.substring(0, 36) + "..." : opt.text
        ctx.fillText(optText, rect.x + 75, rect.y + rect.h / 2 + 7)
      })

      // -------------------------------------------------------------
      // KHI ĐÃ HẾT GIỜ / CHỐT ĐÁP ÁN: HIỂN THỊ LỜI GIẢI VÀ NÚT TIẾP THEO
      // -------------------------------------------------------------
      if (revealed) {
        // Khung Giải thích chi tiết
        ctx.fillStyle = "rgba(13, 59, 68, 0.95)"
        ctx.fillRect(35, 446, 680, 54)
        ctx.strokeStyle = "#00C2CB"
        ctx.lineWidth = 2
        ctx.strokeRect(35, 446, 680, 54)

        ctx.fillStyle = "#6FEEFF"
        ctx.font = "bold 14px 'Space Grotesk', sans-serif"
        ctx.fillText("💡 GIẢI THÍCH:", 48, 478)

        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 15px 'Plus Jakarta Sans', sans-serif"
        const explText = q.explanation
          ? q.explanation.length > 60
            ? q.explanation.substring(0, 58) + "..."
            : q.explanation
          : "Đây là câu trả lời chính xác cho câu hỏi này."
        ctx.fillText(explText, 160, 478)

        // Nút "CÂU TIẾP THEO" trực tiếp trên màn hình đen!
        ctx.fillStyle = "#00a76d"
        ctx.fillRect(NEXT_BTN_RECT.x, NEXT_BTN_RECT.y, NEXT_BTN_RECT.w, NEXT_BTN_RECT.h)
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 3
        ctx.strokeRect(NEXT_BTN_RECT.x, NEXT_BTN_RECT.y, NEXT_BTN_RECT.w, NEXT_BTN_RECT.h)

        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 18px 'Space Grotesk', sans-serif"
        ctx.textAlign = "center"
        const nextText = idx + 1 < total ? "CÂU TIẾP THEO ➔" : "XEM KẾT QUẢ 🏆"
        ctx.fillText(nextText, NEXT_BTN_RECT.x + NEXT_BTN_RECT.w / 2, NEXT_BTN_RECT.y + NEXT_BTN_RECT.h / 2 + 6)
        ctx.textAlign = "left"
      }
    } else {
      ctx.fillStyle = "#6FEEFF"
      ctx.font = "bold 36px 'Space Grotesk', sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("TRƯỜNG THI 3D", W / 2, H / 2)
      ctx.font = "20px 'Plus Jakarta Sans', sans-serif"
      ctx.fillStyle = "#cbd5e1"
      ctx.fillText("Đang tải dữ liệu...", W / 2, H / 2 + 45)
      ctx.textAlign = "left"
    }

    texture.needsUpdate = true
  }, [currentQuestion, currentIdx, totalQuestions, timeRemaining, maxQuestionTime, isRevealed, selectedOptionId, myScore, myStreak, topic])

  // Sync texture updates
  useEffect(() => {
    updateJumbotronTextureRef.current = updateJumbotronTexture
    updateJumbotronTexture()
  }, [updateJumbotronTexture])

  // -------------------------------------------------------------
  // 2. HELPER: CREATE BILLBOARD SPRITE FOR PLAYER EMOJI & NAME
  // -------------------------------------------------------------
  const createPlayerBillboard = (avatarEmoji: string, name: string, isMe = false) => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.fillStyle = isMe ? "#00C2CB" : "rgba(17, 24, 39, 0.88)"
    ctx.beginPath()
    ctx.roundRect(10, 10, 236, 108, 24)
    ctx.fill()
    ctx.strokeStyle = isMe ? "#FFFFFF" : "#475569"
    ctx.lineWidth = 4
    ctx.stroke()

    ctx.font = "46px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(avatarEmoji || "🦊", 60, 80)

    ctx.fillStyle = isMe ? "#000000" : "#FFFFFF"
    ctx.font = "bold 22px 'Space Grotesk', sans-serif"
    ctx.textAlign = "left"
    const displayTag = isMe ? `${name} (BẠN)` : name
    ctx.fillText(displayTag.length > 12 ? displayTag.substring(0, 11) + ".." : displayTag, 100, 58)

    ctx.fillStyle = isMe ? "#064e3b" : "#94a3b8"
    ctx.font = "bold 15px 'Plus Jakarta Sans', sans-serif"
    ctx.fillText(isMe ? "★ Thí Sinh" : "Thí Sinh", 100, 86)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(1.8, 0.9, 1)
    return sprite
  }

  const createDeskBillboard = (text: string, bgColor = "#00C2CB") => {
    const canvas = document.createElement("canvas")
    canvas.width = 384
    canvas.height = 96
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.fillStyle = bgColor
    ctx.beginPath()
    ctx.roundRect(8, 8, 368, 80, 20)
    ctx.fill()
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 4
    ctx.stroke()

    ctx.fillStyle = "#000000"
    ctx.font = "bold 24px 'Space Grotesk', sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(text, 192, 55)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(2.4, 0.6, 1)
    return sprite
  }

  // -------------------------------------------------------------
  // 3. INITIALIZE THREE.JS 3D SCENE
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene - Lighter, modern broadcast studio arena tone
    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#162838")
    scene.fog = new THREE.FogExp2("#162838", 0.016)
    sceneRef.current = scene

    // Camera (Góc nhìn POV rộng rãi, có thể điều chỉnh qua cài đặt)
    const initialFov = povSettingsRef.current.fov || 70
    const camera = new THREE.PerspectiveCamera(
      initialFov,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 5.2, 5.8)
    camera.lookAt(0, 3.2, -4.8)
    cameraRef.current = camera

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Lighting (Significantly brighter, luminous professional studio exam arena)
    const hemiLight = new THREE.HemisphereLight("#e2f2ff", "#1f3448", 1.5)
    scene.add(hemiLight)

    const ambientLight = new THREE.AmbientLight("#d0e8fa", 1.2)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight("#ffffff", 2.2)
    mainLight.position.set(6, 14, 8)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    scene.add(mainLight)

    // Dual overhead stadium floodlights illuminating the desks with bright clean light
    const studioLightLeft = new THREE.PointLight("#bbf2f6", 1.8, 22)
    studioLightLeft.position.set(-4.5, 8.5, 0)
    scene.add(studioLightLeft)

    const studioLightRight = new THREE.PointLight("#bbf2f6", 1.8, 22)
    studioLightRight.position.set(4.5, 8.5, 0)
    scene.add(studioLightRight)

    // Spotlight directly illuminating the big screen
    const screenSpotLight = new THREE.SpotLight("#ffffff", 3.0, 26, Math.PI / 2.6, 0.35)
    screenSpotLight.position.set(0, 8.5, 2)
    screenSpotLight.target.position.set(0, 4.6, -4.95)
    scene.add(screenSpotLight)
    scene.add(screenSpotLight.target)

    const cyanRim = new THREE.PointLight("#00E5FF", 2.6, 20)
    cyanRim.position.set(-8, 5, -3)
    scene.add(cyanRim)

    const orangeRim = new THREE.PointLight("#FFB800", 2.4, 20)
    orangeRim.position.set(8, 5, -3)
    scene.add(orangeRim)

    // Architectural Side Stage Light Pillars (Framing the Big Screen on left and right)
    const pillarGeo = new THREE.BoxGeometry(0.5, 8.5, 0.5)
    const pillarMat = new THREE.MeshStandardMaterial({
      color: "#1e364a",
      metalness: 0.6,
      roughness: 0.3,
    })

    const pillarLeft = new THREE.Mesh(pillarGeo, pillarMat)
    pillarLeft.position.set(-8.2, 4.5, -5.3)
    scene.add(pillarLeft)

    const pillarRight = new THREE.Mesh(pillarGeo, pillarMat)
    pillarRight.position.set(8.2, 4.5, -5.3)
    scene.add(pillarRight)

    // Glowing Neon Vertical Light Strips on Pillars
    const neonStripGeo = new THREE.BoxGeometry(0.12, 7.8, 0.12)
    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: "#00E5FF",
      emissive: "#00C2CB",
      emissiveIntensity: 1.5,
    })
    const neonLeft = new THREE.Mesh(neonStripGeo, neonCyanMat)
    neonLeft.position.set(-8.0, 4.5, -5.0)
    scene.add(neonLeft)

    const neonRight = new THREE.Mesh(neonStripGeo, neonCyanMat)
    neonRight.position.set(8.0, 4.5, -5.0)
    scene.add(neonRight)

    // -------------------------------------------------------------
    // A. FLOOR & CARPET (Brighter, sleek reflective studio stage)
    // -------------------------------------------------------------
    const floorGeo = new THREE.PlaneGeometry(30, 32)
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#22384c", // Brighter modern studio tile floor
      roughness: 0.35,  // Reflective glossy finish
      metalness: 0.25,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    scene.add(floor)

    const grid = new THREE.GridHelper(30, 30, "#00E5FF", "#2c4860")
    grid.position.y = 0.01
    scene.add(grid)

    const carpetGeo = new THREE.PlaneGeometry(5, 20)
    const carpetMat = new THREE.MeshStandardMaterial({
      color: "#0f5968",
      roughness: 0.5,
    })
    const carpet = new THREE.Mesh(carpetGeo, carpetMat)
    carpet.rotation.x = -Math.PI / 2
    carpet.position.set(0, 0.02, 0.5)
    carpet.receiveShadow = true
    scene.add(carpet)

    // -------------------------------------------------------------
    // B. GIANT 3D SCREEN ("MÀN HÌNH ĐEN" LỚN HIỂN THỊ VÀ BẤM ĐÁP ÁN)
    // -------------------------------------------------------------
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    jumbotronCanvasRef.current = canvas

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false // Critical: Zero mipmap rebuild on ticks
    if (renderer.capabilities.getMaxAnisotropy) {
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    }
    jumbotronTextureRef.current = texture

    // Screen Mesh Face (Big & Centered in View)
    // Placed at z: -4.95 to be clearly in front of the frame backplate!
    const screenGeo = new THREE.PlaneGeometry(14, 7)
    const screenMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
    })
    const screenMesh = new THREE.Mesh(screenGeo, screenMat)
    screenMesh.position.set(0, 4.6, -4.95)
    screenMesh.rotation.x = -0.04 // Tilt slightly down towards camera
    scene.add(screenMesh)
    screenMeshRef.current = screenMesh

    // Bezel Frame (Backplate placed safely behind at z: -5.25)
    const frameGeo = new THREE.BoxGeometry(14.5, 7.5, 0.2)
    const frameMat = new THREE.MeshStandardMaterial({
      color: "#0a1924",
      metalness: 0.8,
      roughness: 0.3,
    })
    const screenFrame = new THREE.Mesh(frameGeo, frameMat)
    screenFrame.position.set(0, 4.6, -5.25)
    screenFrame.rotation.x = -0.04
    scene.add(screenFrame)

    // Render texture immediately on mount
    updateJumbotronTextureRef.current?.()

    // -------------------------------------------------------------
    // C. 10 EXAM DESKS
    // -------------------------------------------------------------
    const deskGroup = new THREE.Group()

    DESK_CONFIGS.forEach((d) => {
      const isMyDesk = d.num === 3

      const tableGeo = new THREE.BoxGeometry(1.6, 0.08, 0.9)
      const tableMat = new THREE.MeshStandardMaterial({
        color: isMyDesk ? "#1f5869" : "#364e60", // Brighter modern table top
        metalness: 0.3,
        roughness: 0.4,
      })
      const table = new THREE.Mesh(tableGeo, tableMat)
      table.position.set(d.x, 0.8, d.z)
      table.castShadow = true
      table.receiveShadow = true
      deskGroup.add(table)

      if (isMyDesk) {
        myDeskMeshRef.current = table
        table.userData = { isMyDesk: true }
        myDeskObjectsRef.current.push(table)

        // Bảng tên bàn của bạn (ẩn đi khi ở xa, chỉ hiện khi lại gần)
        const deskBadge = createDeskBillboard("★ BÀN CỦA BẠN (Click hoặc phím E để ngồi)", "#00C2CB")
        if (deskBadge) {
          deskBadge.position.set(d.x, 2.1, d.z)
          deskBadge.visible = false
          deskGroup.add(deskBadge)
          myDeskObjectsRef.current.push(deskBadge)
          myDeskBadgeRef.current = deskBadge
        }
      }

      // Ghế thi đấu đặt phía sau bàn
      const chairMat = new THREE.MeshStandardMaterial({
        color: isMyDesk ? "#00C2CB" : "#243442",
        metalness: 0.2,
        roughness: 0.5,
      })
      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.5), chairMat)
      chairSeat.position.set(d.x, 0.45, d.z + 0.6)
      chairSeat.castShadow = true
      deskGroup.add(chairSeat)

      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.06), chairMat)
      chairBack.position.set(d.x, 0.7, d.z + 0.82)
      chairBack.castShadow = true
      deskGroup.add(chairBack)

      if (isMyDesk) {
        myDeskObjectsRef.current.push(chairSeat, chairBack)
      }

      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8)
      const legMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", metalness: 0.8 }) // Metallic silver
      const legOffsets = [
        [-0.7, 0.4, -0.35],
        [0.7, 0.4, -0.35],
        [-0.7, 0.4, 0.35],
        [0.7, 0.4, 0.35],
      ]
      legOffsets.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat)
        leg.position.set(d.x + lx, ly, d.z + lz)
        leg.castShadow = true
        deskGroup.add(leg)
      })

      const monGeo = new THREE.BoxGeometry(0.5, 0.35, 0.05)
      const monMat = new THREE.MeshStandardMaterial({
        color: "#00E5FF",
        emissive: "#005a66",
        emissiveIntensity: 1.2,
      })
      const mon = new THREE.Mesh(monGeo, monMat)
      mon.position.set(d.x, 1.05, d.z - 0.2)
      mon.rotation.x = -0.15
      deskGroup.add(mon)

      // Desk Number Badge
      const numCanvas = document.createElement("canvas")
      numCanvas.width = 128
      numCanvas.height = 64
      const nctx = numCanvas.getContext("2d")
      if (nctx) {
        nctx.fillStyle = isMyDesk ? "#00C2CB" : "#1e293b"
        nctx.fillRect(0, 0, 128, 64)
        nctx.strokeStyle = "#FFFFFF"
        nctx.lineWidth = 4
        nctx.strokeRect(0, 0, 128, 64)
        nctx.fillStyle = isMyDesk ? "#000000" : "#FFFFFF"
        nctx.font = "bold 26px 'Space Grotesk', sans-serif"
        nctx.textAlign = "center"
        nctx.fillText(`BÀN ${d.num < 10 ? "0" + d.num : d.num}`, 64, 42)
      }
      const numTex = new THREE.CanvasTexture(numCanvas)
      const numPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.25),
        new THREE.MeshBasicMaterial({ map: numTex })
      )
      numPlate.position.set(d.x, 0.85, d.z + 0.46)
      deskGroup.add(numPlate)

      const lampGeo = new THREE.SphereGeometry(0.08, 12, 12)
      const lampMat = new THREE.MeshStandardMaterial({
        color: isMyDesk ? "#6FEEFF" : "#93c5fd",
        emissive: isMyDesk ? "#00E5FF" : "#3b82f6",
        emissiveIntensity: 1.2,
      })
      const lamp = new THREE.Mesh(lampGeo, lampMat)
      lamp.position.set(d.x + 0.6, 0.95, d.z - 0.25)
      deskGroup.add(lamp)

      const lampLight = new THREE.PointLight(isMyDesk ? "#00E5FF" : "#60a5fa", 1.4, 4)
      lampLight.position.set(d.x + 0.6, 1.1, d.z - 0.25)
      deskGroup.add(lampLight)

      deskLampsRef.current[d.num] = { light: lampLight, mesh: lamp }

      if (!isMyDesk) {
        const npcGroup = new THREE.Group()
        npcGroup.position.set(d.x, 0, d.z + 0.5)

        const npcBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.25, 0.65),
          new THREE.MeshStandardMaterial({ color: "#334155" })
        )
        npcBody.position.y = 0.65
        npcGroup.add(npcBody)

        const npcHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 16, 16),
          new THREE.MeshStandardMaterial({ color: "#e2e8f0" })
        )
        npcHead.position.y = 1.1
        npcGroup.add(npcHead)

        // Nhãn tên thí sinh khác (ẩn khi ở xa, chỉ hiện khi lại gần)
        const npcSprite = createPlayerBillboard(d.emoji, d.name, false)
        if (npcSprite) {
          npcSprite.position.set(0, 1.6, 0)
          npcSprite.visible = false
          npcGroup.add(npcSprite)
          npcSpritesRef.current[d.num] = npcSprite
        }

        deskGroup.add(npcGroup)
      }
    })

    scene.add(deskGroup)

    // -------------------------------------------------------------
    // D. 3D PLAYER CHARACTER
    // -------------------------------------------------------------
    const pGroup = new THREE.Group()
    pGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z)

    const shadowGeo = new THREE.CircleGeometry(0.35, 16)
    const shadowMat = new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.4 })
    const shadowDisk = new THREE.Mesh(shadowGeo, shadowMat)
    shadowDisk.rotation.x = -Math.PI / 2
    shadowDisk.position.y = 0.02
    pGroup.add(shadowDisk)

    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.7, 16)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: "#00C2CB",
      metalness: 0.3,
      roughness: 0.4,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.7
    body.castShadow = true
    pGroup.add(body)

    const beltGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16)
    const beltMat = new THREE.MeshStandardMaterial({ color: "#0d3b44" })
    const belt = new THREE.Mesh(beltGeo, beltMat)
    belt.position.y = 0.5
    pGroup.add(belt)

    const headGeo = new THREE.SphereGeometry(0.22, 20, 20)
    const headMat = new THREE.MeshStandardMaterial({ color: "#ffe0bd", roughness: 0.5 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.25
    head.castShadow = true
    pGroup.add(head)

    const capGeo = new THREE.ConeGeometry(0.26, 0.2, 16)
    const capMat = new THREE.MeshStandardMaterial({ color: "#00a76d" })
    const cap = new THREE.Mesh(capGeo, capMat)
    cap.position.set(0, 1.45, -0.05)
    cap.rotation.x = -0.1
    pGroup.add(cap)

    const sprite = createPlayerBillboard(
      playerRef.current?.avatar || "🦊",
      playerRef.current?.nickname || "Thí Sinh",
      true
    )
    if (sprite) {
      sprite.position.set(0, 1.9, 0)
      pGroup.add(sprite)
      playerSpriteRef.current = sprite
    }

    scene.add(pGroup)
    playerMeshRef.current = pGroup

    // -------------------------------------------------------------
    // E. RAYCASTING: CLICK ON THE 3D SCREEN TO ANSWER OR CLICK FLOOR TO MOVE
    // Người dùng bấm trực tiếp trên màn hình đen!
    // -------------------------------------------------------------
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // 1. Pointer Down: Bắt đầu bấm chuột (ghi lại tọa độ để phân biệt Click và Giữ Chuột Xoay)
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest("button") || target.closest("header") || target.closest("input")) return

      isPointerDownRef.current = true
      // Chuột phải (button === 2) kích hoạt xoay camera ngay lập tức
      isDraggingCameraRef.current = event.button === 2
      pointerDownPosRef.current = { x: event.clientX, y: event.clientY }
      lastPointerPosRef.current = { x: event.clientX, y: event.clientY }
    }

    // 2. Pointer Move: Xoay camera 360 độ góc nhìn thứ 3
    const handlePointerMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isOverUI =
        target &&
        (target.closest("button") ||
          target.closest("header") ||
          target.closest("input") ||
          target.closest(".interactive-ui"))

      // Tính khoảng cách di chuyển chuột (movementX/Y hoặc delta)
      const dx =
        typeof event.movementX === "number" && !isNaN(event.movementX) && Math.abs(event.movementX) < 180
          ? event.movementX
          : event.clientX - lastPointerPosRef.current.x
      const dy =
        typeof event.movementY === "number" && !isNaN(event.movementY) && Math.abs(event.movementY) < 180
          ? event.movementY
          : event.clientY - lastPointerPosRef.current.y

      lastPointerPosRef.current = { x: event.clientX, y: event.clientY }

      // QUAY CHUỘT XUNG QUANH PHÒNG THI KHI ĐANG ĐI DẠO
      if (!isSeatedRef.current && !isOverUI) {
        const settings = povSettingsRef.current
        const sensitivity = settings.mouseSensitivity || 1.0

        if (settings.mouseControl === "FREE_LOOK") {
          // BẠN CHỈ CẦN QUAY CHUỘT THÔI, KHÔNG CẦN GIỮ CHUỘT!
          cameraYawRef.current -= dx * 0.0035 * sensitivity
          cameraPitchRef.current = Math.max(
            0.02,
            Math.min(1.2, cameraPitchRef.current + dy * 0.0025 * sensitivity)
          )
        } else if (isPointerDownRef.current) {
          // Chế độ giữ chuột kéo
          const dist = Math.hypot(
            event.clientX - pointerDownPosRef.current.x,
            event.clientY - pointerDownPosRef.current.y
          )
          if (dist > 4 || event.button === 2) {
            isDraggingCameraRef.current = true
          }
          if (isDraggingCameraRef.current) {
            cameraYawRef.current -= dx * 0.0055 * sensitivity
            cameraPitchRef.current = Math.max(
              0.02,
              Math.min(1.2, cameraPitchRef.current + dy * 0.004 * sensitivity)
            )
            renderer.domElement.style.cursor = "grabbing"
            return
          }
        }
      }

      // Rê chuột bình thường: Đổi con trỏ thành bàn tay (pointer) khi qua các vật thể tương tác
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      let isHoveringInteractive = false

      if (!isSeatedRef.current && myDeskObjectsRef.current.length > 0) {
        const deskHits = raycaster.intersectObjects(myDeskObjectsRef.current, true)
        if (deskHits.length > 0) {
          isHoveringInteractive = true
        }
      }

      if (!isHoveringInteractive && screenMeshRef.current) {
        const screenHits = raycaster.intersectObject(screenMeshRef.current)
        if (screenHits.length > 0 && screenHits[0].uv) {
          const uv = screenHits[0].uv
          const canvasX = uv.x * 1024
          const canvasY = (1 - uv.y) * 512

          if (isRevealedRef.current) {
            if (
              canvasX >= NEXT_BTN_RECT.x &&
              canvasX <= NEXT_BTN_RECT.x + NEXT_BTN_RECT.w &&
              canvasY >= NEXT_BTN_RECT.y &&
              canvasY <= NEXT_BTN_RECT.y + NEXT_BTN_RECT.h
            ) {
              isHoveringInteractive = true
            }
          } else if (currentQuestionRef.current) {
            for (let i = 0; i < currentQuestionRef.current.options.length; i++) {
              const optRect = OPTION_RECTS[i]
              if (
                optRect &&
                canvasX >= optRect.x &&
                canvasX <= optRect.x + optRect.w &&
                canvasY >= optRect.y &&
                canvasY <= optRect.y + optRect.h
              ) {
                isHoveringInteractive = true
                break
              }
            }
          }
        }
      }

      renderer.domElement.style.cursor = isHoveringInteractive
        ? "pointer"
        : !isSeatedRef.current
        ? povSettingsRef.current.mouseControl === "FREE_LOOK"
          ? "crosshair"
          : "grab"
        : "default"
    }

    // 3. Pointer Up: Nhả chuột (nếu không kéo xoay thì xử lý Click tương tác)
    const handlePointerUp = (event: MouseEvent) => {
      if (!isPointerDownRef.current) return
      const wasDragging =
        povSettingsRef.current.mouseControl === "DRAG_TO_LOOK" &&
        (isDraggingCameraRef.current || event.button === 2)
      isPointerDownRef.current = false
      isDraggingCameraRef.current = false

      if (wasDragging) {
        renderer.domElement.style.cursor = !isSeatedRef.current ? "grab" : "default"
        return // Không kích hoạt Click khi vừa xoay camera
      }

      const target = event.target as HTMLElement
      if (target.closest("button") || target.closest("header") || target.closest("input")) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      // A. KIỂM TRA CLICK VÀO BÀN CỦA BẠN (KHI ĐANG ĐỨNG) ĐỂ NGỒI XUỐNG VÀ MỞ MÀN HÌNH LỚN
      if (!isSeatedRef.current && myDeskObjectsRef.current.length > 0) {
        const deskHits = raycaster.intersectObjects(myDeskObjectsRef.current, true)
        if (deskHits.length > 0) {
          setIsSeated(true)
          return
        }
      }

      // B. KIỂM TRA CLICK VÀO MÀN HÌNH ĐEN (GIANT 3D SCREEN)
      if (screenMeshRef.current) {
        const screenHits = raycaster.intersectObject(screenMeshRef.current)
        if (screenHits.length > 0 && screenHits[0].uv) {
          const uv = screenHits[0].uv
          const canvasX = uv.x * 1024
          const canvasY = (1 - uv.y) * 512

          if (isRevealedRef.current) {
            if (
              canvasX >= NEXT_BTN_RECT.x &&
              canvasX <= NEXT_BTN_RECT.x + NEXT_BTN_RECT.w &&
              canvasY >= NEXT_BTN_RECT.y &&
              canvasY <= NEXT_BTN_RECT.y + NEXT_BTN_RECT.h
            ) {
              if (onNextQuestionRef.current) {
                onNextQuestionRef.current()
                return
              }
            }
          }

          if (!isRevealedRef.current && currentQuestionRef.current) {
            for (let i = 0; i < currentQuestionRef.current.options.length; i++) {
              const optRect = OPTION_RECTS[i]
              if (
                optRect &&
                canvasX >= optRect.x &&
                canvasX <= optRect.x + optRect.w &&
                canvasY >= optRect.y &&
                canvasY <= optRect.y + optRect.h
              ) {
                const opt = currentQuestionRef.current.options[i]
                if (opt && onSelectOptionRef.current) {
                  onSelectOptionRef.current(opt.id)
                  return
                }
              }
            }
          }
          return
        }
      }

      // C. CLICK VÀO SÀN ĐỂ DI CHUYỂN
      const floorHits = raycaster.intersectObject(floor)
      if (floorHits.length > 0) {
        if (isSeatedRef.current) {
          setIsSeated(false)
        }
        const pt = floorHits[0].point
        const cx = Math.max(-8, Math.min(8, pt.x))
        const cz = Math.max(-4.5, Math.min(6, pt.z))
        playerTargetPosRef.current = { x: cx, z: cz }
      }
    }

    // 4. Cuộn chuột để Zoom camera gần/xa
    const handleWheel = (e: WheelEvent) => {
      if (isSeatedRef.current) return
      const current = povSettingsRef.current.cameraDist || 5.6
      const next = Math.max(3.5, Math.min(9.0, current + e.deltaY * 0.005))
      updatePovSetting("cameraDist", next)
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault() // Cho phép giữ chuột phải xoay góc nhìn mượt mà như game MMORPG/AAA
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: true })
    renderer.domElement.addEventListener("contextmenu", handleContextMenu)

    // -------------------------------------------------------------
    // F. KEYBOARD LISTENERS (WASD / MŨI TÊN & PHÍM TẮT 1-4, A-D)
    // -------------------------------------------------------------
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      // Phím ESC: Đóng modal POV hoặc chuyển đổi giữa Ngồi vào bàn thi / Đứng dậy đi dạo
      if (key === "escape") {
        if (showPovSettingsRef.current) {
          setShowPovSettings(false)
          return
        }
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
        setIsSeated((prev) => !prev)
        return
      }

      // Phím E: Nếu đang đứng, nhấn E để ngồi vào bàn thi
      if (!isSeatedRef.current) {
        if (key === "e") {
          setIsSeated(true)
          return
        }
      } else {
        // Nếu đang ngồi mà bấm phím di chuyển WASD / Mũi tên -> Tự động đứng dậy
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
          setIsSeated(false)
        }
      }

      keysPressedRef.current[key] = true
      playerTargetPosRef.current = null

      // Phím tắt chọn đáp án nhanh trên bàn phím (1-4 hoặc A-D)
      if (!isRevealedRef.current && currentQuestionRef.current) {
        const opts = currentQuestionRef.current.options
        if (key === "1" || key === "a") {
          if (opts[0] && onSelectOptionRef.current) onSelectOptionRef.current(opts[0].id)
        } else if (key === "2" || key === "b") {
          if (opts[1] && onSelectOptionRef.current) onSelectOptionRef.current(opts[1].id)
        } else if (key === "3" || key === "c") {
          if (opts[2] && onSelectOptionRef.current) onSelectOptionRef.current(opts[2].id)
        } else if (key === "4" || key === "d") {
          if (opts[3] && onSelectOptionRef.current) onSelectOptionRef.current(opts[3].id)
        }
      }

      // Enter hoặc Space để qua câu khi đã hết giờ
      if (isRevealedRef.current && (key === "enter" || key === " ")) {
        if (onNextQuestionRef.current) onNextQuestionRef.current()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // -------------------------------------------------------------
    // G. RESIZE HANDLER (100% OF WINDOW)
    // -------------------------------------------------------------
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener("resize", handleResize)

    // -------------------------------------------------------------
    // H. ANIMATION LOOP
    // -------------------------------------------------------------
    let walkCycle = 0
    const moveSpeed = 0.08

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate)

      // Cập nhật FOV của Camera trong thời gian thực khi người dùng chỉnh cài đặt POV
      if (cameraRef.current && cameraRef.current.fov !== povSettingsRef.current.fov) {
        cameraRef.current.fov = povSettingsRef.current.fov
        cameraRef.current.updateProjectionMatrix()
      }

      if (isSeatedRef.current) {
        // Thí sinh ngồi chuẩn tư thế tại Bàn thi số 03
        playerPosRef.current.x += (0 - playerPosRef.current.x) * 0.12
        playerPosRef.current.z += (-1.55 - playerPosRef.current.z) * 0.12
        playerRotationRef.current = 0

        if (playerMeshRef.current) {
          playerMeshRef.current.position.x = playerPosRef.current.x
          playerMeshRef.current.position.y = -0.15
          playerMeshRef.current.position.z = playerPosRef.current.z
          playerMeshRef.current.rotation.y = 0
        }

        // Camera hướng thẳng tới màn hình lớn
        if (cameraRef.current) {
          const targetCamX = 0
          const targetCamY = 3.6
          const targetCamZ = 2.4

          cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * 0.08
          cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.08
          cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * 0.08
          cameraRef.current.lookAt(0, 4.2, -4.95)
        }

        // Khi đang ngồi làm bài: Ẩn toàn bộ nhãn tương tác và thông báo tiệm cận
        if (myDeskBadgeRef.current) myDeskBadgeRef.current.visible = false
        Object.values(npcSpritesRef.current).forEach((sp) => {
          if (sp) sp.visible = false
        })
        if (nearbyTargetRef.current) {
          nearbyTargetRef.current = null
          setNearbyTarget(null)
        }
      } else {
        // Khi đứng dậy đi dạo quanh trường thi 3D
        let inputForward = 0
        let inputRight = 0

        // Keyboard WASD / Mũi tên
        const keys = keysPressedRef.current
        if (keys["w"] || keys["arrowup"]) inputForward += 1
        if (keys["s"] || keys["arrowdown"]) inputForward -= 1
        if (keys["d"] || keys["arrowright"]) inputRight += 1
        if (keys["a"] || keys["arrowleft"]) inputRight -= 1

        // Joystick trên mobile
        if (joystickVectorRef.current.x !== 0 || joystickVectorRef.current.y !== 0) {
          inputRight = joystickVectorRef.current.x
          inputForward = joystickVectorRef.current.y
          playerTargetPosRef.current = null
        }

        let moveX = 0
        let moveZ = 0

        // Chuyển đổi hướng di chuyển tương đối theo góc quay camera góc nhìn thứ 3
        const yaw = cameraYawRef.current
        const sinYaw = Math.sin(yaw)
        const cosYaw = Math.cos(yaw)

        if (inputForward !== 0 || inputRight !== 0) {
          moveX = inputRight * cosYaw - inputForward * sinYaw
          moveZ = -inputRight * sinYaw - inputForward * cosYaw
          playerTargetPosRef.current = null
        }

        // Point-to-click di chuyển sàn
        if (playerTargetPosRef.current) {
          const dx = playerTargetPosRef.current.x - playerPosRef.current.x
          const dz = playerTargetPosRef.current.z - playerPosRef.current.z
          const dist = Math.sqrt(dx * dx + dz * dz)

          if (dist > 0.15) {
            moveX = dx / dist
            moveZ = dz / dist
          } else {
            playerTargetPosRef.current = null
          }
        }

        const isMoving = moveX !== 0 || moveZ !== 0

        if (isMoving) {
          const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
          const vx = (moveX / len) * moveSpeed
          const vz = (moveZ / len) * moveSpeed

          playerPosRef.current.x = Math.max(-8, Math.min(8, playerPosRef.current.x + vx))
          playerPosRef.current.z = Math.max(-4.5, Math.min(6, playerPosRef.current.z + vz))

          // Xoay hướng mặt nhân vật mượt mà theo đúng hướng di chuyển trong Three.js
          const targetRot = Math.atan2(-vx, -vz)
          if (playerMeshRef.current) {
            let diff = targetRot - playerMeshRef.current.rotation.y
            while (diff < -Math.PI) diff += Math.PI * 2
            while (diff > Math.PI) diff -= Math.PI * 2
            playerMeshRef.current.rotation.y += diff * 0.18
            playerRotationRef.current = playerMeshRef.current.rotation.y
          }

          walkCycle += 0.25
          if (playerMeshRef.current) {
            playerMeshRef.current.position.y = Math.abs(Math.sin(walkCycle)) * 0.08
          }
        } else {
          if (playerMeshRef.current) {
            playerMeshRef.current.position.y = 0
          }
        }

        // Cập nhật vị trí nhân vật 3D
        if (playerMeshRef.current) {
          playerMeshRef.current.position.x = playerPosRef.current.x
          playerMeshRef.current.position.z = playerPosRef.current.z
        }

        // Camera Follow: Quay 360 độ góc nhìn thứ ba quanh nhân vật khi giữ chuột
        if (cameraRef.current) {
          if (cameraModeRef.current === "FOLLOW") {
            const pitch = cameraPitchRef.current
            const dist = povSettingsRef.current.cameraDist || 5.6

            const targetCamX = playerPosRef.current.x + dist * Math.sin(yaw) * Math.cos(pitch)
            const targetCamY = playerPosRef.current.y + 1.2 + dist * Math.sin(pitch)
            const targetCamZ = playerPosRef.current.z + dist * Math.cos(yaw) * Math.cos(pitch)

            cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * 0.1
            cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.1
            cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * 0.1

            cameraRef.current.lookAt(
              playerPosRef.current.x,
              playerPosRef.current.y + 1.2,
              playerPosRef.current.z
            )
          } else {
            // OVERVIEW: Góc nhìn bao quát toàn trường thi
            cameraRef.current.position.set(0, 7.5, 7.5)
            cameraRef.current.lookAt(0, 3.6, -4.5)
          }
        }

        // -------------------------------------------------------------
        // PROXIMITY DETECTION (CHỈ HIỆN KHI TIẾP CẬN GẦN BÀN HOẶC NGƯỜI)
        // -------------------------------------------------------------
        const px = playerPosRef.current.x
        const pz = playerPosRef.current.z

        // Khoảng cách tới Bàn thi số 03 (bàn của mình)
        const distToMyDesk = Math.hypot(px - 0, pz - (-2.0))
        const isNearMyDesk = distToMyDesk < 2.0

        if (myDeskBadgeRef.current) {
          myDeskBadgeRef.current.visible = isNearMyDesk
        }

        let closestTarget: NearbyTarget | null = null
        let minDistance = 999

        if (isNearMyDesk) {
          closestTarget = {
            type: "MY_DESK",
            deskNum: 3,
            name: "Bàn Thi #03 (Của Bạn)",
            emoji: "🪑",
            quote: "Bàn thi của bạn. Nhấn E hoặc bấm nút để ngồi thi.",
          }
          minDistance = distToMyDesk
        }

        // Khoảng cách tới các bàn NPC
        DESK_CONFIGS.forEach((d) => {
          if (d.num === 3) return
          const sprite = npcSpritesRef.current[d.num]
          const distToNpc = Math.hypot(px - d.x, pz - (d.z + 0.4))
          const isNearNpc = distToNpc < 1.9

          if (sprite) {
            sprite.visible = isNearNpc
          }

          if (isNearNpc && distToNpc < minDistance) {
            minDistance = distToNpc
            closestTarget = {
              type: "NPC",
              deskNum: d.num,
              name: d.name,
              emoji: d.emoji,
              quote: d.quote,
            }
          }
        })

        // Chỉ cập nhật state khi đối tượng tương tác thay đổi để tối ưu hiệu năng
        const prevTarget = nearbyTargetRef.current
        const isChanged =
          (!prevTarget && closestTarget) ||
          (prevTarget && !closestTarget) ||
          (prevTarget &&
            closestTarget &&
            (prevTarget.deskNum !== closestTarget.deskNum || prevTarget.type !== closestTarget.type))

        if (isChanged) {
          nearbyTargetRef.current = closestTarget
          setNearbyTarget(closestTarget)
        }
      }

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      renderer.domElement.removeEventListener("wheel", handleWheel)
      renderer.domElement.removeEventListener("contextmenu", handleContextMenu)
      myDeskObjectsRef.current = []
      myDeskBadgeRef.current = null
      npcSpritesRef.current = {}
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // -------------------------------------------------------------
  // 4. VIRTUAL JOYSTICK HANDLERS FOR MOBILE
  // -------------------------------------------------------------
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    joystickStartRef.current = { x: touch.clientX, y: touch.clientY }
    setVirtualJoystickActive(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickStartRef.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - joystickStartRef.current.x
    const dy = touch.clientY - joystickStartRef.current.y
    const maxDist = 45

    const dist = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    const clampedDist = Math.min(dist, maxDist)

    const vx = (clampedDist / maxDist) * Math.cos(angle)
    const vy = -(clampedDist / maxDist) * Math.sin(angle)

    joystickVectorRef.current = { x: vx, y: vy }
    setJoystickThumbPos({
      x: clampedDist * Math.cos(angle),
      y: clampedDist * Math.sin(angle),
    })
  }

  const handleTouchEnd = () => {
    joystickStartRef.current = null
    joystickVectorRef.current = { x: 0, y: 0 }
    setJoystickThumbPos({ x: 0, y: 0 })
    setVirtualJoystickActive(false)
  }

  // -------------------------------------------------------------
  // 5. UPDATE PLAYER DESK LAMP COLOR
  // -------------------------------------------------------------
  useEffect(() => {
    const desk3 = deskLampsRef.current[3]
    if (!desk3) return

    if (isRevealed) {
      const correctOpt = currentQuestion?.options.find((o) => o.isCorrect)
      const isCorrect = selectedOptionId ? selectedOptionId === correctOpt?.id : false
      const color = isCorrect ? "#00C853" : "#FF4D4D"
      desk3.light.color.set(color)
      ;(desk3.mesh.material as THREE.MeshStandardMaterial).emissive.set(color)
    } else if (selectedOptionId) {
      desk3.light.color.set("#FFB800")
      ;(desk3.mesh.material as THREE.MeshStandardMaterial).emissive.set("#FFB800")
    } else {
      desk3.light.color.set("#00C2CB")
      ;(desk3.mesh.material as THREE.MeshStandardMaterial).emissive.set("#00C2CB")
    }
  }, [isRevealed, selectedOptionId, currentQuestion])

  // -------------------------------------------------------------
  // 6. DYNAMIC PLAYER BILLBOARD UPDATE (IF PROFILE CHANGES)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!playerMeshRef.current || !playerSpriteRef.current) return
    const newSprite = createPlayerBillboard(
      player?.avatar || "🦊",
      player?.nickname || "Thí Sinh",
      true
    )
    if (newSprite) {
      playerMeshRef.current.remove(playerSpriteRef.current)
      playerSpriteRef.current = newSprite
      newSprite.position.set(0, 1.9, 0)
      playerMeshRef.current.add(newSprite)
    }
  }, [player?.avatar, player?.nickname])

  // Snap/reset player mesh when seating status toggles
  useEffect(() => {
    if (isSeated) {
      playerPosRef.current = { x: 0, y: -0.15, z: -1.55 }
      playerTargetPosRef.current = null
      playerRotationRef.current = 0
      cameraYawRef.current = 0
      cameraPitchRef.current = 0.28
      if (playerMeshRef.current) {
        playerMeshRef.current.position.set(0, -0.15, -1.55)
        playerMeshRef.current.rotation.y = 0
      }
    } else {
      if (playerMeshRef.current) {
        playerMeshRef.current.position.y = 0
      }
    }
  }, [isSeated])

  const progressPercent = Math.round(((currentIdx + 1) / totalQuestions) * 100)

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#132230] select-none z-10 flex flex-col justify-between">
      {/* 1. Three.js Canvas Container (Toàn bộ 100vw x 100vh) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Minimal Floating Top HUD Bar */}
      <header className="relative z-20 w-full px-4 pt-3 pb-2 flex items-center justify-between gap-3 pointer-events-none">
        <Link
          href="/lobby"
          className="pointer-events-auto btn-3d btn-3d-white px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Rời Phòng</span>
        </Link>

        {/* Minimal Progress Center */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-auto space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black text-white/90 drop-shadow">
            <span>Tiến Độ: Câu {currentIdx + 1}/{totalQuestions}</span>
            <span className="text-[#6FEEFF]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-black/60 border border-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#00C2CB] to-[#00a76d] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Stats & Camera / Seated Toggle */}
        <div className="flex items-center gap-2">
          {myStreak > 1 && (
            <div className="px-2.5 py-1 rounded-xl bg-orange-500 border border-black text-white font-black text-xs flex items-center gap-1 shadow">
              <Flame className="w-3.5 h-3.5 fill-white text-white animate-bounce" />
              <span>x{myStreak}</span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-white border-2 border-black text-slate-900 font-mono font-black text-xs flex items-center gap-1 shadow-[2px_2px_0px_#000]">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{myScore.toLocaleString()}đ</span>
          </div>

          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="pointer-events-auto p-1.5 rounded-xl bg-white border-2 border-black text-slate-800 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-[#00a76d]" />}
            </button>
          )}

          {isSeated ? (
            <button
              onClick={() => setIsSeated(false)}
              className="pointer-events-auto btn-3d btn-3d-white px-2.5 py-1.5 rounded-xl text-slate-900 shadow-[2px_2px_0px_#000] text-xs font-black flex items-center gap-1.5 cursor-pointer"
              title="Đứng dậy đi dạo quanh phòng thi (Phím ESC hoặc WASD)"
            >
              <Minimize2 className="w-4 h-4 text-slate-700" />
              <span className="hidden md:inline">Đi Dạo 🚶</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSeated(true)}
              className="pointer-events-auto btn-3d btn-3d-cyan px-2.5 py-1.5 rounded-xl text-slate-900 shadow-[2px_2px_0px_#000] text-xs font-black flex items-center gap-1.5 cursor-pointer"
              title="Ngồi vào bàn thi số 03 (Phím E)"
            >
              <Armchair className="w-4 h-4 text-slate-950" />
              <span className="hidden md:inline">Ngồi Bàn 🪑</span>
            </button>
          )}

          <button
            onClick={() => setCameraMode((prev) => (prev === "FOLLOW" ? "OVERVIEW" : "FOLLOW"))}
            className="pointer-events-auto btn-3d btn-3d-white p-1.5 rounded-xl text-slate-900 shadow-[2px_2px_0px_#000]"
            title={cameraMode === "FOLLOW" ? "Góc nhìn toàn cảnh" : "Góc theo sát nhân vật"}
          >
            {cameraMode === "FOLLOW" ? <Compass className="w-4 h-4 text-[#00C2CB]" /> : <Camera className="w-4 h-4 text-[#00a76d]" />}
          </button>

          {/* Nút mở cài đặt góc nhìn POV & Điều khiển */}
          <button
            onClick={() => setShowPovSettings(true)}
            className="pointer-events-auto btn-3d btn-3d-white px-2.5 py-1.5 rounded-xl text-slate-900 shadow-[2px_2px_0px_#000] text-xs font-black flex items-center gap-1.5 cursor-pointer"
            title="Cài đặt góc nhìn POV & Điều khiển chuột"
          >
            <Sliders className="w-4 h-4 text-[#00a76d]" />
            <span className="hidden lg:inline">POV ({povSettings.fov}°)</span>
          </button>
        </div>
      </header>

      {/* 3. FULL-SCREEN FOCUS EXAM INTERFACE (KHI THÍ SINH NGỒI VÀO BÀN THI) */}
      {isSeated && currentQuestion && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
          <div className="w-full max-w-5xl xl:max-w-6xl bg-[#FFFDF4] border-3 border-black rounded-3xl p-6 sm:p-8 md:p-10 shadow-[12px_12px_0px_#000] flex flex-col justify-between max-h-[94vh] overflow-y-auto">
            {/* Header: Topic, Desk Badge & Timer */}
            <div className="flex items-center justify-between gap-3 border-b-2 border-black/10 pb-4 sm:pb-5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl bg-slate-900 text-[#6FEEFF] text-xs sm:text-sm font-black uppercase tracking-wider border border-black shadow-[2px_2px_0px_#000]">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{topic}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#00C2CB]/20 border-2 border-[#00C2CB] text-[#006e75] text-xs sm:text-sm font-black">
                  <Armchair className="w-4 h-4" />
                  <span>Bàn Thi #03 (Chính Thức)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm sm:text-base font-black border-2 border-black shadow-[2px_2px_0px_#000] ${
                    timeRemaining <= 5
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-amber-100 text-amber-950"
                  }`}
                >
                  <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  <span>{timeRemaining}s</span>
                </div>

                <button
                  onClick={() => setIsSeated(false)}
                  className="btn-3d btn-3d-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer hover:bg-slate-100 transition"
                  title="Đứng dậy đi lại trong phòng thi 3D (Phím ESC hoặc WASD)"
                >
                  <Minimize2 className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline">Đứng Dậy Đi Dạo 🚶</span>
                  <span className="sm:hidden">Đi Dạo 🚶</span>
                </button>
              </div>
            </div>

            {/* Question Heading */}
            <div className="py-5 sm:py-7 md:py-8">
              <span className="text-sm sm:text-base font-black text-[#00a76d] uppercase tracking-wider block mb-2">
                Câu {currentIdx + 1} / {totalQuestions}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 leading-snug tracking-tight">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Options 4 Big Responsive Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 my-2 sm:my-4">
              {currentQuestion.options.map((opt, i) => {
                const theme = OPTION_THEMES[i] || { letter: String.fromCharCode(65 + i), color: "#00C2CB" }
                const isSelected = selectedOptionId === opt.id
                const isCorrect = opt.isCorrect

                let cardStyle = "bg-white hover:bg-slate-50 border-3 border-black text-slate-900 shadow-[5px_5px_0px_#000] active:translate-y-1 active:shadow-[1px_1px_0px_#000]"

                if (isRevealed) {
                  if (isCorrect) {
                    cardStyle = "bg-emerald-100 border-4 border-emerald-600 text-emerald-950 shadow-[5px_5px_0px_#059669]"
                  } else if (isSelected) {
                    cardStyle = "bg-rose-100 border-4 border-rose-600 text-rose-950 shadow-[5px_5px_0px_#e11d48]"
                  } else {
                    cardStyle = "bg-slate-100/60 border-2 border-slate-300 text-slate-400 opacity-40 shadow-none"
                  }
                } else if (isSelected) {
                  cardStyle = "bg-emerald-50 border-4 border-[#00a76d] text-slate-950 shadow-[5px_5px_0px_#00a76d]"
                }

                return (
                  <button
                    key={opt.id}
                    disabled={isRevealed}
                    onClick={() => onSelectOption(opt.id)}
                    className={`group text-left p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border-3 transition-all duration-150 flex items-center gap-4 sm:gap-5 cursor-pointer disabled:cursor-default ${cardStyle}`}
                  >
                    <div
                      className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl border-2 sm:border-3 border-black flex items-center justify-center font-black text-white text-lg sm:text-xl md:text-2xl shrink-0 shadow-[2px_2px_0px_#000]"
                      style={{ backgroundColor: theme.color }}
                    >
                      {theme.letter}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-base sm:text-lg md:text-xl font-bold leading-snug break-words">
                        {opt.text}
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm font-mono font-bold text-slate-400 hidden sm:inline-block">
                      [{i + 1}]
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Explanation & Next Question */}
            {isRevealed && (
              <div className="mt-6 pt-5 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex-1 text-left w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#00a76d]">
                    <Sparkles className="w-4 h-4" />
                    <span>GIẢI THÍCH CHI TIẾT:</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 font-semibold mt-1 leading-relaxed">
                    {currentQuestion.explanation || "Đây là đáp án chính xác theo kiến thức chuyên sâu."}
                  </p>
                </div>

                {onNextQuestion && (
                  <button
                    onClick={onNextQuestion}
                    className="w-full sm:w-auto btn-3d btn-3d-green px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg font-black flex items-center justify-center gap-2.5 shadow-[5px_5px_0px_#000] cursor-pointer shrink-0 animate-bounce"
                  >
                    <span>{currentIdx + 1 < totalQuestions ? "Câu Tiếp Theo" : "Xem Kết Quả"}</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. VIRTUAL JOYSTICK CHO MOBILE (KHI ĐANG ĐỨNG DẬY ĐI DẠO) */}
      {!isSeated && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden absolute bottom-12 left-4 w-20 h-20 rounded-full bg-black/60 border-2 border-white/40 flex items-center justify-center pointer-events-auto z-30 touch-none shadow-xl"
        >
          <div
            style={{
              transform: `translate(${joystickThumbPos.x}px, ${joystickThumbPos.y}px)`,
            }}
            className={`w-9 h-9 rounded-full ${
              virtualJoystickActive ? "bg-[#00C2CB] scale-110" : "bg-white/80"
            } shadow-md transition-transform duration-75`}
          />
        </div>
      )}

      {/* 5. THÔNG BÁO TƯƠNG TÁC TIỆM CẬN (CHỈ HIỆN KHI TIẾP CẬN GẦN BÀN HOẶC NGƯỜI) */}
      {!isSeated && nearbyTarget && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-200">
          {nearbyTarget.type === "MY_DESK" ? (
            <button
              onClick={() => setIsSeated(true)}
              className="btn-3d btn-3d-cyan px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl border-3 border-black text-slate-950 font-black text-sm sm:text-base flex items-center gap-3 shadow-[6px_6px_0px_#000] cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <Armchair className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
              <span>[Phím E] Ngồi Vào Bàn Thi #03 (Mở Đề Thi)</span>
            </button>
          ) : (
            <div className="bg-[#FFFDF4] border-3 border-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl shadow-[6px_6px_0px_#000] flex items-center gap-3.5 max-w-sm sm:max-w-md">
              <span className="text-3xl sm:text-4xl shrink-0 select-none">{nearbyTarget.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm sm:text-base">{nearbyTarget.name}</span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#00C2CB]/20 text-[#006e75] border border-[#00C2CB]/40">
                    Bàn {nearbyTarget.deskNum < 10 ? `0${nearbyTarget.deskNum}` : nearbyTarget.deskNum}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-bold mt-0.5 truncate">
                  &ldquo;{nearbyTarget.quote}&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL CÀI ĐẶT GÓC NHÌN POV & ĐIỀU KHIỂN CHUỘT */}
      {showPovSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 pointer-events-auto">
          <div className="w-full max-w-lg bg-[#FFFDF4] border-3 border-black rounded-3xl p-5 sm:p-7 shadow-[10px_10px_0px_#000] flex flex-col gap-4 sm:gap-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#00C2CB] border-2 border-black flex items-center justify-center text-slate-950 shadow-[2px_2px_0px_#000]">
                  <Eye className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950">Cài Đặt Góc Nhìn POV</h3>
                  <p className="text-xs text-slate-600 font-bold">Tùy chỉnh góc nhìn rộng và chế độ quay chuột</p>
                </div>
              </div>
              <button
                onClick={() => setShowPovSettings(false)}
                className="btn-3d btn-3d-white p-2 rounded-xl text-slate-700 shadow-[2px_2px_0px_#000] cursor-pointer"
                title="Đóng (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Góc nhìn FOV (Field of view) */}
            <div className="bg-white border-2 border-black rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#000] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-black text-slate-900">
                  Góc Nhìn FOV (Độ Rộng Trường Nhìn)
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs sm:text-sm font-black text-[#008f5d] px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-300">
                    {povSettings.fov}°
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {povSettings.fov < 60 ? "Hẹp" : povSettings.fov <= 75 ? "Rộng (Khuyến nghị)" : "Siêu Rộng"}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={50}
                max={95}
                step={1}
                value={povSettings.fov}
                onChange={(e) => updatePovSetting("fov", Number(e.target.value))}
                className="w-full accent-[#00a76d] cursor-pointer h-2 bg-slate-200 rounded-lg"
              />

              {/* Preset buttons */}
              <div className="flex items-center gap-2 pt-0.5">
                {[
                  { label: "55° Hẹp", val: 55 },
                  { label: "70° Rộng (Chuẩn)", val: 70 },
                  { label: "85° Siêu Rộng", val: 85 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => updatePovSetting("fov", item.val)}
                    className={`flex-1 text-[11px] sm:text-xs font-black py-1.5 px-2 rounded-xl border-2 border-black transition cursor-pointer ${
                      povSettings.fov === item.val
                        ? "bg-[#00C2CB] text-slate-950 shadow-[2px_2px_0px_#000]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Chế độ điều khiển quay chuột */}
            <div className="bg-white border-2 border-black rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#000] space-y-2.5">
              <label className="text-xs sm:text-sm font-black text-slate-900 block">
                Chế Độ Quay Chuột (Camera Look)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => updatePovSetting("mouseControl", "FREE_LOOK")}
                  className={`text-left p-3 rounded-xl border-2 border-black transition cursor-pointer ${
                    povSettings.mouseControl === "FREE_LOOK"
                      ? "bg-emerald-50 border-emerald-600 shadow-[3px_3px_0px_#059669]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-slate-950 text-xs sm:text-sm">
                    {povSettings.mouseControl === "FREE_LOOK" && <Check className="w-4 h-4 text-emerald-600" />}
                    <span>Tự Do Quay Chuột</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-bold mt-1 leading-snug">
                    Chỉ cần di chuột là xoay góc nhìn, không cần giữ phím hay chuột.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => updatePovSetting("mouseControl", "DRAG_TO_LOOK")}
                  className={`text-left p-3 rounded-xl border-2 border-black transition cursor-pointer ${
                    povSettings.mouseControl === "DRAG_TO_LOOK"
                      ? "bg-emerald-50 border-emerald-600 shadow-[3px_3px_0px_#059669]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-slate-950 text-xs sm:text-sm">
                    {povSettings.mouseControl === "DRAG_TO_LOOK" && <Check className="w-4 h-4 text-emerald-600" />}
                    <span>Giữ Chuột Để Quay</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-bold mt-1 leading-snug">
                    Nhấp giữ chuột trái/phải và kéo để xoay góc nhìn.
                  </p>
                </button>
              </div>
            </div>

            {/* 3. Độ nhạy quay chuột */}
            <div className="bg-white border-2 border-black rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#000] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-black text-slate-900">
                  Độ Nhạy Chuột (Sensitivity)
                </label>
                <span className="font-mono text-xs sm:text-sm font-black text-slate-800 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-300">
                  {povSettings.mouseSensitivity.toFixed(1)}x
                </span>
              </div>

              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={povSettings.mouseSensitivity}
                onChange={(e) => updatePovSetting("mouseSensitivity", Number(e.target.value))}
                className="w-full accent-[#00a76d] cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* 4. Khoảng cách camera */}
            <div className="bg-white border-2 border-black rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#000] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-black text-slate-900">
                  Khoảng Cách Camera
                </label>
                <span className="font-mono text-xs sm:text-sm font-black text-slate-800 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-300">
                  {povSettings.cameraDist.toFixed(1)}m
                </span>
              </div>

              <input
                type="range"
                min={3.5}
                max={9.0}
                step={0.2}
                value={povSettings.cameraDist}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  updatePovSetting("cameraDist", val)
                }}
                className="w-full accent-[#00a76d] cursor-pointer h-2 bg-slate-200 rounded-lg"
              />

              <div className="flex items-center gap-2 pt-0.5">
                {[
                  { label: "Gần (4.2m)", val: 4.2 },
                  { label: "Vừa (5.6m)", val: 5.6 },
                  { label: "Xa (7.5m)", val: 7.5 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      updatePovSetting("cameraDist", item.val)
                    }}
                    className={`flex-1 text-[11px] sm:text-xs font-black py-1.5 px-2 rounded-xl border-2 border-black transition cursor-pointer ${
                      Math.abs(povSettings.cameraDist - item.val) < 0.2
                        ? "bg-[#00C2CB] text-slate-950 shadow-[2px_2px_0px_#000]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t-2 border-black/10">
              <button
                type="button"
                onClick={resetPovSettings}
                className="btn-3d btn-3d-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer hover:bg-slate-100 transition"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>Mặc Định</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPovSettings(false)}
                className="btn-3d btn-3d-green px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Hoàn Tất & Lưu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
