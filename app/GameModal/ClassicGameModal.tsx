import { BallType } from "./DefaultGameModal";

export const getClassicBallType = (gameMode: string): BallType => {
  // Classic Mode: 93% Normal (Red), 5% Heal (Green), 2% Shield (Grey)
  const r = Math.random()
  if (r < 0.02) return "grey"
  if (gameMode !== "hardcode" && r < 0.07) return "heal"
  return "normal"
}
