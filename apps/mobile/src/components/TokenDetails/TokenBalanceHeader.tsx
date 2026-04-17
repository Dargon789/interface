import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

interface TokenBalanceHeaderProps {
  balance: PortfolioBalance
  isReadonly: boolean
  displayName?: string
}

export function TokenBalanceHeader({ balance, isReadonly, displayName }: TokenBalanceHeaderProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { isTestnetModeEnabled } = useEnabledChains()

  const fiatBalance = convertFiatAmountFormatted(balance.balanceUSD, NumberType.FiatTokenDetails)
  const tokenBalance = `${formatNumberOrString({ value: balance.quantity, type: NumberType.TokenNonTx })} ${getSymbolDisplayText(balance.currencyInfo.currency.symbol)}`

  return (
    <Flex row>
      <Flex fill gap="$spacing8">
        <Text color="$neutral2" variant="subheading2">
          {isReadonly ? t('token.balances.viewOnly', { ownerAddress: displayName ?? '' }) : t('token.balances.main')}
        </Text>
        <Flex row gap="$spacing8" alignItems="flex-end">
          <Text variant="heading3">{isTestnetModeEnabled ? tokenBalance : fiatBalance}</Text>
          <Text color="$neutral2" variant="body2" lineHeight="$large">
            {!isTestnetModeEnabled && tokenBalance}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
