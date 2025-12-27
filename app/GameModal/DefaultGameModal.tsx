export type BallType = "normal" | "purple" | "yellow" | "boost" | "grey" | "snow" | "orange" | "heal";

export const getDefaultBallType = (score: number, gameMode: string): BallType => {
  if (score < 10) {
    return "normal";
  }
  // Use a weight-based selection so we can enforce spawn thresholds and adjust rates
  // Reduce grey, boost and snow by 30% (multiply by 0.7) when available
  const weights: { [k: string]: number } = {
    orange: score >= 2 && score <= 50 ? 0.15 : 0, // Bomb (single)
    grey: score >= 300 ? 0.02 * 0.7 : 0, // Shield (grey) available from 300
    heal: gameMode !== "hardcode" && score >= 150 ? 0.05 : 0, // Heal (green) from 150
    boost: score >= 200 ? 0.05 * 0.7 : 0, // Boost (blue) from 200
    snow: score >= 500 ? 0.05 * 0.7 : 0, // Snow (white) from 500
    yellow: score >= 100 ? 0.20 : 0, // Yellow from 100
    purple: score >= 50 ? 0.40 : 0, // Purple from 50
  }
  const baseSum = Object.values(weights).reduce((s, v) => s + v, 0)
  const normalWeight = Math.max(0, 1 - baseSum)
  const pool: [string, number][] = [...Object.entries(weights), ["normal", normalWeight]]
  const total = pool.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  let chosen: string | undefined
  for (const [k, w] of pool) {
    if (r < w) {
      chosen = k
      break
    }
    r -= w
  }
  return (chosen as BallType) || "normal"
}
