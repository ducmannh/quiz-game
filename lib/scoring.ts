// -------------------------------------------------------------
// THUẬT TOÁN TÍNH ĐIỂM GAMESHOW ĐẤU TRƯỜNG
// Kết hợp: Điểm cơ bản + Thưởng tốc độ phản xạ + Combo Streak
// -------------------------------------------------------------

export interface ScoreCalculationResult {
  basePoints: number
  speedBonus: number
  streakMultiplier: number
  earnedPoints: number
  isCorrect: boolean
}

export function calculateQuestionScore(
  isCorrect: boolean,
  timeTaken: number,
  maxTime: number,
  streak: number
): ScoreCalculationResult {
  if (!isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      streakMultiplier: 1,
      earnedPoints: 0,
      isCorrect: false,
    }
  }

  // 1. Điểm cơ bản cho mỗi câu trả lời đúng
  const basePoints = 100

  // 2. Điểm thưởng tốc độ (Trả lời càng nhanh điểm càng cao, tối đa +50 điểm)
  const remainingTimeRatio = Math.max(0, Math.min(1, (maxTime - timeTaken) / maxTime))
  const speedBonus = Math.round(remainingTimeRatio * 50)

  // 3. Hệ số nhân chuỗi đúng liên tiếp (Combo Streak)
  let streakMultiplier = 1.0
  if (streak === 2) streakMultiplier = 1.15
  else if (streak === 3) streakMultiplier = 1.3
  else if (streak >= 4) streakMultiplier = 1.5

  // 4. Tổng điểm câu này
  const earnedPoints = Math.round((basePoints + speedBonus) * streakMultiplier)

  return {
    basePoints,
    speedBonus,
    streakMultiplier,
    earnedPoints,
    isCorrect: true,
  }
}

