import { createPromiseClient } from '@connectrpc/connect'
import {
  createFetchClient,
  createUnitagsApiClient,
  createUnitagsServiceApiClient,
  getCloudflareApiBaseUrl,
  provideSessionService,
  UnitagService,
  UnitagsServiceApiClient,
} from '@universe/api'
import { TrafficFlows } from '@universe/api/src/clients/base/urls'
import { UnitagsApiClientType } from '@universe/api/src/clients/unitags/createUnitagsApiClient'
import { getConfig } from '@universe/config'
import { FeatureFlags, getIsSessionServiceEnabled, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/rest/base'

const UnitagsApiFetchClient = createFetchClient({
  baseUrl:
    getConfig().unitagsApiUrlOverride || getCloudflareApiBaseUrl({ flow: TrafficFlows.Unitags, postfix: 'v2/unitags' }),
  getSessionService: () =>
    provideSessionService({ getBaseUrl: () => uniswapUrls.apiBaseUrlV2, getIsSessionServiceEnabled }),
})

export function useUnitagsApiClient(): UnitagsApiClientType | UnitagsServiceApiClient {
  const newServiceEnabled = useFeatureFlag(FeatureFlags.UnitagsServiceV2)

  return useMemo(() => {
    if (newServiceEnabled) {
      return createUnitagsServiceApiClient({
        // Always use production calls unless overridden locally to ensure stable name mapping
        rpcClient: createPromiseClient(UnitagService, entryGatewayProdPostTransport),
      })
    } else {
      return createUnitagsApiClient({
        fetchClient: UnitagsApiFetchClient,
      })
    }
  }, [newServiceEnabled])
}
