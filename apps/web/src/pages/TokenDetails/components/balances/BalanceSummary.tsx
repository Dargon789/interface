import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text } from 'ui/src'
import { NetworkBalanceBreakdown } from 'uniswap/src/components/tokenDetails/NetworkBalanceBreakdown'
import { computeAggregateBalance } from 'uniswap/src/components/tokenDetails/utils'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { Balance } from '~/pages/TokenDetails/components/balances/Balance'
import { BridgedAssetWithdrawButton } from '~/pages/TokenDetails/components/balances/BridgedAssetWithdrawButton'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export function BalanceSummary(): JSX.Element | null {
  const { isDisconnected } = useConnectionStatus()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const { currencyChain, multiChainMap } = useTDPStore((s) => ({
    currencyChain: s.currencyChain,
    multiChainMap: s.multiChainMap,
  }))

  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const otherChainBalances: PortfolioBalance[] = []
  const allBalances: PortfolioBalance[] = []
  for (const [key, value] of Object.entries(multiChainMap)) {
    if (value.balance !== undefined) {
      allBalances.push(value.balance)
      if (key !== currencyChain) {
        otherChainBalances.push(value.balance)
      }
    }
  }

  const isMultichainBalance = otherChainBalances.length > 0

  const displayBalance =
    multichainTokenUxEnabled && isMultichainBalance
      ? computeAggregateBalance(allBalances, pageChainBalance?.currencyInfo)
      : pageChainBalance

  const hasBalances = Boolean(displayBalance || isMultichainBalance)

  if (isDisconnected || !hasBalances) {
    return null
  }
  return (
    <Flex gap="$gap24" height="fit-content" width="100%">
      <Flex gap="$gap16">
        <PageChainBalanceSummary
          pageChainBalance={displayBalance}
          isMultichainBalance={multichainTokenUxEnabled && isMultichainBalance}
        />
        {isMultichainBalance && (
          <BreakdownSection
            otherChainBalances={otherChainBalances}
            pageChainBalance={pageChainBalance}
            hasPageChainBalance={!!pageChainBalance}
          />
        )}
      </Flex>
      <BridgedAssetWithdrawButton />
    </Flex>
  )
}

function PageChainBalanceSummary({
  pageChainBalance,
  isMultichainBalance = false,
}: {
  pageChainBalance?: PortfolioBalance
  isMultichainBalance?: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  if (!pageChainBalance) {
    return null
  }
  const currency = pageChainBalance.currencyInfo.currency
  return (
    <Flex height="fit-content" width="100%" gap="$gap16">
      <Text variant="subheading2" color="$neutral2">
        {t('tdp.balanceSummary.title')}
      </Text>
      <Balance
        currency={currency}
        fetchedBalance={pageChainBalance}
        isAggregate={isMultichainBalance}
        isMultichainBalance={isMultichainBalance}
      />
    </Flex>
  )
}

function BreakdownSection({
  otherChainBalances,
  pageChainBalance,
  hasPageChainBalance,
}: {
  otherChainBalances: readonly PortfolioBalance[]
  pageChainBalance?: PortfolioBalance
  hasPageChainBalance: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()

  const displayBalances = useMemo(
    () =>
      multichainTokenUxEnabled
        ? [...(pageChainBalance ? [pageChainBalance] : []), ...otherChainBalances]
        : [...otherChainBalances],
    [multichainTokenUxEnabled, pageChainBalance, otherChainBalances],
  )

  const handleSelectBalance = useCallback(
    (balance: PortfolioBalance) => {
      const currency = balance.currencyInfo.currency
      const chainId = currency.chainId || defaultChainId
      navigate(
        getTokenDetailsURL({
          address: currency.isToken ? currency.address : undefined,
          chain: toGraphQLChain(chainId),
        }),
      )
    },
    [defaultChainId, navigate],
  )

  const renderNetworkLogo = useCallback((chainId: UniverseChainId) => {
    const chainName = getChainLabel(chainId)
    return (
      <MouseoverTooltip
        placement="left"
        size={TooltipSize.Max}
        text={<Text variant="body3">{chainName}</Text>}
        offsetX={0}
      >
        <ChainLogo chainId={chainId} size={24} borderRadius={6} />
      </MouseoverTooltip>
    )
  }, [])

  const collapseLabel = multichainTokenUxEnabled
    ? t('tdp.balanceSummary.breakdown')
    : t('tdp.balanceSummary.otherNetworks')

  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true)

  if (!displayBalances.length) {
    return null
  }

  return (
    <NetworkBalanceBreakdown
      balances={displayBalances}
      label={collapseLabel}
      expanded={hasPageChainBalance ? isBreakdownExpanded : true}
      onExpandedChange={hasPageChainBalance ? setIsBreakdownExpanded : undefined}
      collapsible={hasPageChainBalance}
      renderNetworkLogo={renderNetworkLogo}
      onSelectBalance={handleSelectBalance}
    />
  )
}
