import { TradeType } from '@uniswap/sdk-core'
import { type JupiterOrderUrlParams } from '@universe/api/src/clients/jupiter/types'
import { JupiterApiClient } from 'uniswap/src/data/apiClients/jupiterApi/JupiterFetchClient'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import {
  areCurrenciesEqual,
  isZeroAmount,
} from 'uniswap/src/features/transactions/swap/hooks/useTrade/parseQuoteCurrencies'
import {
  TradeService,
  TradeWithGasEstimates,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { createSolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'

function prepareJupiterTradeInput(args: UseTradeArgs): JupiterOrderUrlParams | null {
  const input = args.tradeType === TradeType.EXACT_INPUT ? args.amountSpecified?.currency : args.otherCurrency
  const output = args.tradeType === TradeType.EXACT_OUTPUT ? args.amountSpecified?.currency : args.otherCurrency
  const slippageBps = args.customSlippageTolerance ? (args.customSlippageTolerance * 100).toString() : undefined
  const swapMode = args.tradeType === TradeType.EXACT_INPUT ? 'ExactIn' : 'ExactOut'

  if (
    !input ||
    !output ||
    !isSVMChain(input.chainId) ||
    !isSVMChain(output.chainId) ||
    !args.amountSpecified ||
    isZeroAmount(args.amountSpecified) ||
    areCurrenciesEqual(input, output)
  ) {
    return null
  }

  return {
    inputMint: input.wrapped.address,
    outputMint: output.wrapped.address,
    amount: args.amountSpecified.quotient.toString(),
    taker: args.account?.address,
    slippageBps,
    swapMode,
  }
}

export function createSolanaTradeService({
  onTradeError,
}: {
  onTradeError: (error: Error, ctx: { input: UseTradeArgs; quoteRequestArgs?: JupiterOrderUrlParams }) => void
}): TradeService {
  return {
    async getTrade(args: UseTradeArgs): Promise<TradeWithGasEstimates> {
      let quoteRequestArgs: JupiterOrderUrlParams | undefined
      try {
        // Step 1: Prepare trade input
        const input = args.tradeType === TradeType.EXACT_INPUT ? args.amountSpecified?.currency : args.otherCurrency
        const output = args.tradeType === TradeType.EXACT_OUTPUT ? args.amountSpecified?.currency : args.otherCurrency

        // Step 2: Early exit if quote args are null
        const validatedInput = prepareJupiterTradeInput(args)

        if (!validatedInput || !input || !output) {
          return { trade: null }
        }

        // Step 3: Build quote request with all params
        quoteRequestArgs = validatedInput

        // Step 4: Fetch quote from API
        const quote = await JupiterApiClient.fetchOrder(quoteRequestArgs)

        // Step 5: Transform quote to trade
        const trade = createSolanaTrade({ quote, inputToken: input, outputToken: output })

        return { trade, gasEstimate: undefined } // `gasEstimate` is used for our Gas Experiment, which we don't conduct on Solana
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unknown error')
        onTradeError(error, {
          input: args,
          quoteRequestArgs,
        })
        quoteRequestArgs = undefined
        throw error
      }
    },
    prepareTradeInput: prepareJupiterTradeInput,
    // No indicative quotes on Jupiter
    prepareIndicativeTradeInput: () => null,
    getIndicativeTrade: () => Promise.resolve(null),
  }
}
