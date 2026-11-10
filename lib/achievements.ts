// -------------------------------------------------------------
// HỆ THỐNG HUY HIỆU & DANH HIỆU (ACHIEVEMENTS SYSTEM)
// -------------------------------------------------------------

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  color: string
  unlockedAt?: string
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: "speed_demon",
    title: "Thần Tốc",
    description: "Trả lời chính xác một câu hỏi trong vòng dưới 3 giây.",
    icon: "⚡",
    color: "from-amber-400 to-yellow-600",
  },
  {
    id: "perfect_score",
    title: "Bất Bại",
    description: "Đạt độ chính xác 100% trong một trận đấu hoàn chỉnh.",
    icon: "🏆",
    color: "from-emerald-400 to-teal-600",
  },
  {
    id: "combo_master",
    title: "Bậc Thầy Combo",
    description: "Đạt chuỗi trả lời đúng liên tiếp từ 5 câu trở lên.",
    icon: "🔥",
    color: "from-orange-500 to-red-600",
  },
  {
    id: "ai_scholar",
    title: "Học Giả AI",
    description: "Tạo thành công một bộ câu hỏi bằng trí tuệ nhân tạo.",
    icon: "🧠",
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "arena_king",
    title: "Vua Đấu Trường",
    description: "Đạt Top 1 chung cuộc trên sân khấu trường quay 10 bục.",
    icon: "👑",
    color: "from-yellow-400 to-amber-500",
  },
  {
    id: "master_mind",
    title: "Bậc Thầy Trí Tuệ",
    description: "Tham gia thi đấu và tích lũy từ 1,000 điểm trở lên trên sân khấu trường quay.",
    icon: "💎",
    color: "from-rose-500 to-pink-600",
  },
]

const STORAGE_ACHIEVEMENTS_KEY = "funquiz_achievements"

export function getUnlockedAchievements(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_ACHIEVEMENTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

export function unlockAchievement(achievementId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    const current = getUnlockedAchievements()
    if (!current.includes(achievementId)) {
      const updated = [...current, achievementId]
      localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(updated))
      return true
    }
  } catch {
    // Ignore storage errors
  }
  return false
}

