import { useEffect, useRef, useState } from 'react'
import LocalDataIndicator from '../components/LocalDataIndicator'
import PageShell from '../components/PageShell'
import {
  isAppUnlocked,
  loadAppSettings,
  resetAppSettings,
  saveAppLockPin,
  saveAppSettings,
  setAppUnlocked,
  simulateAutoBackup,
  subscribeToAppSettings,
} from '../utils/appSettings'
import {
  buildBackupFilename,
  downloadJsonBackup,
  downloadTransactionsCsv,
  restoreJsonBackup,
} from '../utils/dataPortability'
import { getDefaultData, saveData } from '../utils/storage'

function SettingRow({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-white/6 bg-white/[0.03] p-3 sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-wn-text">{title}</p>
        <p className="mt-1 text-xs leading-5 text-wn-muted sm:text-sm">{subtitle}</p>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  )
}

function getToggleClass(enabled) {
  return enabled
    ? 'bg-wn-accent-strong border border-emerald-600/30'
    : 'border border-slate-300 bg-slate-200'
}

function formatBackupTime(value) {
  if (!value) {
    return 'Never'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function Settings() {
  const [settings, setSettings] = useState(() => loadAppSettings())
  const [statusMessage, setStatusMessage] = useState('')
  const [pinDraft, setPinDraft] = useState('')
  const [confirmPinDraft, setConfirmPinDraft] = useState('')
  const [isSavingPin, setIsSavingPin] = useState(false)
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => subscribeToAppSettings(setSettings), [])

  function handleBackupDownload() {
    const filename = buildBackupFilename()
    const snapshot = downloadJsonBackup()
    saveAppSettings({
      lastBackupAt: snapshot.exportedAt,
    })
    setStatusMessage(`Backup created: ${filename}`)
  }

  function handleRestore(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? '{}'))
        restoreJsonBackup(parsed)
        setStatusMessage('Backup restored successfully. Local storage was replaced.')
      } catch {
        setStatusMessage('Restore failed. Please choose a valid WealthNest backup file.')
      } finally {
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  function handleClearAllData() {
    saveData(getDefaultData())
    resetAppSettings()
    setPinDraft('')
    setConfirmPinDraft('')
    setShowClearDataConfirm(false)
    setStatusMessage('All WealthNest data was cleared from this device.')
  }

  return (
    <PageShell
      eyebrow="Preferences"
      title="Settings"
      description="Manage backup, security, reminders, and local device preferences."
    >
      <div className="space-y-4 pb-24">
        <article className="glass-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Backup</p>
              <p className="mt-1 text-sm text-wn-muted">
                Export, restore, or download transaction history.
              </p>
            </div>
            <span className="pill-chip">Local only</span>
          </div>

          <SettingRow
            title="Backup"
            subtitle={`Last backup: ${formatBackupTime(settings.lastBackupAt)}`}
          >
            <button type="button" onClick={handleBackupDownload} className="secondary-button px-3 py-2 text-xs">
              Backup
            </button>
          </SettingRow>

          <SettingRow
            title="Restore"
            subtitle="Import a WealthNest backup file."
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="secondary-button px-3 py-2 text-xs"
            >
              Restore
            </button>
          </SettingRow>

          <SettingRow
            title="Transactions CSV"
            subtitle="Download transactions in spreadsheet format."
          >
            <button type="button" onClick={downloadTransactionsCsv} className="secondary-button px-3 py-2 text-xs">
              CSV
            </button>
          </SettingRow>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleRestore}
            className="hidden"
          />

        </article>

        <article className="glass-card space-y-3 p-4">
          <div>
            <p className="section-title">Security</p>
            <p className="mt-1 text-sm text-wn-muted">
              Protect access and adjust app appearance.
            </p>
          </div>

          <SettingRow
            title="Dark Mode"
            subtitle={settings.themeMode === 'light' ? 'Light theme is enabled' : 'Dark theme is enabled'}
          >
            <button
              type="button"
              onClick={() =>
                saveAppSettings({
                  themeMode: settings.themeMode === 'light' ? 'dark' : 'light',
                })
              }
              className={`relative h-7 w-12 shrink-0 rounded-full ${getToggleClass(settings.themeMode !== 'light')}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${settings.themeMode === 'light' ? 'left-1' : 'left-6'}`}
              />
            </button>
          </SettingRow>

          <SettingRow
            title="App Lock"
            subtitle={settings.appLockEnabled ? 'PIN protection is enabled' : 'PIN protection is disabled'}
          >
            <button
              type="button"
              onClick={() =>
                saveAppSettings({
                  appLockEnabled: !settings.appLockEnabled,
                })
              }
              className={`relative h-7 w-12 shrink-0 rounded-full ${getToggleClass(settings.appLockEnabled)}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${settings.appLockEnabled ? 'left-6' : 'left-1'}`}
              />
            </button>
          </SettingRow>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-wn-text">App Lock PIN</span>
            <input
              type="password"
              value={pinDraft}
              inputMode="numeric"
              maxLength={4}
              onChange={(event) =>
                setPinDraft(event.target.value.replace(/\D/g, '').slice(0, 4))
              }
              className="form-input"
            />
            <span className="mt-2 block text-xs leading-5 text-wn-muted">
              Enter a new 4-digit PIN to replace the current app lock PIN.
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-wn-text">Confirm PIN</span>
            <input
              type="password"
              value={confirmPinDraft}
              inputMode="numeric"
              maxLength={4}
              onChange={(event) =>
                setConfirmPinDraft(event.target.value.replace(/\D/g, '').slice(0, 4))
              }
              className="form-input"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={async () => {
                if (isSavingPin) {
                  return
                }

                const normalizedPin = pinDraft.replace(/\D/g, '').slice(0, 4)

                if (normalizedPin.length !== 4) {
                  setStatusMessage('App lock PIN must be exactly 4 digits.')
                  return
                }

                if (normalizedPin !== confirmPinDraft.replace(/\D/g, '').slice(0, 4)) {
                  setStatusMessage('PIN confirmation does not match.')
                  return
                }

                setIsSavingPin(true)

                try {
                  await saveAppLockPin(normalizedPin)
                  setPinDraft('')
                  setConfirmPinDraft('')
                  setStatusMessage('App lock PIN updated.')
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : 'App lock PIN could not be updated.'
                  setStatusMessage(message)
                } finally {
                  setIsSavingPin(false)
                }
              }}
              className="primary-button px-3 py-2 text-xs"
            >
              {isSavingPin ? 'Saving...' : 'Save PIN'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAppUnlocked(false)
                setStatusMessage('App locked for this session.')
              }}
              className="secondary-button px-3 py-2 text-xs"
            >
              Lock Now
            </button>
          </div>

          <p className="text-xs text-wn-muted">
            Session unlock: {isAppUnlocked() ? 'Unlocked' : 'Locked'}
          </p>
        </article>

        <article className="glass-card space-y-3 p-4">
          <div>
            <p className="section-title">Preferences</p>
            <p className="mt-1 text-sm text-wn-muted">
              Control reminders and local backup indicators.
            </p>
          </div>

          <SettingRow
            title="Reminders"
            subtitle={settings.remindersEnabled ? 'Reminder alerts are enabled' : 'Reminder alerts are disabled'}
          >
            <button
              type="button"
              onClick={() =>
                saveAppSettings({
                  remindersEnabled: !settings.remindersEnabled,
                  lastReminderCheckAt: new Date().toISOString(),
                })
              }
              className={`relative h-7 w-12 shrink-0 rounded-full ${getToggleClass(settings.remindersEnabled)}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${settings.remindersEnabled ? 'left-6' : 'left-1'}`}
              />
            </button>
          </SettingRow>

          <SettingRow
            title="Auto Backup"
            subtitle={settings.autoBackupEnabled ? 'Backup simulation is enabled' : 'Backup simulation is disabled'}
          >
            <button
              type="button"
              onClick={() =>
                saveAppSettings({
                  autoBackupEnabled: !settings.autoBackupEnabled,
                })
              }
              className={`relative h-7 w-12 shrink-0 rounded-full ${getToggleClass(settings.autoBackupEnabled)}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${settings.autoBackupEnabled ? 'left-6' : 'left-1'}`}
              />
            </button>
          </SettingRow>

          <button
            type="button"
            onClick={() => {
              simulateAutoBackup()
              setStatusMessage('Auto backup timestamp updated.')
            }}
            className="secondary-button w-full px-3 py-2 text-xs"
          >
            <span>Run Backup Check</span>
          </button>

          <div className="space-y-1 text-xs leading-5 text-wn-muted">
            <p>Last reminder scan: {settings.lastReminderCheckAt ?? 'Never'}</p>
            <p>Simulated auto backup: {settings.autoBackupAt ?? 'Never'}</p>
          </div>
        </article>

        <article className="glass-card space-y-1 p-3">
          <SettingRow
            title="Data Management"
            subtitle="Clear locally stored application data"
          >
            <button
              type="button"
              onClick={() => setShowClearDataConfirm(true)}
              className="secondary-button px-3 py-2 text-xs"
            >
              Clear
            </button>
          </SettingRow>

          <SettingRow
            title="About WealthNest"
            subtitle="Version 1.0.0"
          />
        </article>

        <article className="glass-card rounded-[26px] px-5 py-4">
          <p className="text-sm font-semibold text-wn-text">
            Built by VISIRA
          </p>
        </article>

        <LocalDataIndicator />

        {statusMessage ? (
          <article className="glass-card p-5">
            <p className="section-title">Status</p>
            <p className="mt-2 text-sm text-wn-muted">{statusMessage}</p>
          </article>
        ) : null}

        {showClearDataConfirm ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-black/55 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-10 backdrop-blur sm:items-center sm:pb-6">
            <article
              role="dialog"
              aria-modal="true"
              aria-label="Clear all data confirmation"
              className="glass-card w-full max-w-md p-5"
            >
              <p className="section-title">Clear All Data?</p>
              <p className="mt-2 text-sm text-wn-muted">
                This will remove all transactions, account records, and local settings from this device.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearDataConfirm(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  className="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300"
                >
                  Clear Data
                </button>
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </PageShell>
  )
}
