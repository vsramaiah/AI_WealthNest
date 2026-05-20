import { Eye, EyeOff, Layers3, PencilLine, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import CalendarView from '../components/CalendarView'
import PageShell from '../components/PageShell'
import {
  loadAppSettings,
  saveAppSettings,
  subscribeToAppSettings,
} from '../utils/appSettings'
import { getPortfolioOverview } from '../utils/portfolioSummary'
import { getReminders } from '../utils/reminders'

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

function getCategoryValueClass(amount) {
  const value = formatCurrency(amount)

  if (value.length >= 14) {
    return 'text-[1.2rem]'
  }

  if (value.length >= 12) {
    return 'text-[1.35rem]'
  }

  if (value.length >= 10) {
    return 'text-[1.55rem]'
  }

  return 'text-2xl'
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

function getUpcomingDueSummary(reminders) {
  if (!reminders.length) {
    return 'No upcoming due dates'
  }

  return reminders[0].dueDate
}

export default function Home() {
  const overview = useMemo(() => getPortfolioOverview(), [])
  const [settings, setSettings] = useState(() => loadAppSettings())
  const [showNetWorth, setShowNetWorth] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(() => loadAppSettings().investorName ?? 'Investor')
  const reminders = useMemo(
    () => (settings.remindersEnabled ? getReminders().slice(0, 3) : []),
    [settings.remindersEnabled],
  )
  const donutBackground = buildAllocationGradient(overview.groupedAllocation)

  useEffect(() => subscribeToAppSettings(setSettings), [])
  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(settings.investorName ?? 'Investor')
    }
  }, [isEditingName, settings.investorName])

  function saveInvestorName(nextName) {
    const normalizedName = nextName.trim().replace(/\s+/g, ' ').slice(0, 24) || 'Investor'
    saveAppSettings({
      investorName: normalizedName,
    })
    setIsEditingName(false)
  }

  return (
    <PageShell>
      <div className="space-y-4">
        <section className="rounded-[30px] border border-wn-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-wn-card)_94%,white_6%),color-mix(in_srgb,var(--color-wn-bg-soft)_92%,var(--color-wn-card)_8%))] p-5 shadow-[0_24px_50px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {isEditingName ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveInvestorName(nameDraft)
                  }}
                >
                  <input
                    type="text"
                    value={nameDraft}
                    maxLength={24}
                    autoFocus
                    onChange={(event) => setNameDraft(event.target.value)}
                    className="form-input max-w-[13rem] text-[1.1rem] font-semibold tracking-tight"
                    aria-label="Dashboard name"
                  />
                  <button type="submit" className="secondary-button px-3 py-2">
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[2rem] font-semibold tracking-tight text-wn-text">
                    Hi, {settings.investorName || 'Investor'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    aria-label="Edit dashboard name"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-wn-border bg-white/[0.04] text-wn-text hover:bg-white/[0.06]"
                  >
                    <PencilLine size={15} strokeWidth={2.1} />
                  </button>
                </div>
              )}
              <p className="mt-2 max-w-xs text-sm leading-6 text-wn-muted">
                Welcome back! Here's your wealth overview.
              </p>
            </div>

            <button
              type="button"
              aria-label={showNetWorth ? 'Hide portfolio value' : 'Show portfolio value'}
              onClick={() => setShowNetWorth((current) => !current)}
              className="secondary-button h-11 w-11 rounded-2xl px-0 py-0"
            >
              {showNetWorth ? <Eye size={18} strokeWidth={2.2} /> : <EyeOff size={18} strokeWidth={2.2} />}
            </button>
          </div>

          <article className="mt-5 overflow-hidden rounded-[28px] border border-wn-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-wn-card-strong)_92%,white_8%),color-mix(in_srgb,var(--color-wn-card)_96%,var(--color-wn-bg)_4%))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="metric-label">Portfolio Value</p>
                <p className="mt-3 text-[2.35rem] font-semibold tracking-tight text-wn-text">
                  {showNetWorth ? formatCurrency(overview.totalNetWorth) : '\u20B9x,xxx'}
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-wn-success">
                  <TrendingUp size={16} strokeWidth={2.2} />
                  {overview.groupedAllocation.length} asset groups tracked
                </p>
              </div>

              <div className="flex shrink-0 items-end justify-end">
                <svg viewBox="0 0 96 72" className="h-20 w-20 text-wn-success" aria-hidden="true" fill="none">
                  <path d="M8 58L24 46L38 60L56 28L72 34L88 12" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="88" cy="12" r="5" fill="currentColor" />
                </svg>
              </div>
            </div>
          </article>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-wn-border bg-white/[0.04] p-4">
              <p className="metric-label">Categories</p>
              <p className="mt-2 text-xl font-semibold text-wn-text">
                {overview.groupedAllocation.reduce((total, group) => total + group.categories.length, 0)}
              </p>
            </div>
            <div className="rounded-[24px] border border-wn-border bg-white/[0.04] p-4">
              <p className="metric-label">Next Due Date</p>
              <p className="mt-2 text-base font-semibold text-wn-text">
                {getUpcomingDueSummary(reminders)}
              </p>
              <p className="mt-1 text-xs text-wn-muted">{reminders.length} active reminders</p>
            </div>
          </div>
        </section>

        <article className="glass-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-title">Asset Allocation</p>
              <p className="mt-1 text-sm text-wn-muted">
                Allocation grouped by major investment class.
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
                <div key={group.group} className="flex items-center justify-between gap-3 rounded-[20px] border border-wn-border bg-white/[0.03] px-4 py-3">
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
            <div>
              <p className="section-title">Category Cards</p>
              <p className="mt-1 text-sm text-wn-muted">Grouped by investment class</p>
            </div>
            <span className="rounded-full border border-wn-border bg-white/[0.04] px-3 py-1 text-xs font-medium text-wn-muted">
              {overview.groupedAllocation.length} groups
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {overview.groupedAllocation.map((group, index) => (
              <Link
                key={group.group}
                to="/portfolio"
                state={{ initialGroup: group.group }}
                className={`block rounded-[26px] border border-wn-border bg-gradient-to-br ${GROUP_GRADIENTS[index % GROUP_GRADIENTS.length]} p-4 text-left shadow-[0_16px_40px_rgba(0,0,0,0.12)]`}
              >
                <div className="min-w-0 rounded-[22px] bg-white/[0.16] p-4 backdrop-blur">
                  <p className="text-sm font-medium text-wn-text">{group.group}</p>
                  <p className={`mt-3 max-w-full overflow-hidden whitespace-nowrap font-semibold leading-tight tracking-tight text-wn-text ${getCategoryValueClass(group.value)}`}>
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
              <p className="section-title">Upcoming Due Dates</p>
              <p className="mt-1 text-sm text-wn-muted">
                Upcoming due dates generated from your saved records.
              </p>
            </div>
            <div className="text-right">
              <p className="metric-label">Preview</p>
              <p className="mt-1 text-sm font-semibold text-wn-text">{reminders.length} items</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {reminders.length > 0 ? (
              reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-wn-text">{reminder.title}</p>
                      <p className="mt-1 text-sm text-wn-muted">{reminder.message}</p>
                    </div>
                    {Number(reminder.amount) > 0 ? (
                      <span className="shrink-0 text-sm font-semibold text-wn-success">
                        {formatCurrency(reminder.amount)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="pill-chip">{reminder.type}</span>
                    <span className="pill-chip">{reminder.dueDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="section-copy">
                No reminders are active. Enable reminders and add scheduled investment records to populate this section.
              </p>
            )}
          </div>

          {reminders.length > 0 ? (
            <div className="mt-4">
              <Link to="/upcoming-reminders" className="secondary-button w-full">
                View All
              </Link>
            </div>
          ) : null}
        </article>

        <CalendarView />
      </div>
    </PageShell>
  )
}
