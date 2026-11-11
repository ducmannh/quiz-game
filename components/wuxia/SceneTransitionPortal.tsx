"use client"

import { useEffect, useState } from "react"

interface SceneTransitionPortalProps {
  isActive: boolean
  message?: string
  onComplete?: () => void
}

export default function SceneTransitionPortal({
  isActive,
  message = "Đang vận chuyển kiếm khí... Dịch chuyển đến Tông Đường",
  onComplete,
}: SceneTransitionPortalProps) {
  const [stage, setStage] = useState<"idle" | "entering" | "holding" | "exiting">("idle")

  useEffect(() => {
    if (isActive) {
      Promise.resolve().then(() => {
        setStage("entering")
      })
      const t1 = setTimeout(() => {
        setStage("holding")
        if (onComplete) onComplete()
      }, 700)

      const t2 = setTimeout(() => {
        setStage("exiting")
      }, 1200)

      const t3 = setTimeout(() => {
        setStage("idle")
      }, 1600)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    } else {
      Promise.resolve().then(() => {
        setStage("idle")
      })
    }
  }, [isActive, onComplete])

  if (stage === "idle") return null

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center transition-all duration-500 ${
        stage === "entering" || stage === "holding"
          ? "opacity-100 backdrop-blur-md bg-[#0D1217]/90"
          : "opacity-0 backdrop-blur-none bg-transparent"
      }`}
    >
      {/* Vòng hào quang kiếm khí xoáy tròn */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-t-[#FFC857] border-r-[#B23A22] border-b-[#1B4D3E] border-l-transparent animate-spin duration-700" />
        <div className="absolute inset-4 rounded-full border-2 border-dashed border-[#FFC857]/60 animate-spin duration-1000 direction-reverse" />
        <div className="w-24 h-24 rounded-full bg-radial from-[#FFC857]/30 via-[#B23A22]/20 to-transparent animate-pulse flex items-center justify-center text-4xl shadow-[0_0_50px_#FFC857]">
          ⚔️
        </div>
      </div>

      {/* Thông điệp dịch chuyển */}
      <div className="mt-6 text-center space-y-1.5">
        <p className="text-sm sm:text-base font-serif font-black tracking-widest text-[#FFC857] uppercase drop-shadow-[0_2px_10px_rgba(255,200,87,0.5)]">
          {message}
        </p>
        <p className="text-[11px] font-mono text-slate-400">
          Võ Lâm Càn Khôn Đại Na Di
        </p>
      </div>
    </div>
  )
}
