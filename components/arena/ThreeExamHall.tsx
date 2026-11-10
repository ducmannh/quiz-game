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

        // Nội dung đáp án
        ctx.fillStyle = textColor
        ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif"
        const optText = opt.text.length > 30 ? opt.text.substring(0, 28) + "..." : opt.text
        ctx.fillText(optText, rect.x + 75, rect.y + rect.h / 2 + 7)

        // Trạng thái Đúng / Sai
        if (revealed) {
          if (isCorrect) {
            ctx.fillStyle = "#FFFFFF"
            ctx.font = "bold 18px 'Space Grotesk', sans-serif"
            ctx.fillText("✓ ĐÚNG", rect.x + rect.w - 90, rect.y + rect.h / 2 + 7)
          } else if (isSelected && !isCorrect) {
            ctx.fillStyle = "#FFFFFF"
            ctx.font = "bold 18px 'Space Grotesk', sans-serif"
            ctx.fillText("✗ SAI", rect.x + rect.w - 75, rect.y + rect.h / 2 + 7)
          }
        } else if (isSelected) {
          ctx.fillStyle = "#00a76d"
          ctx.font = "bold 16px 'Space Grotesk', sans-serif"
          ctx.fillText("✓ ĐÃ CHỌN", rect.x + rect.w - 110, rect.y + rect.h / 2 + 7)
        }
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

    // Camera (Positioned to have the giant screen clearly visible directly ahead)
    const camera = new THREE.PerspectiveCamera(
      46,
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
    const deskRows = [
      { x: -5, z: -2.2, num: 1 },
      { x: -2.5, z: -2.2, num: 2 },
      { x: 0, z: -2.2, num: 3 }, // Player desk
      { x: 2.5, z: -2.2, num: 4 },
      { x: 5, z: -2.2, num: 5 },
      { x: -5, z: 1.2, num: 6 },
      { x: -2.5, z: 1.2, num: 7 },
      { x: 0, z: 1.2, num: 8 },
      { x: 2.5, z: 1.2, num: 9 },
      { x: 5, z: 1.2, num: 10 },
    ]

    const deskGroup = new THREE.Group()

    deskRows.forEach((d) => {
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

        const randomEmojis = ["🦁", "🐼", "🐨", "🐰", "🐯", "🐻", "🐶", "🐱"]
        const npcSprite = createPlayerBillboard(
          randomEmojis[d.num % randomEmojis.length],
          `Thí Sinh #${d.num}`,
          false
        )
        if (npcSprite) {
          npcSprite.position.set(0, 1.6, 0)
          npcGroup.add(npcSprite)
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

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest("button") || target.closest("header")) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      // 1. KIỂM TRA CLICK VÀO MÀN HÌNH ĐEN (GIANT 3D SCREEN)
      if (screenMeshRef.current) {
        const screenHits = raycaster.intersectObject(screenMeshRef.current)
        if (screenHits.length > 0 && screenHits[0].uv) {
          const uv = screenHits[0].uv
          const canvasX = uv.x * 1024
          const canvasY = (1 - uv.y) * 512

          // Kiểm tra nếu bấm nút "CÂU TIẾP THEO" trên màn hình khi đã hết giờ
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

          // Kiểm tra nếu bấm 1 trong 4 đáp án (A, B, C, D) trên màn hình đen!
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

      // 2. NẾU KHÔNG BẤM VÀO MÀN HÌNH -> CLICK VÀO SÀN ĐỂ DI CHUYỂN
      const floorHits = raycaster.intersectObject(floor)
      if (floorHits.length > 0) {
        const pt = floorHits[0].point
        const cx = Math.max(-8, Math.min(8, pt.x))
        const cz = Math.max(-4.5, Math.min(6, pt.z))
        playerTargetPosRef.current = { x: cx, z: cz }
      }
    }

    // Hover effect: Con trỏ đổi thành bàn tay (pointer) khi rê chuột qua các nút trên màn hình đen
    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      let isHoveringInteractive = false

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

      renderer.domElement.style.cursor = isHoveringInteractive ? "pointer" : "default"
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown)
    renderer.domElement.addEventListener("pointermove", handlePointerMove)

    // -------------------------------------------------------------
    // F. KEYBOARD LISTENERS (WASD / MŨI TÊN & PHÍM TẮT 1-4, A-D)
    // -------------------------------------------------------------
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysPressedRef.current[key] = true
      playerTargetPosRef.current = null

      // Phím tắt chọn đáp án nhanh trên bàn phím
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

      let moveX = 0
      let moveZ = 0

      // Keyboard
      const keys = keysPressedRef.current
      if (keys["w"] || keys["arrowup"]) moveZ -= 1
      if (keys["s"] || keys["arrowdown"]) moveZ += 1
      if (keys["a"] || keys["arrowleft"]) moveX -= 1
      if (keys["d"] || keys["arrowright"]) moveX += 1

      // Joystick
      if (joystickVectorRef.current.x !== 0 || joystickVectorRef.current.y !== 0) {
        moveX = joystickVectorRef.current.x
        moveZ = -joystickVectorRef.current.y
        playerTargetPosRef.current = null
      }

      // Point-to-click
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

        const targetRot = Math.atan2(vx, vz)
        playerRotationRef.current = targetRot

        walkCycle += 0.25
        if (playerMeshRef.current) {
          playerMeshRef.current.position.y = Math.abs(Math.sin(walkCycle)) * 0.08
        }
      } else {
        if (playerMeshRef.current) {
          playerMeshRef.current.position.y = 0
        }
      }

      // Update character 3D mesh
      if (playerMeshRef.current) {
        playerMeshRef.current.position.x = playerPosRef.current.x
        playerMeshRef.current.position.z = playerPosRef.current.z
        playerMeshRef.current.rotation.y = playerRotationRef.current
      }

      // Camera Follow: Keep screen in upper view and character in lower view
      if (cameraRef.current) {
        if (cameraModeRef.current === "FOLLOW") {
          const targetCamX = playerPosRef.current.x * 0.3
          const targetCamZ = playerPosRef.current.z + 5.2
          const targetCamY = 4.4

          cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * 0.06
          cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.06
          cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * 0.06

          cameraRef.current.lookAt(
            playerPosRef.current.x * 0.15,
            3.2,
            -4.5
          )
        } else {
          // OVERVIEW: Broad arena view
          cameraRef.current.position.set(0, 6.8, 6.8)
          cameraRef.current.lookAt(0, 3.6, -4.5)
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
      renderer.domElement.removeEventListener("pointermove", handlePointerMove)
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
              className="h-full bg-gradient-to-r from-[#00C2CB] to-[#00a76d] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Stats & Camera Toggle */}
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

          <button
            onClick={() => setCameraMode((prev) => (prev === "FOLLOW" ? "OVERVIEW" : "FOLLOW"))}
            className="pointer-events-auto btn-3d btn-3d-white p-1.5 rounded-xl text-slate-900 shadow-[2px_2px_0px_#000]"
            title={cameraMode === "FOLLOW" ? "Góc nhìn toàn cảnh" : "Góc theo sát nhân vật"}
          >
            {cameraMode === "FOLLOW" ? <Compass className="w-4 h-4 text-[#00C2CB]" /> : <Camera className="w-4 h-4 text-[#00a76d]" />}
          </button>
        </div>
      </header>

      {/* 3. Subtle Controls Hint At Bottom (Không còn bất kỳ thẻ trắng nào che khuất!) */}
      <footer className="relative z-20 w-full px-4 pb-3 flex justify-between items-center pointer-events-none">
        <div className="bg-black/75 backdrop-blur-md border border-white/20 text-white/90 px-3 py-1 rounded-2xl text-[11px] font-bold flex items-center gap-2 shadow">
          <span className="w-2 h-2 rounded-full bg-[#00C2CB] animate-pulse" />
          <span>🎮 Bấm trực tiếp lên màn hình đen để chọn đáp án • Di chuyển: <strong>WASD / Mũi tên / Click sàn</strong></span>
        </div>

        {selectedOptionId && !isRevealed && (
          <div className="bg-[#00a76d] border-2 border-white text-white px-3.5 py-1 rounded-2xl text-xs font-black shadow-lg animate-bounce">
            ✓ Đã Chốt Đáp Án Trên Màn Hình!
          </div>
        )}
      </footer>

      {/* 4. Virtual Joystick for Mobile (Bottom Left) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="sm:hidden absolute bottom-16 left-4 w-20 h-20 rounded-full bg-black/60 border-2 border-white/40 flex items-center justify-center pointer-events-auto z-30 touch-none shadow-xl"
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
    </div>
  )
}
