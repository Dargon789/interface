import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin, isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'
import {
  buildTokenTableRows,
  flattenTokenDataToSingleChainRows,
  getSubRows,
  getTokenDataForRow,
  getTokenTableRowId,
  isStablecoinForChainToken,
} from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'
import {
  createMockTokenTableChainToken,
  createMockTokenTableData,
} from '~/pages/Portfolio/Tokens/test-utils/mockTokenTableData'
import { NATIVE_INFO, TEST_TOKEN_1, TEST_TOKEN_1_INFO, TEST_TOKEN_2_INFO, USDC_INFO } from '~/test-utils/constants'

describe('buildTokenTableRows', () => {
  it('returns parent rows without subRows when multichainExpandable is false', () => {
    const tokenData = createMockTokenTableData({
      tokens: [
        createMockTokenTableChainToken({ chainId: 1, currencyInfo: TEST_TOKEN_1_INFO, symbol: 'A' }),
        createMockTokenTableChainToken({ chainId: 42161, currencyInfo: TEST_TOKEN_2_INFO, symbol: 'B' }),
      ],
    })
    const rows = buildTokenTableRows([tokenData], false)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ type: 'parent', testId: tokenData.testId })
    expect(rows[0].type === 'parent' && rows[0].subRows).toBeUndefined()
  })

  it('returns parent rows without subRows when only one chain', () => {
    const tokenData = createMockTokenTableData()
    const rows = buildTokenTableRows([tokenData], true)
    expect(rows).toHaveLength(1)
    expect(rows[0].type === 'parent' && rows[0].subRows).toBeUndefined()
  })

  it('adds a child subRow per chain when multichainExpandable and multiple tokens', () => {
    const t1 = createMockTokenTableChainToken({ chainId: 1, currencyInfo: TEST_TOKEN_1_INFO, symbol: 'A' })
    const t2 = createMockTokenTableChainToken({ chainId: 42161, currencyInfo: TEST_TOKEN_2_INFO, symbol: 'B' })
    const tokenData = createMockTokenTableData({ tokens: [t1, t2] })
    const rows = buildTokenTableRows([tokenData], true)
    expect(rows).toHaveLength(1)
    const parent = rows[0]
    expect(parent.type).toBe('parent')
    if (parent.type !== 'parent') {
      return
    }
    expect(parent.subRows).toHaveLength(2)
    expect(parent.subRows?.[0]).toEqual({ type: 'child', tokenData, chainToken: t1 })
    expect(parent.subRows?.[1]).toEqual({ type: 'child', tokenData, chainToken: t2 })
  })
})

describe('getTokenTableRowId', () => {
  it('returns tokenData.id for parent rows', () => {
    const tokenData = createMockTokenTableData({ id: 'parent-1' })
    const row = buildTokenTableRows([tokenData], false)[0]
    expect(getTokenTableRowId(row)).toBe('parent-1')
  })

  it('returns id with chain suffix for child rows', () => {
    const tokenData = createMockTokenTableData({ id: 'mc' })
    const chainToken = createMockTokenTableChainToken({ chainId: 10, currencyInfo: TEST_TOKEN_1_INFO })
    const child = { type: 'child' as const, tokenData, chainToken }
    expect(getTokenTableRowId(child)).toBe('mc-chain-10')
  })
})

describe('getSubRows', () => {
  it('returns undefined for child rows', () => {
    const tokenData = createMockTokenTableData()
    const chainToken = tokenData.tokens[0]!
    const child = { type: 'child' as const, tokenData, chainToken }
    expect(getSubRows(child)).toBeUndefined()
  })

  it('returns subRows for parent when present', () => {
    const tokenData = createMockTokenTableData({
      tokens: [
        createMockTokenTableChainToken({ chainId: 1, currencyInfo: TEST_TOKEN_1_INFO }),
        createMockTokenTableChainToken({ chainId: 2, currencyInfo: TEST_TOKEN_2_INFO }),
      ],
    })
    const parent = buildTokenTableRows([tokenData], true)[0]
    const sub = getSubRows(parent)
    expect(sub).toHaveLength(2)
  })

  it('returns undefined for parent without subRows', () => {
    const tokenData = createMockTokenTableData()
    const parent = buildTokenTableRows([tokenData], true)[0]
    expect(getSubRows(parent)).toBeUndefined()
  })
})

describe('getTokenDataForRow', () => {
  it('returns tokenData unchanged for parent rows', () => {
    const tokenData = createMockTokenTableData({ id: 'x' })
    const parent = buildTokenTableRows([tokenData], false)[0]
    expect(getTokenDataForRow(parent)).toBe(tokenData)
  })

  it('projects chain-specific fields for child rows', () => {
    const tokenData = createMockTokenTableData({
      id: 'agg',
      price: 99,
      tokens: [
        createMockTokenTableChainToken({
          chainId: 42161,
          currencyInfo: TEST_TOKEN_2_INFO,
          quantity: 2,
          valueUsd: 50,
          symbol: 'DEF',
        }),
        createMockTokenTableChainToken({ chainId: 1, currencyInfo: TEST_TOKEN_1_INFO }),
      ],
    })
    const chainToken = tokenData.tokens[0]!
    const child = { type: 'child' as const, tokenData, chainToken }
    const view = getTokenDataForRow(child)
    expect(view.chainId).toBe(42161)
    expect(view.currencyInfo).toBe(chainToken.currencyInfo)
    expect(view.quantity).toBe(2)
    expect(view.symbol).toBe('DEF')
    expect(view.totalValue).toBe(50)
    expect(view.tokens).toEqual(tokenData.tokens)
  })
})

describe('isStablecoinForChainToken', () => {
  it('returns true for USDC on mainnet', () => {
    const chainToken = createMockTokenTableChainToken({
      chainId: UniverseChainId.Mainnet,
      currencyInfo: USDC_INFO,
    })
    expect(isStablecoinForChainToken(chainToken)).toBe(true)
  })

  it('returns false for a non-stablecoin ERC20', () => {
    const chainToken = createMockTokenTableChainToken({
      chainId: UniverseChainId.Mainnet,
      currencyInfo: TEST_TOKEN_1_INFO,
    })
    expect(isStablecoinForChainToken(chainToken)).toBe(false)
  })

  it('uses DEFAULT_NATIVE_ADDRESS when currency is native (matches isStablecoinAddress on canonical native)', () => {
    const chainToken = createMockTokenTableChainToken({
      chainId: UniverseChainId.Mainnet,
      currencyInfo: NATIVE_INFO,
    })
    expect(isStablecoinForChainToken(chainToken)).toBe(
      isStablecoinAddress(UniverseChainId.Mainnet, DEFAULT_NATIVE_ADDRESS),
    )
  })
})

describe('flattenTokenDataToSingleChainRows', () => {
  it('skips entries with no chain tokens', () => {
    const empty = createMockTokenTableData({ tokens: [] })
    expect(flattenTokenDataToSingleChainRows([empty])).toEqual([])
  })

  it('normalizes single-chain rows to tokens length 1', () => {
    const tokenData = createMockTokenTableData({ id: 'single' })
    const only = tokenData.tokens[0]!
    const out = flattenTokenDataToSingleChainRows([tokenData])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      ...tokenData,
      tokens: [only],
    })
  })

  it('splits multichain rows and derives per-row price from value and quantity', () => {
    const tokenData = createMockTokenTableData({
      id: 'multi',
      price: 5,
      tokens: [
        createMockTokenTableChainToken({
          chainId: 1,
          currencyInfo: TEST_TOKEN_1_INFO,
          quantity: 2,
          valueUsd: 10,
          symbol: 'A',
        }),
        createMockTokenTableChainToken({
          chainId: 42161,
          currencyInfo: TEST_TOKEN_2_INFO,
          quantity: 0,
          valueUsd: 0,
          symbol: 'B',
        }),
      ],
    })
    const out = flattenTokenDataToSingleChainRows([tokenData])
    expect(out).toHaveLength(2)

    const suffix1 = currencyId(TEST_TOKEN_1)!
    expect(out[0]).toMatchObject({
      id: `multi-${suffix1}`,
      testId: `${TestID.TokenTableRowPrefix}multi-${suffix1}`,
      chainId: 1,
      quantity: 2,
      price: 5,
      totalValue: 10,
      tokens: [tokenData.tokens[0]],
      avgCost: undefined,
      unrealizedPnl: undefined,
      unrealizedPnlPercent: undefined,
    })

    expect(out[1]).toMatchObject({
      chainId: 42161,
      price: 5,
      tokens: [tokenData.tokens[1]],
    })
  })

  it('marks stablecoin rows using chain stablecoin list', () => {
    const primaryStable = getPrimaryStablecoin(UniverseChainId.Mainnet)
    const usdcInfo = { ...TEST_TOKEN_1_INFO, currency: primaryStable }
    const tokenData = createMockTokenTableData({
      id: 'st',
      tokens: [
        createMockTokenTableChainToken({
          chainId: UniverseChainId.Mainnet,
          currencyInfo: usdcInfo,
          quantity: 1,
          valueUsd: 1,
          symbol: 'USDC',
        }),
      ],
    })
    const out = flattenTokenDataToSingleChainRows([tokenData])
    expect(out).toHaveLength(1)
    expect(out[0]!.isStablecoin).toBe(true)
  })
})
