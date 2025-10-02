import { NetworkStatus } from '@apollo/client'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { MultiBlockchainAddressDisplay } from 'components/AccountDetails/MultiBlockchainAddressDisplay'
import { ActionTile } from 'components/AccountDrawer/ActionTile'
import { DisconnectButton } from 'components/AccountDrawer/DisconnectButton'
import { DownloadGraduatedWalletCard } from 'components/AccountDrawer/DownloadGraduatedWalletCard'
import { EmptyWallet } from 'components/AccountDrawer/MiniPortfolio/EmptyWallet'
import { ExtensionDeeplinks } from 'components/AccountDrawer/MiniPortfolio/ExtensionDeeplinks'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import MiniPortfolio from 'components/AccountDrawer/MiniPortfolio/MiniPortfolio'
import { SendButtonTooltip } from 'components/AccountDrawer/SendButtonTooltip'
import { LimitedSupportBanner } from 'components/Banner/LimitedSupportBanner'
import DelegationMismatchModal from 'components/delegation/DelegationMismatchModal'
import { Settings } from 'components/Icons/Settings'
import { ReceiveModalState } from 'components/ReceiveCryptoModal/types'
import { useOpenReceiveCryptoModal } from 'components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import StatusIcon from 'components/StatusIcon'
import { useIsUniswapExtensionConnected } from 'hooks/useIsUniswapExtensionConnected'
import { useModalState } from 'hooks/useModalState'
import { useTheme } from 'lib/styled-components'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from 'state/claim/hooks'
import { Button, Flex, IconButton } from 'ui/src'
import { ArrowDownCircleFilled } from 'ui/src/components/icons/ArrowDownCircleFilled'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { Shine } from 'ui/src/loading/Shine'
import AnimatedNumber, {
  BALANCE_CHANGE_INDICATION_DURATION,
} from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useHasAccountMismatchOnAnyChain } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import i18next from 'uniswap/src/i18n'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

export default function AuthenticatedHeader({
  evmAddress,
  svmAddress,
  openSettings,
}: {
  evmAddress?: string
  svmAddress?: string
  openSettings: () => void
}) {
  const { t } = useTranslation()

  const isSolanaConnected = useConnectionStatus(Platform.SVM).isConnected
  const shouldShowExtensionDeeplinks = useIsUniswapExtensionConnected() && !isSolanaConnected

  const { isTestnetModeEnabled } = useEnabledChains()

  const isRightToLeft = i18next.dir() === 'rtl'

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(evmAddress)
  const isUnclaimed = useUserHasAvailableClaim(evmAddress)
  const { toggleModal: toggleClaimModal } = useModalState(ModalName.AddressClaim)

  const accountDrawer = useAccountDrawer()

  const openReceiveCryptoModal = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.DEFAULT,
  })

  const { navigateToSendFlow } = useUniswapContext()

  const isSolanaOnlyWallet = Boolean(svmAddress && !evmAddress)

  const onPressSend = useEvent(() => {
    if (!isSolanaOnlyWallet) {
      navigateToSendFlow({ chainId: UniverseChainId.Mainnet })
      accountDrawer.close()
    }
  })

  const { data, networkStatus, loading } = usePortfolioTotalValue({
    evmAddress,
    svmAddress,
  })

  const { percentChange, absoluteChangeUSD, balanceUSD } = data || {}

  const isLoading = loading && !data
  const isWarmLoading = !!data && networkStatus === NetworkStatus.loading

  const currency = useAppFiatCurrency()
  const currencyComponents = useAppFiatCurrencyInfo()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const totalFormattedValue = convertFiatAmountFormatted(balanceUSD, NumberType.PortfolioBalance)

  // denominated portfolio balance on testnet is always 0
  const isPortfolioZero = !isTestnetModeEnabled && balanceUSD === 0

  const isDelegationMismatch = useHasAccountMismatchOnAnyChain()
  const isPermitMismatchUxEnabled = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const shouldShowDelegationMismatch = isPermitMismatchUxEnabled && isDelegationMismatch
  const [displayDelegationMismatchModal, setDisplayDelegationMismatchModal] = useState(false)
  const theme = useTheme()

  const amount = unclaimedAmount?.toFixed(0, { groupSeparator: ',' }) ?? '-'

  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) && currencyComponents.symbolAtFront

  return (
    <>
      <Flex flex={1} px="$padding16" py={shouldShowExtensionDeeplinks ? '$spacing16' : '$spacing20'}>
        <TestnetModeBanner mt={shouldShowExtensionDeeplinks ? -16 : -20} mx={-24} mb="$spacing16" />
        <Flex row justifyContent="space-between" alignItems="flex-start" mb="$spacing8">
          <StatusIcon size={48} />
          <Flex row gap="$spacing4">
            <IconButton
              size="small"
              emphasis="text-only"
              data-testid="wallet-disconnect"
              icon={<Settings height={24} width={24} color={theme.neutral2} />}
              borderRadius="$rounded32"
              hoverStyle={{
                backgroundColor: '$surface2',
              }}
              onPress={openSettings}
            />

            <DisconnectButton />
          </Flex>
        </Flex>
        <Flex gap="$spacing4">
          <MultiBlockchainAddressDisplay />
        </Flex>
        <Flex flex={1} mt="$spacing16">
          <Flex gap="$spacing4" mb="$spacing16" data-testid="portfolio-total-balance">
            <AnimatedNumber
              balance={balanceUSD}
              isRightToLeft={isRightToLeft}
              colorIndicationDuration={BALANCE_CHANGE_INDICATION_DURATION}
              loading={isLoading}
              loadingPlaceholderText="000000.00"
              shouldFadeDecimals={shouldFadePortfolioDecimals}
              value={totalFormattedValue}
              warmLoading={isWarmLoading}
            />
            {!isPortfolioZero && (
              <Shine disabled={!isWarmLoading}>
                <RelativeChange
                  absoluteChange={absoluteChangeUSD}
                  arrowSize="$icon.16"
                  change={percentChange}
                  loading={isLoading}
                  negativeChangeColor={isWarmLoading ? '$neutral2' : '$statusCritical'}
                  positiveChangeColor={isWarmLoading ? '$neutral2' : '$statusSuccess'}
                  variant="body3"
                />
              </Shine>
            )}
          </Flex>
          {shouldShowDelegationMismatch && (
            <LimitedSupportBanner onPress={() => setDisplayDelegationMismatchModal(true)} />
          )}
          {shouldShowExtensionDeeplinks ? (
            <ExtensionDeeplinks account={evmAddress ?? ''} />
          ) : (
            <>
              {isPortfolioZero ? (
                <EmptyWallet />
              ) : (
                <>
                  <Flex row gap="$gap8">
                    <SendButtonTooltip isSolanaOnlyWallet={isSolanaOnlyWallet}>
                      <ActionTile
                        dataTestId={TestID.Send}
                        Icon={<SendAction size={24} color="$accent1" />}
                        name={t('common.send.button')}
                        onClick={onPressSend}
                        disabled={isSolanaOnlyWallet}
                      />
                    </SendButtonTooltip>
                    <ActionTile
                      dataTestId={TestID.WalletReceiveCrypto}
                      Icon={<ArrowDownCircleFilled size={24} color="$accent1" />}
                      name={t('common.receive')}
                      onClick={openReceiveCryptoModal}
                    />
                  </Flex>
                  <DownloadGraduatedWalletCard />
                  <MiniPortfolio evmAddress={evmAddress} svmAddress={svmAddress} />
                </>
              )}
              {isUnclaimed && (
                <Button
                  my="$spacing8"
                  fill={false}
                  onPress={toggleClaimModal}
                  style={{ background: 'linear-gradient(to right, #9139b0 0%, #4261d6 100%)' }}
                >
                  <Trans i18nKey="account.authHeader.claimReward" values={{ amount }} />
                </Button>
              )}
            </>
          )}
        </Flex>
      </Flex>
      {displayDelegationMismatchModal && (
        <DelegationMismatchModal onClose={() => setDisplayDelegationMismatchModal(false)} />
      )}
    </>
  )
}
