import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenBalanceHeader } from 'src/components/TokenDetails/TokenBalanceHeader'
import { Flex, Separator } from 'ui/src'
import { NetworkBalanceBreakdown } from 'uniswap/src/components/tokenDetails/NetworkBalanceBreakdown'
import { computeAggregateBalance } from 'uniswap/src/components/tokenDetails/utils'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useActiveAccount, useDisplayName } from 'wallet/src/features/wallet/hooks'

export function MultichainTokenBalances({
  currentChainBalance,
  otherChainBalances,
}: {
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
}): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const displayName = useDisplayName(activeAccount?.address, { includeUnitagSuffix: true })?.name
  const isReadonly = activeAccount?.type === AccountType.Readonly

  const allBalances = useMemo(() => {
    const balances: PortfolioBalance[] = []
    if (currentChainBalance) {
      balances.push(currentChainBalance)
    }
    if (otherChainBalances) {
      balances.push(...otherChainBalances)
    }
    return balances
  }, [currentChainBalance, otherChainBalances])

  const aggregateBalance = useMemo(
    () => computeAggregateBalance(allBalances, currentChainBalance?.currencyInfo),
    [allBalances, currentChainBalance?.currencyInfo],
  )

  const hasMultipleChains = allBalances.length > 1
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true)

  return (
    <Flex borderRadius="$rounded8" gap="$spacing12">
      {aggregateBalance && (
        <Flex gap="$spacing24">
          <Separator />
          <TokenBalanceHeader balance={aggregateBalance} displayName={displayName} isReadonly={isReadonly} />
        </Flex>
      )}
      {hasMultipleChains && (
        <NetworkBalanceBreakdown
          balances={allBalances}
          label={t('tdp.balanceSummary.breakdown')}
          expanded={isBreakdownExpanded}
          onExpandedChange={setIsBreakdownExpanded}
        />
      )}
    </Flex>
  )
}
