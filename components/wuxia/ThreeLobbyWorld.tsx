"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { PlayerProfile } from "@/lib/player"
import {
  KeyRound,
  PlusCircle,
  Eye,
  Sliders,
  Sparkles,
  LogOut,
  FolderOpen,
} from "lucide-react"

export interface ThreeLobbyWorldProps {
  player: PlayerProfile | null
  groupsCount: number
  onOpenCreateGroup: () => void
  onOpenJoinGroup: () => void
  onOpenMyGroups: () => void
  onLogout: () => void
}

export default function ThreeLobbyWorld({
  player,
  groupsCount,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenMyGroups,
  onLogout,
}: ThreeLobbyWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  // Camera Settings
  const [fov, setFov] = useState(65)
  const [cameraDistance, setCameraDistance] = useState(7.5)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Proximity Station ("create_group" | "join_group" | "my_groups" | null)
  const [nearStation, setNearStation] = useState<"create_group" | "join_group" | "my_groups" | null>(null)

  // Callbacks refs to prevent stale closures in animation loop
  const onOpenCreateGroupRef = useRef(onOpenCreateGroup)
  const onOpenJoinGroupRef = useRef(onOpenJoinGroup)
  const onOpenMyGroupsRef = useRef(onOpenMyGroups)

  useEffect(() => {
    onOpenCreateGroupRef.current = onOpenCreateGroup
    onOpenJoinGroupRef.current = onOpenJoinGroup
    onOpenMyGroupsRef.current = onOpenMyGroups
  }, [onOpenCreateGroup, onOpenJoinGroup, onOpenMyGroups])

  // Key press listener for "E" to interact
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E") {
        if (nearStation === "create_group") {
          onOpenCreateGroupRef.current()
        } else if (nearStation === "join_group") {
          onOpenJoinGroupRef.current()
        } else if (nearStation === "my_groups") {
          onOpenMyGroupsRef.current()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nearStation])

  // --- THREE.JS IMPLEMENTATION ---
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let animationFrameId: number
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0e141a)
    scene.fog = new THREE.FogExp2(0x0e141a, 0.025)

    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000)
    camera.position.set(0, 4.5, 9)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // 2. Lighting (Moonlight & Warm Lanterns)
    const ambientLight = new THREE.AmbientLight(0xd4af37, 0.75)
    scene.add(ambientLight)

    const moonLight = new THREE.DirectionalLight(0xaad4f5, 1.2)
    moonLight.position.set(15, 25, 10)
    moonLight.castShadow = true
    moonLight.shadow.mapSize.width = 1024
    moonLight.shadow.mapSize.height = 1024
    moonLight.shadow.camera.near = 0.5
    moonLight.shadow.camera.far = 60
    moonLight.shadow.camera.left = -20
    moonLight.shadow.camera.right = 20
    moonLight.shadow.camera.top = 20
    moonLight.shadow.camera.bottom = -20
    scene.add(moonLight)

    // 3. Ground (Flagstone Martial Arts Courtyard)
    const groundGeo = new THREE.CylinderGeometry(24, 24, 0.4, 32)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x242c33,
      roughness: 0.8,
      metalness: 0.1,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.position.y = -0.2
    ground.receiveShadow = true
    scene.add(ground)

    // Central Yin-Yang / Lotus Platform Ring
    const ringGeo = new THREE.RingGeometry(3, 3.4, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffc857,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    scene.add(ring)

    // 4. STATION 1: ĐÀI LẬP BANG (x: -8, z: -4)
    const station1Pos = new THREE.Vector3(-8, 0, -4)
    const altarGeo = new THREE.CylinderGeometry(2, 2.2, 0.6, 16)
    const altarMat = new THREE.MeshStandardMaterial({ color: 0x4a181a, roughness: 0.6 })
    const altar1 = new THREE.Mesh(altarGeo, altarMat)
    altar1.position.copy(station1Pos)
    altar1.receiveShadow = true
    scene.add(altar1)

    // Pillar with Dragon Banner
    const bannerPole1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x7a4b1f })
    )
    bannerPole1.position.set(-8, 2, -4)
    bannerPole1.castShadow = true
    scene.add(bannerPole1)

    // Glowing Sign Sprite: "🏛️ ĐÀI LẬP BANG"
    const createSignSprite = (text: string, icon: string, bgColor: string) => {
      const canvas = document.createElement("canvas")
      canvas.width = 320
      canvas.height = 120
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = bgColor
        ctx.strokeStyle = "#FFC857"
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.roundRect(10, 10, 300, 100, 20)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = "#FFC857"
        ctx.font = "bold 26px serif"
        ctx.textAlign = "center"
        ctx.fillText(`${icon} ${text}`, 160, 52)

        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 16px sans-serif"
        ctx.fillText("Bấm E hoặc Lại gần", 160, 85)
      }
      const texture = new THREE.CanvasTexture(canvas)
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true })
      const sprite = new THREE.Sprite(mat)
      sprite.scale.set(3.2, 1.2, 1)
      return sprite
    }

    const sign1 = createSignSprite("ĐÀI LẬP BANG", "🏛️", "#78181C")
    sign1.position.set(-8, 3.2, -4)
    scene.add(sign1)

    // 5. STATION 2: ĐÀI BÁI SƠN / NHẬP MÃ (x: 8, z: -4)
    const station2Pos = new THREE.Vector3(8, 0, -4)
    const altar2 = new THREE.Mesh(altarGeo, new THREE.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.6 }))
    altar2.position.copy(station2Pos)
    altar2.receiveShadow = true
    scene.add(altar2)

    const bannerPole2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x7a4b1f })
    )
    bannerPole2.position.set(8, 2, -4)
    bannerPole2.castShadow = true
    scene.add(bannerPole2)

    const sign2 = createSignSprite("ĐÀI BÁI SƠN", "📜", "#1B4D3E")
    sign2.position.set(8, 3.2, -4)
    scene.add(sign2)

    // 6. STATION 3: CỔNG TÔNG MÔN (x: 0, z: -10)
    const station3Pos = new THREE.Vector3(0, 0, -10)
    const gatePillarGeo = new THREE.BoxGeometry(0.8, 5, 0.8)
    const gatePillarMat = new THREE.MeshStandardMaterial({ color: 0x5a1815 })
    const leftPillar = new THREE.Mesh(gatePillarGeo, gatePillarMat)
    leftPillar.position.set(-3.5, 2.5, -10)
    leftPillar.castShadow = true
    scene.add(leftPillar)

    const rightPillar = new THREE.Mesh(gatePillarGeo, gatePillarMat)
    rightPillar.position.set(3.5, 2.5, -10)
    rightPillar.castShadow = true
    scene.add(rightPillar)

    const beamGeo = new THREE.BoxGeometry(8.5, 0.8, 1.2)
    const beam = new THREE.Mesh(beamGeo, new THREE.MeshStandardMaterial({ color: 0x2a1d15 }))
    beam.position.set(0, 4.8, -10)
    beam.castShadow = true
    scene.add(beam)

    const sign3 = createSignSprite("CỔNG BANG HỘI", "⛩️", "#2A1D15")
    sign3.position.set(0, 5.8, -10)
    scene.add(sign3)

    // 7. PLAYER 3D MESH (Hiệp Khách với Kiếm Khí Hào Quang)
    const playerGroup = new THREE.Group()
    playerGroup.position.set(0, 0, 1)

    // Body Capsule
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.25, 1.2, 16)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.5 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.8
    body.castShadow = true
    playerGroup.add(body)

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf2d6ae, roughness: 0.8 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.6
    head.castShadow = true
    playerGroup.add(head)

    // Martial Arts Sword on Back
    const swordGeo = new THREE.BoxGeometry(0.06, 1.4, 0.12)
    const swordMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    const sword = new THREE.Mesh(swordGeo, swordMat)
    sword.position.set(0.18, 1.0, -0.25)
    sword.rotation.z = 0.35
    playerGroup.add(sword)

    // Floor Aura / Kiếm Khí Vòng Sáng
    const auraGeo = new THREE.RingGeometry(0.4, 0.65, 32)
    const auraMat = new THREE.MeshBasicMaterial({ color: 0x00c2cb, side: THREE.DoubleSide })
    const aura = new THREE.Mesh(auraGeo, auraMat)
    aura.rotation.x = -Math.PI / 2
    aura.position.y = 0.02
    playerGroup.add(aura)

    scene.add(playerGroup)

    // 8. CONTROLS STATE
    const keys: Record<string, boolean> = {}
    let targetPos: THREE.Vector3 | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // Mouse rotation (Quay chuột để nhìn xung quanh, không cần giữ)
    let cameraYaw = 0
    let cameraPitch = 0.25
    const onMouseMove = (e: MouseEvent) => {
      // Chỉ xoay khi di chuyển chuột trên canvas
      if (document.pointerLockElement === container || e.buttons === 0) {
        cameraYaw -= e.movementX * 0.003
        cameraPitch = Math.max(0.08, Math.min(0.65, cameraPitch + e.movementY * 0.002))
      }
    }
    window.addEventListener("mousemove", onMouseMove)

    // Click on ground to move
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onPointerDown = (e: MouseEvent) => {
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

    // 9. ANIMATION LOOP
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()

      // Player Movement
      const moveSpeed = 6.5
      const moveDir = new THREE.Vector3()

      // Keyboard input
      if (keys["w"] || keys["arrowup"]) moveDir.z -= 1
      if (keys["s"] || keys["arrowdown"]) moveDir.z += 1
      if (keys["a"] || keys["arrowleft"]) moveDir.x -= 1
      if (keys["d"] || keys["arrowright"]) moveDir.x += 1

      if (moveDir.lengthSq() > 0) {
        targetPos = null
        moveDir.normalize()

        // Xoay hướng di chuyển theo góc quay của camera
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw)
        playerGroup.position.addScaledVector(moveDir, moveSpeed * delta)

        // Xoay nhân vật theo hướng di chuyển
        const angle = Math.atan2(moveDir.x, moveDir.z)
        playerGroup.rotation.y = angle
      } else if (targetPos) {
        // Point and click path
        const dist = playerGroup.position.distanceTo(targetPos)
        if (dist > 0.2) {
          const dir = targetPos.clone().sub(playerGroup.position).normalize()
          playerGroup.position.addScaledVector(dir, moveSpeed * delta)
          playerGroup.rotation.y = Math.atan2(dir.x, dir.z)
        } else {
          targetPos = null
        }
      }

      // Giới hạn phạm vi sân võ lâm
      const maxRadius = 22
      if (playerGroup.position.length() > maxRadius) {
        playerGroup.position.setLength(maxRadius)
      }

      // Kiếm khí xoay tròn dưới chân
      aura.rotation.z += delta * 2

      // Camera follow player (Góc nhìn thứ 3)
      const currentDist = cameraDistance
      const camX = playerGroup.position.x + Math.sin(cameraYaw) * currentDist
      const camZ = playerGroup.position.z + Math.cos(cameraYaw) * currentDist
      const camY = playerGroup.position.y + 1.2 + Math.sin(cameraPitch) * currentDist

      camera.position.set(camX, camY, camZ)
      camera.lookAt(
        playerGroup.position.x,
        playerGroup.position.y + 1.3,
        playerGroup.position.z
      )

      // Kiểm tra khoảng cách tới 3 điểm tương tác (Proximity Detection < 4.2m)
      const dist1 = playerGroup.position.distanceTo(station1Pos)
      const dist2 = playerGroup.position.distanceTo(station2Pos)
      const dist3 = playerGroup.position.distanceTo(station3Pos)

      if (dist1 < 4.2) {
        setNearStation("create_group")
      } else if (dist2 < 4.2) {
        setNearStation("join_group")
      } else if (dist3 < 4.5) {
        setNearStation("my_groups")
      } else {
        setNearStation(null)
      }

      renderer.render(scene, camera)
    }

    animate()

    // 10. RESIZE LISTENER
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
  }, [fov, cameraDistance])

  return (
    <div className="relative w-full h-screen bg-[#0E141A] overflow-hidden select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />

      {/* TOP HUD: Hồ Sơ Hiệp Khách & Điều Khiển */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-6 flex items-center justify-between pointer-events-none z-20">
        {/* Profile Hiệp Khách */}
        <div className="p-2 sm:p-2.5 rounded-2xl bg-[#0D1217]/85 border-2 border-[#7A4B1F] shadow-[3px_3px_0px_#000] text-white flex items-center gap-3 pointer-events-auto backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-[#9B2226] border border-[#FFC857] flex items-center justify-center text-white font-black text-base shadow-[1px_1px_0px_#000]">
            {player?.username ? player.username.charAt(0).toUpperCase() : "武"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black font-serif text-[#FFC857]">
                {player?.nickname || player?.name || player?.username || "Hiệp Khách"}
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#1B4D3E] border border-[#2D6A4F] text-[#6FEEFF] font-bold">
                Trực Tuyến
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              @{player?.username} • {groupsCount} Bang Hội
            </div>
          </div>
        </div>

        {/* Cài đặt góc nhìn & Đăng xuất */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Nút cài đặt POV/FOV */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2.5 rounded-xl bg-[#0D1217]/85 hover:bg-[#1E2630] border-2 border-[#7A4B1F] text-[#FFC857] shadow-[2px_2px_0px_#000] transition cursor-pointer backdrop-blur-md"
            title="Cài đặt góc nhìn POV / Camera"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Đăng xuất */}
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-[#9B2226]/90 hover:bg-[#B23A22] border-2 border-[#FFC857] text-[#FFFDF4] text-xs font-black shadow-[2px_2px_0px_#000] transition cursor-pointer flex items-center gap-1.5"
            title="Rời khỏi giang hồ"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>

      {/* POPUP CÀI ĐẶT GÓC NHÌN (POV / FOV SETTINGS) */}
      {isSettingsOpen && (
        <div className="absolute top-18 right-4 sm:right-6 w-72 p-4 rounded-2xl bg-[#0D1217]/95 border-2 border-[#7A4B1F] shadow-[6px_6px_0px_#000] text-white z-30 space-y-3 backdrop-blur-lg">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="text-xs font-black uppercase text-[#FFC857] flex items-center gap-1.5 font-serif">
              <Eye className="w-4 h-4" />
              Góc Nhìn Hiệp Khách (POV)
            </span>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span>Độ rộng tầm mắt (FOV)</span>
              <span className="text-[#FFC857] font-mono">{fov}°</span>
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
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span>Khoảng cách Camera</span>
              <span className="text-[#FFC857] font-mono">{cameraDistance}m</span>
            </div>
            <input
              type="range"
              min="5"
              max="14"
              step="0.5"
              value={cameraDistance}
              onChange={(e) => setCameraDistance(Number(e.target.value))}
              className="w-full accent-[#FFC857] cursor-pointer"
            />
          </div>

          <p className="text-[10px] text-slate-400 italic">
            💡 Di chuyển chuột để quay camera xung quanh nhân vật.
          </p>
        </div>
      )}

      {/* PROXIMITY INTERACTIVE BANNER: Khi lại gần điểm tương tác */}
      {nearStation && (
        <div className="absolute bottom-20 sm:bottom-24 inset-x-4 flex justify-center pointer-events-none z-30 animate-in fade-in-50 slide-in-from-bottom-4 duration-150">
          <div className="pointer-events-auto p-4 sm:p-5 rounded-3xl bg-[#FAF6EE] text-[#1F1610] border-4 border-[#7A4B1F] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_0_2px_#FFC857] flex flex-col sm:flex-row items-center gap-4 max-w-lg">
            <div className="w-12 h-12 rounded-2xl bg-[#9B2226] border-2 border-[#FFC857] flex items-center justify-center text-2xl shadow-md shrink-0">
              {nearStation === "create_group" ? "🏛️" : nearStation === "join_group" ? "📜" : "⛩️"}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h4 className="text-base font-black font-serif text-[#161A1D]">
                {nearStation === "create_group"
                  ? "Đài Lập Bang: Khởi Tạo Nhóm Mới"
                  : nearStation === "join_group"
                  ? "Đài Bái Sơn: Gia Nhập Bằng Mã Mời"
                  : "Cổng Tông Môn: Xem Bang Hội Đang Tham Gia"}
              </h4>
              <p className="text-xs text-[#5C4D3C] font-bold mt-0.5">
                {nearStation === "create_group"
                  ? "Tạo nhóm thi đấu và nhập mã 230400 để nhận quyền Trưởng nhóm"
                  : nearStation === "join_group"
                  ? "Nhập mã GR-XXXX để gia nhập bang hội và so tài"
                  : `Bạn đang có ${groupsCount} bang hội sẵn sàng bước vào`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (nearStation === "create_group") onOpenCreateGroup()
                else if (nearStation === "join_group") onOpenJoinGroup()
                else if (nearStation === "my_groups") onOpenMyGroups()
              }}
              className="btn-3d btn-3d-green px-5 py-3 text-xs font-black uppercase flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#FFC857]" />
              <span>Bấm E / Mở Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM HUD: Hướng dẫn điều khiển & Lối tắt nhanh */}
      <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none z-20">
        {/* Phím di chuyển */}
        <div className="px-3.5 py-2 rounded-xl bg-[#0D1217]/80 border border-[#7A4B1F]/60 text-slate-300 text-[11px] font-bold flex items-center gap-2 pointer-events-auto backdrop-blur-md">
          <span className="text-[#FFC857] font-black">🕹️ Di chuyển:</span>
          <span>WASD / Phím mũi tên / Click sàn</span>
          <span>•</span>
          <span className="text-[#6FEEFF]">Chuột xoay 360°</span>
        </div>

        {/* 3 Lối tắt nhanh không cần đi bộ */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="px-3.5 py-2 rounded-xl bg-[#9B2226] hover:bg-[#B23A22] border-2 border-[#FFC857] text-[#FFFDF4] text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#FFC857]" />
            <span>Tạo Nhóm (230400)</span>
          </button>

          <button
            type="button"
            onClick={onOpenJoinGroup}
            className="px-3.5 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#2D6A4F] border-2 border-[#FFC857] text-[#FFFDF4] text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#FFC857]" />
            <span>Vào Bằng Mã</span>
          </button>

          <button
            type="button"
            onClick={onOpenMyGroups}
            className="px-3.5 py-2 rounded-xl bg-[#FAF6EE] hover:bg-white border-2 border-[#7A4B1F] text-[#161A1D] text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition cursor-pointer flex items-center gap-1.5"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#7A4B1F]" />
            <span>Bang Hội ({groupsCount})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
