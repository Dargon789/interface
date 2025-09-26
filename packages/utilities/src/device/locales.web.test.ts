import { chrome } from 'jest-chrome'
import { DEFAULT_LANGUAGE_CODE, DEFAULT_LANGUAGE_TAG } from 'utilities/src/device/constants'
import { getDeviceLocales } from 'utilities/src/device/locales.web'

// Mock the chrome utilities to return jest-chrome
// Needed because the jest runner doesn't currently support platform file-splitting
jest.mock('utilities/src/chrome/chrome', () => {
  // Import jest-chrome inside the mock factory to avoid out-of-scope reference
  const { chrome: mockChrome } = require('jest-chrome')
  return {
    getChromeWithThrow: (): typeof chrome => mockChrome,
  }
})

describe(getDeviceLocales, () => {
  const MOCK_LANGUAGE = 'es-ES'
  chrome.i18n.getUILanguage.mockImplementation(() => MOCK_LANGUAGE)

  it('should return the device locale', () => {
    expect(getDeviceLocales).not.toThrow()
    expect(getDeviceLocales()).toEqual([{ languageCode: MOCK_LANGUAGE, languageTag: MOCK_LANGUAGE }])
  })

  it('should return the default locale if an error occurs', () => {
    chrome.i18n.getUILanguage.mockImplementation(() => {
      throw new Error('test error')
    })

    expect(getDeviceLocales).not.toThrow()
    expect(getDeviceLocales()).toEqual([{ languageCode: DEFAULT_LANGUAGE_CODE, languageTag: DEFAULT_LANGUAGE_TAG }])
  })
})
