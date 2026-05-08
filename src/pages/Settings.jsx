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
import { defaultData, saveData } from '../utils/storage'

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
      {children}
    </div>
  )
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
  }) + date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/^/, ' at ')
}

export default function Settings() {
  const [settings, setSettings] = useState(() => loadAppSettings())
  const [statusMessage, setStatusMessage] = useState('')
  const [pinDraft, setPinDraft] = useState(() => loadAppSettings().appLockPin ?? '1234')
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
    const confirmed = window.confirm(
      'Clear all WealthNest data from this device? This will remove transactions, masters, and local settings.',
    )

    if (!confirmed) {
      return
    }

    saveData(defaultData)
    resetAppSettings()
    setPinDraft('1234')
    setStatusMessage('All WealthNest data was cleared from this device.')
  }

  return (
    <PageShell
      eyebrow="Preferences"
      title="Tune the experience"
      description="Manage backups, app lock, reminders, exports, and your local-first device settings."
    >
      <div className="space-y-4">
        <article className="glass-card space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Backup & Restore</p>
              <p className="mt-1 text-sm text-wn-muted">
                Export local data, restore from file, or download CSV history.
              </p>
            </div>
            <span className="pill-chip">Local only</span>
          </div>

          <SettingRow
            icon={Download}
            iconTone="from-sky-500 to-blue-400"
            title="Export JSON Backup"
            subtitle={`Filename format: ${buildBackupFilename()}`}
          >
            <button type="button" onClick={handleBackupDownload} className="secondary-button px-3 py-2">
              Export
            </button>
          </SettingRow>

          <SettingRow
            icon={Upload}
            iconTone="from-emerald-500 to-green-400"
            title="Restore from File"
            subtitle="Replace current local storage with a valid backup file."
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
            subtitle="Download your transaction list in spreadsheet-friendly format."
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
              Customize the shell and protect access on this device.
            </p>
          </div>

          <SettingRow
            icon={Moon}
            iconTone="from-slate-500 to-slate-700"
            title="Dark Mode"
            subtitle={settings.themeMode === 'light' ? 'Light shell is active' : 'Dark shell is active'}
          >
            <button
              type="button"
              onClick={() =>
                saveAppSettings({
                  themeMode: settings.themeMode === 'light' ? 'dark' : 'light',
                })
              }
              className={`relative h-7 w-12 rounded-full ${settings.themeMode === 'light' ? 'bg-slate-300' : 'bg-wn-accent-strong'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${settings.themeMode === 'light' ? 'left-1' : 'left-6'}`}
              />
            </button>
          </SettingRow>

          <SettingRow
            icon={Lock}
            iconTone="from-amber-500 to-yellow-400"
            title="App Lock"
            subtitle={settings.appLockEnabled ? 'PIN lock is enabled' : 'PIN lock is disabled'}
          >
            <button
              type="button"
              onClick={() =>
                saveAppSettings({
                  appLockEnabled: !settings.appLockEnabled,
                })
              }
              className={`relative h-7 w-12 rounded-full ${settings.appLockEnabled ? 'bg-wn-accent-strong' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${settings.appLockEnabled ? 'left-6' : 'left-1'}`}
              />
            </button>
          </SettingRow>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-wn-text">App Lock PIN</span>
            <input
              type="password"
              value={pinDraft}
              onChange={(event) => setPinDraft(event.target.value)}
              className="form-input"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                saveAppSettings({
                  appLockPin: pinDraft || '1234',
                })
                setStatusMessage('App lock PIN updated.')
              }}
              className="primary-button"
            >
              Save PIN
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
              Keep reminders and auto backup indicators in sync with your local usage.
            </p>
          </div>

          <SettingRow
            icon={ShieldCheck}
            iconTone="from-emerald-500 to-green-400"
            title="Reminders"
            subtitle={settings.remindersEnabled ? 'Reminders are enabled' : 'Reminders are disabled'}
          >
            <button
              type="button"
              onClick={() =>
                saveAppSettings({
                  remindersEnabled: !settings.remindersEnabled,
                  lastReminderCheckAt: new Date().toISOString(),
                })
              }
              className={`relative h-7 w-12 rounded-full ${settings.remindersEnabled ? 'bg-wn-accent-strong' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${settings.remindersEnabled ? 'left-6' : 'left-1'}`}
              />
            </button>
          </SettingRow>

          <SettingRow
            icon={RefreshCw}
            iconTone="from-sky-500 to-cyan-400"
            title="Auto Backup"
            subtitle={settings.autoBackupEnabled ? 'Simulated backup is enabled' : 'Simulated backup is disabled'}
          >
            <button
              type="button"
              onClick={() =>
                saveAppSettings({
                  autoBackupEnabled: !settings.autoBackupEnabled,
                })
              }
              className={`relative h-7 w-12 rounded-full ${settings.autoBackupEnabled ? 'bg-wn-accent-strong' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${settings.autoBackupEnabled ? 'left-6' : 'left-1'}`}
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
            subtitle="Clear or Manage Data"
          >
            <button
              type="button"
              onClick={handleClearAllData}
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
      </div>
    </PageShell>
  )
}
