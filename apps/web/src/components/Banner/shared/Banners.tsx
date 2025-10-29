import { manualChainOutageAtom, useChainOutageConfig } from 'featureFlags/flags/outageBanner'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BridgingPopularTokensBanner } from 'components/Banner/BridgingPopularTokens/BridgingPopularTokensBanner'
import { getOutageBannerSessionStorageKey, OutageBanner } from 'components/Banner/Outage/OutageBanner'
import { SOLANA_PROMO_BANNER_STORAGE_KEY, SolanaPromoBanner } from 'components/Banner/SolanaPromo/SolanaPromoBanner'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { useAppSelector } from 'state/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { getChainIdFromChainUrlParam, isChainUrlParam } from 'utils/chainParams'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export function Banners() {
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const isSolanaPromoEnabled = useFeatureFlag(FeatureFlags.SolanaPromo)
  const isBridgedAssetsBannerV2Enabled = useFeatureFlag(FeatureFlags.BridgedAssetsBannerV2)
  const hasDismissedBridgedAssetsBannerV2 = useAppSelector(
    (state) => state.uniswapBehaviorHistory.hasDismissedBridgedAssetsBannerV2,
  )

  // Read from both sources: error-detected (from GraphQL failures) and Statsig (manual config)
  const statsigOutage = useChainOutageConfig()
  const errorDetectedOutage = useAtomValue(manualChainOutageAtom)
  const outage = errorDetectedOutage || statsigOutage

  // Calculate the chainId for the current page's contextual chain (e.g. /tokens/ethereum or /tokens/arbitrum), if it exists.
  const pageChainId = useMemo(() => {
    const chainUrlParam = pathname.split('/').find(isChainUrlParam)
    return chainUrlParam ? getChainIdFromChainUrlParam(chainUrlParam) : UniverseChainId.Mainnet
  }, [pathname])
  const currentPageHasOutage = outage?.chainId === pageChainId

  const showOutageBanner = useMemo(() => {
    return (
      currentPage &&
      pageChainId &&
      currentPageHasOutage &&
      !sessionStorage.getItem(getOutageBannerSessionStorageKey(pageChainId)) &&
      (
        [
          InterfacePageName.ExplorePage,
          InterfacePageName.TokenDetailsPage,
          InterfacePageName.PoolDetailsPage,
          InterfacePageName.TokensPage,
        ] as string[]
      ).includes(currentPage)
    )
  }, [currentPage, currentPageHasOutage, pageChainId])

  // Outage Banners should take precedence over other promotional banners
  if (pageChainId && showOutageBanner) {
    return <OutageBanner chainId={pageChainId} version={currentPageHasOutage ? outage?.version : undefined} />
  }

  const userAlreadySeenSolanaPromo = localStorage.getItem(SOLANA_PROMO_BANNER_STORAGE_KEY) === 'true'
  if (isSolanaPromoEnabled && !userAlreadySeenSolanaPromo) {
    return <SolanaPromoBanner />
  }

  if (isBridgedAssetsBannerV2Enabled && !hasDismissedBridgedAssetsBannerV2) {
    return <BridgingPopularTokensBanner />
  }

  return null
}
