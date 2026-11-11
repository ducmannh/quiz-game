"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export interface AuthUserResponse {
  id: string
  username: string
  name: string
  avatar?: string | null
}

export interface AuthActionResult {
  success: boolean
  error?: string
  user?: AuthUserResponse
}

// -------------------------------------------------------------
// ĐĂNG KÝ TÀI KHOẢN MỚI
// -------------------------------------------------------------
export async function registerAction(formData: {
  username: string
  password: string
  name?: string
}): Promise<AuthActionResult> {
  try {
    const rawUsername = formData.username?.trim().toLowerCase() || ""
    const password = formData.password || ""
    const displayName = formData.name?.trim() || rawUsername

    // Kiểm tra định dạng username
    if (!rawUsername) {
      return { success: false, error: "Vui lòng nhập tên tài khoản!" }
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    if (!usernameRegex.test(rawUsername)) {
      return {
        success: false,
        error: "Tên tài khoản phải từ 3 đến 30 ký tự, viết liền không dấu, chỉ gồm chữ, số, gạch dưới hoặc gạch ngang.",
      }
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        error: "Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên.",
      }
    }

    // Kiểm tra xem username đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: { username: rawUsername },
    })

    if (existingUser) {
      return {
        success: false,
        error: "Tên tài khoản này đã được sử dụng. Vui lòng chọn một tên tài khoản khác!",
      }
    }

    // Tạo tài khoản mới
    const newUser = await prisma.user.create({
      data: {
        username: rawUsername,
        password: password,
        name: displayName || rawUsername,
        avatar: "🎓",
      },
    })

    // Thiết lập session cookie
    const cookieStore = await cookies()
    cookieStore.set("funquiz_user_id", newUser.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 ngày
      httpOnly: false,
      sameSite: "lax",
    })
    cookieStore.set("funquiz_username", newUser.username || rawUsername, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
    })

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username || rawUsername,
        name: newUser.name,
        avatar: newUser.avatar,
      },
    }
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký tài khoản:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi trong quá trình tạo tài khoản. Vui lòng thử lại!",
    }
  }
}

// -------------------------------------------------------------
// ĐĂNG NHẬP VÀO HỆ THỐNG
// -------------------------------------------------------------
export async function loginAction(formData: {
  username: string
  password: string
}): Promise<AuthActionResult> {
  try {
    const rawUsername = formData.username?.trim().toLowerCase() || ""
    const password = formData.password || ""

    if (!rawUsername || !password) {
      return {
        success: false,
        error: "Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!",
      }
    }

    // Tìm kiếm người dùng theo username
    const user = await prisma.user.findFirst({
      where: { username: rawUsername },
    })

    if (!user || user.password !== password) {
      return {
        success: false,
        error: "Tên tài khoản hoặc mật khẩu không chính xác!",
      }
    }

    // Thiết lập session cookie
    const cookieStore = await cookies()
    cookieStore.set("funquiz_user_id", user.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
    })
    cookieStore.set("funquiz_username", user.username || rawUsername, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
    })

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username || rawUsername,
        name: user.name,
        avatar: user.avatar,
      },
    }
  } catch (error) {
    console.error("❌ Lỗi khi đăng nhập:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi máy chủ trong quá trình đăng nhập. Vui lòng thử lại!",
    }
  }
}

// -------------------------------------------------------------
// ĐĂNG XUẤT TÀI KHOẢN
// -------------------------------------------------------------
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("funquiz_user_id")
    cookieStore.delete("funquiz_username")
    return { success: true }
  } catch {
    return { success: false }
  }
}

// -------------------------------------------------------------
// LẤY THÔNG TIN USER HIỆN TẠI TỪ COOKIE
// -------------------------------------------------------------
export async function getCurrentUserAction(): Promise<{
  success: boolean
  user: AuthUserResponse | null
}> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("funquiz_user_id")?.value
    if (!userId) {
      return { success: false, user: null }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
    })

    if (!user || !user.username) {
      return { success: false, user: null }
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
    }
  } catch {
    return { success: false, user: null }
  }
}

