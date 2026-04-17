import type { BucketChartEntry } from '~/components/Charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import type { LinearTickScale } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'

type TickAlignment = 'center' | 'top' | 'bottom'

/**
 * Convert a tick to Y position using the linear tick scale.
 *
 * With a linear scale, ticks map directly to Y positions.
 * The tickAlignment parameter is kept for API compatibility but doesn't affect
 * the position since there are no discrete bands anymore.
 */
export const tickToY = ({
  tick,
  tickScale,
  tickAlignment: _tickAlignment,
}: {
  tick: number
  tickScale: LinearTickScale
  tickAlignment?: TickAlignment
}): number => {
  return tickScale.tickToY(tick)
}

/**
 * Compute the Y position of the current tick dot.
 *
 * If the current tick falls within a rendered bucket, centers the dot
 * vertically within that bucket. Otherwise falls back to the raw tick position.
 * This ensures all renderers split colors at the same pixel position as the dot.
 */
export const getCurrentTickDotY = ({
  currentTick,
  renderedBuckets,
  tickScale,
}: {
  currentTick: number
  renderedBuckets: BucketChartEntry[] | undefined
  tickScale: LinearTickScale
}): number => {
  const currentBucket = renderedBuckets?.find((b) => currentTick >= b.startTick && currentTick < b.endTick)
  return currentBucket
    ? (tickScale.tickToY(currentBucket.startTick) + tickScale.tickToY(currentBucket.endTick)) / 2
    : tickScale.tickToY(currentTick)
}
