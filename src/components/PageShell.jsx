import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PageShell({
  eyebrow,
  title,
  description,
  children,
  backTo = '',
  backLabel = 'Back',
}) {
  const navigate = useNavigate()

  return (
    <section className="page-canvas space-y-5">
      <div className="px-1">
        {backTo ? (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="secondary-button inline-flex"
          >
            <ArrowLeft size={16} />
            <span className="ml-2">{backLabel}</span>
          </button>
        ) : null}
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className="mt-2 screen-title">{title}</h2> : null}
        {description ? (
          <p className="mt-2 max-w-sm text-sm leading-6 text-wn-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}
