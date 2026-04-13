import type { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { createContext, type ReactNode, useContext } from 'react'
import type { PollingInterval } from 'uniswap/src/constants/misc'
import { useTokenSpotPrice as useTokenSpotPriceLegacy } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useTokenSpotPriceCentralized } from 'uniswap/src/features/dataApi/tokenDetails/useTokenSpotPriceCentralized'
import {
  useUSDCPrice as useUSDCPriceLegacy,
  useUSDCValue as useUSDCValueLegacy,
  useUSDCValueWithStatus as useUSDCValueWithStatusLegacy,
} from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import {
  useUSDCPriceCentralized,
  useUSDCValueCentralized,
  useUSDCValueWithStatusCentralized,
} from 'uniswap/src/features/transactions/hooks/useUSDCPriceCentralized'
import type { CurrencyId } from 'uniswap/src/types/currency'

export interface TokenPriceHooks {
  useUSDCPrice: (
    currency?: Currency,
    pollInterval?: PollingInterval,
  ) => { price: Price<Currency, Currency> | undefined; isLoading: boolean }

  useUSDCValue: (
    currencyAmount: CurrencyAmount<Currency> | undefined | null,
    pollInterval?: PollingInterval,
  ) => CurrencyAmount<Currency> | null

  useUSDCValueWithStatus: (
    currencyAmount: CurrencyAmount<Currency> | undefined | null,
    pollInterval?: PollingInterval,
  ) => {
    value: CurrencyAmount<Currency> | null
    isLoading: boolean
  }

  useTokenSpotPrice: (currencyId: CurrencyId | undefined) => number | undefined
}

const LEGACY_HOOKS: TokenPriceHooks = {
  useUSDCPrice: useUSDCPriceLegacy,
  useUSDCValue: useUSDCValueLegacy,
  useUSDCValueWithStatus: useUSDCValueWithStatusLegacy,
  useTokenSpotPrice: useTokenSpotPriceLegacy,
}

// Metrics phase: USDC hooks go through centralized (for TAPI comparison logging),
// but spot price stays on GQL legacy until Aurora data quality is validated.
// GQL prices come from The Graph subgraphs (derivedETH × ethPriceUSD) — a different
// data source than Aurora's hub-and-spoke DAG. Once Aurora is validated against TAPI,
// this becomes CENTRALIZED_HOOKS (all hooks migrated to centralized price service).
const METRICS_PHASE_HOOKS: TokenPriceHooks = {
  useUSDCPrice: useUSDCPriceCentralized,
  useUSDCValue: useUSDCValueCentralized,
  useUSDCValueWithStatus: useUSDCValueWithStatusCentralized,
  useTokenSpotPrice: useTokenSpotPriceLegacy,
}

// Full rollout: all hooks go through centralized price service
const CENTRALIZED_HOOKS: TokenPriceHooks = {
  useUSDCPrice: useUSDCPriceCentralized,
  useUSDCValue: useUSDCValueCentralized,
  useUSDCValueWithStatus: useUSDCValueWithStatusCentralized,
  useTokenSpotPrice: useTokenSpotPriceCentralized,
}

const TokenPriceContext = createContext<TokenPriceHooks>(LEGACY_HOOKS)

export function TokenPriceProvider({ children }: { children: ReactNode }): JSX.Element {
  const useCentralized = useFeatureFlag(FeatureFlags.CentralizedPrices)
  const useWs = useFeatureFlag(FeatureFlags.CentralizedPricesWs)

  let hooks: TokenPriceHooks
  if (!useCentralized) {
    hooks = LEGACY_HOOKS
  } else if (!useWs) {
    hooks = METRICS_PHASE_HOOKS
  } else {
    hooks = CENTRALIZED_HOOKS
  }

  return <TokenPriceContext.Provider value={hooks}>{children}</TokenPriceContext.Provider>
}

export function useTokenPriceHooks(): TokenPriceHooks {
  return useContext(TokenPriceContext)
}
