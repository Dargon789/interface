import { Currency } from '@uniswap/sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex } from 'ui/src'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { isUniverseChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { areCurrenciesEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCurrency } from '~/hooks/Tokens'
import { Swap } from '~/pages/Swap'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPSwapCurrency } from '~/pages/TokenDetails/hooks/useTDPSwapCurrency'
import { useUserPreservedCurrencies } from '~/pages/TokenDetails/hooks/useUserPreservedCurrencies'
import { CurrencyState } from '~/state/swap/types'
import { getInitialLogoUrl } from '~/utils/getInitialLogoURL'

export function TDPSwapComponent() {
  const { t } = useTranslation()
  const { address, currency, currencyChainId, tokenColor } = useTDPStore((s) => ({
    address: s.address,
    currency: s.currency!,
    currencyChainId: s.currencyChainId,
    tokenColor: s.tokenColor,
  }))
  const navigate = useNavigate()
  const swapCurrency = useTDPSwapCurrency()

  const currencyInfo = useCurrencyInfo(currencyId(currency))

  const { inputCurrency, outputCurrency } = useSwapInitialCurrencies(swapCurrency)

  // If the initial input currency is the same as the swap currency, then we are selling the TDP currency
  const computedOutputCurrency = useMemo((): Currency | undefined => {
    if (
      areCurrenciesEqual(inputCurrency, swapCurrency) &&
      // ensure the output is not equal to the input before setting
      !areCurrenciesEqual(outputCurrency, inputCurrency)
    ) {
      return outputCurrency
    }

    // ensure the swap currency is not equal to the input before setting
    if (areCurrenciesEqual(swapCurrency, inputCurrency)) {
      return undefined
    }

    return swapCurrency
  }, [swapCurrency, inputCurrency, outputCurrency])

  const {
    inputCurrency: initialInputCurrency,
    outputCurrency: initialOutputCurrency,
    markInteracted,
  } = useUserPreservedCurrencies(inputCurrency, computedOutputCurrency)

  const [prevTokens, setPrevTokens] = useState<CurrencyState>({
    inputCurrency: initialInputCurrency,
    outputCurrency: initialOutputCurrency,
  })

  // Keep prevTokens in sync when auto-fill currencies change (e.g., network filter change).
  // Without this, handleCurrencyChange compares against stale old-chain tokens and navigates unexpectedly.
  useEffect(() => {
    setPrevTokens({ inputCurrency: initialInputCurrency, outputCurrency: initialOutputCurrency })
  }, [initialInputCurrency, initialOutputCurrency])

  const handleCurrencyChange = useCallback(
    (tokens: CurrencyState, isBridgePair?: boolean) => {
      markInteracted()
      const inputCurrencyURLAddress = getCurrencyURLAddress(tokens.inputCurrency)
      const outputCurrencyURLAddress = getCurrencyURLAddress(tokens.outputCurrency)

      const inputEquivalent =
        tokens.inputCurrency &&
        areAddressesEqual({
          addressInput1: { address: inputCurrencyURLAddress, chainId: tokens.inputCurrency.chainId },
          addressInput2: { address, chainId: currencyChainId },
        }) &&
        tokens.inputCurrency.chainId === currencyChainId
      const outputEquivalent =
        tokens.outputCurrency &&
        areAddressesEqual({
          addressInput1: { address: outputCurrencyURLAddress, chainId: tokens.outputCurrency.chainId },
          addressInput2: { address, chainId: currencyChainId },
        }) &&
        tokens.outputCurrency.chainId === currencyChainId

      if (inputEquivalent || outputEquivalent || isBridgePair) {
        setPrevTokens(tokens)
        return
      }

      // If the user replaced the default token, we will hit this path.
      // In this case, we want to navigate to the token that replaced it,
      // which is the token that was not in the previous state.
      const newDefaultToken = includesToken(prevTokens, tokens.inputCurrency)
        ? tokens.outputCurrency
        : tokens.inputCurrency

      setPrevTokens(tokens)

      if (!newDefaultToken) {
        return
      }

      const preloadedLogoSrc = getInitialLogoUrl({
        address: newDefaultToken.wrapped.address,
        chainId: newDefaultToken.chainId,
      })
      const url = getTokenDetailsURL({
        // The function falls back to "NATIVE" if the address is null
        address: newDefaultToken.isNative ? null : newDefaultToken.address,
        chain: toGraphQLChain(isUniverseChainId(newDefaultToken.chainId) ? newDefaultToken.chainId : currencyChainId),
        inputAddress: inputCurrencyURLAddress,
        outputAddress: outputCurrencyURLAddress,
      })
      navigate(url, { state: { preloadedLogoSrc } })
    },
    [address, currencyChainId, markInteracted, navigate, prevTokens],
  )

  const [showWarningModal, setShowWarningModal] = useState(false)
  const closeWarningModal = useCallback(() => setShowWarningModal(false), [])

  const onTokenWarningReportSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-token-warning-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  return (
    <Flex gap="$gap12">
      <Swap
        syncTabToUrl={false}
        initialInputChainId={swapCurrency.chainId}
        initialInputCurrency={initialInputCurrency}
        initialOutputCurrency={initialOutputCurrency}
        onCurrencyChange={handleCurrencyChange}
        tokenColor={tokenColor}
        tdpCurrency={swapCurrency}
      />
      <TokenWarningCard currencyInfo={currencyInfo} onPress={() => setShowWarningModal(true)} />
      {currencyInfo && (
        // Intentionally duplicative with the TokenWarningModal in the swap component; this one only displays when user clicks "i" Info button on the TokenWarningCard
        <TokenWarningModal
          currencyInfo0={currencyInfo}
          isInfoOnlyWarning
          isVisible={showWarningModal}
          closeModalOnly={closeWarningModal}
          onReportSuccess={onTokenWarningReportSuccess}
          onAcknowledge={closeWarningModal}
        />
      )}
    </Flex>
  )
}

function getCurrencyURLAddress(currency?: Currency): string {
  if (!currency) {
    return ''
  }

  if (currency.isToken) {
    return currency.address
  }
  return NATIVE_CHAIN_ID
}

// Defaults the input currency to the swap currency's native currency or undefined if the swap currency is already the chain's native currency
// Note: Query string input currency takes precedence if it's set
function useSwapInitialCurrencies(swapCurrency: Currency) {
  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()

  const inputTokenAddress = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string'
      ? parsedQs.inputCurrency
      : swapCurrency.isNative
        ? undefined
        : getNativeAddress(swapCurrency.chainId)
  }, [swapCurrency.chainId, swapCurrency.isNative, parsedQs.inputCurrency])

  const outputTokenAddress = useMemo(() => {
    return typeof parsedQs.outputCurrency === 'string'
      ? parsedQs.outputCurrency
      : swapCurrency.isNative
        ? undefined
        : getNativeAddress(swapCurrency.chainId)
  }, [swapCurrency.chainId, swapCurrency.isNative, parsedQs.outputCurrency])

  return {
    inputCurrency: useCurrency({
      address: inputTokenAddress,
      chainId: swapCurrency.chainId,
    }),
    outputCurrency: useCurrency({
      address: outputTokenAddress,
      chainId: swapCurrency.chainId,
    }),
  }
}

function includesToken(tokens: CurrencyState | undefined, token: Currency | undefined): boolean {
  if (!tokens || !token) {
    return false
  }
  return areCurrenciesEqual(tokens.inputCurrency, token) || areCurrenciesEqual(tokens.outputCurrency, token)
}
