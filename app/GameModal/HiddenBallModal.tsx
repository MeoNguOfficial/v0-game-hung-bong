export const getHiddenBallAlpha = (ballY: number, paddleY: number, canvasHeight: number, isHiddenMode: boolean, isReverse: boolean): number => {
  if (!isHiddenMode) {
    return 1.0
  }

  const totalPath = isReverse ? canvasHeight - paddleY : paddleY
  const pathTraveled = isReverse ? canvasHeight - ballY : ballY
  const progress = totalPath > 0 ? pathTraveled / totalPath : 0

  const startFadeProgress = 0.3
  const endFadeProgress = 0.8

  if (progress <= startFadeProgress) return 1.0
  if (progress >= endFadeProgress) return 0.0

  const fadeDurationProgress = endFadeProgress - startFadeProgress
  const progressInFade = progress - startFadeProgress
  
  return 1.0 - (progressInFade / fadeDurationProgress)
}
