import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

import { initStatSigForBrowserScripts } from 'src/app/core/initStatSigForBrowserScripts'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/focusOrCreateOnboardingTab'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { initMessageBridge } from 'src/background/backgroundDappRequests'
import { backgroundStore } from 'src/background/backgroundStore'
import {
  backgroundToSidePanelMessageChannel,
  contentScriptUtilityMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import {
  BackgroundToSidePanelRequestType,
  ContentScriptUtilityMessageType,
} from 'src/background/messagePassing/types/requests'
import { setSidePanelBehavior, setSidePanelOptions } from 'src/background/utils/chromeSidePanelUtils'
import { readIsOnboardedFromStorage } from 'src/background/utils/persistedStateUtils'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { logger } from 'utilities/src/logger/logger'
import { defineBackground } from 'wxt/utils/define-background'

async function enableSidebar(): Promise<void> {
  await setSidePanelOptions({ enabled: true })
  await setSidePanelBehavior({ openPanelOnActionClick: true })
}

async function disableSidebar(): Promise<void> {
  await setSidePanelOptions({ enabled: false })
  await setSidePanelBehavior({ openPanelOnActionClick: false })
}

async function setSidebarState(isOnboarded: boolean): Promise<void> {
  if (isOnboarded) {
    await enableSidebar()
  } else {
    await disableSidebar()
  }
}

async function initApp(): Promise<void> {
  await initStatSigForBrowserScripts()
  await initExtensionAnalytics()

  // Enables or disables sidebar based on onboarding status
  // Injected script will reject any requests if not onboarded
  backgroundStore.addOnboardingChangedListener(async (isOnboarded) => {
    await setSidebarState(isOnboarded)
  })

  // Sets uninstall URL
  chrome.runtime.setUninstallURL(uniswapUrls.chromeExtensionUninstallUrl)

  await backgroundStore.init()
}

function makeBackground(): void {
  let isArcBrowser = false

  initMessageBridge()

  chrome.tabs.onActivated.addListener(onTabChange)
  chrome.tabs.onUpdated.addListener(onTabChange)

  chrome.action.onClicked.addListener(async () => {
    await checkAndHandleOnboarding()
  })

  chrome.runtime.onInstalled.addListener(async () => {
    await checkAndHandleOnboarding()
  })

  // on arc browser, show unsupported browser page (lives on onboarding flow)
  // this is because arc doesn't support the sidebar
  contentScriptUtilityMessageChannel.addMessageListener(
    ContentScriptUtilityMessageType.ArcBrowserCheck,
    async (message) => {
      isArcBrowser = !!message.isArcBrowser

      if (message.isArcBrowser) {
        await disableSidebar()
      } else {
        // ensure that we reenable the sidebar if arc styles are not detected
        // but ONLY if the user is actually onboarded
        const isOnboarded = await readIsOnboardedFromStorage()
        if (isOnboarded) {
          await enableSidebar()
        } else {
          await disableSidebar()
        }
      }
    },
  )

  // Utility Functions
  async function checkAndHandleOnboarding(): Promise<void> {
    if (isArcBrowser) {
      await focusOrCreateOnboardingTab()
      return
    }

    const isOnboarded = await readIsOnboardedFromStorage()

    if (isOnboarded) {
      await enableSidebar()
    } else {
      await disableSidebar()
      // Always open onboarding tab when not onboarded
      await focusOrCreateOnboardingTab()
    }
  }

  /** Fires an event whenever a tab is changed so the sidebar can reflect the current connection status properly. */
  async function onTabChange(): Promise<void> {
    try {
      await backgroundToSidePanelMessageChannel.sendMessage({
        type: BackgroundToSidePanelRequestType.TabActivated,
      })
    } catch (_e) {
      // an error will be thrown if the sidebar is not open. This is expected and in this case there is no action to be taken anyways so ignore.
    }
  }

  initApp().catch((error) => {
    logger.error(error, {
      tags: {
        file: 'background/background.ts',
        function: 'initApp',
      },
    })
  })
}

// eslint-disable-next-line import/no-unused-modules
export default defineBackground({
  type: 'module',
  main() {
    makeBackground()
  },
})
