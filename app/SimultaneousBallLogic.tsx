import { BallState, GameData } from "./MainGameLogic"
import { getDefaultBallType } from "./GameModal/DefaultGameModal"
import { getCustomBallType } from "./GameCustomLogic"

/**
 * Chọn loại bóng ngẫu nhiên dựa trên mode hiện tại nhưng loại trừ Bom (orange)
 */
const getRandomBallTypeExcludingBomb = (gameData: GameData): BallState["type"] => {
  const score = gameData.score || 0
  const gameMode = gameData.gameMode === "sudden_death" ? "hardcode" : (gameData.gameMode || "normal")
  
  let type: BallState["type"] = "normal"

  if (gameData.isCustom) {
    type = getCustomBallType(gameData.customBallConfig ?? {}, score) as BallState["type"]
  } else {
    type = getDefaultBallType(score, gameMode) as BallState["type"]
  }

  // Nếu quay vào bom, chuyển thành bóng thường để đảm bảo không vi phạm quy tắc
  return type === "orange" ? "normal" : type
}

/**
 * Logic sinh các bóng phụ rơi cùng lúc
 */
export const generateSimultaneousBalls = (
  gameData: GameData,
  canvasWidth: number,
  startY: number,
  baseSpeed: number
): BallState[] => {
  const score = gameData.score || 0
  const spawnChance = score > 3000 ? 0.25 : 0.2
  
  if (score <= 50 || Math.random() >= spawnChance) return []

  let maxBalls = 1
  if (score > 2000) maxBalls = 5
  else if (score > 1000) maxBalls = 4
  else if (score > 500) maxBalls = 3
  else if (score > 200) maxBalls = 2

  const count = Math.floor(Math.random() * maxBalls) + 1
  const extraBalls: BallState[] = []

  for (let i = 0; i < count; i++) {
    const type = getRandomBallTypeExcludingBomb(gameData)
    const speed = type === "purple" ? baseSpeed * 1.3 : baseSpeed * 1.1

    const delayDistance = Math.random() * (speed * 60)
    const offset = (gameData.isReverse ? 1 : -1) * delayDistance

    extraBalls.push({
      x: Math.random() * (canvasWidth - 40) + 20,
      y: startY + offset,
      radius: 10,
      speed: speed,
      dx: (Math.random() - 0.5) * 2,
      type: type,
      sinTime: Math.random() * Math.PI * 2
    })
  }

  return extraBalls
}
