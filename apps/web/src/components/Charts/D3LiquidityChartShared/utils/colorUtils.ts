// Utility function to determine color for price elements based on token position
export const getColorForTick = ({
  tick,
  currentTick,
  token0Color,
  token1Color,
}: {
  tick?: number
  currentTick: number
  token0Color: string
  token1Color: string
}): string | undefined => {
  if (tick === undefined) {
    return undefined
  }
  return tick >= currentTick ? token0Color : token1Color
}

// Utility function to determine opacity for price elements
export const getOpacityForTick = ({
  tick,
  minTick,
  maxTick,
}: {
  tick?: number
  minTick?: number
  maxTick?: number
}): number => {
  if (tick !== undefined && minTick !== undefined && maxTick !== undefined) {
    const isInRange = (tick >= minTick && tick <= maxTick) || (tick <= minTick && tick >= maxTick)
    return isInRange ? 0.8 : 0.2
  }
  return 0.2
}
