import { VersionedTransaction } from '@solana/web3.js'
import { JupiterExecuteResponse, TradingApi } from '@universe/api'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { signSolanaTransactionWithCurrentWallet } from 'components/Web3Provider/signSolanaTransaction'
import store from 'state'
import { getSwapTransactionInfo } from 'state/sagas/transactions/utils'
import { call } from 'typed-redux-saga'
import { JupiterApiClient } from 'uniswap/src/data/apiClients/jupiterApi/JupiterFetchClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { JupiterExecuteError } from 'uniswap/src/features/transactions/errors'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import { ExtractedBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import { ValidatedSolanaSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { TransactionOriginType, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { tryCatch } from 'utilities/src/errors'

type JupiterSwapParams = {
  account: SignerMnemonicAccountDetails
  analytics: ExtractedBaseTradeAnalyticsProperties
  swapTxContext: ValidatedSolanaSwapTxAndGasInfo
  /** Callback to trigger after swap has been signed but before confirmation. */
  onSwapSigned?: () => void
}

async function signAndSendJupiterSwap({
  transaction,
  requestId,
  signSolanaTransaction,
  onSwapSigned,
}: {
  transaction: VersionedTransaction
  requestId: string
  signSolanaTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>
  onSwapSigned?: () => void
}): Promise<JupiterExecuteResponse> {
  const signedTransactionObj = await signSolanaTransaction(transaction)
  const signedTransaction = Buffer.from(signedTransactionObj.serialize()).toString('base64')

  onSwapSigned?.()

  const result = await JupiterApiClient.execute({ signedTransaction, requestId })

  return result
}

function updateAppState({ hash, trade, from }: { hash: string; trade: SolanaTrade; from: string }) {
  const typeInfo = getSwapTransactionInfo(trade)

  store.dispatch(
    addTransaction({
      from,
      typeInfo,
      hash,
      chainId: UniverseChainId.Solana,
      routing: TradingApi.Routing.JUPITER,
      status: TransactionStatus.Success,
      addedTime: Date.now(),
      id: hash,
      transactionOriginType: TransactionOriginType.Internal,
      options: {
        request: {},
      },
    }),
  )

  popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)
}

function createJupiterSwap(signSolanaTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>) {
  return function* jupiterSwap(params: JupiterSwapParams) {
    const { swapTxContext, account, onSwapSigned } = params
    const { trade, transactionBase64 } = swapTxContext
    const { requestId } = trade.quote.quote

    const transaction = VersionedTransaction.deserialize(Buffer.from(transactionBase64, 'base64'))

    const { data, error } = yield* call(() =>
      tryCatch(signAndSendJupiterSwap({ transaction, requestId, signSolanaTransaction, onSwapSigned })),
    )

    if (error) {
      throw error
    }
    const { signature: hash, status, code, error: errorMessage } = data
    if (status !== 'Success' || !hash) {
      throw new JupiterExecuteError(errorMessage ?? 'Unknown Jupiter Execution Error', code)
    }

    updateAppState({ hash, trade, from: account.address })

    return hash
  }
}

function logJupiterSwapFinalized({
  success,
  analytics,
  hash,
  timeSigned,
}: {
  success: boolean
  analytics: ExtractedBaseTradeAnalyticsProperties
  hash?: string
  timeSigned?: number
}) {
  // We log SwapSigned here, rather than immediately after signing, because the hash may be unknown until jupiter api response time.
  sendAnalyticsEvent(SwapEventName.SwapSigned, {
    ...analytics,
    time_signed: timeSigned,
    transaction_hash: hash,
  })

  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  const event = success ? SwapEventName.SwapTransactionCompleted : SwapEventName.SwapTransactionFailed

  sendAnalyticsEvent(event, {
    ...analytics,
    hash,
    id: hash ?? '',
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
    chain_id: analytics.chain_id_in,
  })
}

function withAnalyticsLogging(swap: (params: JupiterSwapParams) => Generator<any, string>) {
  return function* withLogging(params: JupiterSwapParams) {
    let timeSigned: number | undefined
    try {
      const onSwapSigned = () => {
        timeSigned = Date.now()
        params.onSwapSigned?.()
      }

      const hash = yield* swap({ ...params, onSwapSigned })

      logJupiterSwapFinalized({ success: true, analytics: params.analytics, hash, timeSigned })
    } catch (error) {
      logJupiterSwapFinalized({ success: false, analytics: params.analytics, timeSigned })
      throw error
    }
  }
}

export const jupiterSwap = withAnalyticsLogging(createJupiterSwap(signSolanaTransactionWithCurrentWallet))
