import { computeTickWindow } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'

describe('computeTickWindow', () => {
  it('returns original range when data fits naturally', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 100,
      minRequiredMaxIndex: 65,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(100)
  })

  it('extends windowMaxIndex to minRequiredMaxIndex when clearing price is above data', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 10,
      minRequiredMaxIndex: 65,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(65)
  })

  it('returns full range for wide tick ranges (bar consolidation handles display)', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 100_000,
      minRequiredMaxIndex: 50_015,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(100_000)
  })

  it('handles case where clearing price is below all bids', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 100,
      maxTickIndexAvailable: 200,
      minRequiredMaxIndex: 65,
    })

    expect(result.windowMinIndex).toBe(100)
    expect(result.windowMaxIndex).toBe(200)
  })

  it('handles single bid at floor with distant clearing price', () => {
    const result = computeTickWindow({
      minTickIndexAvailable: 0,
      maxTickIndexAvailable: 0,
      minRequiredMaxIndex: 1_000_015,
    })

    expect(result.windowMinIndex).toBe(0)
    expect(result.windowMaxIndex).toBe(1_000_015)
  })
})
