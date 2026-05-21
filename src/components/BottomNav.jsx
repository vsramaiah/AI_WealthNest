import { NavLink, useLocation } from 'react-router-dom'
import { navigationItems } from '../utils/navigation'

function getNavItemClass(path, isActive, isAddPage) {
  const baseClassName =
    'flex flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-semibold'

  if (path === '/add') {
    if (isActive && isAddPage) {
      return [
        baseClassName,
        'border border-wn-accent/35 bg-wn-accent text-[#04110a] shadow-[0_14px_28px_var(--color-wn-accent-glow)]',
      ].join(' ')
    }

    if (isActive) {
      return [
        baseClassName,
        'bg-wn-accent text-[#04110a] shadow-[0_14px_28px_var(--color-wn-accent-glow)]',
      ].join(' ')
    }

    return [
      baseClassName,
      'border border-wn-border bg-wn-card-strong text-wn-text shadow-[0_10px_22px_rgba(0,0,0,0.16)] hover:border-wn-accent/35 hover:text-wn-accent',
    ].join(' ')
  }

  return [
    baseClassName,
    isActive
      ? 'text-wn-accent'
      : 'text-wn-muted hover:text-wn-text',
  ].join(' ')
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const isAddPage = pathname === '/add'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-wn-border bg-wn-bg/94 px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
        {navigationItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            aria-label={label}
            className={({ isActive }) => getNavItemClass(path, isActive, isAddPage)}
          >
            <Icon size={20} strokeWidth={2.2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
