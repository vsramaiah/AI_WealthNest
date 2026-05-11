import { Bell, PencilLine, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadAppSettings, saveAppSettings, subscribeToAppSettings } from '../utils/appSettings'
import BrandMark from './BrandMark'

function getHeaderMeta(pathname, investorName = 'Investor') {
  if (pathname.startsWith('/portfolio/')) {
    return {
      title: 'Asset Details',
      subtitle: 'Category-level balances, contributions, and records',
    }
  }

  const pageMeta = {
    '/home': {
      title: `Hi, ${investorName || 'Investor'}`,
      subtitle: 'Monitor balances, allocation, and upcoming activity',
    },
    '/portfolio': {
      title: 'Portfolio',
      subtitle: 'A consolidated view across all investment categories',
    },
    '/add': {
      title: 'Add Transaction',
      subtitle: 'Create account records and capture investment entries',
    },
    '/transactions': {
      title: 'Transactions',
      subtitle: 'Review transaction history and refine results with filters',
    },
    '/settings': {
      title: 'Settings',
      subtitle: 'Security, backup, and application preferences',
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
  const [settings, setSettings] = useState(() => loadAppSettings())
  const meta = useMemo(
    () => getHeaderMeta(pathname, settings.investorName),
    [pathname, settings.investorName],
  )
  const showExpandedBrand = pathname === '/home'

  useEffect(() => subscribeToAppSettings(setSettings), [])

  function handleInvestorNameEdit() {
    const currentName = settings.investorName ?? 'Investor'
    const nextName = window.prompt('Enter the display name for the dashboard greeting.', currentName)

    if (nextName === null) {
      return
    }

    const normalizedName = nextName.trim().replace(/\s+/g, ' ').slice(0, 24) || 'Investor'
    saveAppSettings({
      investorName: normalizedName,
    })
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-wn-bg/88 px-4 pb-4 pt-6 backdrop-blur-xl">
      <div className="space-y-4">
        {showExpandedBrand ? (
          <BrandMark minimal />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <BrandMark compact subtitle="" />
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[1.9rem] font-semibold tracking-tight text-wn-text">
                {meta.title}
              </h1>
              {showExpandedBrand ? (
                <button
                  type="button"
                  onClick={handleInvestorNameEdit}
                  aria-label="Edit dashboard name"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-wn-text hover:bg-white/[0.06]"
                >
                  <PencilLine size={15} strokeWidth={2.1} />
                </button>
              ) : null}
            </div>
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
