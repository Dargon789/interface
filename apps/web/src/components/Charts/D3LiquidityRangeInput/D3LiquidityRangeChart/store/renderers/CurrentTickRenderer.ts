import { CHART_DIMENSIONS } from '~/components/Charts/D3LiquidityChartShared/constants'
import type {
  ChartState,
  Renderer,
  RenderingContext,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getCurrentTickDotY } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickToY'

const CURRENT_PRICE_CLASSES = {
  LINE: 'current-price-line',
  LABEL: 'current-price-label',
  DOT: 'current-price-dot',
}

export function createCurrentTickRenderer({
  g,
  context,
  getState,
}: {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  context: RenderingContext
  getState: () => ChartState
}): Renderer {
  const currentTickGroup = g.append('g').attr('class', 'current-tick-group')

  const draw = (): void => {
    // Clear previous current tick elements
    currentTickGroup.selectAll('*').remove()

    const { chartId, colors, dimensions, currentTick, tickScale } = context
    const { renderedBuckets } = getState()
    const centerY = getCurrentTickDotY({ currentTick, renderedBuckets, tickScale })

    // Draw dotted line across the entire chart for current price
    currentTickGroup
      .append('line')
      .attr('class', CURRENT_PRICE_CLASSES.LINE)
      .attr('x1', 0) // Start from left edge
      .attr('x2', dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET) // Extend to right edge
      .attr('y1', centerY)
      .attr('y2', centerY)
      .attr('stroke', colors.neutral2.val)
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', '0,6') // Dotted line pattern
      .attr('opacity', 0.8)

    // Create a gradient so the dot is a blend of both token colors
    const defs = currentTickGroup.append('defs')
    const grad = defs
      .append('linearGradient')
      .attr('id', `${chartId}-current-tick-dot-gradient`)
      .attr('x1', '0')
      .attr('x2', '0')
      .attr('y1', '0')
      .attr('y2', '1')
    grad.append('stop').attr('offset', '0%').attr('stop-color', context.token0Color)
    grad.append('stop').attr('offset', '100%').attr('stop-color', context.token1Color)

    currentTickGroup
      .append('circle')
      .attr('class', CURRENT_PRICE_CLASSES.DOT)
      .attr('cx', dimensions.width)
      .attr('cy', centerY)
      .attr('r', CHART_DIMENSIONS.PRICE_DOT_RADIUS)
      .attr('fill', `url(#${chartId}-current-tick-dot-gradient)`)
      .attr('opacity', 1)
  }

  return {
    draw,
  }
}
