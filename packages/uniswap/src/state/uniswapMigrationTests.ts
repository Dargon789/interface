/* biome-ignore-all lint/suspicious/noExplicitAny: legacy code needs review */
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { PreV55SearchResultType } from 'uniswap/src/state/oldTypes'

// Mobile: 89
// Extension: 25
// Web: 25

export function testRemoveTHBFromCurrency(migration: (state: any) => any, prevSchema: any): void {
  const result = migration(prevSchema)

  if (prevSchema.userSettings.currentCurrency === 'THB') {
    expect(result.userSettings.currentCurrency).toEqual('USD')
  } else {
    expect(result.userSettings.currentCurrency).toEqual(prevSchema.userSettings.currentCurrency)
  }
}

// Web: 55
// Mobile: 93
// Extension: 27

export function testMigrateSearchHistory(migration: (state: any) => any, prevSchema: any): void {
  const result = migration(prevSchema)

  if (prevSchema.searchHistory.results) {
    expect(result.searchHistory.results.length).toEqual(prevSchema.searchHistory.results.length)

    for (const item of result.searchHistory.results) {
      // Check that no result has type ENS or Unitag
      expect(item.type).not.toBe(PreV55SearchResultType.ENSAddress)
      expect(item.type).not.toBe(PreV55SearchResultType.Unitag)

      // Check that token types do not contain name or symbol
      if (item.type === SearchHistoryResultType.Token) {
        expect(item).not.toHaveProperty('name')
        expect(item).not.toHaveProperty('symbol')
      }
    }
  }
}
