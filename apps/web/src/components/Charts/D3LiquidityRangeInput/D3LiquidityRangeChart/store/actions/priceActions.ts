import { CHART_BEHAVIOR } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type { ChartStoreState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { DefaultPriceStrategy } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getClosestTick } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/getClosestTick'
import {
  calculateStrategyPrices,
  detectPriceStrategy,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import { calculateRangeViewport } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/rangeViewportUtils'
import { navigateTick } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'

interface PriceActionCallbacks {
  onMinPriceChange: (price?: number) => void
  onMaxPriceChange: (price?: number) => void
}

export const createPriceActions = ({
  set,
  get,
  callbacks,
}: {
  set: (fn: (state: ChartStoreState) => ChartStoreState) => void
  get: () => ChartStoreState
  callbacks: PriceActionCallbacks
}) => ({
  // WARNING: This function will cause the CreateLiquidityContext to re-render.
  // Use this sparingly when a user action is complete (i.e drag ends).
  // This function should not react to min/max state changes.
  handlePriceChange: (changeType: 'min' | 'max', price?: number) => {
    if (changeType === 'min') {
      callbacks.onMinPriceChange(price)
    } else {
      callbacks.onMaxPriceChange(price)
    }

    const { maxPrice, minPrice, selectedPriceStrategy, renderingContext } = get()

    if (!renderingContext) {
      return
    }

    const currentPrice = renderingContext.priceData[renderingContext.priceData.length - 1]?.value || 0
    const detectedStrategy = detectPriceStrategy({
      minPrice,
      maxPrice,
      currentPrice,
      liquidityData: renderingContext.liquidityData,
    })

    const currentSelectedStrategy = selectedPriceStrategy
    if (detectedStrategy !== currentSelectedStrategy) {
      set((state) => ({ ...state, selectedPriceStrategy: detectedStrategy }))
    }
  },

  setPriceStrategy: (priceStrategy: DefaultPriceStrategy) => {
    const { actions, dimensions, dynamicZoomMin, renderingContext } = get()
    if (!renderingContext) {
      return
    }

    set((state) => ({ ...state, selectedPriceStrategy: priceStrategy }))

    const { priceData, liquidityData } = renderingContext
    const currentPrice = priceData[priceData.length - 1].value || 0

    const { minPrice: targetMinPrice, maxPrice: targetMaxPrice } = calculateStrategyPrices({
      priceStrategy,
      currentPrice,
      liquidityData,
    })

    const { index: minTickIndex } = getClosestTick(liquidityData, targetMinPrice)
    const { index: maxTickIndex } = getClosestTick(liquidityData, targetMaxPrice)

    const { targetZoom, targetPanY } = calculateRangeViewport({
      minTickIndex,
      maxTickIndex,
      liquidityData,
      dynamicZoomMin,
      dimensions,
    })

    actions.animateToState({
      targetZoom,
      targetPan: targetPanY,
      targetMinPrice,
      targetMaxPrice,
    })

    setTimeout(() => {
      actions.handlePriceChange('min', targetMinPrice)
      actions.handlePriceChange('max', targetMaxPrice)
    }, CHART_BEHAVIOR.ANIMATION_DURATION)
  },

  incrementMax: () => {
    const { maxPrice, renderingContext, actions } = get()
    if (!maxPrice || !renderingContext) {
      return
    }

    const newPrice = navigateTick({
      liquidityData: renderingContext.liquidityData,
      currentPrice: maxPrice,
      direction: 'next',
    })

    if (newPrice !== undefined) {
      actions.setChartState({ maxPrice: newPrice })
      actions.handlePriceChange('max', newPrice)
    }
  },

  decrementMax: () => {
    const { maxPrice, renderingContext, actions } = get()
    if (!maxPrice || !renderingContext) {
      return
    }

    const newPrice = navigateTick({
      liquidityData: renderingContext.liquidityData,
      currentPrice: maxPrice,
      direction: 'prev',
    })

    if (newPrice !== undefined) {
      actions.setChartState({ maxPrice: newPrice })
      actions.handlePriceChange('max', newPrice)
    }
  },

  incrementMin: () => {
    const { minPrice, renderingContext, actions } = get()
    if (!minPrice || !renderingContext) {
      return
    }

    const newPrice = navigateTick({
      liquidityData: renderingContext.liquidityData,
      currentPrice: minPrice,
      direction: 'next',
    })

    if (newPrice !== undefined) {
      actions.setChartState({ minPrice: newPrice })
      actions.handlePriceChange('min', newPrice)
    }
  },

  decrementMin: () => {
    const { minPrice, renderingContext, actions } = get()
    if (!minPrice || !renderingContext) {
      return
    }

    const newPrice = navigateTick({
      liquidityData: renderingContext.liquidityData,
      currentPrice: minPrice,
      direction: 'prev',
    })

    if (newPrice !== undefined) {
      actions.setChartState({ minPrice: newPrice })
      actions.handlePriceChange('min', newPrice)
    }
  },
})
