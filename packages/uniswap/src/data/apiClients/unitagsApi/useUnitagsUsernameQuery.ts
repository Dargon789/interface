import { PlainMessage } from '@bufbuild/protobuf'
import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { GetUsernameRequest, GetUsernameResponse } from '@universe/api'
import { UseQueryApiHelperHookArgs } from '@universe/api'
import { useUnitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsUsernameQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  PlainMessage<GetUsernameRequest>,
  GetUsernameResponse
>): UseQueryResult<GetUsernameResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'username', params]
  const unitagsApiClient = useUnitagsApiClient()

  return useQuery<GetUsernameResponse>({
    queryKey,
    queryFn: params
      ? async (): Promise<GetUsernameResponse> => {
          const response = await unitagsApiClient.fetchUsername(params)
          return new GetUsernameResponse({
            available: response.available,
            requiresEnsMatch: response.requiresEnsMatch,
            username: response.username,
            metadata: response.metadata,
            address: typeof response.address === 'string' ? response.address : response.address?.address,
          })
        }
      : skipToken,
    staleTime: ONE_MINUTE_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
    ...rest,
  })
}
