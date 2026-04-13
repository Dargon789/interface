import { memo, useCallback, useEffect, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { HeightAnimator } from 'ui/src/animations/components/HeightAnimator'
import { TokenCard } from 'uniswap/src/components/TokenSelector/items/tokens/TokenCard'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'

const MAX_CARDS_PER_ROW = 5

export const HorizontalTokenList = memo(function HorizontalTokenListInner({
  tokens: suggestedTokens,
  onSelectCurrency,
  index,
  section,
  expanded,
  onExpand,
}: HorizontalTokenListProps): JSX.Element {
  const shouldShowExpansion = suggestedTokens.length > MAX_CARDS_PER_ROW
  const visibleTokens = shouldShowExpansion
    ? expanded
      ? suggestedTokens
      : suggestedTokens.slice(0, MAX_CARDS_PER_ROW - 1)
    : suggestedTokens
  const remainingCount = shouldShowExpansion ? suggestedTokens.length - MAX_CARDS_PER_ROW + 1 : 0

  const [isInitialMount, setIsInitialMount] = useState(true)

  // Avoid animating the initial paint; only animate user-driven expansion.
  useEffect(() => {
    setIsInitialMount(false)
  }, [])

  const handleExpand = useCallback(() => {
    onExpand?.(suggestedTokens)
  }, [onExpand, suggestedTokens])

  return (
    <HeightAnimator open animationDisabled={isInitialMount} animation={expanded ? '200ms' : undefined}>
      <Flex row gap="$spacing4" flexWrap="wrap" py="$spacing8" mx="$spacing20">
        {visibleTokens.map((token) => (
          <Flex key={token.currencyInfo.currencyId} style={styles.fiveTokenRowCard}>
            <TokenCard index={index} section={section} token={token} onSelectCurrency={onSelectCurrency} />
          </Flex>
        ))}
        {!expanded && remainingCount > 0 && (
          <TouchableArea style={styles.fiveTokenRowCard} onPress={handleExpand}>
            <Flex fill centered borderRadius="$rounded16" backgroundColor="$surface2">
              <Text variant="buttonLabel3" color="$neutral2">
                {remainingCount}+
              </Text>
            </Flex>
          </TouchableArea>
        )}
      </Flex>
    </HeightAnimator>
  )
})

const styles = {
  fiveTokenRowCard: {
    width: 'calc(20% - 4px)',
  },
}
