"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { getStoredPlayer } from "@/lib/player"
import WuxiaAuthGate from "@/components/wuxia/WuxiaAuthGate"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    Promise.resolve().then(() => {
      const player = getStoredPlayer()
      if (player && player.id && player.username) {
        router.replace("/lobby")
      } else {
        setCheckingAuth(false)
      }
    })
  }, [router])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#11171D] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#FFC857] mb-3" />
        <p className="text-xs font-black tracking-widest text-[#FFC857] uppercase font-serif">
          Đang khởi tạo cổng vào Võ Lâm...
        </p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#11171D] flex flex-col items-center justify-center p-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#FFC857] mb-3" />
          <p className="text-xs font-bold text-slate-400">Đang tải...</p>
        </div>
      }
    >
      <WuxiaAuthGate />
    </Suspense>
  )
}
