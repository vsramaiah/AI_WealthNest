const SETTINGS_KEY = 'wealthNestPreferences'
const SETTINGS_EVENT = 'wealthnest:settings-changed'
const APP_LOCK_SESSION_KEY = 'wealthNestUnlocked'
const APP_LOCK_EVENT = 'wealthnest:app-lock-changed'

const defaultSettings = {
  investorName: 'Investor',
  themeMode: 'dark',
  autoBackupEnabled: false,
  lastBackupAt: null,
  autoBackupAt: null,
  appLockEnabled: false,
  appLockPinHash: null,
  remindersEnabled: true,
  lastReminderCheckAt: null,
}

function normalizePin(pin) {
  return String(pin ?? '')
    .replace(/\D/g, '')
    .slice(0, 4)
}

function cloneDefaultSettings() {
  return JSON.parse(JSON.stringify(defaultSettings))
}

async function hashPin(pin) {
  const normalizedPin = normalizePin(pin)
  const encodedPin = new TextEncoder().encode(normalizedPin)
  const digest = await window.crypto.subtle.digest('SHA-256', encodedPin)

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

function dispatchSettingsChange(detail) {
  window.dispatchEvent(
    new CustomEvent(SETTINGS_EVENT, {
      detail,
    }),
  )
}

export function loadAppSettings() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? 'null')
    return {
      ...defaultSettings,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    }
  } catch {
    return { ...defaultSettings }
  }
}

export function applyThemeMode(themeMode) {
  document.documentElement.dataset.theme = themeMode === 'light' ? 'light' : 'dark'
}

export function saveAppSettings(nextSettings) {
  const mergedSettings = {
    ...loadAppSettings(),
    ...nextSettings,
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings))
  applyThemeMode(mergedSettings.themeMode)
  dispatchSettingsChange(mergedSettings)

  return mergedSettings
}

export function subscribeToAppSettings(listener) {
  function handleSettingsChange(event) {
    listener(event.detail ?? loadAppSettings())
  }

  window.addEventListener(SETTINGS_EVENT, handleSettingsChange)

  return () => {
    window.removeEventListener(SETTINGS_EVENT, handleSettingsChange)
  }
}

export function simulateAutoBackup() {
  const timestamp = new Date().toISOString()

  return saveAppSettings({
    lastBackupAt: timestamp,
    autoBackupAt: timestamp,
  })
}

export function isAppUnlocked() {
  return window.sessionStorage.getItem(APP_LOCK_SESSION_KEY) === 'true'
}

export function setAppUnlocked(unlocked) {
  if (unlocked) {
    window.sessionStorage.setItem(APP_LOCK_SESSION_KEY, 'true')
  } else {
    window.sessionStorage.removeItem(APP_LOCK_SESSION_KEY)
  }

  window.dispatchEvent(
    new CustomEvent(APP_LOCK_EVENT, {
      detail: { unlocked },
    }),
  )
}

export async function saveAppLockPin(pin) {
  const normalizedPin = normalizePin(pin)

  if (normalizedPin.length !== 4) {
    throw new Error('App lock PIN must be exactly 4 digits.')
  }

  const nextSettings = {
    ...loadAppSettings(),
    appLockPinHash: await hashPin(normalizedPin),
  }

  delete nextSettings.appLockPin

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings))
  applyThemeMode(nextSettings.themeMode)
  dispatchSettingsChange(nextSettings)

  return nextSettings
}

export async function verifyAppLockPin(pin) {
  const normalizedPin = normalizePin(pin)
  const settings = loadAppSettings()
  const storedHash = settings.appLockPinHash ?? null

  if (storedHash) {
    return (await hashPin(normalizedPin)) === storedHash
  }

  const legacyPin = normalizePin(settings.appLockPin ?? '')

  if (legacyPin.length !== 4) {
    return false
  }

  const isValid = normalizedPin === legacyPin

  if (isValid) {
    await saveAppLockPin(legacyPin)
  }

  return isValid
}

export function subscribeToAppLock(listener) {
  function handleAppLockChange(event) {
    listener(event.detail?.unlocked ?? isAppUnlocked())
  }

  window.addEventListener(APP_LOCK_EVENT, handleAppLockChange)

  return () => {
    window.removeEventListener(APP_LOCK_EVENT, handleAppLockChange)
  }
}

export function resetAppSettings() {
  const resetSettings = cloneDefaultSettings()
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(resetSettings))
  applyThemeMode(resetSettings.themeMode)
  setAppUnlocked(false)
  dispatchSettingsChange(resetSettings)

  return resetSettings
}

export function resetAppLock() {
  const nextSettings = {
    ...loadAppSettings(),
    appLockEnabled: false,
    appLockPinHash: null,
  }

  delete nextSettings.appLockPin

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings))
  applyThemeMode(nextSettings.themeMode)
  setAppUnlocked(false)
  dispatchSettingsChange(nextSettings)

  return nextSettings
}
