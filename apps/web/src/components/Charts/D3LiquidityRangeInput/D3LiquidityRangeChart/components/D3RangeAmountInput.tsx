import { getBaseAndQuoteCurrencies } from 'components/Liquidity/utils/currency'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Minus } from 'ui/src/components/icons/Minus'
import { Plus } from 'ui/src/components/icons/Plus'
import { fonts } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { numericInputRegex } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

enum RangeSelectionInput {
  MIN = 0,
  MAX = 1,
}

function numericInputEnforcerWithInfinity(value?: string): boolean {
  return !value || numericInputRegex.test(value) || value === '∞'
}

export function D3RangeAmountInput({
  value,
  input,
  typedValue,
  displayUserTypedValue,
  priceDifference,
  handleDecrement,
  handleIncrement,
  onBlur,
  isDisabled,
  isIncrementDisabled,
  isDecrementDisabled,
  showIncrementButtons = true,
  isInvalid = false,
  handlePriceRangeInput,
}: {
  value: string
  typedValue: string
  displayUserTypedValue: boolean
  input: RangeSelectionInput
  priceDifference?: string
  handleDecrement?: () => void
  handleIncrement?: () => void
  onBlur: () => void
  isDisabled?: boolean
  isIncrementDisabled?: boolean
  isDecrementDisabled?: boolean
  showIncrementButtons?: boolean
  isInvalid?: boolean
  handlePriceRangeInput: (input: RangeSelectionInput, value: string) => void
}) {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const {
    currencies,
    creatingPoolOrPair,
    priceRangeState: { priceInverted },
  } = useCreateLiquidityContext()

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.display, priceInverted)

  return (
    <Flex
      row
      flex={1}
      position="relative"
      backgroundColor="$surface2"
      borderTopLeftRadius={creatingPoolOrPair && input === RangeSelectionInput.MIN ? '$rounded20' : '$none'}
      borderTopRightRadius={creatingPoolOrPair && input === RangeSelectionInput.MAX ? '$rounded20' : '$none'}
      borderBottomRightRadius={input === RangeSelectionInput.MIN ? '$none' : '$rounded20'}
      borderBottomLeftRadius={input === RangeSelectionInput.MIN ? '$rounded20' : '$none'}
      $lg={{
        borderBottomRightRadius: input === RangeSelectionInput.MAX ? '$rounded20' : '$none',
        borderBottomLeftRadius: input === RangeSelectionInput.MAX ? '$rounded20' : '$none',
      }}
      p="$spacing16"
      justifyContent="space-between"
      overflow="hidden"
    >
      <Flex gap="$gap4" overflow="hidden" flex={1}>
        <Text variant="body3" color="$neutral2">
          {input === RangeSelectionInput.MIN ? t(`pool.minPrice`) : t(`pool.maxPrice`)}
        </Text>
        <AmountInput
          disabled={isDisabled}
          backgroundColor="$transparent"
          borderWidth="$none"
          borderRadius="$none"
          color={isInvalid ? '$statusCritical' : '$neutral1'}
          fontFamily="$heading"
          fontSize={fonts.heading3.fontSize}
          fontWeight={fonts.heading3.fontWeight}
          maxDecimals={quoteCurrency?.decimals ?? 18}
          overflow="visible"
          placeholder="0"
          placeholderTextColor={colors.neutral3.val}
          px="$none"
          py="$none"
          value={displayUserTypedValue ? typedValue : value}
          onChange={(e) => handlePriceRangeInput(input, e.nativeEvent.text)}
          onBlur={onBlur}
          inputEnforcer={numericInputEnforcerWithInfinity}
          $md={{
            fontSize: fonts.subheading2.fontSize,
            fontWeight: fonts.subheading2.fontWeight,
          }}
          testID={`${TestID.RangeInput}-${input}`}
        />
        <Text variant="body3" color="$neutral2">
          {priceDifference ? priceDifference : `${quoteCurrency?.symbol} = 1 ${baseCurrency?.symbol}`}
        </Text>
      </Flex>
      {showIncrementButtons && (
        <Flex gap={10}>
          <TouchableArea
            disabled={isIncrementDisabled}
            testID={`${TestID.RangeInputIncrement}-${input}`}
            alignItems="center"
            justifyContent="center"
            userSelect="none"
            onPress={handleIncrement}
            borderRadius="$roundedFull"
            p={8}
            backgroundColor="$surface3"
            hoverable
            hoverStyle={{ backgroundColor: '$surface3Hovered' }}
          >
            <Plus size="$icon.16" color="$neutral2" />
          </TouchableArea>
          <TouchableArea
            disabled={isDecrementDisabled}
            testID={`${TestID.RangeInputDecrement}-${input}`}
            alignItems="center"
            justifyContent="center"
            userSelect="none"
            onPress={handleDecrement}
            borderRadius="$roundedFull"
            p={8}
            backgroundColor="$surface3"
            hoverable
            hoverStyle={{ backgroundColor: '$surface3Hovered' }}
          >
            <Minus size="$icon.16" color="$neutral2" />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}
