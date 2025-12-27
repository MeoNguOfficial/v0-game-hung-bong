interface ObstacleProps {
  x: number
  y: number
  width: number
  height: number
}

export const getBlankObstacleProps = (
  paddleY: number,
  canvasWidth: number,
  isBlankMode: boolean,
  isReverse: boolean
): ObstacleProps | null => {
  if (!isBlankMode) {
    return null
  }

  const obstacleHeight = 100;

  if (isReverse) {
    return { x: 0, y: paddleY + 30, width: canvasWidth, height: obstacleHeight };
  } else {
    return { x: 0, y: paddleY - obstacleHeight - 30, width: canvasWidth, height: obstacleHeight };
  }
}
