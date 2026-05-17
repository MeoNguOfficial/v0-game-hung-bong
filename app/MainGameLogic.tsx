import { getCustomBallType } from "./GameCustomLogic"
import { getDefaultBallType } from "./GameModal/DefaultGameModal"
import { getInitialVerticalState } from "./GameModal/ReverseGameModal"

export interface BallState {
  x: number
  y: number
  dx: number
  speed: number
  type: "normal" | "purple" | "yellow" | "boost" | "grey" | "snow" | "orange" | "heal"
  radius: number
  sinTime: number
}

export interface BombState {
  x: number
  y: number
  radius: number
  speed: number
}

export interface SpawnResult {
  ball: BallState
  newBombs?: BombState[]
  soundToPlay?: string
}

export interface GameData {
  score?: number
  isCustom?: boolean
  gameMode?: "normal" | "hardcode" | "sudden_death"
  customBallConfig?: Record<string, { enabled: boolean; score: number; rate: number }>
  allowedBalls?: string[]
  isReverse?: boolean
  baseGameSpeed?: number
}

export const spawnBall = (
  gameData: GameData,
  canvasWidth: number,
  canvasHeight: number
): SpawnResult => {
  const score = gameData.score || 0
  const isCustom = gameData.isCustom
  const gameMode = gameData.gameMode
  const customBallConfig = gameData.customBallConfig
  const { startY } = getInitialVerticalState(canvasHeight, gameData.isReverse || false)

  const b: BallState = {
    x: 0,
    y: startY,
    dx: 0,
    speed: 0,
    type: "normal",
    radius: 10,
    sinTime: Math.random() < 0.5 ? 0 : Math.PI,
  }

  // Position
  b.x = Math.random() * (canvasWidth - 40) + 20

  // Base Speed with customizable base multiplier
  const baseGameSpeed = gameData.baseGameSpeed || 1.0
  const baseSpeed = Math.min((1.5 * baseGameSpeed) + score * 0.02, 80)

  // Horizontal Movement (DX)
  const straightChance = Math.max(0.98 - score / 250, 0.02)
  if (Math.random() < straightChance) {
    b.dx = (Math.random() - 0.5) * 2
  } else {
    const tiltPower = Math.min(4 + score * 0.05, 12)
    b.dx = (Math.random() - 0.5) * tiltPower
  }

  // --- TYPE SELECTION LOGIC ---
  if (isCustom) {
    b.type = getCustomBallType(customBallConfig ?? {}, score) as BallState["type"]
  } else {
    // Sudden Death dùng tỉ lệ của Hardcore
    b.type = getDefaultBallType(score, gameMode === "sudden_death" ? "hardcode" : (gameMode || "normal"))
  }

  // --- SPEED ADJUSTMENT ---
  if (b.type === "yellow") {
    b.speed = Math.min((3 + score * 0.02) / 2, 40)
  } else {
    b.speed = b.type === "purple" ? Math.min(baseSpeed * 1.5, 160) : baseSpeed
  }

  b.radius = b.type === "orange" ? 12 : 10

  // --- BOMB SPAWN LOGIC ---
  let newBombs: BombState[] = []
  const canSpawnSimultaneousBombs = !isCustom || (gameData.allowedBalls && gameData.allowedBalls.includes("orange"))
  
  const spawnChance = score > 3000 ? 0.25 : 0.2

  if (canSpawnSimultaneousBombs && score > 50 && Math.random() < spawnChance) {
    let maxBombs = 1
    if (score > 2000) maxBombs = 5
    else if (score > 1000) maxBombs = 4
    else if (score > 500) maxBombs = 3
    else if (score > 200) maxBombs = 2

    const bombCount = Math.floor(Math.random() * maxBombs) + 1
    const bombSpeed = baseSpeed * 1.1

    for (let i = 0; i < bombCount; i++) {
      // Độ lệch tối đa 1s (tương đương 60 frames). 
      // Tính toán khoảng cách y dựa trên tốc độ để tạo độ trễ rơi.
      const delayDistance = Math.random() * (bombSpeed * 60)
      const offset = (gameData.isReverse ? 1 : -1) * delayDistance

      newBombs.push({
        x: Math.random() * (canvasWidth - 40) + 20,
        y: startY + offset,
        radius: 12,
        speed: bombSpeed,
      })
    }
  }

  return { ball: b, newBombs: newBombs.length > 0 ? newBombs : undefined, soundToPlay: b.type === "orange" ? "bomb_fall" : undefined }
}
