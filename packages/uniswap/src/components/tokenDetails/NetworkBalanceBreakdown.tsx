import { useMemo } from 'react'
import { Flex, HeightAnimator, Separator, Text, TouchableArea } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { NetworkBalanceRow } from 'uniswap/src/components/tokenDetails/NetworkBalanceRow'
import { sortBalancesByValue } from 'uniswap/src/components/tokenDetails/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { isMobileApp } from 'utilities/src/platform'

interface NetworkBalanceBreakdownProps {
  balances: PortfolioBalance[]
  label: string
  expanded: boolean
  onExpandedChange?: (expanded: boolean) => void
  collapsible?: boolean
  onSelectBalance?: (balance: PortfolioBalance) => void
  renderNetworkLogo?: (chainId: UniverseChainId) => JSX.Element
}

export function NetworkBalanceBreakdown({
  balances,
  label,
  expanded,
  onExpandedChange,
  collapsible = true,
  onSelectBalance,
  renderNetworkLogo,
}: NetworkBalanceBreakdownProps): JSX.Element | null {
  const sortedBalances = useMemo(() => sortBalancesByValue(balances), [balances])
  const chainIds = useMemo(() => sortedBalances.map((b) => b.currencyInfo.currency.chainId), [sortedBalances])
  const isExpanded = collapsible ? expanded : true
  const chevronSize = isMobileApp ? '$icon.20' : '$icon.16'

  if (!sortedBalances.length) {
    return null
  }

  return (
    <Flex>
      {collapsible && <Separator mb="$spacing12" />}
      {collapsible ? (
        <Flex pb="$spacing8">
          <TouchableArea
            row
            justifyContent="space-between"
            alignItems="center"
            onPress={() => onExpandedChange?.(!expanded)}
          >
            <Text variant={isMobileApp ? 'body2' : 'body3'} color="$neutral2">
              {label}
            </Text>
            <Flex row alignItems="center" gap="$spacing8">
              {!isExpanded && <NetworkIconList chainIds={chainIds} size={16} />}
              {isExpanded ? (
                <ChevronsIn color="$neutral2" size={chevronSize} />
              ) : (
                <ChevronsOut color="$neutral2" size={chevronSize} />
              )}
            </Flex>
          </TouchableArea>
        </Flex>
      ) : (
        <Text variant="subheading1" color="$neutral1">
          {label}
        </Text>
      )}
      <HeightAnimator open={!collapsible || isExpanded}>
        {(!collapsible || isExpanded) &&
          sortedBalances.map(
            (balance): JSX.Element => (
              <NetworkBalanceRow
                key={balance.id}
                balance={balance}
                renderNetworkLogo={renderNetworkLogo}
                onPress={onSelectBalance ? () => onSelectBalance(balance) : undefined}
              />
            ),
          )}
      </HeightAnimator>
    </Flex>
  )
}
