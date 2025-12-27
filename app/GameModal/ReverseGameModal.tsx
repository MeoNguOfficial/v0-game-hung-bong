/**
 * Determines the initial Y position and vertical direction for a ball based on gravity.
 * @param canvasHeight The height of the game canvas.
 * @param isReverse Whether reverse gravity is active.
 * @returns An object with the starting Y position and the direction multiplier.
 */
export const getInitialVerticalState = (canvasHeight: number, isReverse: boolean) => {
  if (isReverse) {
    return {
      startY: canvasHeight + 20, // Start from the bottom
      direction: -1, // Move upwards
    }
  }
  return {
    startY: -20, // Start from the top
    direction: 1, // Move downwards
  }
}
