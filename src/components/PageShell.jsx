export default function PageShell({ eyebrow, title, description, children }) {
  return (
    <section className="page-canvas space-y-5">
      <div className="px-1">
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
