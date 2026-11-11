"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { PlayerProfile } from "@/lib/player"
import {
  Gamepad2,
  Trophy,
  Sparkles,
  Users,
  Copy,
  Check,
  PlusCircle,
  ArrowLeft,
  Crown,
  Eye,
  Sliders,
  Play,
  UserPlus,
  Flame,
  HelpCircle,
  Clock,
  ChevronRight,
  BookOpen,
} from "lucide-react"

export interface GroupMemberItem {
  id: string
  role: string
  joinedAt: Date
  user: {
    id: string
    username: string
    name: string
    avatar?: string | null
  }
}

export interface GroupRoomItem {
  id: string
  code: string
  title: string
  topic?: string | null
  status: string
  maxPodiums: number
  quiz: {
    id: string
    title: string
    topic: string
    difficulty: string
    timePerQuestion: number
    _count: {
      questions: number
    }
  }
  _count?: {
    participants?: number
    attempts?: number
  }
}

export interface ThreeGroupWorldProps {
  player: PlayerProfile | null
  group: {
    id: string
    name: string
    code: string
    description?: string | null
    leaderId: string
    leader: {
      id: string
      username: string
      name: string
      avatar?: string | null
    }
    members: GroupMemberItem[]
    rooms: GroupRoomItem[]
  }
  isLeader: boolean
  onBackToLobby: () => void
  onOpenCreateRoom: () => void
  onOpenRoomStats: (roomId: string) => void
  onJoinRoom: (roomCode: string) => void
  onAddMember: (username: string) => Promise<{ success: boolean; error?: string }>
}

export default function ThreeGroupWorld({
  player,
  group,
  isLeader,
  onBackToLobby,
  onOpenCreateRoom,
  onOpenRoomStats,
  onJoinRoom,
  onAddMember,
}: ThreeGroupWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  // Camera Settings
  const [fov, setFov] = useState(65)
  const [cameraDistance, setCameraDistance] = useState(7.5)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Proximity Station ("rooms" | "create_quiz" | "leaderboard" | "members" | null)
  const [nearStation, setNearStation] = useState<"rooms" | "create_quiz" | "leaderboard" | "members" | null>(null)

  // Active Overlay Modal opened via E or HUD ("rooms" | "create_quiz" | "leaderboard" | "members" | null)
  const [activeModal, setActiveModal] = useState<"rooms" | "create_quiz" | "leaderboard" | "members" | null>(null)

  // Member invite form state
  const [inviteUsername, setInviteUsername] = useState("")
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Callback refs to prevent stale closures in animation loop
  const onOpenCreateRoomRef = useRef(onOpenCreateRoom)
  useEffect(() => {
    onOpenCreateRoomRef.current = onOpenCreateRoom
  }, [onOpenCreateRoom])

  // Key press listener for "E" to interact with nearest station
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E") {
        if (nearStation) {
          setActiveModal((prev) => (prev === nearStation ? null : nearStation))
        }
      } else if (e.key === "Escape") {
        setActiveModal(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nearStation])

  // Copy clan code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Handle add member
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUname = inviteUsername.trim()
    if (!cleanUname) return

    setIsInviting(true)
    setInviteMsg(null)

    const res = await onAddMember(cleanUname)
    if (res.success) {
      setInviteMsg({ type: "success", text: `Đã kết nạp thành công @${cleanUname}!` })
      setInviteUsername("")
    } else {
      setInviteMsg({ type: "error", text: res.error || "Không thể kết nạp đệ tử này." })
    }
    setIsInviting(false)
  }

  // --- THREE.JS IMPLEMENTATION ---
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let animationFrameId: number
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0c1117)
    scene.fog = new THREE.FogExp2(0x0c1117, 0.024)

    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000)
    camera.position.set(0, 4.5, 9)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // 2. Lighting (Martial Hall Lanterns & Golden Qi)
    const ambientLight = new THREE.AmbientLight(0xffe8a3, 0.7)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xfff3d1, 1.3)
    mainLight.position.set(12, 24, 12)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 1024
    mainLight.shadow.mapSize.height = 1024
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 60
    mainLight.shadow.camera.left = -22
    mainLight.shadow.camera.right = 22
    mainLight.shadow.camera.top = 22
    mainLight.shadow.camera.bottom = -22
    scene.add(mainLight)

    // Cyan accent light from ancient scrolls
    const cyanLight = new THREE.PointLight(0x6feeff, 1.2, 18)
    cyanLight.position.set(8, 3, -4)
    scene.add(cyanLight)

    // Crimson accent light from arena braziers
    const redLight = new THREE.PointLight(0xff453a, 1.4, 18)
    redLight.position.set(-8, 3, -4)
    scene.add(redLight)

    // 3. Ground (Clan Hall Stone Courtyard)
    const groundGeo = new THREE.CylinderGeometry(25, 25, 0.4, 32)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f272f,
      roughness: 0.75,
      metalness: 0.15,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.position.y = -0.2
    ground.receiveShadow = true
    scene.add(ground)

    // Outer martial boundary ring
    const borderRingGeo = new THREE.RingGeometry(24, 24.8, 32)
    const borderRingMat = new THREE.MeshBasicMaterial({
      color: 0x9b2226,
      side: THREE.DoubleSide,
    })
    const borderRing = new THREE.Mesh(borderRingGeo, borderRingMat)
    borderRing.rotation.x = -Math.PI / 2
    borderRing.position.y = 0.015
    scene.add(borderRing)

    // Central Yin-Yang emblem
    const centerRingGeo = new THREE.RingGeometry(3.2, 3.7, 32)
    const centerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffc857,
      side: THREE.DoubleSide,
    })
    const centerRing = new THREE.Mesh(centerRingGeo, centerRingMat)
    centerRing.rotation.x = -Math.PI / 2
    centerRing.position.y = 0.02
    scene.add(centerRing)

    // Helper: Canvas Sprite for Station Labels
    const createSignSprite = (title: string, sub: string, icon: string, bgColor: string, borderColor: string) => {
      const canvas = document.createElement("canvas")
      canvas.width = 340
      canvas.height = 130
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = bgColor
        ctx.strokeStyle = borderColor
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.roundRect(10, 10, 320, 110, 22)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = borderColor
        ctx.font = "bold 26px serif"
        ctx.textAlign = "center"
        ctx.fillText(`${icon} ${title}`, 170, 52)

        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 15px sans-serif"
        ctx.fillText(sub, 170, 84)

        ctx.fillStyle = borderColor
        ctx.font = "bold 12px sans-serif"
        ctx.fillText("[Bấm E để mở]", 170, 106)
      }
      const texture = new THREE.CanvasTexture(canvas)
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true })
      const sprite = new THREE.Sprite(mat)
      sprite.scale.set(3.4, 1.3, 1)
      return sprite
    }

    // 4. STATION 1: LÔI ĐÀI TỈ THÍ (Phòng Thi Đấu Theo Chủ Đề) -> Pos: (-8, 0, -4)
    const station1Pos = new THREE.Vector3(-8, 0, -4)
    const arenaPlatGeo = new THREE.CylinderGeometry(3.2, 3.6, 0.8, 8)
    const arenaPlatMat = new THREE.MeshStandardMaterial({ color: 0x4a181a, roughness: 0.6 })
    const arenaPlat = new THREE.Mesh(arenaPlatGeo, arenaPlatMat)
    arenaPlat.position.copy(station1Pos)
    arenaPlat.position.y = 0.4
    arenaPlat.receiveShadow = true
    scene.add(arenaPlat)

    // Battle Flag Pole
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 4.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x7a4b1f })
    )
    flagPole.position.set(-8, 2.6, -4)
    flagPole.castShadow = true
    scene.add(flagPole)

    const sign1 = createSignSprite("LÔI ĐÀI TỈ THÍ", `${group.rooms.length} Phòng Thi Đấu`, "⚔️", "#581216", "#FFC857")
    sign1.position.set(-8, 3.8, -4)
    scene.add(sign1)

    // 5. STATION 2: TÀNG KINH CÁC (Soạn Đề Thi Bằng AI) -> Pos: (8, 0, -4)
    const station2Pos = new THREE.Vector3(8, 0, -4)
    const pagodaBaseGeo = new THREE.CylinderGeometry(2.8, 3.2, 0.8, 8)
    const pagodaBaseMat = new THREE.MeshStandardMaterial({ color: 0x133830, roughness: 0.6 })
    const pagodaBase = new THREE.Mesh(pagodaBaseGeo, pagodaBaseMat)
    pagodaBase.position.copy(station2Pos)
    pagodaBase.position.y = 0.4
    pagodaBase.receiveShadow = true
    scene.add(pagodaBase)

    // Glowing Knowledge Shrine
    const shrineCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.8, 0),
      new THREE.MeshStandardMaterial({
        color: 0x6feeff,
        emissive: 0x2299aa,
        roughness: 0.2,
        metalness: 0.8,
      })
    )
    shrineCrystal.position.set(8, 2.2, -4)
    scene.add(shrineCrystal)

    const sign2 = createSignSprite("TÀNG KINH CÁC", "Soạn Đề Bằng AI", "📜", "#0d3b44", "#6FEEFF")
    sign2.position.set(8, 3.8, -4)
    scene.add(sign2)

    // 6. STATION 3: BIA ĐÁ PHONG THẦN (Xếp Hạng & Thống Kê) -> Pos: (0, 0, -9)
    const station3Pos = new THREE.Vector3(0, 0, -9)
    const stelePedestal = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.7, 2),
      new THREE.MeshStandardMaterial({ color: 0x2c353d })
    )
    stelePedestal.position.set(0, 0.35, -9)
    stelePedestal.receiveShadow = true
    scene.add(stelePedestal)

    const steleStone = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 4.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x1f272f, roughness: 0.4 })
    )
    steleStone.position.set(0, 2.8, -9)
    steleStone.castShadow = true
    scene.add(steleStone)

    const sign3 = createSignSprite("BIA ĐÁ PHONG THẦN", "Bảng Xếp Hạng Đệ Tử", "🏆", "#2A2510", "#FFC857")
    sign3.position.set(0, 4.6, -9)
    scene.add(sign3)

    // 7. STATION 4: TÔNG MÔN ĐIỆN (Thông Tin Bang Hội & Thành Viên) -> Pos: (0, 0, 7)
    const station4Pos = new THREE.Vector3(0, 0, 7)
    const gateAltar = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.6, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x3d2814, roughness: 0.7 })
    )
    gateAltar.position.copy(station4Pos)
    gateAltar.position.y = 0.3
    gateAltar.receiveShadow = true
    scene.add(gateAltar)

    const sign4 = createSignSprite(group.name, `${group.members.length} Đồng Môn • Mã: ${group.code}`, "🏛️", "#4A2800", "#FFC857")
    sign4.position.set(0, 3.2, 7)
    scene.add(sign4)

    // Surrounding Ancient Pillars with Lanterns
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.4, 6, 12)
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2c251e, roughness: 0.8 })
    const pillarCoords = [
      [-14, -10],
      [14, -10],
      [-14, 10],
      [14, 10],
      [-18, 0],
      [18, 0],
    ]
    pillarCoords.forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat)
      p.position.set(px, 3, pz)
      p.castShadow = true
      scene.add(p)

      // Lantern on top of pillar
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffa500 })
      )
      lantern.position.set(px, 6.2, pz)
      scene.add(lantern)
    })

    // 8. THIRD-PERSON CHARACTER (Hiệp Khách)
    const playerGroup = new THREE.Group()
    playerGroup.position.set(0, 0, 1)

    // Body (Áo bào kiếm khách)
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.42, 1.35, 12)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isLeader ? 0x9b2226 : 0x1b4d3e,
      roughness: 0.5,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.88
    body.castShadow = true
    playerGroup.add(body)

    // Golden Sash Belt
    const beltGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.16, 12)
    const beltMat = new THREE.MeshStandardMaterial({ color: 0xffc857, metalness: 0.5 })
    const belt = new THREE.Mesh(beltGeo, beltMat)
    belt.position.y = 0.88
    playerGroup.add(belt)

    // Head
    const headGeo = new THREE.SphereGeometry(0.25, 16, 16)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd5b5 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.7
    head.castShadow = true
    playerGroup.add(head)

    // Conical Hat (Nón lá kiếm hiệp)
    const hatGeo = new THREE.ConeGeometry(0.68, 0.28, 16)
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 })
    const hat = new THREE.Mesh(hatGeo, hatMat)
    hat.position.y = 1.92
    hat.castShadow = true
    playerGroup.add(hat)

    // Sword on back (Thanh kiếm sau lưng)
    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 1.25, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xe0e6ed, metalness: 0.9, roughness: 0.2 })
    )
    swordBlade.position.set(0.18, 1.1, -0.32)
    swordBlade.rotation.z = -0.35
    swordBlade.castShadow = true
    playerGroup.add(swordBlade)

    // Sword Hilt (Chuôi kiếm)
    const swordHilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xffc857, metalness: 0.7 })
    )
    swordHilt.position.set(0.4, 1.65, -0.32)
    swordHilt.rotation.z = -0.35
    playerGroup.add(swordHilt)

    // Martial Qi Aura Ring (Kiếm khí dưới chân)
    const auraGeo = new THREE.RingGeometry(0.7, 0.88, 32)
    const auraMat = new THREE.MeshBasicMaterial({
      color: isLeader ? 0xffc857 : 0x6feeff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
    const aura = new THREE.Mesh(auraGeo, auraMat)
    aura.rotation.x = -Math.PI / 2
    aura.position.y = 0.03
    playerGroup.add(aura)

    // Player Name Sprite
    const nameCanvas = document.createElement("canvas")
    nameCanvas.width = 256
    nameCanvas.height = 64
    const nameCtx = nameCanvas.getContext("2d")
    if (nameCtx) {
      nameCtx.fillStyle = isLeader ? "#9B2226" : "#11171D"
      nameCtx.strokeStyle = "#FFC857"
      nameCtx.lineWidth = 3
      nameCtx.beginPath()
      nameCtx.roundRect(8, 8, 240, 48, 14)
      nameCtx.fill()
      nameCtx.stroke()

      nameCtx.fillStyle = "#FFC857"
      nameCtx.font = "bold 20px serif"
      nameCtx.textAlign = "center"
      const displayName = player?.nickname || player?.username || "Hiệp Khách"
      nameCtx.fillText(isLeader ? `👑 ${displayName}` : displayName, 128, 39)
    }
    const nameTexture = new THREE.CanvasTexture(nameCanvas)
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTexture, transparent: true }))
    nameSprite.scale.set(2, 0.5, 1)
    nameSprite.position.y = 2.4
    playerGroup.add(nameSprite)

    scene.add(playerGroup)

    // 9. CONTROLLER & THIRD-PERSON CAMERA
    const keys: Record<string, boolean> = {}
    let targetPos: THREE.Vector3 | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture WASD if typing in input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      keys[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // Mouse Look (Free 360 camera rotation)
    let cameraYaw = 0
    let cameraPitch = 0.35

    const onMouseMove = (e: MouseEvent) => {
      // When inside modal, don't rotate camera
      if (activeModal) return
      const sensitivity = 0.003
      cameraYaw -= e.movementX * sensitivity
      cameraPitch += e.movementY * sensitivity
      cameraPitch = Math.max(0.08, Math.min(1.1, cameraPitch))
    }
    window.addEventListener("mousemove", onMouseMove)

    // Click on ground to move
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onPointerDown = (e: MouseEvent) => {
      if (activeModal) return
      if (e.target !== renderer.domElement) return
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObject(ground)
      if (intersects.length > 0) {
        targetPos = intersects[0].point.clone()
        targetPos.y = 0
      }
    }
    renderer.domElement.addEventListener("pointerdown", onPointerDown)

    // 10. ANIMATION LOOP
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()

      // Shrine crystal floating and rotating
      shrineCrystal.rotation.y += delta * 1.2
      shrineCrystal.rotation.x += delta * 0.6
      shrineCrystal.position.y = 2.2 + Math.sin(clock.getElapsedTime() * 2) * 0.15

      // Player Movement
      const moveSpeed = 6.5
      const moveDir = new THREE.Vector3()

      if (!activeModal) {
        if (keys["w"] || keys["arrowup"]) moveDir.z -= 1
        if (keys["s"] || keys["arrowdown"]) moveDir.z += 1
        if (keys["a"] || keys["arrowleft"]) moveDir.x -= 1
        if (keys["d"] || keys["arrowright"]) moveDir.x += 1
      }

      if (moveDir.lengthSq() > 0) {
        targetPos = null
        moveDir.normalize()

        // Rotate movement direction by camera yaw
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw)
        playerGroup.position.addScaledVector(moveDir, moveSpeed * delta)

        // Face player in movement direction
        const angle = Math.atan2(moveDir.x, moveDir.z)
        playerGroup.rotation.y = angle
      } else if (targetPos) {
        const dist = playerGroup.position.distanceTo(targetPos)
        if (dist > 0.2) {
          const dir = targetPos.clone().sub(playerGroup.position).normalize()
          playerGroup.position.addScaledVector(dir, moveSpeed * delta)
          playerGroup.rotation.y = Math.atan2(dir.x, dir.z)
        } else {
          targetPos = null
        }
      }

      // Constrain player within courtyard
      const maxRadius = 23
      if (playerGroup.position.length() > maxRadius) {
        playerGroup.position.setLength(maxRadius)
      }

      // Rotate foot aura
      aura.rotation.z += delta * 2.2

      // Camera Follows Player (Third Person)
      const currentDist = cameraDistance
      const camX = playerGroup.position.x + Math.sin(cameraYaw) * currentDist
      const camZ = playerGroup.position.z + Math.cos(cameraYaw) * currentDist
      const camY = playerGroup.position.y + 1.2 + Math.sin(cameraPitch) * currentDist

      camera.position.set(camX, camY, camZ)
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.3, playerGroup.position.z)

      // Proximity detection (< 4.2m)
      const dist1 = playerGroup.position.distanceTo(station1Pos)
      const dist2 = playerGroup.position.distanceTo(station2Pos)
      const dist3 = playerGroup.position.distanceTo(station3Pos)
      const dist4 = playerGroup.position.distanceTo(station4Pos)

      if (dist1 < 4.4) {
        setNearStation("rooms")
      } else if (dist2 < 4.4) {
        setNearStation("create_quiz")
      } else if (dist3 < 4.4) {
        setNearStation("leaderboard")
      } else if (dist4 < 4.4) {
        setNearStation("members")
      } else {
        setNearStation(null)
      }

      renderer.render(scene, camera)
    }

    animate()

    // 11. RESIZE LISTENER
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("pointerdown", onPointerDown)
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [fov, cameraDistance, isLeader, activeModal, group, player?.nickname, player?.username])

  return (
    <div className="relative w-full h-screen bg-[#0C1117] overflow-hidden select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />

      {/* TOP BAR HUD: Tên Bang Hội, Mã Nhóm, Nút Về Sảnh Tổng */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-6 flex items-center justify-between pointer-events-none z-20">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToLobby}
          className="pointer-events-auto px-4 py-2.5 rounded-xl bg-[#0D1217]/90 hover:bg-[#9B2226] border-2 border-[#FFC857] text-[#FFFDF4] text-xs font-black shadow-[3px_3px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-2 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-[#FFC857]" />
          <span>Về Sảnh Võ Lâm</span>
        </button>

        {/* Group Banner Badge */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0D1217]/90 border-2 border-[#FFC857] shadow-[3px_3px_0px_#000] backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-[#9B2226] border border-[#FFC857] flex items-center justify-center font-serif text-sm font-black text-[#FFC857]">
            {isLeader ? "👑" : "⚔️"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-sm text-[#FFC857] tracking-wide">
                {group.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B4D3E] border border-[#2D6A4F] text-[#6FEEFF] font-bold">
                {group.members.length} Đệ Tử
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
              <span>Mã Bang:</span>
              <span className="text-white font-black tracking-wider bg-black/40 px-1.5 py-0.5 rounded">
                {group.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="hover:text-[#FFC857] transition cursor-pointer ml-0.5"
                title="Sao chép mã bang"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Camera Settings Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-10 h-10 rounded-xl bg-[#0D1217]/90 border-2 border-[#7A4B1F] text-[#FFC857] flex items-center justify-center shadow-[2px_2px_0px_#000] hover:border-[#FFC857] transition cursor-pointer backdrop-blur-md"
            title="Cài đặt góc nhìn"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CAMERA SETTINGS POPUP */}
      {isSettingsOpen && (
        <div className="absolute top-18 right-6 w-72 p-4 rounded-2xl bg-[#0D1217]/95 border-2 border-[#FFC857] shadow-[6px_6px_0px_#000] text-white z-30 space-y-4 backdrop-blur-md animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between border-b border-[#7A4B1F]/60 pb-2">
            <span className="text-xs font-serif font-black text-[#FFC857] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Góc Nhìn Thứ 3
            </span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Tầm nhìn (FOV):</span>
                <span className="font-mono text-[#FFC857] font-bold">{fov}°</span>
              </div>
              <input
                type="range"
                min="45"
                max="90"
                value={fov}
                onChange={(e) => setFov(Number(e.target.value))}
                className="w-full accent-[#FFC857] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Khoảng cách camera:</span>
                <span className="font-mono text-[#FFC857] font-bold">{cameraDistance}m</span>
              </div>
              <input
                type="range"
                min="4.5"
                max="14"
                step="0.5"
                value={cameraDistance}
                onChange={(e) => setCameraDistance(Number(e.target.value))}
                className="w-full accent-[#FFC857] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* PROXIMITY INTERACTION BANNER (Hiện khi lại gần bất kỳ đài nào) */}
      {nearStation && !activeModal && (
        <div className="absolute top-22 inset-x-0 flex justify-center pointer-events-none z-20 animate-in fade-in-50 slide-in-from-top-4 duration-200">
          <div className="pointer-events-auto px-6 py-3.5 rounded-2xl bg-[#0D1217]/95 border-3 border-[#FFC857] shadow-[6px_6px_0px_#000] flex items-center gap-4 text-white backdrop-blur-md max-w-lg">
            <div className="w-11 h-11 rounded-xl bg-[#9B2226] border-2 border-[#FFC857] flex items-center justify-center text-xl shrink-0">
              {nearStation === "rooms" ? "⚔️" : nearStation === "create_quiz" ? "📜" : nearStation === "leaderboard" ? "🏆" : "👥"}
            </div>

            <div className="space-y-0.5">
              <h4 className="text-sm font-serif font-black text-[#FFC857] uppercase tracking-wide">
                {nearStation === "rooms"
                  ? "Lôi Đài Tỉ Thí"
                  : nearStation === "create_quiz"
                  ? "Tàng Kinh Các"
                  : nearStation === "leaderboard"
                  ? "Bia Đá Phong Thần"
                  : "Tông Môn Điện"}
              </h4>
              <p className="text-xs text-slate-300">
                {nearStation === "rooms"
                  ? `Có ${group.rooms.length} phòng thi đấu sẵn sàng. Bấm E để lên đài!`
                  : nearStation === "create_quiz"
                  ? "Soạn thảo phòng thi và bộ câu hỏi mới bằng Trí Tuệ Nhân Tạo AI"
                  : nearStation === "leaderboard"
                  ? "Thống kê số lần thi và bảng xếp hạng thành tích các đệ tử"
                  : `Tông chủ: ${group.leader.name} (@${group.leader.username})`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(nearStation)}
              className="px-4 py-2.5 rounded-xl bg-[#1B4D3E] hover:bg-[#2D6A4F] border-2 border-[#6FEEFF] text-[#6FEEFF] hover:text-white text-xs font-black uppercase flex items-center gap-1.5 shrink-0 cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
              <span>Bấm E / Mở</span>
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 1: LÔI ĐÀI TỈ THÍ (Danh sách phòng thi & Bước lên đài) */}
      {activeModal === "rooms" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="w-full max-w-2xl bg-[#0D1217] rounded-3xl border-3 border-[#FFC857] shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#9B2226] to-[#581216] border-b-2 border-[#FFC857] text-[#FFFDF4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚔️</span>
                <div>
                  <h3 className="text-lg font-serif font-black text-[#FFC857] uppercase tracking-wider">
                    Lôi Đài Tỉ Thí - {group.name}
                  </h3>
                  <p className="text-xs text-amber-100/80">
                    Chọn phòng thi theo chủ đề để bước lên lôi đài tỉ thí võ nghệ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Room List Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-serif font-bold text-[#FFC857] uppercase tracking-wider">
                  Danh Sách Lôi Đài ({group.rooms.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null)
                    onOpenCreateRoom()
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1B4D3E] hover:bg-[#2D6A4F] border border-[#6FEEFF] text-[#6FEEFF] text-xs font-black cursor-pointer flex items-center gap-1.5 transition shadow-[2px_2px_0px_#000]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Khởi Tạo Phòng Thi Mới</span>
                </button>
              </div>

              {group.rooms.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-[#7A4B1F]/60 bg-[#161D24] p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#9B2226]/30 border border-[#FFC857] flex items-center justify-center text-2xl">
                    ⚔️
                  </div>
                  <h4 className="text-sm font-serif font-bold text-[#FFC857]">
                    Chưa có lôi đài thi đấu nào trong bang!
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Huynh đệ hãy bấm nút bên dưới để dùng AI tạo ngay phòng thi trắc nghiệm theo chủ đề.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null)
                      onOpenCreateRoom()
                    }}
                    className="btn-3d btn-3d-green px-5 py-2.5 text-xs font-black uppercase cursor-pointer"
                  >
                    + Khởi Tạo Phòng Thi Đầu Tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {group.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl bg-[#161D24] border-2 border-[#7A4B1F] hover:border-[#FFC857] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[4px_4px_0px_#000]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-[#9B2226] text-[#FFFDF4] text-[10px] font-black uppercase tracking-wider border border-[#FFC857]/50">
                            {room.topic || room.quiz.topic || "Tổng Hợp"}
                          </span>
                          <h4 className="text-sm font-bold text-white">{room.title}</h4>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-[#FFC857]" />
                            {room.quiz._count.questions} câu hỏi
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {room.quiz.timePerQuestion}s / câu
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            {room._count?.attempts || 0} lượt tỉ thí
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModal(null)
                            onOpenRoomStats(room.id)
                          }}
                          className="px-3 py-2 rounded-xl bg-[#242C33] hover:bg-[#323D47] border border-[#7A4B1F] text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Xem thống kê & BXH"
                        >
                          <Trophy className="w-3.5 h-3.5 text-[#FFC857]" />
                          <span>BXH</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveModal(null)
                            onJoinRoom(room.code)
                          }}
                          className="px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#2D6A4F] border-2 border-[#FFC857] text-[#FFFDF4] text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 text-[#FFC857] fill-[#FFC857]" />
                          <span>Vào Thi</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 2: TÀNG KINH CÁC (Soạn Đề AI) */}
      {activeModal === "create_quiz" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="w-full max-w-lg bg-[#0D1217] rounded-3xl border-3 border-[#6FEEFF] shadow-[10px_10px_0px_#000] overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#0d3b44] to-[#133830] border-b-2 border-[#6FEEFF] text-[#FFFDF4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📜</span>
                <div>
                  <h3 className="text-lg font-serif font-black text-[#6FEEFF] uppercase tracking-wider">
                    Tàng Kinh Các - Soạn Đề AI
                  </h3>
                  <p className="text-xs text-teal-100/80">
                    Tạo ngân hàng câu hỏi và phòng thi mới cho huynh đệ trong bang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Option 1: AI Topic generator */}
              <div
                onClick={() => {
                  setActiveModal(null)
                  onOpenCreateRoom()
                }}
                className="p-4 rounded-2xl bg-[#161D24] border-2 border-[#1B4D3E] hover:border-[#6FEEFF] transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-black text-[#6FEEFF] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFC857]" /> Tạo Phòng Thi AI Theo Chủ Đề
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#6FEEFF] group-hover:translate-x-1 transition" />
                </div>
                <p className="text-xs text-slate-300">
                  Nhập bất kỳ chủ đề nào (Lập trình, Lịch sử, Đố vui, IQ...) - Hệ thống AI sẽ tự động sinh đề thi và mở phòng ngay lập tức.
                </p>
              </div>

              {/* Option 2: Full Quiz Studio */}
              <a
                href={`/quiz/create`}
                className="block p-4 rounded-2xl bg-[#161D24] border-2 border-[#7A4B1F] hover:border-[#FFC857] transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-black text-[#FFC857] uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#FFC857]" /> Soạn Đề Từ Giáo Trình / Tài Liệu PDF
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#FFC857] group-hover:translate-x-1 transition" />
                </div>
                <p className="text-xs text-slate-300">
                  Tải lên nội dung tài liệu ôn tập để AI trích xuất các câu hỏi trắc nghiệm chuyên sâu.
                </p>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 3: BIA ĐÁ PHONG THẦN (Xếp Hạng & Thống Kê Tổng Quan) */}
      {activeModal === "leaderboard" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="w-full max-w-2xl bg-[#0D1217] rounded-3xl border-3 border-[#FFC857] shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#3D2C04] to-[#1C1605] border-b-2 border-[#FFC857] text-[#FFFDF4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="text-lg font-serif font-black text-[#FFC857] uppercase tracking-wider">
                    Bia Đá Phong Thần - {group.name}
                  </h3>
                  <p className="text-xs text-amber-200/80">
                    Khắc ghi chiến tích, số lần tỉ thí và thứ hạng đệ tử
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content: Chọn phòng để xem BXH */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-[#161D24] border border-[#7A4B1F]">
                  <div className="text-xl font-black text-[#FFC857] font-serif">{group.rooms.length}</div>
                  <div className="text-[11px] text-slate-400 font-bold">Lôi Đài Thi Đấu</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161D24] border border-[#7A4B1F]">
                  <div className="text-xl font-black text-[#6FEEFF] font-serif">
                    {group.rooms.reduce((acc, r) => acc + (r._count?.attempts || 0), 0)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold">Lượt Tỉ Thí</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161D24] border border-[#7A4B1F]">
                  <div className="text-xl font-black text-emerald-400 font-serif">{group.members.length}</div>
                  <div className="text-[11px] text-slate-400 font-bold">Đệ Tử Trong Bang</div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-serif font-bold text-[#FFC857] uppercase tracking-wider mb-2">
                  Chọn Lôi Đài Để Tra Cứu Bảng Phong Thần Chi Tiết:
                </h4>

                {group.rooms.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    Chưa có lôi đài nào để hiển thị bảng phong thần.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {group.rooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => {
                          setActiveModal(null)
                          onOpenRoomStats(room.id)
                        }}
                        className="p-3.5 rounded-xl bg-[#161D24] border border-[#7A4B1F] hover:border-[#FFC857] transition flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <h5 className="text-xs font-bold text-white group-hover:text-[#FFC857] transition">
                            {room.title}
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            Chủ đề: {room.topic || room.quiz.topic} • {room._count?.attempts || 0} lượt tỉ thí
                          </span>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-[#9B2226] text-[#FFFDF4] text-xs font-black flex items-center gap-1 group-hover:bg-[#B23A22] transition"
                        >
                          <Trophy className="w-3.5 h-3.5 text-[#FFC857]" />
                          <span>Xem BXH</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 4: TÔNG MÔN ĐIỆN (Thông Tin Bang Hội, Thành Viên, Mời Đệ Tử) */}
      {activeModal === "members" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="w-full max-w-xl bg-[#0D1217] rounded-3xl border-3 border-[#FFC857] shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#4A2800] to-[#241300] border-b-2 border-[#FFC857] text-[#FFFDF4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="text-lg font-serif font-black text-[#FFC857] uppercase tracking-wider">
                    Tông Môn Điện - {group.name}
                  </h3>
                  <p className="text-xs text-amber-200/80">
                    Danh sách các huynh đệ đồng môn trong bang hội
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Leader Invite Member Form */}
              {isLeader && (
                <div className="p-4 rounded-2xl bg-[#161D24] border-2 border-[#9B2226] space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-black text-[#FFC857] uppercase tracking-wider">
                    <UserPlus className="w-4 h-4" /> Quyền Trưởng Nhóm: Kết Nạp Đệ Tử
                  </div>
                  <form onSubmit={handleInviteSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập tên tài khoản (username) đệ tử..."
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#0D1217] border border-[#7A4B1F] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FFC857]"
                    />
                    <button
                      type="submit"
                      disabled={isInviting}
                      className="px-4 py-2 rounded-xl bg-[#9B2226] hover:bg-[#B23A22] text-white text-xs font-black shrink-0 disabled:opacity-50 transition cursor-pointer"
                    >
                      {isInviting ? "Đang thêm..." : "+ Thêm"}
                    </button>
                  </form>
                  {inviteMsg && (
                    <p
                      className={`text-[11px] font-bold ${
                        inviteMsg.type === "success" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {inviteMsg.text}
                    </p>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2">
                <span className="text-xs font-serif font-bold text-[#FFC857] uppercase tracking-wider">
                  Huynh Đệ Đồng Môn ({group.members.length})
                </span>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 rounded-xl bg-[#161D24] border border-[#7A4B1F]/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#242C33] border border-[#7A4B1F] flex items-center justify-center font-bold text-xs text-white">
                          {member.user.avatar || member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{member.user.name}</span>
                            {member.user.id === group.leaderId && (
                              <span className="px-1.5 py-0.5 rounded bg-[#9B2226] text-[#FFC857] text-[10px] font-black uppercase flex items-center gap-0.5 border border-[#FFC857]/40">
                                <Crown className="w-3 h-3" /> Tông Chủ
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">@{member.user.username}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM HUD: Lối tắt tương tác nhanh & Hướng dẫn điều khiển */}
      <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none z-20">
        {/* Hướng dẫn phím */}
        <div className="px-3.5 py-2 rounded-xl bg-[#0D1217]/85 border border-[#7A4B1F]/60 text-slate-300 text-[11px] font-bold flex items-center gap-2 pointer-events-auto backdrop-blur-md">
          <span className="text-[#FFC857] font-black">🕹️ Di chuyển:</span>
          <span>WASD / Phím mũi tên / Click sàn</span>
          <span>•</span>
          <span className="text-[#6FEEFF]">Chuột xoay 360°</span>
        </div>

        {/* 4 Lối tắt trực tiếp */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setActiveModal("rooms")}
            className="px-3.5 py-2 rounded-xl bg-[#9B2226] hover:bg-[#B23A22] border-2 border-[#FFC857] text-[#FFFDF4] text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-[#FFC857]" />
            <span>Lôi Đài ({group.rooms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("create_quiz")}
            className="px-3.5 py-2 rounded-xl bg-[#0d3b44] hover:bg-[#133830] border-2 border-[#6FEEFF] text-[#6FEEFF] hover:text-white text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
            <span>Tạo Đề AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("leaderboard")}
            className="px-3.5 py-2 rounded-xl bg-[#2A2510] hover:bg-[#3D2C04] border-2 border-[#FFC857] text-[#FFC857] text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-[#FFC857]" />
            <span>Xếp Hạng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("members")}
            className="px-3.5 py-2 rounded-xl bg-[#161D24] hover:bg-[#242C33] border-2 border-[#7A4B1F] text-slate-200 text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-[#FFC857]" />
            <span>Đồng Môn ({group.members.length})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
