import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'
import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

export type TokenTableRow =
  | { type: 'parent'; tokenData: TokenData; subRows?: TokenTableRow[]; testId: string }
  | { type: 'child'; tokenData: TokenData; chainToken: TokenData['tokens'][number] }

/**
 * Builds table rows with optional subRows for multichain expandable UX.
 * When multichainExpandable is true and a token has tokens.length > 1,
 * the row has subRows (one per additional chain). Otherwise subRows is undefined.
 */
export function buildTokenTableRows(tokenData: TokenData[], multichainExpandable: boolean): TokenTableRow[] {
  return tokenData.map((tokenData): TokenTableRow => {
    const hasMultipleChains = multichainExpandable && tokenData.tokens.length > 1
    const subRows: TokenTableRow[] | undefined = hasMultipleChains
      ? tokenData.tokens.map((chainToken) => ({ type: 'child', tokenData, chainToken }))
      : undefined
    return { type: 'parent', tokenData, subRows, testId: tokenData.testId }
  })
}

export function getTokenTableRowId(row: TokenTableRow): string {
  if (row.type === 'parent') {
    return row.tokenData.id
  }
  return `${row.tokenData.id}-chain-${row.chainToken.chainId}`
}

export function getSubRows(row: TokenTableRow): TokenTableRow[] | undefined {
  if (row.type !== 'parent') {
    return undefined
  }
  return row.subRows
}

/** TokenData-like view for a child row so context menu and navigation use the chain-specific data. */
export function getTokenDataForRow(row: TokenTableRow): TokenData {
  if (row.type === 'parent') {
    return row.tokenData
  }
  const { tokenData, chainToken } = row
  return {
    ...tokenData,
    chainId: chainToken.chainId,
    currencyInfo: chainToken.currencyInfo,
    quantity: chainToken.quantity,
    symbol: chainToken.symbol,
    totalValue: chainToken.valueUsd,
  }
}

/** Stable per-chain row suffix (multiple balances can share the same chainId). */
function tokenDataChainRowSuffix(chainToken: TokenData['tokens'][number]): string {
  return (
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
    currencyId(chainToken.currencyInfo.currency) ??
    `${chainToken.chainId}-${currencyAddress(chainToken.currencyInfo.currency)}`
  )
}

export function isStablecoinForChainToken(chainToken: TokenData['tokens'][number]): boolean {
  const rawAddr = currencyAddress(chainToken.currencyInfo.currency).toLowerCase()
  const addr = chainToken.currencyInfo.currency.isNative ? DEFAULT_NATIVE_ADDRESS : rawAddr
  return isStablecoinAddress(chainToken.chainId, addr)
}

/**
 * Splits each multichain {@link TokenData} into one row per chain balance, each with `tokens.length === 1`,
 * matching the shape of a multichain row that only has a single chain.
 */
export function flattenTokenDataToSingleChainRows(tokenDataList: TokenData[]): TokenData[] {
  const result: TokenData[] = []
  for (const tokenData of tokenDataList) {
    const chainTokens = tokenData.tokens
    const only = chainTokens[0]
    if (chainTokens.length === 0) {
      continue
    }
    if (chainTokens.length === 1) {
      result.push({ ...tokenData, tokens: [only], isStablecoin: isStablecoinForChainToken(only) })
      continue
    }
    for (const chainToken of chainTokens) {
      const isStablecoin = isStablecoinForChainToken(chainToken)
      const price =
        chainToken.valueUsd > 0 && chainToken.quantity > 0 ? chainToken.valueUsd / chainToken.quantity : tokenData.price
      const rowSuffix = tokenDataChainRowSuffix(chainToken)
      result.push({
        ...tokenData,
        id: `${tokenData.id}-${rowSuffix}`,
        testId: `${TestID.TokenTableRowPrefix}${tokenData.id}-${rowSuffix}`,
        chainId: chainToken.chainId,
        currencyInfo: chainToken.currencyInfo,
        quantity: chainToken.quantity,
        symbol: chainToken.symbol,
        price,
        tokens: [chainToken],
        totalValue: chainToken.valueUsd,
        avgCost: undefined,
        unrealizedPnl: undefined,
        unrealizedPnlPercent: undefined,
        isStablecoin,
      })
    }
  }
  return result
}
