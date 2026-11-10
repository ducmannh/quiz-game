import Link from "next/link"

export default function QuizLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl sm:text-5xl",
  }

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  }

  return (
    <Link href="/" className="inline-flex items-center gap-1 group select-none">
      <div className={`font-black tracking-tighter ${textSizes[size]} flex items-center leading-none`}>
        <span className="text-[#00C2CB] group-hover:rotate-[-4deg] transition-transform inline-block">Q</span>
        <span className="text-[#FF7A00] group-hover:rotate-[3deg] transition-transform inline-block">u</span>
        <span className="text-[#E040FB] group-hover:rotate-[-3deg] transition-transform inline-block">i</span>
        <span className="text-[#00C853] group-hover:rotate-[4deg] transition-transform inline-block">z</span>
        <span className={`inline-block mx-0.5 rounded-full bg-slate-900 ${dotSizes[size]} self-baseline`} />
        <span className="text-slate-900 font-black">com</span>
        <span className="ml-1.5 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#0d3b44] text-[#6FEEFF] font-mono font-bold uppercase tracking-wider shadow-sm">
          AI
        </span>
      </div>
    </Link>
  )
}

