function IconBase({ children, size = 22, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: 1.85,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function HomeIcon({ size = 22, className }) {
  return (
    <IconBase size={size} className={className}>
      <path {...strokeProps} d="M4.75 10.75L12 4.75L19.25 10.75V18.25C19.25 18.8 18.8 19.25 18.25 19.25H5.75C5.2 19.25 4.75 18.8 4.75 18.25V10.75Z" />
      <path {...strokeProps} d="M9.25 19.25V13.75C9.25 13.2 9.7 12.75 10.25 12.75H13.75C14.3 12.75 14.75 13.2 14.75 13.75V19.25" />
    </IconBase>
  )
}

export function PortfolioIcon({ size = 22, className }) {
  return (
    <IconBase size={size} className={className}>
      <path {...strokeProps} d="M5.25 16.75L9.25 12.75L12.25 15.25L18.75 8.75" />
      <path {...strokeProps} d="M15.75 8.75H18.75V11.75" />
      <path {...strokeProps} d="M5.75 5.75H18.25C18.8 5.75 19.25 6.2 19.25 6.75V17.25C19.25 17.8 18.8 18.25 18.25 18.25H5.75C5.2 18.25 4.75 17.8 4.75 17.25V6.75C4.75 6.2 5.2 5.75 5.75 5.75Z" />
    </IconBase>
  )
}

export function AddEntryIcon({ size = 24, className }) {
  return (
    <IconBase size={size} className={className}>
      <circle {...strokeProps} cx="12" cy="12" r="7.25" />
      <path {...strokeProps} d="M12 8.75V15.25" />
      <path {...strokeProps} d="M8.75 12H15.25" />
    </IconBase>
  )
}

export function LedgerIcon({ size = 22, className }) {
  return (
    <IconBase size={size} className={className}>
      <path {...strokeProps} d="M7.25 5.75H17.25C18.35 5.75 19.25 6.65 19.25 7.75V16.25C19.25 17.35 18.35 18.25 17.25 18.25H7.25C6.15 18.25 5.25 17.35 5.25 16.25V7.75C5.25 6.65 6.15 5.75 7.25 5.75Z" />
      <path {...strokeProps} d="M8.75 9H15.75" />
      <path {...strokeProps} d="M8.75 12H15.75" />
      <path {...strokeProps} d="M8.75 15H13.25" />
    </IconBase>
  )
}

export function ControlsIcon({ size = 22, className }) {
  return (
    <IconBase size={size} className={className}>
      <path {...strokeProps} d="M6 7.25H18" />
      <path {...strokeProps} d="M6 12H18" />
      <path {...strokeProps} d="M6 16.75H18" />
      <circle {...strokeProps} cx="9" cy="7.25" r="1.75" />
      <circle {...strokeProps} cx="15" cy="12" r="1.75" />
      <circle {...strokeProps} cx="11" cy="16.75" r="1.75" />
    </IconBase>
  )
}
