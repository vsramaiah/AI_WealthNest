import { NavLink } from 'react-router-dom'
import { navigationItems } from '../utils/navigation'

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-white/5 bg-wn-bg/92 px-3 pb-5 pt-3 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
        {navigationItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            aria-label={label}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-1 rounded-[22px] px-2 py-2 text-[11px] font-medium',
                path === '/add'
                  ? isActive
                    ? 'bg-wn-accent-strong text-[#04110a] shadow-[0_16px_36px_rgba(34,197,94,0.32)]'
                    : 'border border-emerald-400/20 bg-emerald-500/12 text-emerald-200 shadow-[0_12px_28px_rgba(34,197,94,0.14)] hover:bg-emerald-500/18 hover:text-emerald-100'
                  : isActive
                    ? 'bg-white/[0.06] text-emerald-300'
                    : 'text-wn-muted hover:bg-white/[0.04] hover:text-wn-text',
              ].join(' ')
            }
          >
            <Icon size={path === '/add' ? 21 : 19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
