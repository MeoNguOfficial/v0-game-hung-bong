import { GameData } from "./MainGameLogic"

/**
 * Logic Autoplay / Bot của Catch Master
 * Tính toán vị trí bóng rơi, né bom và điều khiển paddle tự động.
 */
export const runAutoplayLogic = (
  gameData: any,
  canvasWidth: number,
  logicPaddleY: number,
  deltaTime: number,
  isDebug: boolean
) => {
  const isAuto = gameData.isAuto
  const b = gameData.ball
  const isReverse = gameData.isReverse

  // Chỉ chạy nếu đang ở chế độ Auto hoặc Debug hitbox, và không trong trạng thái chết
  if (!(isAuto || isDebug) || gameData.isDying) return

  const ts = gameData.timeScale || 1

  // 1. Dự đoán vị trí bóng sẽ chạm Paddle (Predicted X)
  const timeToHit = Math.abs(logicPaddleY - b.y) / (b.speed * ts)
  let predictedX = b.x

  if (timeToHit > 0) {
    predictedX = b.x + b.dx * timeToHit

    // Logic tính toán nảy tường cho dự đoán
    let tempX = predictedX
    const minX = b.radius
    const maxX = canvasWidth - b.radius

    while (tempX < minX || tempX > maxX) {
      if (tempX < minX) {
        tempX = minX + (minX - tempX)
      } else if (tempX > maxX) {
        tempX = maxX - (tempX - maxX)
      }
    }
    predictedX = tempX

    // Bổ sung quỹ đạo cho bóng vàng (sine wave)
    if (b.type === "yellow") {
      const futureSinTime = b.sinTime + 0.15 * timeToHit
      const dynamicAmplitude = b.speed * 3
      predictedX += Math.sin(futureSinTime) * dynamicAmplitude
    }
  }

  // 2. Xác định các vùng nguy hiểm (Danger Zones)
  const pWidth = gameData.playerWidth
  const hardMargin = 8 // Lề cứng để né bom
  const softMargin = 4 // Lề dự phòng

  const hardZones: { min: number; max: number }[] = []
  const softZones: { min: number; max: number }[] = []

  const addZone = (zones: any[], x: number, r: number, margin: number) => {
    const safeDist = pWidth / 2 + r + margin
    zones.push({ min: x - safeDist, max: x + safeDist })
  }

  // Bóng chính là mối đe dọa nếu là bóng Cam (Bom)
  if (b.type === "orange") {
    const distY = isReverse ? (b.y - logicPaddleY) : (logicPaddleY - b.y)
    if (distY < 450 && distY > -50) addZone(hardZones, predictedX, b.radius, hardMargin)
    else addZone(softZones, predictedX, b.radius, softMargin)
  }

  // Các quả bom đang rơi đồng thời
  gameData.bombs.forEach((bomb: any) => {
    const distY = isReverse ? (bomb.y - logicPaddleY) : (logicPaddleY - bomb.y)
    if (distY < 350 && distY > -50) {
      addZone(hardZones, bomb.x, bomb.radius, hardMargin)
    } else {
      addZone(softZones, bomb.x, bomb.radius, softMargin)
    }
  })

  // Gộp các vùng nguy hiểm bị chồng lấn
  const mergeZones = (zones: { min: number; max: number }[]) => {
    if (zones.length === 0) return []
    zones.sort((a, b) => a.min - b.min)
    const merged = [zones[0]]
    for (let i = 1; i < zones.length; i++) {
      const last = merged[merged.length - 1]
      if (last.max >= zones[i].min) {
        last.max = Math.max(last.max, zones[i].max)
      } else {
        merged.push(zones[i])
      }
    }
    return merged
  }

  const mergedHardZones = mergeZones(hardZones)
  const mergedSoftZones = mergeZones(softZones)

  // 3. Tính toán các khoảng an toàn (Safe Intervals)
  const validMin = pWidth / 2
  const validMax = canvasWidth - pWidth / 2
  const safeIntervals: { min: number; max: number }[] = []

  let cursor = validMin
  mergedHardZones.forEach(z => {
    if (z.min > cursor) {
      safeIntervals.push({ min: cursor, max: z.min })
    }
    cursor = Math.max(cursor, z.max)
  })
  if (cursor < validMax) {
    safeIntervals.push({ min: cursor, max: validMax })
  }

  // 4. Quyết định mục tiêu di chuyển (Target Center)
  const currentCenter = gameData.playerX + pWidth / 2
  let targetCenter = currentCenter

  let bestInterval = null
  let minDistToInterval = Infinity

  if (safeIntervals.length > 0) {
    for (const interval of safeIntervals) {
      if (currentCenter >= interval.min && currentCenter <= interval.max) {
        bestInterval = interval
        break
      }
      const dist = currentCenter < interval.min ? interval.min - currentCenter : currentCenter - interval.max
      if (dist < minDistToInterval) {
        minDistToInterval = dist
        bestInterval = interval
      }
    }
  }

  if (bestInterval) {
    const isGoodBall = b.type !== "orange"

    if (isGoodBall) {
      // Tối ưu hóa việc hứng bóng trong vùng an toàn
      const catchRangeMin = predictedX - pWidth / 2 + b.radius + 2
      const catchRangeMax = predictedX + pWidth / 2 - b.radius - 2
      
      let bestCatchingPoint = null
      let minCenterDist = Infinity
      
      for (const interval of safeIntervals) {
        const intersectMin = Math.max(interval.min, catchRangeMin)
        const intersectMax = Math.min(interval.max, catchRangeMax)
        
        if (intersectMin <= intersectMax) {
          const candidate = Math.max(intersectMin, Math.min(predictedX, intersectMax))
          const dist = Math.abs(candidate - predictedX)
          if (dist < minCenterDist) {
            minCenterDist = dist
            bestCatchingPoint = candidate
          }
        }
      }
      
      if (bestCatchingPoint !== null) {
        targetCenter = bestCatchingPoint
      } else {
        targetCenter = Math.max(bestInterval.min, Math.min(currentCenter, bestInterval.max))
      }
    } else {
      targetCenter = Math.max(bestInterval.min, Math.min(currentCenter, bestInterval.max))
    }
    
    // Tránh các vùng Soft Zone nếu không cần thiết phải ở đó
    for (const sz of mergedSoftZones) {
       if (targetCenter > sz.min && targetCenter < sz.max) {
          const distToGoodBall = Math.abs(targetCenter - predictedX)
          const isCatchingPossible = distToGoodBall < pWidth / 3 
          
          if (!isGoodBall || !isCatchingPossible) {
             const dLeft = Math.abs(targetCenter - sz.min)
             const dRight = Math.abs(targetCenter - sz.max)
             let escapeX = dLeft < dRight ? sz.min : sz.max
             targetCenter = Math.max(bestInterval.min, Math.min(escapeX, bestInterval.max))
          }
       }
    }
  }

  gameData.aiDebug = { predictedX, targetCenter, hardZones: mergedHardZones, softZones: mergedSoftZones }

  if (isAuto) {
    const targetX = targetCenter - pWidth / 2
    gameData.playerX += (targetX - gameData.playerX) * (1 - Math.pow(1 - 0.5, deltaTime))
  }
}