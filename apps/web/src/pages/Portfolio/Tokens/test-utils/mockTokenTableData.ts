import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TEST_TOKEN_1, TEST_TOKEN_1_INFO } from '~/test-utils/constants'

/** One chain balance row inside {@link TokenData.tokens}. */
export function createMockTokenTableChainToken(
  overrides: Partial<TokenData['tokens'][number]> & Pick<TokenData['tokens'][number], 'chainId' | 'currencyInfo'>,
): TokenData['tokens'][number] {
  return {
    quantity: 1,
    valueUsd: 100,
    symbol: 'TKN',
    ...overrides,
  }
}

/**
 * Full {@link TokenData} row for portfolio token table tests (Tokens table, row utils, search, etc.).
 * Defaults to a single mainnet {@link TEST_TOKEN_1_INFO} balance unless `tokens` is overridden.
 */
export function createMockTokenTableData(overrides: Partial<TokenData> = {}): TokenData {
  const { tokens: overrideTokens, ...restOverrides } = overrides
  const defaultChainToken = createMockTokenTableChainToken({
    chainId: UniverseChainId.Mainnet,
    currencyInfo: TEST_TOKEN_1_INFO,
    quantity: 1,
    valueUsd: 100,
    symbol: 'ABC',
  })
  const tokens = overrideTokens ?? ([defaultChainToken] satisfies TokenData['tokens'])
  const first = tokens[0]

  // No per-chain balances (e.g. edge cases for flatten/skip). Parent row fields are placeholders.
  if (!first) {
    return {
      id: 'row-id',
      testId: `${TestID.TokenTableRowPrefix}row-id`,
      chainId: UniverseChainId.Mainnet,
      currencyInfo: TEST_TOKEN_1_INFO,
      quantity: 0,
      symbol: 'ABC',
      price: 10,
      change1d: 0,
      totalValue: 0,
      allocation: 0,
      isHidden: false,
      isStablecoin: false,
      ...restOverrides,
      tokens: [],
    }
  }

  return {
    id: 'row-id',
    testId: `${TestID.TokenTableRowPrefix}row-id`,
    chainId: first.chainId,
    currencyInfo: first.currencyInfo,
    quantity: first.quantity,
    symbol: first.symbol,
    price: 10,
    change1d: 0,
    totalValue: 100,
    allocation: 1,
    isHidden: false,
    isStablecoin: false,
    ...restOverrides,
    tokens,
  }
}

/** {@link CurrencyInfo} default for portfolio token tests that only need a plausible token. */
export function createMockTokenTableCurrencyInfo(overrides: Partial<CurrencyInfo> = {}): CurrencyInfo {
  return {
    currencyId: 'TEST',
    currency: TEST_TOKEN_1,
    logoUrl: undefined,
    ...overrides,
  }
}

/** Minimal {@link TokenData} slice for tests that only need `currencyInfo` (e.g. search filtering). */
export function createMockTokenTableRowCurrencyOnly(
  overrides: Partial<Pick<TokenData, 'currencyInfo'>> = {},
): Pick<TokenData, 'currencyInfo'> {
  return {
    currencyInfo: createMockTokenTableCurrencyInfo(),
    ...overrides,
  }
}
