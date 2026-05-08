import { Bell, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BrandMark from './BrandMark'

function getHeaderMeta(pathname) {
  if (pathname.startsWith('/portfolio/')) {
    return {
      title: 'Asset Details',
      subtitle: 'Value, invested, and category records',
    }
  }

  const pageMeta = {
    '/home': {
      title: 'Hi, Investor',
      subtitle: 'Track, analyse, and grow',
    },
    '/portfolio': {
      title: 'Portfolio',
      subtitle: 'Your assets across every category',
    },
    '/add': {
      title: 'Add Transaction',
      subtitle: 'Capture a new entry in two quick steps',
    },
    '/transactions': {
      title: 'Transactions',
      subtitle: 'Review activity and apply filters',
    },
    '/settings': {
      title: 'Settings',
      subtitle: 'Privacy, backup, and preferences',
    },
  }

  return pageMeta[pathname] ?? pageMeta['/home']
}

function ActionButton({ children, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-wn-text"
    >
      {children}
    </button>
  )
}

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const meta = useMemo(() => getHeaderMeta(pathname), [pathname])
  const showExpandedBrand = pathname === '/home'

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-wn-bg/88 px-4 pb-4 pt-6 backdrop-blur-xl">
      <div className="space-y-4">
        {showExpandedBrand ? (
          <BrandMark subtitle="Private investing, beautifully organized." />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <BrandMark compact subtitle="" />
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[1.9rem] font-semibold tracking-tight text-wn-text">
              {meta.title}
            </h1>
            <p className="mt-1 text-sm text-wn-muted">{meta.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {pathname !== '/settings' ? (
              <ActionButton
                label="Open transactions"
                onClick={() => navigate('/transactions')}
              >
                <Search size={18} strokeWidth={2.1} />
              </ActionButton>
            ) : null}
            <ActionButton
              label={pathname === '/transactions' ? 'Open add transaction' : 'Open settings'}
              onClick={() => navigate(pathname === '/transactions' ? '/add' : '/settings')}
            >
              {pathname === '/transactions' ? (
                <SlidersHorizontal size={18} strokeWidth={2.1} />
              ) : (
                <Bell size={18} strokeWidth={2.1} />
              )}
            </ActionButton>
          </div>
        </div>
      </div>
    </header>
  )
}
