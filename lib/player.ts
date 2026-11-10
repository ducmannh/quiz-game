// -------------------------------------------------------------
// THÔNG TIN VÀ ĐỊNH DANH NGƯỜI CHƠI (PLAYER PROFILE)
// -------------------------------------------------------------

export interface PlayerProfile {
  id: string
  nickname: string
  avatar: string
  title: string
}

export const AVATAR_LIST = [
  { id: "lion", name: "Sư Tử Trí Tuệ", emoji: "🦁", color: "from-amber-500 to-orange-600" },
  { id: "fox", name: "Cáo Nhanh Trí", emoji: "🦊", color: "from-orange-500 to-red-600" },
  { id: "owl", name: "Cú Mèo Uyên Bác", emoji: "🦉", color: "from-indigo-500 to-purple-600" },
  { id: "robot", name: "Chiến Binh AI", emoji: "🤖", color: "from-cyan-500 to-blue-600" },
  { id: "astro", name: "Phi Hành Gia", emoji: "🚀", color: "from-blue-500 to-indigo-600" },
  { id: "dragon", name: "Rồng Vàng Đấu Trí", emoji: "🐉", color: "from-yellow-400 to-amber-600" },
  { id: "ninja", name: "Cao Thủ Ẩn Danh", emoji: "🥷", color: "from-slate-600 to-slate-900" },
  { id: "cat", name: "Mèo Thông Thái", emoji: "🐱", color: "from-pink-500 to-rose-600" },
  { id: "bear", name: "Gấu Bất Bại", emoji: "🐻", color: "from-amber-700 to-stone-900" },
  { id: "wizard", name: "Pháp Sư Tri Thức", emoji: "🧙‍♂️", color: "from-purple-500 to-violet-700" },
]

const STORAGE_KEY = "funquiz_player_profile"

export function getStoredPlayer(): PlayerProfile | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlayerProfile
  } catch {
    return null
  }
}

export function saveStoredPlayer(profile: PlayerProfile): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Ignore storage errors
  }
}

export function getOrCreateDefaultPlayer(): PlayerProfile {
  if (typeof window === "undefined") {
    return {
      id: "guest_player",
      nickname: "Thí Sinh Khách",
      avatar: "🦊",
      title: "Cáo Nhanh Trí",
    }
  }

  const existing = getStoredPlayer()
  if (existing) return existing

  const randomAvatar = AVATAR_LIST[Math.floor(Math.random() * AVATAR_LIST.length)]
  const defaultPlayer: PlayerProfile = {
    id: "user_" + Math.random().toString(36).substring(2, 9),
    nickname: "Thí Sinh #" + Math.floor(100 + Math.random() * 900),
    avatar: randomAvatar.emoji,
    title: randomAvatar.name,
  }

  saveStoredPlayer(defaultPlayer)
  return defaultPlayer
}

