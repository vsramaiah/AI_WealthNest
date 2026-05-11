import { useState } from 'react'

export default function AppLockOverlay({ onUnlock, pinHint }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-wn-bg/95 px-5 backdrop-blur">
      <div className="glass-card w-full max-w-sm p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-wn-accent">App Lock</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-wn-text">Unlock WealthNest</h2>
        <p className="section-copy mt-3">
          Enter your local app PIN to continue. {pinHint ? `Hint: ${pinHint}` : ''}
        </p>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-wn-text">PIN</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
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
          onClick={() => {
            if (!onUnlock(pin)) {
              setError('Incorrect PIN. Try again.')
            }
          }}
          className="mt-5 w-full rounded-2xl bg-wn-accent-strong px-4 py-3 text-sm font-semibold text-slate-950"
        >
          Unlock App
        </button>
      </div>
    </div>
  )
}
