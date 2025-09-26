import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import type { SessionRepository } from '@universe/sessions/src/session-repository/types'
import { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createSessionService', () => {
  let storage: SessionStorage
  let deviceIdService: DeviceIdService
  let repository: SessionRepository
  let service: SessionService

  beforeEach(() => {
    // In-memory storage implementation
    let data: { sessionId: string } | null = null
    storage = {
      get: async (): Promise<{ sessionId: string } | null> => data,
      set: async (newData): Promise<void> => {
        data = newData
      },
      clear: async (): Promise<void> => {
        data = null
      },
    }

    // Default device ID service
    deviceIdService = {
      getDeviceId: async (): Promise<string> => 'test-device-id',
    }

    // In-memory repository implementation
    repository = {
      initSession: async ({
        deviceId,
      }): Promise<{ sessionId?: string; needChallenge: boolean; extra: Record<string, string> }> => ({
        sessionId: `session-for-${deviceId}`,
        needChallenge: false,
        extra: {},
      }),
      challenge: vi.fn(),
      upgradeSession: vi.fn(),
      deleteSession: vi.fn(),
    }

    service = createSessionService({
      deviceIdService,
      sessionStorage: storage,
      sessionRepository: repository,
    })
  })

  describe('session lifecycle', () => {
    it('starts with no session', async () => {
      expect(await service.getSessionState()).toBeNull()
    })

    it('creates and retrieves sessions', async () => {
      await service.initSession()
      expect(await service.getSessionState()).toEqual({ sessionId: 'session-for-test-device-id' })
    })

    it('removes sessions', async () => {
      await service.initSession()
      await service.removeSession()
      expect(await service.getSessionState()).toBeNull()
    })

    it('uses device ID to generate session via repository', async () => {
      deviceIdService.getDeviceId = async (): Promise<string> => 'custom-device-123'
      service = createSessionService({
        sessionStorage: storage,
        deviceIdService,
        sessionRepository: repository,
      })

      await service.initSession()
      expect(await service.getSessionState()).toEqual({ sessionId: 'session-for-custom-device-123' })
    })
  })

  describe('platform-specific behaviors', () => {
    it('stores session ID when provided (mobile/extension)', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'mobile-session-123',
        needChallenge: false,
        extra: {},
      })

      await service.initSession()
      expect(await service.getSessionState()).toEqual({ sessionId: 'mobile-session-123' })
    })

    it('does not store session when ID is undefined (web)', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: undefined, // Web uses cookies
        needChallenge: true,
        extra: { sitekey: 'turnstile-key' },
      })

      await service.initSession()
      expect(await service.getSessionState()).toBeNull()
    })

    it('handles different session ID values correctly', async () => {
      const sessionIds = ['mobile-123', 'extension-456', undefined]

      for (const sessionId of sessionIds) {
        // Reset storage
        await service.removeSession()

        repository.initSession = async (): Promise<{
          sessionId?: string
          needChallenge: boolean
          extra: Record<string, string>
        }> => ({
          sessionId,
          needChallenge: false,
          extra: {},
        })

        await service.initSession()

        if (sessionId) {
          expect(await service.getSessionState()).toEqual({ sessionId })
        } else {
          expect(await service.getSessionState()).toBeNull()
        }
      }
    })
  })

  describe('state persistence', () => {
    it('shares state between service instances using same storage', async () => {
      await service.initSession()

      const service2 = createSessionService({
        sessionStorage: storage,
        deviceIdService,
        sessionRepository: repository,
      })

      expect(await service2.getSessionState()).toEqual({ sessionId: 'session-for-test-device-id' })
    })

    it('maintains independent state with different storage instances', async () => {
      // Create second set of dependencies
      let data2: { sessionId: string } | null = null
      const storage2: SessionStorage = {
        get: async (): Promise<{ sessionId: string } | null> => data2,
        set: async (newData): Promise<void> => {
          data2 = newData
        },
        clear: async (): Promise<void> => {
          data2 = null
        },
      }

      const service2 = createSessionService({
        sessionStorage: storage2,
        deviceIdService: {
          getDeviceId: async (): Promise<string> => 'device-2',
        },
        sessionRepository: repository,
      })

      await service.initSession()
      await service2.initSession()

      expect(await service.getSessionState()).toEqual({ sessionId: 'session-for-test-device-id' })
      expect(await service2.getSessionState()).toEqual({ sessionId: 'session-for-device-2' })
    })
  })

  describe('error handling', () => {
    it('propagates storage read errors', async () => {
      storage.get = async (): Promise<{ sessionId: string } | null> => {
        throw new Error('Storage read failed')
      }

      await expect(service.getSessionState()).rejects.toThrow('Storage read failed')
    })

    it('propagates storage write errors', async () => {
      storage.set = async (): Promise<void> => {
        throw new Error('Storage write failed')
      }

      await expect(service.initSession()).rejects.toThrow('Storage write failed')
    })

    it('propagates device ID errors', async () => {
      deviceIdService.getDeviceId = async (): Promise<string> => {
        throw new Error('Device ID failed')
      }

      await expect(service.initSession()).rejects.toThrow('Device ID failed')
    })

    it('propagates repository errors', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => {
        throw new Error('API call failed')
      }

      await expect(service.initSession()).rejects.toThrow('API call failed')
    })

    it('preserves state when operations fail', async () => {
      await service.initSession()
      const originalState = await service.getSessionState()

      // Make clear fail
      storage.clear = async (): Promise<void> => {
        throw new Error('Clear failed')
      }

      await expect(service.removeSession()).rejects.toThrow('Clear failed')
      expect(await service.getSessionState()).toEqual(originalState)
    })
  })

  describe('integration scenarios', () => {
    it('handles complete session lifecycle', async () => {
      // Start with no session
      expect(await service.getSessionState()).toBeNull()

      // Create session
      await service.initSession()
      const session = await service.getSessionState()
      expect(session).toBeTruthy()
      expect(session?.sessionId).toContain('session-for-')

      // Remove session
      await service.removeSession()
      expect(await service.getSessionState()).toBeNull()
    })

    it('handles multiple initialization attempts', async () => {
      // First initialization
      await service.initSession()
      const firstSession = await service.getSessionState()

      // Second initialization should replace
      deviceIdService.getDeviceId = async (): Promise<string> => 'new-device-id'
      await service.initSession()
      const secondSession = await service.getSessionState()

      expect(secondSession).not.toEqual(firstSession)
      expect(secondSession).toEqual({ sessionId: 'session-for-new-device-id' })
    })
  })
})
