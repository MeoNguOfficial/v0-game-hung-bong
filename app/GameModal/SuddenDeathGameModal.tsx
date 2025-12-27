import { BallType } from "./DefaultGameModal";

// Sudden Death Mode:
// - Sử dụng logic sinh bóng của Hardcore (tỉ lệ bóng khó cao hơn).
// - Luật chơi: Mất mạng nếu trượt BẤT KỲ bóng nào (trừ Bomb).

export const isSuddenDeathMiss = (ballType: BallType): boolean => {
  // Trong Sudden Death, trượt bất kỳ bóng nào không phải là Bomb đều tính là Miss (chết)
  return ballType !== "orange";
}
