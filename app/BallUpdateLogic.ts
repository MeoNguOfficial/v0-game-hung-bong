import { BallState, GameData } from "./MainGameLogic"
import { isSuddenDeathMiss } from "./GameModal/SuddenDeathGameModal"
import { getScoreMultiplier } from "./ScoreManager"
import { audioRateManager } from "../lib/audioPlaybackRateManager"

export const updateBallLifecycle = (
  gameData: any,
  canvas: HTMLCanvasElement,
  deltaTime: number,
  audioRefs: any,
  currentBgm: HTMLAudioElement | null,
  callbacks: {
    setScore: (s: number) => void
    setLives: (l: number) => void
    setComboCount: (c: number) => void
    setIsFlashRed: (v: boolean) => void
    setIsFlashWhite: (v: boolean) => void
    setGameState: (s: any) => void
    setSnowActive: (v: boolean) => void
    setSnowLeft: (v: number) => void
    setSnowContactPoint: (p: { x: number, y: number }) => void
    playSound: (n: string, i?: number) => void
    stopSound: (n: string) => void
    createParticles: (x: number, y: number, color: string, type: string, intense: boolean) => void
    resetBall: () => void
    clearSnow: () => void
    fadeAudio: (a: any, t: number, d?: number) => void
    handleBombHit: (x: number, y: number) => void
  }
) => {
  const isReverse = gameData.isReverse
  const gravityDirection = isReverse ? -1 : 1
  const logicPaddleY = isReverse ? 90 : canvas.height - 90
  const ts = gameData.timeScale || 1

  const ballColors: any = {
    heal: "#22c55e",
    boost: "#3b82f6",
    purple: "#a855f7",
    yellow: "#facc15",
    normal: "#ef4444",
    grey: "#94a3b8",
    snow: "#ffffff",
    orange: "#f97316",
  }

  // Rain mode dùng mảng activeBalls, Default dùng ball đơn lẻ
  const balls = gameData.isRain ? gameData.activeBalls : [gameData.ball]

  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i]
    const prevBallY = b.y

    // Di chuyển
    b.y += b.speed * ts * gravityDirection * deltaTime
    if (b.type === "yellow") {
      b.sinTime += 0.15 * deltaTime
      const dynamicAmplitude = b.speed * 3
      b.x += (b.dx * ts + Math.sin(b.sinTime) * dynamicAmplitude * ts) * deltaTime
    } else {
      b.x += b.dx * ts * deltaTime
    }

    // Nảy tường
    if (b.x - b.radius < 0) {
      b.x = b.radius; b.dx = Math.abs(b.dx) + 0.8
      if (b.type === "yellow" && Math.sin(b.sinTime) < 0) b.sinTime = -b.sinTime
    } else if (b.x + b.radius > canvas.width) {
      b.x = canvas.width - b.radius; b.dx = -Math.abs(b.dx) - 0.8
      if (b.type === "yellow" && Math.sin(b.sinTime) > 0) b.sinTime = -b.sinTime
    }

    // Kiểm tra va chạm Paddle
    const isInsideX = b.x >= gameData.playerX && b.x <= gameData.playerX + gameData.playerWidth
    const isHitY = isReverse
      ? b.y - b.radius <= logicPaddleY + 15 && prevBallY >= logicPaddleY
      : b.y + b.radius >= logicPaddleY && prevBallY <= logicPaddleY + 15

    if (isInsideX && isHitY) {
      const isCenter = Math.abs(b.x - (gameData.playerX + gameData.playerWidth / 2)) < (gameData.playerWidth * 0.3) / 2

      // Xử lý hiệu ứng đặc biệt
      if (b.type === "grey") {
        gameData.hasShield = true
        callbacks.playSound("shield")
        callbacks.createParticles(b.x, b.y, "#cbd5e1", "absorb", true)
      } else if (b.type === "boost") {
        gameData.targetWidth = 160
        gameData.isBoosted = true
        gameData.boostTimeLeft = 8
        callbacks.playSound("boost")
        callbacks.createParticles(b.x, b.y, "#3b82f6", "absorb", true)
      } else if (b.type === "snow") {
        if (gameData.score >= 500) {
          gameData.targetTimeScale = 0.4
          gameData.snowTimeLeft = 10
          gameData.isSnowSlowed = true
          callbacks.setSnowLeft(10)
          callbacks.setSnowContactPoint({ x: (b.x / canvas.width) * 100, y: (b.y / canvas.height) * 100 })
          callbacks.setSnowActive(true)
          callbacks.playSound("snow")
          const currentScoreInt = Math.floor(gameData.score)
          const currentBaseRate = Math.min(currentScoreInt < 200 ? 1.0 + Math.floor(currentScoreInt / 40) * 0.01 : 1.05 + Math.floor((currentScoreInt - 200) / 50) * 0.01, 2.5)
          audioRateManager.animatePlaybackRate(currentBaseRate / 2, 1000)
          
          // Logic interval cho tuyết cần được xử lý ở đây hoặc qua callback
          if (callbacks.setSnowActive) {
             callbacks.setSnowActive(true);
          }
        }
        callbacks.createParticles(b.x, b.y, "#ffffff", "explode", true)
      } else if (b.type === "orange") {
        callbacks.handleBombHit(b.x, b.y)
        if (gameData.bombs.length === 0) callbacks.stopSound("bomb_fall")
      } else {
        callbacks.createParticles(b.x, b.y, ballColors[b.type] || "#ef4444", "explode", isCenter)
      }

      if (b.type === "heal") {
        gameData.lives = Math.min(gameData.lives + 1, 5)
        callbacks.setLives(gameData.lives)
        callbacks.playSound("heal")
      }

      // Tính điểm
      let scoreAdd = b.type === "orange" ? 0 : 1
      if (isCenter) {
        gameData.combo = Math.min(gameData.combo + 1, 6)
        callbacks.setComboCount(gameData.combo)
        callbacks.playSound("combo", gameData.combo - 1)
        scoreAdd += gameData.combo
      } else {
        if (b.type !== "orange") gameData.combo = 0
        callbacks.setComboCount(0)
        callbacks.playSound("catch")
      }
      if (b.type === "purple") scoreAdd += 2
      if (b.type === "yellow") scoreAdd += 9

      let multiplier = getScoreMultiplier(gameData.gameMode, "default", { isHidden: !!gameData.isHidden, isBlank: !!gameData.isBlank, isReverse: !!gameData.isReverse }, !!(gameData.isReverseControl || gameData.isMirror || gameData.isInvisible))
      if (gameData.isRain) multiplier *= 0.8
      
      gameData.score += scoreAdd * multiplier
      const currentScoreInt = Math.floor(gameData.score)
      callbacks.setScore(currentScoreInt)

      // Cập nhật tốc độ nhạc
      if (!gameData.isSnowSlowed) {
        const musicRate = Math.min(currentScoreInt < 200 ? 1.0 + Math.floor(currentScoreInt / 40) * 0.01 : 1.05 + Math.floor((currentScoreInt - 200) / 50) * 0.01, 2.5)
        audioRateManager.updatePlaybackRate(musicRate)
      }

      // Xóa bóng
      if (gameData.isRain) {
        gameData.activeBalls.splice(i, 1)
      } else {
        callbacks.resetBall()
      }
      continue
    }

    // Kiểm tra hụt bóng (Out of bounds)
    if ((!isReverse && b.y > canvas.height) || (isReverse && b.y < -b.radius)) {
      if (b.type === "orange") {
        if (gameData.isRain) gameData.activeBalls.splice(i, 1); else callbacks.resetBall()
        if (gameData.bombs.length === 0) callbacks.stopSound("bomb_fall")
      } else if (gameData.gameMode === "sudden_death") {
        if (isSuddenDeathMiss(b.type)) {
          gameData.lives = 0; callbacks.setLives(0)
          callbacks.playSound("miss"); callbacks.setIsFlashRed(true)
          setTimeout(() => callbacks.setIsFlashRed(false), 150)
          callbacks.createParticles(b.x, isReverse ? 6 : canvas.height - 6, "#ef4444", "miss", true)
          callbacks.setGameState("over")
          callbacks.clearSnow()
          if (callbacks.stopSound) callbacks.stopSound("bomb_fall")
        }
        if (gameData.isRain) gameData.activeBalls.splice(i, 1); else callbacks.resetBall()
      } else if (["normal", "purple", "yellow", "heal", "boost", "snow", "grey"].includes(b.type)) {
        if (gameData.hasShield) {
          gameData.hasShield = false
          callbacks.playSound("shield_breaking")
          callbacks.createParticles(b.x, isReverse ? 6 : canvas.height - 6, "#94a3b8", "shard", true)
          gameData.combo = 0; callbacks.setComboCount(0)
        } else {
          gameData.lives--
          callbacks.setLives(gameData.lives)
          callbacks.playSound("miss"); callbacks.setIsFlashRed(true)
          setTimeout(() => callbacks.setIsFlashRed(false), 150)
          callbacks.createParticles(b.x, isReverse ? 6 : canvas.height - 6, "#ef4444", "miss", true)
          gameData.combo = 0; callbacks.setComboCount(0)
          if (gameData.lives <= 0) {
            // Hiệu ứng làm chậm nhạc khi chết kiểu OSU
            if (currentBgm) {
              audioRateManager.animatePlaybackRate(0.09, 1800)
              callbacks.fadeAudio(currentBgm, 0, 1800)
            }
            callbacks.setGameState("over")
            callbacks.clearSnow()
            if (callbacks.stopSound) callbacks.stopSound("bomb_fall")
          }
        }
        if (gameData.isRain) gameData.activeBalls.splice(i, 1); else callbacks.resetBall()
      } else {
        if (gameData.isRain) gameData.activeBalls.splice(i, 1); else callbacks.resetBall()
      }
    }
  }
}
