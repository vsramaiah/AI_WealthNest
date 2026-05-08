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
        <linearGradient id="wn-mark-bg" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#11243A" />
          <stop offset="0.58" stopColor="#0C1728" />
          <stop offset="1" stopColor="#08111E" />
        </linearGradient>
        <linearGradient id="wn-mark-line" x1="15" y1="18" x2="48" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DDFCE9" />
          <stop offset="0.45" stopColor="#7AF3AF" />
          <stop offset="1" stopColor="#2DD36F" />
        </linearGradient>
        <linearGradient id="wn-mark-accent" x1="35" y1="14" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B9F8D2" />
          <stop offset="1" stopColor="#38E07D" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wn-mark-bg)" />
      <path
        d="M15 18.5V41.5C15 44.54 17.46 47 20.5 47H44.5"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 20L24.6 39.5L31.4 28L38.1 39.5L45.5 17.5"
        stroke="url(#wn-mark-line)"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37 17.3C39.6 17.3 41.86 18.78 42.83 21.01C40.73 20.32 38.39 20.91 37 22.86C35.61 20.91 33.27 20.32 31.17 21.01C32.14 18.78 34.4 17.3 37 17.3Z"
        fill="url(#wn-mark-accent)"
      />
      <path d="M37 14V18.8" stroke="#E6FFF0" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export default function BrandMark({ subtitle = 'Build wealth with clarity', compact = false }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
      <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
        <WealthNestGlyph className={compact ? 'h-10 w-10' : 'h-11 w-11'} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-emerald-300/88">
          WealthNest
        </p>
        <p className={`truncate font-semibold tracking-tight text-wn-text ${compact ? 'text-base' : 'text-lg'}`}>
          Wealth that compounds with discipline.
        </p>
        {!compact ? <p className="mt-1 text-sm text-wn-muted">{subtitle}</p> : null}
      </div>
    </div>
  )
}
