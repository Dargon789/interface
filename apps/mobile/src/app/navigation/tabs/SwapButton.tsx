import React, { useCallback, useRef } from 'react'
import { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Flex, TouchableArea, useSporeColors } from 'ui/src'
import { SwapDotted } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, spacing } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/dataApi/balances/balances'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const ACTIVE_SCALE = 0.96
const LONG_PRESS_HAPTIC_DELAY = 200 // ms - faster than default long press (usually 500ms)

interface SwapButtonProps {
  onLongPress: () => void
  onClose?: () => void
}

export function SwapButton({ onLongPress, onClose }: SwapButtonProps): JSX.Element {
  const colors = useSporeColors()
  const { defaultChainId } = useEnabledChains()
  const { hapticFeedback } = useHapticFeedback()
  const { navigate } = useAppStackNavigation()

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasTriggeredLongPressHaptic = useRef(false)

  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)
  const inputCurrencyId = useHighestBalanceNativeCurrencyId({
    evmAddress: activeAccountAddress,
    chainId: persistedFilteredChainIds?.[CurrencyField.INPUT],
  })

  const onPress = useCallback(async () => {
    // Close modal if onClose is provided
    onClose?.()

    navigate(
      ModalName.Swap,
      prepareSwapFormState({
        inputCurrencyId,
        defaultChainId,
        filteredChainIdsOverride: persistedFilteredChainIds,
      }),
    )

    // Only trigger light haptic if we haven't already triggered long press haptic
    if (!hasTriggeredLongPressHaptic.current) {
      await hapticFeedback.light()
    }
  }, [inputCurrencyId, defaultChainId, hapticFeedback, persistedFilteredChainIds, navigate, onClose])

  const handleLongPress = useCallback(() => {
    // Don't trigger haptic here since timer already handled it
    onLongPress()
  }, [onLongPress])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    hasTriggeredLongPressHaptic.current = false
  }, [])

  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])

  const onPressIn = useCallback(() => {
    cancelAnimation(scale)
    scale.value = withSpring(ACTIVE_SCALE, {
      damping: 15,
      stiffness: 300,
    })

    // Use a timer to trigger haptic feedback so that it activates faster than the default long press
    longPressTimerRef.current = setTimeout(async () => {
      if (!hasTriggeredLongPressHaptic.current) {
        await hapticFeedback.success()
        hasTriggeredLongPressHaptic.current = true
      }
    }, LONG_PRESS_HAPTIC_DELAY)
  }, [scale, hapticFeedback])

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    })

    // Clear the timer when press ends
    clearLongPressTimer()
  }, [scale, clearLongPressTimer])

  return (
    <Trace logPress element={ElementName.Swap}>
      <TouchableArea
        testID={ElementName.Swap}
        activeOpacity={1}
        onPress={onPress}
        onLongPress={handleLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <AnimatedFlex style={animatedStyle}>
          <Flex
            borderRadius="$roundedFull"
            backgroundColor="$accent1"
            px="$spacing24"
            py="$spacing12"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 6 }}
            shadowRadius={spacing.spacing12}
          >
            <SwapDotted size={iconSizes.icon28} color={colors.white.val} />
          </Flex>
        </AnimatedFlex>
      </TouchableArea>
    </Trace>
  )
}
