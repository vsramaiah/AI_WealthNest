import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  isAppUnlocked,
  loadAppSettings,
  resetAppLock,
  setAppUnlocked,
  subscribeToAppLock,
  subscribeToAppSettings,
  verifyAppLockPin,
} from '../utils/appSettings'
import AppLockOverlay from './AppLockOverlay'
import BottomNav from './BottomNav'
import Header from './Header'

export default function AppLayout() {
  const [settings, setSettings] = useState(() => loadAppSettings())
  const [unlocked, setUnlocked] = useState(() =>
    loadAppSettings().appLockEnabled ? isAppUnlocked() : true,
  )

  useEffect(() => subscribeToAppSettings(setSettings), [])
  useEffect(() => subscribeToAppLock(setUnlocked), [])

  useEffect(() => {
    setUnlocked(settings.appLockEnabled ? isAppUnlocked() : true)
  }, [settings.appLockEnabled])

  return (
    <div className="app-shell">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(69,227,124,0.18),transparent_52%)]" />

      <Header />

      <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-28 pt-3">
        <Outlet />
      </main>

      <BottomNav />

      {settings.appLockEnabled && !unlocked ? (
        <AppLockOverlay
          pinHint="Use your saved local PIN"
          onUnlock={async (pin) => {
            const valid = await verifyAppLockPin(pin)

            if (valid) {
              setAppUnlocked(true)
              setUnlocked(true)
            }

            return valid
          }}
          onResetLock={() => {
            resetAppLock()
            setUnlocked(true)
          }}
        />
      ) : null}
    </div>
  )
}
