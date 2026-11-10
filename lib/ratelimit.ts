// -------------------------------------------------------------
// BẢO VỆ VÀ GIỚI HẠN TẦN SUẤT GỌI AI (RATE LIMITER)
// Giới hạn số lượt tạo câu hỏi AI trên mỗi phiên/client để tránh spam
// -------------------------------------------------------------

interface RateLimitRecord {
  count: number
  resetAt: number
}

// Lưu trữ bộ đếm trong bộ nhớ (Bộ đếm dạng Sliding Window)
const rateLimitMap = new Map<string, RateLimitRecord>()

const MAX_REQUESTS = 6 // Tối đa 6 lần tạo đề AI
const WINDOW_MS = 10 * 60 * 1000 // Trong vòng 10 phút

export function checkAIRateLimit(identifier: string = "default_user"): {
  allowed: boolean
  remaining: number
  resetInMinutes: number
} {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // Nếu chưa có record hoặc đã qua khoảng thời gian reset
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetInMinutes: Math.ceil(WINDOW_MS / 60000),
    }
  }

  // Nếu trong khoảng thời gian nhưng chưa vượt quá giới hạn
  if (record.count < MAX_REQUESTS) {
    record.count += 1
    return {
      allowed: true,
      remaining: MAX_REQUESTS - record.count,
      resetInMinutes: Math.ceil((record.resetAt - now) / 60000),
    }
  }

  // Đã vượt quá giới hạn
  const minutesLeft = Math.ceil((record.resetAt - now) / 60000)
  return {
    allowed: false,
    remaining: 0,
    resetInMinutes: minutesLeft,
  }
}

