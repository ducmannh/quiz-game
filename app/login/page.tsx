"use client"

import { Suspense } from "react"
import WuxiaAuthGate from "@/components/wuxia/WuxiaAuthGate"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
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
