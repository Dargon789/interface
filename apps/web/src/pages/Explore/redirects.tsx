import { ExploreTab } from 'pages/Explore/constants'
import { lazy, Suspense } from 'react'
import { Navigate, useLocation, useParams } from 'react-router'
import { Loader } from 'ui/src/loading/Loader'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const Explore = lazy(() => import('pages/Explore'))
const Toucan = lazy(() => import('pages/Explore/Toucan'))

// This function is needed to disambiguate URL params because useParams struggles to distinguish between /explore/:chainName and /explore/:tab
export function useExploreParams(): {
  tab?: ExploreTab
  chainName?: string
  tokenAddress?: string
} {
  const { tab, chainName, tokenAddress } = useParams<{ tab: string; chainName: string; tokenAddress: string }>()
  const isLegacyUrl = !useLocation().pathname.includes('explore')

  const exploreTabs = Object.values(ExploreTab)
  if (tab && !chainName && exploreTabs.includes(tab as ExploreTab)) {
    // /explore/:tab
    return { tab: tab as ExploreTab, chainName: undefined, tokenAddress }
  } else if (tab && !chainName) {
    // /explore/:chainName
    return { tab: undefined, chainName: tab, tokenAddress }
  } else if (isLegacyUrl && !tab) {
    // legacy /tokens, /tokens/:chainName, and /tokens/:chainName/:tokenAddress
    return { tab: ExploreTab.Tokens, chainName, tokenAddress }
  } else if (!tab) {
    // /explore
    return { tab: undefined, chainName: undefined, tokenAddress: undefined }
  } else {
    // /explore/:tab/:chainName
    return { tab: tab as ExploreTab, chainName, tokenAddress }
  }
}
export default function RedirectExplore() {
  const { tab, chainName, tokenAddress } = useExploreParams()
  const isLegacyUrl = !useLocation().pathname.includes('explore')
  const isToucanEnabled = useFeatureFlag(FeatureFlags.Toucan)

  if (isLegacyUrl) {
    if (tab && chainName && tokenAddress) {
      return <Navigate to={`/explore/${tab}/${chainName}/${tokenAddress}`} replace />
    } else if (chainName && tokenAddress) {
      return <Navigate to={`/explore/tokens/${chainName}/${tokenAddress}`} replace />
    } else if (tab && chainName) {
      return <Navigate to={`/explore/${tab}/${chainName}`} replace />
    }
  }

  if (tab === ExploreTab.Toucan) {
    if (!isToucanEnabled) {
      return <Navigate to="/explore" replace />
    }

    return (
      <Suspense fallback={<Loader.Box />}>
        <Toucan />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<Loader.Box />}>
      <Explore initialTab={tab} />
    </Suspense>
  )
}
