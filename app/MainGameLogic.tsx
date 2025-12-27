import { getCustomBallType } from "./GameCustomLogic"
import { getClassicBallType } from "./GameModal/ClassicGameModal"
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
  newBomb?: BombState
  soundToPlay?: string
}

export interface GameData {
  score?: number
  isCustom?: boolean
  isClassic?: boolean
  gameMode?: "normal" | "hardcode" | "sudden_death"
  customBallConfig?: Record<string, { enabled: boolean; score: number; rate: number }>
  allowedBalls?: string[]
  isReverse?: boolean
}

export const spawnBall = (
  gameData: GameData,
  canvasWidth: number,
  canvasHeight: number
): SpawnResult => {
  const score = gameData.score || 0
  const isCustom = gameData.isCustom
  const isClassic = gameData.isClassic
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
    sinTime: 0,
  }

  // Position
  b.x = Math.random() * (canvasWidth - 40) + 20

  // Base Speed
  const baseSpeed = Math.min(1.5 + score * 0.02, 80)

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
  } else if (isClassic) {
    // Sudden Death dùng tỉ lệ của Hardcore
    b.type = getClassicBallType(gameMode === "sudden_death" ? "hardcode" : (gameMode || "normal"))
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
  let newBomb: BombState | undefined
  const canSpawnSimultaneousBombs = !isClassic && (!isCustom || (gameData.allowedBalls && gameData.allowedBalls.includes("orange")))
  
  if (canSpawnSimultaneousBombs && score > 50 && Math.random() < 0.2) {
    const delayY = Math.random() * 150
    newBomb = {
      x: Math.random() * (canvasWidth - 40) + 20,
      y: -50 - delayY,
      radius: 12,
      speed: baseSpeed * 1.1,
    }
  }

  return { ball: b, newBomb, soundToPlay: b.type === "orange" ? "bomb_fall" : undefined }
}
