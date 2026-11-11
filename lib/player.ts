// -------------------------------------------------------------
// THÔNG TIN VÀ ĐỊNH DANH NGƯỜI CHƠI (PLAYER PROFILE)
// -------------------------------------------------------------

export interface PlayerProfile {
  id: string
  username: string
  nickname: string
  name?: string
  avatar?: string
  title?: string
}

const STORAGE_KEY = "funquiz_auth_user"

/**
 * Lấy thông tin tài khoản đã đăng nhập từ LocalStorage
 * Trả về null nếu người dùng chưa đăng nhập
 */
export function getStoredPlayer(): PlayerProfile | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlayerProfile
    // Chỉ coi là đã đăng nhập nếu có id và username thực sự
    if (parsed && parsed.id && parsed.username) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Lưu thông tin tài khoản đăng nhập vào LocalStorage
 */
export function saveStoredPlayer(profile: PlayerProfile): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new Event("funquiz:auth-change"))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Đăng xuất và xóa thông tin tài khoản khỏi LocalStorage
 */
export function clearStoredPlayer(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem("funquiz_player_profile") // dọn dẹp key cũ nếu có
    window.dispatchEvent(new Event("funquiz:auth-change"))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Kiểm tra xem người dùng hiện tại đã đăng nhập hay chưa
 */
export function isUserLoggedIn(): boolean {
  return getStoredPlayer() !== null
}

/**
 * Fallback dự phòng cho các màn hình cần một profile tạm (không dùng để bypass phòng thi)
 */
export function getOrCreateDefaultPlayer(): PlayerProfile {
  const existing = getStoredPlayer()
  if (existing) return existing

  return {
    id: "guest_unauthenticated",
    username: "",
    nickname: "Thí Sinh Chưa Đăng Nhập",
    avatar: "🎓",
    title: "Thí Sinh Tự Do",
  }
}
