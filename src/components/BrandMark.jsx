function WealthNestGlyph({ className = 'h-11 w-11' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wn-mark-bg" x1="7" y1="6" x2="57" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F2234" />
          <stop offset="0.55" stopColor="#091522" />
          <stop offset="1" stopColor="#050B14" />
        </linearGradient>
        <linearGradient id="wn-mark-line" x1="18" y1="18" x2="47" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2FFF8" />
          <stop offset="0.42" stopColor="#88F4BA" />
          <stop offset="1" stopColor="#22C86A" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wn-mark-bg)" />
      <rect x="7.5" y="7.5" width="49" height="49" rx="15" stroke="rgba(255,255,255,0.08)" />
      <path
        d="M17 17.5V45.5C17 46.88 18.12 48 19.5 48H47.5"
        stroke="rgba(236,255,245,0.18)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M18.6 45.4L27.6 31.1L34.3 37.8L42.4 24.6L49 14.8"
        stroke="url(#wn-mark-line)"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44.9 15.2L49.5 14.4L48.5 19"
        stroke="url(#wn-mark-line)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function BrandMark({
  subtitle = 'A clearer way to build and review your wealth',
  compact = false,
  minimal = false,
}) {
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
      <div className={`${minimal ? 'rounded-[22px] bg-white p-2 shadow-[0_12px_28px_rgba(148,163,184,0.18)]' : 'rounded-[20px] border border-white/8 bg-white/[0.03] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.24)]'}`}>
        <WealthNestGlyph className={minimal ? 'h-12 w-12' : compact ? 'h-10 w-10' : 'h-11 w-11'} />
      </div>

      <div className="min-w-0">
        <p className={`font-['Sora'] font-semibold uppercase ${minimal ? 'text-[0.96rem] tracking-[0.42em] text-emerald-300' : 'text-[10px] tracking-[0.34em] text-emerald-300/88'}`}>
          WEALTHNEST
        </p>
        {minimal ? (
          <p className="mt-1 text-xs font-medium tracking-[0.08em] text-wn-muted">
            Track. Invest. Grow.
          </p>
        ) : null}
        {!minimal ? (
          <p className={`truncate font-['Sora'] font-semibold tracking-tight text-wn-text ${compact ? 'text-base' : 'text-lg'}`}>
            Personal wealth tracking with long-term clarity.
          </p>
        ) : null}
        {!compact && !minimal ? <p className="mt-1 text-sm text-wn-muted">{subtitle}</p> : null}
      </div>
    </div>
  )
}
