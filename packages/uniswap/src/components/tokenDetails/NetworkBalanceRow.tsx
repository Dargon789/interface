import { memo } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'

const NETWORK_LOGO_SIZE = 24

function DefaultNetworkLogo({ chainId }: { chainId: UniverseChainId }): JSX.Element {
  return <NetworkLogo borderRadius={borderRadii.rounded8} chainId={chainId} size={NETWORK_LOGO_SIZE} />
}

interface NetworkBalanceRowProps {
  balance: PortfolioBalance
  onPress?: () => void
  renderNetworkLogo?: (chainId: UniverseChainId) => JSX.Element
}

export const NetworkBalanceRow = memo(function NetworkBalanceRow({
  balance,
  onPress,
  renderNetworkLogo,
}: NetworkBalanceRowProps): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { chainId } = balance.currencyInfo.currency

  const formattedUsdValue = convertFiatAmountFormatted(balance.balanceUSD, NumberType.PortfolioBalance)
  const formattedBalance = formatNumberOrString({ value: balance.quantity, type: NumberType.TokenNonTx })

  const content = (
    <Flex row my="$spacing8" alignItems="center" gap="$spacing12">
      {renderNetworkLogo ? renderNetworkLogo(chainId) : <DefaultNetworkLogo chainId={chainId} />}
      <Flex shrink row flex={1} justifyContent="space-between" alignItems="center">
        <Text variant="subheading2" color="$neutral1">
          {formattedUsdValue}
        </Text>
        <Text variant={isMobileApp ? 'subheading2' : 'body2'} color="$neutral2">
          {formattedBalance}
        </Text>
      </Flex>
    </Flex>
  )

  return (
    <TouchableArea disabled={!onPress} opacity={1} onPress={onPress}>
      {content}
    </TouchableArea>
  )
})
