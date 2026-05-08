import { ShieldCheck } from 'lucide-react'

export default function LocalDataIndicator() {
  return (
    <article className="glass-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[1.35rem] font-semibold tracking-tight text-wn-text">
            Data stored locally
          </p>
          <p className="mt-2 text-sm text-wn-muted">
            Your data is safe on this device.
          </p>
        </div>
        <div className="icon-badge bg-gradient-to-br from-emerald-500 to-green-400">
          <ShieldCheck size={20} strokeWidth={2.2} />
        </div>
      </div>
    </article>
  )
}
