function GlyphBase({ children, size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function StocksGlyph({ size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 5v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="7" y="9" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 15v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="15" y="5" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 13v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v16a2 2 0 0 0 2 2h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MutualFundsGlyph({ size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 16v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 10v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GoldSilverGlyph({ size = 22 }) {
  return (
    <svg
      viewBox="0 0 496.131 496.131"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#FFC200" d="M154.731 401.215l-14.4-45.6c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6l-15.2 47.2c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFB000" d="M.331 402.815c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4l-14.4-45.6Z"/>
      <path fill="#FF9700" d="M.331 402.815c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFDA00" d="M140.331 356.415c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6Z"/>
      <path fill="#FFC200" d="M325.131 401.215l-14.4-45.6c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6l-15.2 46.4c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFB000" d="M170.731 402.815c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4l-14.4-45.6Z"/>
      <path fill="#FF9700" d="M170.731 402.815c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFDA00" d="M310.731 356.415c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6Z"/>
      <path fill="#FFC200" d="M495.531 401.215l-14.4-45.6c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6l-15.2 46.4c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFB000" d="M341.131 402.815c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4l-14.4-45.6Z"/>
      <path fill="#FF9700" d="M341.131 402.815c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFDA00" d="M481.131 356.415c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6Z"/>
      <path fill="#FFC200" d="M240.331 318.815l-14.4-45.6c-.8-3.2-4-5.6-7.2-5.6h-111.2c-3.2 0-6.4 2.4-7.2 5.6l-14.4 47.2c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6-.8-2.4-.8-4Z"/>
      <path fill="#FFB000" d="M85.931 320.415c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4l-14.4-45.6Z"/>
      <path fill="#FF9700" d="M85.931 320.415c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFDA00" d="M225.131 274.015c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6Z"/>
      <path fill="#FFC200" d="M409.931 318.815l-14.4-45.6c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6l-14.4 47.2c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6-.8-2.4-.8-4Z"/>
      <path fill="#FFB000" d="M256.331 320.415c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4l-14.4-45.6Z"/>
      <path fill="#FF9700" d="M256.331 320.415c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFDA00" d="M395.531 274.015c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6Z"/>
      <path fill="#FFC200" d="M325.131 238.815l-14.4-45.6c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6l-15.2 47.2c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFB000" d="M170.731 240.415c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4l-14.4-45.6Z"/>
      <path fill="#FF9700" d="M170.731 240.415c-.8 2.4 0 4.8.8 6.4 1.6 1.6 4 3.2 6.4 3.2h140c4 0 7.2-3.2 7.2-7.2 0-1.6 0-2.4-.8-4Z"/>
      <path fill="#FFDA00" d="M310.731 193.215c-.8-3.2-4-5.6-7.2-5.6h-110.4c-3.2 0-6.4 2.4-7.2 5.6Z"/>
      <path fill="#FFDA00" d="M147.531 141.215c0 31.2-1.6 56.8-3.2 56.8-1.6 0-3.2-25.6-3.2-56.8s1.6-56.8 3.2-56.8c2.4 0 3.2 25.6 3.2 56.8Z"/>
      <path fill="#FFDA00" d="M145.131 143.615c-31.2 0-56.8-1.6-56.8-3.2 0-1.6 25.6-3.2 56.8-3.2s56.8 1.6 56.8 3.2c0 2.4-25.6 3.2-56.8 3.2Z"/>
      <path fill="#FFB000" d="M338.232 126.763c-11.066 0-24.31-14.297-30.223-20.277-.304-.309-.611-.62-.922-.935-.763-.772-.756-2.015.016-2.778.772-.763 2.016-.756 2.778.017.309.313.615.623.918.929 8.767 8.864 25.087 25.369 28.332 19.062.657-.296 1.468-.208 2.062.288.816.68.927 1.892.247 2.708-.576.692-1.552.986-3.208.986Zm-30.4-21.6h.8-.8Z"/>
      <path fill="#FF9700" d="M410.731 258.815c-1.105 0-2-.895-2-2v-20.4c0-1.105.895-2 2-2s2 .895 2 2v20.4c0 1.105-.895 2-2 2Zm21.824-20.797c-3.331 0-12.041-.096-21.824-.096s-18.493.096-21.824.096c-1.105 0-2-.895-2-2 0-.666.331-1.288.884-1.659 1.271-.852 1.271-.852 22.94-.852 21.67 0 21.67 0 22.94.852a1.999 1.999 0 0 1-1.116 3.659Z"/>
    </svg>
  )
}

function FixedDepositGlyph({ size = 22 }) {
  return (
    <GlyphBase size={size}>
      <rect {...strokeProps} x="5.5" y="6" width="13" height="12" rx="2.5" />
      <path {...strokeProps} d="M9 10.25H15" />
      <path {...strokeProps} d="M9 13.75H13.5" />
      <path {...strokeProps} d="M7.75 6V4.75" />
      <path {...strokeProps} d="M16.25 6V4.75" />
    </GlyphBase>
  )
}

function RecurringDepositGlyph({ size = 22 }) {
  return (
    <GlyphBase size={size}>
      <circle {...strokeProps} cx="12" cy="12" r="4" />
      <path {...strokeProps} d="M12 9.9V14.1" />
      <path {...strokeProps} d="M10.1 12H13.9" />
      <path {...strokeProps} d="M7.2 8.1C7.8 7.14 8.72 6.38 9.8 5.95L8.9 4.9" />
      <path {...strokeProps} d="M16.8 15.9C16.2 16.86 15.28 17.62 14.2 18.05L15.1 19.1" />
      <path {...strokeProps} d="M16.85 8.2C15.95 6.88 14.47 6 12.8 5.85" />
      <path {...strokeProps} d="M7.15 15.8C8.05 17.12 9.53 18 11.2 18.15" />
    </GlyphBase>
  )
}

function PpfGlyph({ size = 22 }) {
  return (
    <GlyphBase size={size}>
      <path {...strokeProps} d="M12 5.2C14.3 7.05 16.95 7.82 18.4 8.05V12.15C18.4 15.38 16 17.93 12 19C8 17.93 5.6 15.38 5.6 12.15V8.05C7.05 7.82 9.7 7.05 12 5.2Z" />
      <path {...strokeProps} d="M12 9.25V14.8" />
      <path {...strokeProps} d="M12 9.25C10.55 9.25 9.3 10.05 8.8 11.35C10 10.95 11.2 11.3 12 12.25C12.8 11.3 14 10.95 15.2 11.35C14.7 10.05 13.45 9.25 12 9.25Z" />
    </GlyphBase>
  )
}

function EpfGlyph({ size = 22 }) {
  return (
    <GlyphBase size={size}>
      <rect {...strokeProps} x="6" y="6" width="12" height="12" rx="2.75" />
      <path {...strokeProps} d="M9 10H15" />
      <path {...strokeProps} d="M9 13H15" />
      <path {...strokeProps} d="M9 16H12.5" />
      <path {...strokeProps} d="M8 4.75V6" />
      <path {...strokeProps} d="M12 4.75V6" />
      <path {...strokeProps} d="M16 4.75V6" />
    </GlyphBase>
  )
}

function NpsGlyph({ size = 22 }) {
  return (
    <GlyphBase size={size}>
      <path {...strokeProps} d="M6.5 17.75H17.5" />
      <path {...strokeProps} d="M8 17.75V10.75" />
      <path {...strokeProps} d="M12 17.75V7.75" />
      <path {...strokeProps} d="M16 17.75V12.25" />
      <path {...strokeProps} d="M7 10.75H17" />
      <path {...strokeProps} d="M9.25 7.75H14.75" />
    </GlyphBase>
  )
}

function BondsGlyph({ size = 22 }) {
  return (
    <GlyphBase size={size}>
      <rect {...strokeProps} x="5.5" y="6.25" width="13" height="9.5" rx="2.2" />
      <path {...strokeProps} d="M8.5 9.5H15.5" />
      <path {...strokeProps} d="M8.5 12.5H13" />
      <path {...strokeProps} d="M10.2 15.75L8.9 18.25" />
      <path {...strokeProps} d="M13.8 15.75L15.1 18.25" />
    </GlyphBase>
  )
}

function LicGlyph({ size = 22 }) {
  return (
    <GlyphBase size={size}>
      <path {...strokeProps} d="M6.5 11.25C6.5 8.21 8.96 5.75 12 5.75C15.04 5.75 17.5 8.21 17.5 11.25V12.25H6.5V11.25Z" />
      <path {...strokeProps} d="M12 12.25V18.25" />
      <path {...strokeProps} d="M8.3 18.25H15.7" />
    </GlyphBase>
  )
}

function RealEstateGlyph({ size = 22 }) {
  return (
    <GlyphBase size={size}>
      <path {...strokeProps} d="M5.5 11L12 6L18.5 11" />
      <path {...strokeProps} d="M7 10.6V18H17V10.6" />
      <path {...strokeProps} d="M10.25 18V13.5H13.75V18" />
      <path {...strokeProps} d="M8.75 8.75V6.75H10.5" />
    </GlyphBase>
  )
}

function CryptoGlyph({ size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m11.767 19.089-5.908-1.042" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m11.767 19.089-.347 1.97" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.983 12.195c4.924.869 6.14-6.025 1.215-6.893" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12.983 12.195-3.94-.694" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.198 5.995 8.29 4.953" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14.198 5.302.348-1.97" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.48 20.364 10.606 2.637" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const CATEGORY_VISUALS = {
  stocks: {
    icon: StocksGlyph,
    tone: 'from-sky-500 to-cyan-400',
  },
  mf: {
    icon: MutualFundsGlyph,
    tone: 'from-indigo-500 to-blue-400',
  },
  goldSilver: {
    icon: GoldSilverGlyph,
    tone: 'from-slate-800 via-slate-700 to-stone-700',
  },
  fd: {
    icon: FixedDepositGlyph,
    tone: 'from-cyan-500 to-sky-400',
  },
  rd: {
    icon: RecurringDepositGlyph,
    tone: 'from-teal-500 to-cyan-400',
  },
  ppf: {
    icon: PpfGlyph,
    tone: 'from-emerald-500 to-lime-400',
  },
  epf: {
    icon: EpfGlyph,
    tone: 'from-violet-500 to-fuchsia-400',
  },
  nps: {
    icon: NpsGlyph,
    tone: 'from-blue-500 to-indigo-500',
  },
  bonds: {
    icon: BondsGlyph,
    tone: 'from-orange-500 to-amber-400',
  },
  lic: {
    icon: LicGlyph,
    tone: 'from-blue-600 to-indigo-500',
  },
  realEstate: {
    icon: RealEstateGlyph,
    tone: 'from-emerald-500 to-green-400',
  },
  crypto: {
    icon: CryptoGlyph,
    tone: 'from-amber-500 to-orange-400',
  },
}

export function getCategoryVisual(categoryId) {
  return CATEGORY_VISUALS[categoryId] ?? CATEGORY_VISUALS.crypto
}

export function CategoryIconBadge({ categoryId, size = 20, className = 'h-11 w-11' }) {
  const visual = getCategoryVisual(categoryId)
  const Icon = visual.icon
  const needsInnerPlate = categoryId === 'goldSilver'

  return (
    <div className={`icon-badge bg-gradient-to-br ${className} ${visual.tone}`}>
      {needsInnerPlate ? (
        <div className="flex h-[76%] w-[76%] items-center justify-center rounded-[14px] bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Icon size={size} />
        </div>
      ) : (
        <Icon size={size} />
      )}
    </div>
  )
}
