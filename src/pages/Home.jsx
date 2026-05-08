import { ArrowUpRight, Eye, EyeOff, Layers3, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import CalendarView from '../components/CalendarView'
import PageShell from '../components/PageShell'
import { loadAppSettings } from '../utils/appSettings'
import { getPortfolioOverview } from '../utils/portfolioSummary'
import { getReminders, generateSipSchedule } from '../utils/reminders'
import { useMemo, useState } from 'react'

const GROUP_GRADIENTS = [
  'from-emerald-300/30 to-emerald-500/10',
  'from-sky-300/30 to-blue-500/10',
  'from-amber-300/35 to-yellow-500/10',
  'from-fuchsia-300/30 to-violet-500/10',
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`
}

function buildAllocationGradient(groups) {
  if (!groups.length) {
    return 'conic-gradient(#1f2937 0deg 360deg)'
  }

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#fb7185', '#14b8a6']
  let cursor = 0

  const segments = groups.map((group, index) => {
    const start = cursor
    const end = cursor + (Math.max(group.allocationPercent, 0) / 100) * 360
    cursor = end
    return `${colors[index % colors.length]} ${start}deg ${end}deg`
  })

  return `conic-gradient(${segments.join(', ')})`
}

export default function Home() {
  const overview = useMemo(() => getPortfolioOverview(), [])
  const settings = loadAppSettings()
  const [showNetWorth, setShowNetWorth] = useState(true)
  const reminders = settings.remindersEnabled ? getReminders().slice(0, 3) : []
  const sipSchedule = generateSipSchedule().slice(0, 3)
  const donutBackground = buildAllocationGradient(overview.groupedAllocation)

  return (
    <PageShell
      eyebrow="Overview"
      title="Your wealth snapshot"
      description="A cleaner look at net worth, allocation, reminders, and upcoming investment activity."
    >
      <div className="space-y-4">
        <article className="glass-card overflow-hidden p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Total Net Worth</p>
              <p className="mt-3 text-[2.25rem] font-semibold tracking-tight text-wn-text">
                {showNetWorth ? formatCurrency(overview.totalNetWorth) : '₹x,xxx'}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-400">
                <TrendingUp size={16} strokeWidth={2.2} />
                Portfolio summary is ready locally
              </p>
            </div>
            <button
              type="button"
              aria-label={showNetWorth ? 'Hide total net worth' : 'Show total net worth'}
              onClick={() => setShowNetWorth((current) => !current)}
              className="secondary-button h-11 w-11 rounded-2xl px-0 py-0"
            >
              {showNetWorth ? <Eye size={18} strokeWidth={2.2} /> : <EyeOff size={18} strokeWidth={2.2} />}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-white/6 bg-white/[0.04] p-4">
              <p className="metric-label">Categories</p>
              <p className="mt-2 text-xl font-semibold text-wn-text">
                {overview.groupedAllocation.reduce((total, group) => total + group.categories.length, 0)}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/6 bg-white/[0.04] p-4">
              <p className="metric-label">Active Reminders</p>
              <p className="mt-2 text-xl font-semibold text-wn-text">{reminders.length}</p>
            </div>
          </div>
        </article>
        <article className="glass-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-title">Asset Allocation</p>
              <p className="mt-1 text-sm text-wn-muted">
                Grouped by investment buckets across the app.
              </p>
            </div>
            <Link to="/portfolio" className="pill-chip">
              View all
            </Link>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-[138px_minmax(0,1fr)]">
            <div className="mx-auto flex h-[138px] w-[138px] items-center justify-center rounded-full p-4" style={{ background: donutBackground }}>
              <div className="flex h-full w-full items-center justify-center rounded-full bg-wn-bg text-center shadow-inner">
                <div>
                  <p className="text-lg font-semibold text-wn-text">
                    {formatCurrency(overview.totalNetWorth)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {overview.groupedAllocation.map((group, index) => (
                <div key={group.group} className="flex items-center justify-between gap-3 rounded-[20px] border border-white/6 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full bg-gradient-to-r ${GROUP_GRADIENTS[index % GROUP_GRADIENTS.length]}`} />
                    <div>
                      <p className="text-sm font-medium text-wn-text">{group.group}</p>
                      <p className="text-xs text-wn-muted">{formatCurrency(group.value)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-wn-text">
                    {formatPercent(group.allocationPercent)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4 px-1">
            <p className="section-title">Category Cards</p>
            <span className="text-sm text-wn-muted">Market, fixed income, insurance</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {overview.groupedAllocation.map((group, index) => (
              <Link
                key={group.group}
                to="/portfolio"
                state={{ initialGroup: group.group }}
                className={`block rounded-[26px] border border-white/6 bg-gradient-to-br ${GROUP_GRADIENTS[index % GROUP_GRADIENTS.length]} p-4 text-left shadow-[0_16px_40px_rgba(0,0,0,0.2)]`}
              >
                <div className="rounded-[22px] bg-black/15 p-4 backdrop-blur">
                  <p className="text-sm font-medium text-wn-text">{group.group}</p>
                  <p className="mt-3 text-2xl font-semibold text-wn-text">
                    {formatCurrency(group.value)}
                  </p>
                  <p className="mt-2 text-sm text-wn-muted">
                    {group.categories.length} categories
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <article className="glass-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-title">Upcoming SIPs</p>
              <p className="mt-1 text-sm text-wn-muted">
                Auto-generated from your mutual fund masters.
              </p>
            </div>
            <div className="icon-badge h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400">
              <ArrowUpRight size={18} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {sipSchedule.length > 0 ? (
              sipSchedule.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-wn-text">{item.title}</p>
                      <p className="mt-1 text-sm text-wn-muted">{item.subtitle}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-wn-muted">
                    Due {item.dueDate}
                  </p>
                </div>
              ))
            ) : (
              <p className="section-copy">
                No active SIP masters yet. Add mutual fund masters to generate schedules.
              </p>
            )}
          </div>
        </article>

        <article className="glass-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-title">Reminder Banners</p>
              <p className="mt-1 text-sm text-wn-muted">
                Due dates and missed items generated from your saved records.
              </p>
            </div>
            <div className="icon-badge h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-400">
              <Layers3 size={18} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {reminders.length > 0 ? (
              reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-wn-text">{reminder.title}</p>
                  <p className="mt-2 text-sm text-wn-muted">{reminder.message}</p>
                </div>
              ))
            ) : (
              <p className="section-copy">
                No reminders are active right now. Enable reminders and add SIPs or maturity items.
              </p>
            )}
          </div>
        </article>

        <CalendarView />
      </div>
    </PageShell>
  )
}
