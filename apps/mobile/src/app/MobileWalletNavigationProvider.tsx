import { StackActions } from '@react-navigation/native'
import { PropsWithChildren, useCallback } from 'react'
import { Share } from 'react-native'
import { useDispatch } from 'react-redux'
import { exploreNavigationRef, navigationRef } from 'src/app/navigation/navigationRef'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { closeAllModals, closeModal, openModal } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { NavigateToNftItemArgs } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  useFiatOnRampAggregatorCountryListQuery,
  useFiatOnRampAggregatorGetCountryQuery,
} from 'uniswap/src/features/fiatOnRamp/api'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { getTokenUrl } from 'uniswap/src/utils/linking'
import { closeKeyboardBeforeCallback } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import {
  getNavigateToSendFlowArgsInitialState,
  getNavigateToSwapFlowArgsInitialState,
  isNavigateToSwapFlowArgsPartialState,
  NavigateToExternalProfileArgs,
  NavigateToFiatOnRampArgs,
  NavigateToNftCollectionArgs,
  NavigateToSendFlowArgs,
  NavigateToSwapFlowArgs,
  ShareTokenArgs,
  WalletNavigationProvider,
} from 'wallet/src/contexts/WalletNavigationContext'

export function MobileWalletNavigationProvider({ children }: PropsWithChildren): JSX.Element {
  const handleShareToken = useHandleShareToken()
  const navigateToAccountActivityList = useNavigateToHomepageTab(HomeScreenTabIndex.Activity)
  const navigateToAccountTokenList = useNavigateToHomepageTab(HomeScreenTabIndex.Tokens)
  const navigateToBuyOrReceiveWithEmptyWallet = useNavigateToBuyOrReceiveWithEmptyWallet()
  const navigateToNftCollection = useNavigateToNftCollection()
  const navigateToNftDetails = useNavigateToNftDetails()
  const navigateToReceive = useNavigateToReceive()
  const navigateToSend = useNavigateToSend()
  const navigateToSwapFlow = useNavigateToSwapFlow()
  const navigateToTokenDetails = useNavigateToTokenDetails()
  const navigateToFiatOnRamp = useNavigateToFiatOnRamp()
  const navigateToExternalProfile = useNavigateToExternalProfile()

  return (
    <WalletNavigationProvider
      handleShareToken={handleShareToken}
      navigateToAccountActivityList={navigateToAccountActivityList}
      navigateToAccountTokenList={navigateToAccountTokenList}
      navigateToBuyOrReceiveWithEmptyWallet={navigateToBuyOrReceiveWithEmptyWallet}
      navigateToExternalProfile={navigateToExternalProfile}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
      navigateToNftCollection={navigateToNftCollection}
      navigateToNftDetails={navigateToNftDetails}
      navigateToReceive={navigateToReceive}
      navigateToSend={navigateToSend}
      navigateToSwapFlow={navigateToSwapFlow}
      navigateToTokenDetails={navigateToTokenDetails}
      navigateToPoolDetails={noop} // no pool details screen on mobile
    >
      {children}
    </WalletNavigationProvider>
  )
}

function useHandleShareToken(): (args: ShareTokenArgs) => Promise<void> {
  return useCallback(async ({ currencyId }: ShareTokenArgs): Promise<void> => {
    const url = getTokenUrl(currencyId, true)

    if (!url) {
      logger.error(new Error('Failed to get token URL'), {
        tags: { file: 'MobileWalletNavigationProvider.tsx', function: 'useHandleShareToken' },
        extra: { currencyId },
      })
      return
    }

    try {
      await Share.share({ message: url })

      sendAnalyticsEvent(WalletEventName.ShareButtonClicked, {
        entity: ShareableEntity.Token,
        url,
      })
    } catch (error) {
      logger.error(error, {
        tags: { file: 'MobileWalletNavigationProvider.tsx', function: 'useHandleShareToken' },
      })
    }
  }, [])
}

function useNavigateToHomepageTab(tab: HomeScreenTabIndex): () => void {
  const { navigate } = useAppStackNavigation()

  return useCallback((): void => {
    closeKeyboardBeforeCallback(() => {
      navigate(MobileScreens.Home, { tab })
    })
  }, [navigate, tab])
}

function useNavigateToReceive(): () => void {
  const dispatch = useDispatch()

  return useCallback((): void => {
    closeKeyboardBeforeCallback(() => {
      dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
    })
  }, [dispatch])
}

function useNavigateToSend(): (args: NavigateToSendFlowArgs) => void {
  const dispatch = useDispatch()

  return useCallback(
    (args: NavigateToSendFlowArgs) => {
      closeKeyboardBeforeCallback(() => {
        const initialSendState = getNavigateToSendFlowArgsInitialState(args)
        dispatch(openModal({ name: ModalName.Send, initialState: initialSendState }))
      })
    },
    [dispatch],
  )
}

// Helper function for when coming from BridgedAsset modal (skip BridgedAsset step)
function navigateToSwapWithTokenWarning({
  navigation,
  currencyId,
  swapInitialState,
}: {
  navigation: ReturnType<typeof useAppStackNavigation>
  currencyId: string
  swapInitialState?: TransactionState
}): void {
  navigation.dispatch(
    StackActions.replace(ModalName.TokenWarning, {
      initialState: {
        currencyId,
        onAcknowledge: () => {
          navigation.dispatch(StackActions.replace(ModalName.Swap, swapInitialState))
        },
      },
    }),
  )
}

// Helper function for full flow: TokenWarning -> BridgedAsset -> Swap
function navigateToSwapWithFullFlow({
  navigation,
  currencyId,
  swapInitialState,
}: {
  navigation: ReturnType<typeof useAppStackNavigation>
  currencyId: string
  swapInitialState?: TransactionState
}): void {
  navigation.navigate(ModalName.TokenWarning, {
    initialState: {
      currencyId,
      onAcknowledge: () => {
        navigation.dispatch(
          // Then replace TokenWarning with BridgedAsset
          StackActions.replace(ModalName.BridgedAssetNav, {
            initialState: {
              currencyId,
              onAcknowledge: () => {
                // Then replace BridgedAsset with Swap
                navigation.dispatch(StackActions.replace(ModalName.Swap, swapInitialState))
              },
            },
          }),
        )
      },
    },
  })
}

function useNavigateToSwapFlow(): (args: NavigateToSwapFlowArgs) => void {
  const { defaultChainId } = useEnabledChains()
  const navigation = useAppStackNavigation()
  const { onClose } = useReactNavigationModal()

  return useCallback(
    (args: NavigateToSwapFlowArgs): void => {
      closeKeyboardBeforeCallback(() => {
        const initialState = getNavigateToSwapFlowArgsInitialState(args, defaultChainId)

        // If no prefilled token, go directly to swap
        if (!isNavigateToSwapFlowArgsPartialState(args)) {
          onClose()
          navigation.navigate(ModalName.Swap, initialState)
          return
        }

        const currencyId = buildCurrencyId(args.currencyChainId, args.currencyAddress)

        // Show warning modal for prefilled tokens, which will handle token safety and bridged asset checks
        // The happy path is we first show the token warning modal, then the bridged asset modal, then the swap modal
        // However, if we are coming from BridgedAssetModal then we do not need to show it later
        if (args.origin === ModalName.BridgedAsset) {
          navigateToSwapWithTokenWarning({ navigation, currencyId, swapInitialState: initialState })
        } else {
          navigateToSwapWithFullFlow({ navigation, currencyId, swapInitialState: initialState })
        }
      })
    },
    [defaultChainId, navigation, onClose],
  )
}

function useNavigateToTokenDetails(): (currencyId: string) => void {
  const appNavigation = useAppStackNavigation()
  const { onClose } = useReactNavigationModal()
  const dispatch = useDispatch()

  return useCallback(
    (currencyId: string): void => {
      const isExploreNavigationActuallyFocused = Boolean(
        navigationRef.getCurrentRoute()?.name === ModalName.Explore &&
          exploreNavigationRef.current &&
          exploreNavigationRef.isFocused(),
      )

      closeKeyboardBeforeCallback(() => {
        dispatch(closeAllModals())
        if (isExploreNavigationActuallyFocused) {
          exploreNavigationRef.navigate(MobileScreens.TokenDetails, { currencyId })
        } else {
          onClose()
          appNavigation.reset({
            index: 1,
            routes: [{ name: MobileScreens.Home }, { name: MobileScreens.TokenDetails, params: { currencyId } }],
          })
        }
      })
    },
    [appNavigation, dispatch, onClose],
  )
}

function useNavigateToNftDetails(): (args: NavigateToNftItemArgs) => void {
  const navigation = useAppStackNavigation()

  return useCallback(
    ({ owner, contractAddress: address, tokenId, isSpam, fallbackData }: NavigateToNftItemArgs): void => {
      closeKeyboardBeforeCallback(() => {
        navigation.navigate(MobileScreens.NFTItem, {
          owner,
          address,
          tokenId,
          isSpam,
          fallbackData,
        })
      })
    },
    [navigation],
  )
}

function useNavigateToNftCollection(): (args: NavigateToNftCollectionArgs) => void {
  const appNavigation = useAppStackNavigation()

  return useCallback(
    ({ collectionAddress }: NavigateToNftCollectionArgs): void => {
      closeKeyboardBeforeCallback(() => {
        if (exploreNavigationRef.current && exploreNavigationRef.isFocused()) {
          exploreNavigationRef.navigate(MobileScreens.NFTCollection, {
            collectionAddress,
          })
        } else {
          appNavigation.navigate(MobileScreens.NFTCollection, {
            collectionAddress,
          })
        }
      })
    },
    [appNavigation],
  )
}

function useNavigateToBuyOrReceiveWithEmptyWallet(): () => void {
  const dispatch = useDispatch()

  const { data: countryResult } = useFiatOnRampAggregatorGetCountryQuery()
  const { data: countryOptionsResult } = useFiatOnRampAggregatorCountryListQuery({
    rampDirection: RampDirection.ONRAMP,
  })
  const forAggregatorEnabled = countryOptionsResult?.supportedCountries.some(
    (c) => c.countryCode === countryResult?.countryCode,
  )

  return useCallback((): void => {
    closeKeyboardBeforeCallback(() => {
      dispatch(closeModal({ name: ModalName.Send }))

      if (forAggregatorEnabled) {
        dispatch(openModal({ name: ModalName.FiatOnRampAggregator }))
      } else {
        dispatch(
          openModal({
            name: ModalName.WalletConnectScan,
            initialState: ScannerModalState.WalletQr,
          }),
        )
      }
    })
  }, [dispatch, forAggregatorEnabled])
}

function useNavigateToFiatOnRamp(): (args: NavigateToFiatOnRampArgs) => void {
  const dispatch = useDispatch()

  return useCallback(
    ({ prefilledCurrency, isOfframp }: NavigateToFiatOnRampArgs): void => {
      closeKeyboardBeforeCallback(() => {
        dispatch(openModal({ name: ModalName.FiatOnRampAggregator, initialState: { prefilledCurrency, isOfframp } }))
      })
    },
    [dispatch],
  )
}

function useNavigateToExternalProfile(): (args: NavigateToExternalProfileArgs) => void {
  const appNavigation = useAppStackNavigation()

  return useCallback(
    ({ address }: NavigateToExternalProfileArgs): void => {
      closeKeyboardBeforeCallback(() => {
        if (exploreNavigationRef.isFocused()) {
          exploreNavigationRef.navigate(MobileScreens.ExternalProfile, { address })
        } else {
          appNavigation.navigate(MobileScreens.ExternalProfile, { address })
        }
      })
    },
    [appNavigation],
  )
}
