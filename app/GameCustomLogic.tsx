export const getCustomBallType = (
  config: Record<string, { enabled: boolean; score: number; rate: number }>,
  currentScore: number
): string => {
  // Filter eligible balls based on score threshold and enabled status
  const eligible = Object.entries(config).filter(([_, cfg]) => cfg.enabled && currentScore >= cfg.score)

  if (eligible.length > 0) {
    // Calculate total weight
    const totalWeight = eligible.reduce((sum, [_, cfg]) => sum + cfg.rate, 0)

    if (totalWeight <= 0) {
      // Fallback to equal probability if rates are 0
      return eligible[Math.floor(Math.random() * eligible.length)][0]
    } else {
      let r = Math.random() * totalWeight
      for (const [type, cfg] of eligible) {
        if (r < cfg.rate) {
          return type
        }
        r -= cfg.rate
      }
    }
  } else {
    // Fallback if no balls are eligible (e.g. score too low)
    // Try to find any enabled ball regardless of score
    const anyEnabled = Object.entries(config).filter(([_, cfg]) => cfg.enabled)
    if (anyEnabled.length > 0) {
      return anyEnabled[Math.floor(Math.random() * anyEnabled.length)][0]
    }
  }
  return "normal"
}
