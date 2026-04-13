import {
  Action,
  AuthenticationTypes,
  AuthenticatorNameType,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import type {
  ChallengeResponse,
  RegistrationOptions,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import {
  clearDeviceSession,
  generateDeviceKeyPair,
  getDeviceSession,
  setDeviceSession,
} from 'uniswap/src/features/passkey/deviceSession'
import { authenticatePasskey, registerPasskey } from 'uniswap/src/features/passkey/passkey'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { HexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'

export {
  Action,
  AuthenticationTypes,
  AuthenticatorNameType,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'

export type {
  Authenticator,
  RecoveryMethod,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'

export async function registerNewPasskey({
  username,
  authenticatorAttachment,
  action,
  walletId,
}: {
  username?: string
  authenticatorAttachment?: AuthenticatorAttachment
  action?: Action
  walletId?: string
} = {}): Promise<{ credential: string }> {
  const options = { authenticatorAttachment, username } as unknown as RegistrationOptions
  try {
    const challengeJson = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_REGISTRATION,
      action: action ?? Action.CREATE_WALLET,
      options,
      walletId,
    })
    if (!challengeJson.challengeOptions) {
      throw new Error('No challenge options returned for passkey registration')
    }
    const passkeyCredential = await registerPasskey(challengeJson.challengeOptions)
    return { credential: passkeyCredential }
  } catch (registrationError: unknown) {
    if (registrationError instanceof Error && registrationError.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', 'User aborted registration')
    } else {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', `Error during registration: ${registrationError}`)
    }
    throw registrationError
  }
}

export async function createNewEmbeddedWallet(
  unitag: string,
): Promise<{ address: HexString; walletId: string } | undefined> {
  try {
    const { privateKey, publicKeyBase64: devicePublicKey } = await generateDeviceKeyPair()
    const { credential } = await registerNewPasskey({ username: unitag })

    const createWalletResp = await EmbeddedWalletApiClient.fetchCreateWalletRequest({
      credential,
      devicePublicKey,
    })

    if (createWalletResp.policyId && createWalletResp.policyExpiresAt && createWalletResp.walletId) {
      setDeviceSession({
        privateKey,
        policyId: createWalletResp.policyId,
        policyExpiresAt: Number(createWalletResp.policyExpiresAt),
        walletId: createWalletResp.walletId,
        deviceKeyQuorumId: createWalletResp.deviceKeyQuorumId,
      })
    }

    if (createWalletResp.walletAddress && createWalletResp.walletId) {
      logger.debug(
        'embeddedWallet.ts',
        'createNewEmbeddedWallet',
        `New wallet created: ${createWalletResp.walletAddress}`,
      )
      const address = getValidAddress({
        address: createWalletResp.walletAddress,
        platform: Platform.EVM,
        withEVMChecksum: true,
      })
      if (!address) {
        logger.error(new Error('Invalid address returned from create wallet response'), {
          tags: {
            file: 'embeddedWallet.ts',
            function: 'createNewEmbeddedWallet',
          },
        })
        return undefined
      }
      return { address: address as HexString, walletId: createWalletResp.walletId }
    }
    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'createNewEmbeddedWallet',
      },
    })
    throw error
  }
}

// oxlint-disable-next-line no-unused-vars -- biome-parity: oxlint is stricter here
export async function isSessionAuthenticatedForAction(action: Action): Promise<boolean> {
  const SESSION_ACTIONS: Action[] = [
    Action.SIGN_MESSAGE,
    Action.SIGN_TRANSACTION,
    Action.SIGN_TYPED_DATA,
    Action.LIST_AUTHENTICATORS,
    Action.ACTION_UNSPECIFIED,
  ]
  if (!SESSION_ACTIONS.includes(action)) {
    return false
  }
  return getDeviceSession() !== null
}

async function _reauthenticateSessionWithPasskey(action: Action, walletId?: string): Promise<ChallengeResponse> {
  const signinResponse = await signInWithPasskey()
  if (!signinResponse) {
    throw new Error('Failed to re-authenticate')
  }
  return await EmbeddedWalletApiClient.fetchChallengeRequest({
    type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
    action,
    walletId: walletId ?? signinResponse.walletId,
  })
}

export async function authenticateWithPasskey(
  action: Action,
  options?: {
    walletId?: string
    message?: string
    transaction?: string
    typedData?: string
    encryptionKey?: string
    authenticatorId?: string
  },
): Promise<string | undefined> {
  try {
    const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action,
      walletId: options?.walletId,
      message: options?.message,
      transaction: options?.transaction,
      typedData: options?.typedData,
      authenticatorId: options?.authenticatorId,
    })

    // TODO[INFRA-1212]: if challengeOptions is defined but the action is a session action, it means the session has expired and we need to reauthenticate
    // if (challenge.challengeOptions && SESSION_ACTIONS.includes(action)) {
    //   challenge = await reauthenticateSessionWithPasskey(action, walletId)
    // }
    if (!challenge.challengeOptions) {
      return undefined
    }
    return await authenticatePasskey(challenge.challengeOptions)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'authenticateWithPasskey', 'User aborted the registration process')
      return undefined
    } else {
      logger.error(new Error('Error during authentication', { cause: error }), {
        tags: {
          file: 'embeddedWallet.ts',
          function: 'authenticateWithPasskey',
        },
      })
      throw error
    }
  }
}

export async function authenticateWithPasskeyForSeedPhraseExport(walletId?: string): Promise<string | undefined> {
  return await authenticateWithPasskey(Action.EXPORT_SEED_PHRASE, { walletId })
}

export async function signInWithPasskey(): Promise<
  { walletAddress: string; walletId: string; exported?: boolean } | undefined
> {
  try {
    const credential = await authenticateWithPasskey(Action.WALLET_SIGNIN)
    if (!credential) {
      return undefined
    }
    const signInRespJson = await EmbeddedWalletApiClient.fetchWalletSigninRequest({ credential })
    if (signInRespJson.walletAddress) {
      return signInRespJson
    }
    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signInWithPasskey',
      },
    })
    throw error
  }
}

export async function disconnectWallet(): Promise<void> {
  clearDeviceSession()
  try {
    await EmbeddedWalletApiClient.fetchDisconnectRequest()
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'disconnectWallet',
      },
    })
    throw error
  }
}

export {
  deleteAuthenticator,
  deleteRecoveryMethod,
  listAuthenticators,
  registerNewAuthenticator,
  startAddAuthenticatorSession,
} from 'uniswap/src/features/passkey/authenticatorManagement'
export type { SetupProgress } from 'uniswap/src/features/passkey/recoverySetup'
export { encryptAndStoreRecovery } from 'uniswap/src/features/passkey/recoverySetup'
// Re-exports from sub-modules — consumers continue to import from this file
export {
  exportEncryptedSeedPhrase,
  signMessageWithPasskey,
  signTransactionWithPasskey,
  signTypedDataWithPasskey,
} from 'uniswap/src/features/passkey/signing'

/** Result of the crypto phase — feed this into {@link authorizeAndCompleteRecovery}. */
export interface EncryptedRecoveryState {
  publicKey: string
  authMethodId: string
  encryptedKeyId: string
}

/**
 * Phase 2: Challenge → passkey authentication → SetupRecovery.
 *
 * Must be called directly from a user gesture (button click) so the WebAuthn
 * transient activation window is still open when `authenticatePasskey` fires.
 */
export type RecoveryAuthMethodType = 'EMAIL' | 'GOOGLE' | 'APPLE'

export async function authorizeAndCompleteRecovery({
  encrypted,
  email,
  walletId,
  privyUserId,
  authMethodType,
  onProgress,
}: {
  encrypted: EncryptedRecoveryState
  email: string
  walletId: string
  privyUserId: string
  authMethodType: RecoveryAuthMethodType
  onProgress?: (step: import('uniswap/src/features/passkey/recoverySetup').SetupProgress) => void
}): Promise<{ recoveryQuorumId: string }> {
  // Challenge — server creates recovery quorum, returns PATCH payload as WebAuthn challenge
  onProgress?.('challenging')
  const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
    type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
    action: Action.SETUP_RECOVERY,
    walletId,
    authPublicKey: encrypted.publicKey,
    privyUserId,
  })
  if (!challenge.challengeOptions) {
    throw new Error('No challenge options for SETUP_RECOVERY')
  }

  // Passkey signs the PATCH payload (existing passkey authorizes quorum link)
  onProgress?.('authenticating')
  const credential = await authenticatePasskey(challenge.challengeOptions)

  // Complete setup with passkey credential
  onProgress?.('registering')
  const result = await EmbeddedWalletApiClient.fetchSetupRecovery({
    credential,
    authMethodId: encrypted.authMethodId,
    authMethodType,
    authMethodIdentifier: email,
    encryptedKeyId: encrypted.encryptedKeyId,
  })
  if (!result.success || !result.recoveryQuorumId) {
    throw new Error('Backend failed to register recovery quorum')
  }
  return { recoveryQuorumId: result.recoveryQuorumId }
}
