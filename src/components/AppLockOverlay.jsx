import { useEffect, useRef, useState } from 'react'

export default function AppLockOverlay({ onUnlock, onResetLock, pinHint }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleUnlock() {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      if (!(await onUnlock(pin))) {
        setError('Incorrect PIN. Try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-lock-title"
      aria-describedby="app-lock-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-wn-bg/95 px-5 backdrop-blur"
    >
      <div className="glass-card w-full max-w-sm p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-wn-accent">App Lock</p>
        <h2 id="app-lock-title" className="mt-3 text-2xl font-semibold tracking-tight text-wn-text">
          Unlock WealthNest
        </h2>
        <p id="app-lock-description" className="section-copy mt-3">
          Enter your local app PIN to continue. {pinHint ? `Hint: ${pinHint}` : ''}
        </p>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-wn-text">PIN</span>
          <input
            ref={inputRef}
            type="password"
            autoFocus
            inputMode="numeric"
            maxLength={4}
            autoComplete="current-password"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4))
              setError('')
            }}
            className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-wn-text outline-none transition focus:border-wn-accent focus:bg-white/7"
          />
        </label>

        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}

        <button
          type="button"
          onClick={handleUnlock}
          disabled={isSubmitting}
          className="mt-5 w-full rounded-2xl bg-wn-accent-strong px-4 py-3 text-sm font-semibold text-slate-950"
        >
          {isSubmitting ? 'Checking...' : 'Unlock App'}
        </button>

        <button
          type="button"
          onClick={() => {
            const confirmed = window.confirm(
              'Reset app lock on this device? This disables the lock and clears the saved PIN.',
            )

            if (!confirmed) {
              return
            }

            onResetLock()
          }}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-wn-muted"
        >
          Forgot PIN? Reset App Lock
        </button>
      </div>
    </div>
  )
}
