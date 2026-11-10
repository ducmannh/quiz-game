import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Fun Quiz AI - Đấu Trường Trí Tuệ Gameshow",
  description: "Web game trắc nghiệm đấu trường trường quay 10 bục thí sinh, sinh câu hỏi tự động bằng AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="vi"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Space+Grotesk:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFDF4] text-slate-900 font-sans antialiased">
        <Suspense fallback={<div className="h-16 w-full bg-[#FFFDF4] border-b border-[#E5E0D0]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
