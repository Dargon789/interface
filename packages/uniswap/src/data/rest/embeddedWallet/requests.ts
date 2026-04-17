import { createPromiseClient, type Transport } from '@connectrpc/connect'
import { EmbeddedWalletService as OldEmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'
import { EmbeddedWalletService as NewEmbeddedWalletService } from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_connect'
import type { EmbeddedWalletClientContext } from '@universe/api'
import { createEmbeddedWalletApiClient, getTransport } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/getVersionHeader'
import { isMobileApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

function createEmbeddedWalletTransport(): Transport {
  return getTransport({
    getBaseUrl: () => uniswapUrls.privyEmbeddedWalletUrl,
    getHeaders: () => ({
      ...(isMobileApp && { Origin: uniswapUrls.requestOriginUrl }),
      'x-request-source': REQUEST_SOURCE,
      'x-app-version': getVersionHeader(),
    }),
  })
}

const embeddedWalletTransport = createEmbeddedWalletTransport()

const oldEmbeddedWalletRpcClient = createPromiseClient(OldEmbeddedWalletService, embeddedWalletTransport)

const newRpcClient = createPromiseClient(
  NewEmbeddedWalletService,
  embeddedWalletTransport,
) as unknown as EmbeddedWalletClientContext['rpcClient']

export const EmbeddedWalletApiClient = createEmbeddedWalletApiClient({
  rpcClient: newRpcClient,
  legacyRpcClient: oldEmbeddedWalletRpcClient,
})
