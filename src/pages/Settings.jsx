import {
  Database,
  Download,
  Info,
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react'
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

function SettingRow({ icon: Icon, iconTone, title, subtitle, children }) {
  return (
    <div className="flex items-center gap-4 rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
      <div className={`icon-badge h-11 w-11 rounded-2xl bg-gradient-to-br ${iconTone}`}>
        <Icon size={18} strokeWidth={2.1} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-wn-text">{title}</p>
        <p className="mt-1 text-sm text-wn-muted">{subtitle}</p>
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
      title="Application Settings"
      description="Manage backup, security, reminders, exports, and device-level preferences."
    >
      <div className="space-y-4">
        <article className="glass-card space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Backup & Restore</p>
              <p className="mt-1 text-sm text-wn-muted">
                Export local data, restore from file, or download transaction history.
              </p>
            </div>
            <span className="pill-chip">Local only</span>
          </div>

          <SettingRow
            icon={Download}
            iconTone="from-sky-500 to-blue-400"
            title="Export JSON Backup"
            subtitle="Download your full local WealthNest data as a JSON backup file."
          >
            <button type="button" onClick={handleBackupDownload} className="secondary-button px-3 py-2">
              Export
            </button>
          </SettingRow>

          <SettingRow
            icon={Upload}
            iconTone="from-emerald-500 to-green-400"
            title="Restore from File"
            subtitle="Replace current local data with a valid backup file."
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="secondary-button px-3 py-2"
            >
              Restore
            </button>
          </SettingRow>

          <SettingRow
            icon={RefreshCw}
            iconTone="from-violet-500 to-fuchsia-400"
            title="Export Transactions CSV"
            subtitle="Download transaction records in a spreadsheet-ready format."
          >
            <button type="button" onClick={downloadTransactionsCsv} className="secondary-button px-3 py-2">
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

          <p className="text-sm text-wn-muted">
            Last backup: {formatBackupTime(settings.lastBackupAt)}
          </p>
        </article>

        <article className="glass-card space-y-3 p-5">
          <div>
            <p className="section-title">Appearance & Security</p>
            <p className="mt-1 text-sm text-wn-muted">
              Adjust application appearance and protect access on this device.
            </p>
          </div>

          <SettingRow
            icon={Moon}
            iconTone="from-slate-500 to-slate-700"
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
            icon={Lock}
            iconTone="from-amber-500 to-yellow-400"
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
            <span className="mt-2 block text-sm text-wn-muted">
              Your PIN is stored as a one-way hash on this device. Enter a new 4-digit PIN to replace it.
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
              className="primary-button"
            >
              {isSavingPin ? 'Saving...' : 'Save PIN'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAppUnlocked(false)
                setStatusMessage('App locked for this session.')
              }}
              className="secondary-button"
            >
              Lock Now
            </button>
          </div>

          <p className="text-sm text-wn-muted">
            Session unlock: {isAppUnlocked() ? 'Unlocked' : 'Locked'}
          </p>
        </article>

        <article className="glass-card space-y-3 p-5">
          <div>
            <p className="section-title">Automation Helpers</p>
            <p className="mt-1 text-sm text-wn-muted">
              Keep reminder and backup indicators aligned with local activity.
            </p>
          </div>

          <SettingRow
            icon={ShieldCheck}
            iconTone="from-emerald-500 to-green-400"
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
            icon={RefreshCw}
            iconTone="from-sky-500 to-cyan-400"
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
            className="secondary-button"
          >
            <span>Run Auto Backup Simulation</span>
          </button>

          <div className="space-y-1 text-sm text-wn-muted">
            <p>Last reminder scan: {settings.lastReminderCheckAt ?? 'Never'}</p>
            <p>Simulated auto backup: {settings.autoBackupAt ?? 'Never'}</p>
          </div>
        </article>

        <article className="glass-card space-y-1 p-3">
          <SettingRow
            icon={Database}
            iconTone="from-sky-500 to-blue-400"
            title="Data Management"
            subtitle="Clear locally stored application data"
          >
            <button
              type="button"
              onClick={() => setShowClearDataConfirm(true)}
              className="secondary-button px-3 py-2"
            >
              Clear All Data
            </button>
          </SettingRow>

          <SettingRow
            icon={Info}
            iconTone="from-violet-500 to-fuchsia-400"
            title="About WealthNest"
            subtitle="Version 1.0.0"
          />
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
