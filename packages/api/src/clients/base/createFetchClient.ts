import { FetchError } from '@universe/api/src/clients/base/errors'
import type { CustomOptions, FetchClient, StandardFetchOptions } from '@universe/api/src/clients/base/types'
import { getSessionService } from '@universe/api/src/getSessionService'

export function createFetchClient({
  baseUrl,
  headers: additionalHeaders = {},
  getSessionServiceBaseUrl,
}: {
  baseUrl: string
  headers?: HeadersInit
  getSessionServiceBaseUrl: () => string
}): FetchClient {
  return {
    get fetch() {
      return async <T = Response>(path: string, options: StandardFetchOptions): Promise<T> => {
        const sessionService = getSessionService({ getBaseUrl: getSessionServiceBaseUrl })
        const sessionState = await sessionService.getSessionState()

        const headers = new Headers({
          ...additionalHeaders,
          ...options?.headers,
        })
        if (sessionState?.sessionId) {
          headers.set('x-session-id', sessionState.sessionId)
        }
        return fetch(`${baseUrl}${path}`, {
          ...options,
          // Do NOT remove this, session cookies need to be sent with the request!
          // Note: this causes CORS errors when running web locally
          // TODO(app-infra): Re-enable this when we have a solution
          // credentials: 'include',
          headers,
        }) as Promise<T>
      }
    },

    get get() {
      return async <T>(path: string, options?: CustomOptions): Promise<T> => {
        if (options?.params) {
          const searchParams = new URLSearchParams()
          for (const [key, value] of Object.entries(options.params)) {
            if (value !== undefined && value !== null) {
              searchParams.append(key, value.toString())
            }
          }
          path += '?' + searchParams.toString()
        }

        const { on404, ...standardOptions } = options ?? {}

        const response = await this.fetch(path, standardOptions)

        if (on404 && response.status === 404) {
          on404()
        }

        if (!response.ok) {
          let data: object | undefined
          try {
            data = await response.json()
          } catch (e) {
            throw new FetchError({ response, cause: e })
          }
          throw new FetchError({ response, data })
        }

        return (await response.json()) as T
      }
    },

    get post() {
      return async <T>(path: string, options: CustomOptions): Promise<T> => {
        const _options = options

        _options.headers = {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        }

        return (await this.get(path, { ..._options, method: 'POST' })) as T
      }
    },

    get put() {
      return async <T>(path: string, options: CustomOptions): Promise<T> => {
        const _options = options

        _options.headers = {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        }

        return (await this.get(path, { ..._options, method: 'PUT' })) as T
      }
    },

    get delete() {
      return async <T>(path: string, options: CustomOptions = {}): Promise<T> => {
        return (await this.get(path, { ...options, method: 'DELETE' })) as T
      }
    },

    get patch() {
      return async <T>(path: string, options: CustomOptions): Promise<T> => {
        const _options = options

        _options.headers = {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        }

        return await this.get(path, { ..._options, method: 'PATCH' })
      }
    },
  }
}
