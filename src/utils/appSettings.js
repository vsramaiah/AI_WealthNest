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
  appLockPin: '1234',
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

  if (Object.prototype.hasOwnProperty.call(nextSettings ?? {}, 'appLockPin')) {
    mergedSettings.appLockPin = normalizePin(nextSettings.appLockPin) || '1234'
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings))
  applyThemeMode(mergedSettings.themeMode)
  window.dispatchEvent(
    new CustomEvent(SETTINGS_EVENT, {
      detail: mergedSettings,
    }),
  )

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

export function verifyAppLockPin(pin) {
  return normalizePin(pin) === normalizePin(loadAppSettings().appLockPin ?? '1234')
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
  window.dispatchEvent(
    new CustomEvent(SETTINGS_EVENT, {
      detail: resetSettings,
    }),
  )

  return resetSettings
}
