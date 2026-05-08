import { CalendarDays, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { transactionCategoryOptions } from '../utils/transactionSchemas'
import { listInvestmentTransactions } from '../utils/transactionEngine'

const MASTER_ONLY_CATEGORIES = new Set(['fd', 'rd', 'lic'])

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatTxnMeta(txn) {
  const raw = txn.rawData ?? {}

  if (txn.category === 'stocks') {
    return `${raw.quantity ?? 0} Shares @ ${formatCurrency(raw.pricePerShare ?? 0)}`
  }

  if (txn.category === 'mf') {
    return raw.units ? `${raw.units} Units` : formatCurrency(raw.amount ?? 0)
  }

  if (txn.category === 'fd' || txn.category === 'rd' || txn.category === 'ppf' || txn.category === 'epf') {
    return 'Interest Credited'
  }

  return raw.notes || formatCurrency(txn.amount)
}

function formatDay(value) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleDateString('en-IN', { day: '2-digit' })
}

function formatShortMonth(value) {
  if (!value) {
    return '---'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '---'
  }

  return date.toLocaleDateString('en-IN', { month: 'short' })
}

function formatMonthLabel(value) {
  if (!value) {
    return 'Unknown'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

function formatDateRange(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getCategoryLabel(category) {
  return transactionCategoryOptions.find((option) => option.value === category)?.label ?? category
}

function getMasterOnlyMessage(category) {
  if (category && category !== 'all' && MASTER_ONLY_CATEGORIES.has(category)) {
    return `${getCategoryLabel(category)} records are saved as master entries, so they do not appear in Transactions. Use Portfolio, reminders, and calendar views to review them.`
  }

  return 'FD, RD, and LIC are saved as master records, so they do not appear in Transactions. Use Portfolio, reminders, and calendar views to review them.'
}

function toneForType(type) {
  const normalized = String(type).toUpperCase()

  if (normalized === 'BUY' || normalized === 'SIP' || normalized === 'INVEST' || normalized === 'INTEREST') {
    return 'text-emerald-400'
  }

  if (normalized === 'SELL' || normalized === 'REDEEM') {
    return 'text-rose-400'
  }

  return 'text-sky-400'
}

function badgeTone(type) {
  const normalized = String(type).toUpperCase()

  if (normalized === 'BUY') {
    return 'bg-sky-500'
  }

  if (normalized === 'SELL' || normalized === 'REDEEM') {
    return 'bg-rose-500'
  }

  if (normalized === 'SIP') {
    return 'bg-violet-500'
  }

  if (normalized === 'INTEREST') {
    return 'bg-blue-500'
  }

  return 'bg-emerald-500'
}

function TransactionRow({ txn }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/transactions/${txn.id}`)}
      className="block w-full rounded-[22px] bg-wn-card px-3 py-3 text-left"
    >
        <div className="flex items-center gap-3">
          <div className="w-10 shrink-0 text-center">
            <p className="text-base font-semibold leading-none text-wn-text">{formatDay(txn.date)}</p>
            <p className="mt-1 text-xs text-wn-muted">{formatShortMonth(txn.date)}</p>
          </div>

          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${badgeTone(txn.type)}`}>
            {String(txn.type).slice(0, 3).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-wn-text">
              {txn.type} - {txn.title}
            </p>
            <p className="mt-1 truncate text-xs text-wn-muted">{formatTxnMeta(txn)}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className={`text-sm font-semibold ${toneForType(txn.type)}`}>
              {formatCurrency(txn.amount)}
            </p>
          </div>
        </div>
    </button>
  )
}

export default function Transactions() {
  const [transactions] = useState(() => listInvestmentTransactions())
  const [activeType, setActiveType] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: 'all',
    transactionType: 'all',
    sortBy: 'latest',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: 'all',
    transactionType: 'all',
    sortBy: 'latest',
  })

  const chipOptions = useMemo(
    () => [
      { label: 'All', value: 'all' },
      { label: 'Buy', value: 'BUY' },
      { label: 'Sell', value: 'SELL' },
      { label: 'Sip', value: 'SIP' },
      { label: 'Lumpsum', value: 'LUMPSUM' },
      { label: 'Dividends', value: 'DIVIDEND' },
      { label: 'Interest', value: 'INTEREST' },
    ],
    [],
  )

  const filteredTransactions = useMemo(() => {
    const nextTransactions = transactions.filter((txn) => {
      const type = String(txn.type).toUpperCase()
      const txnDate = String(txn.date ?? '')

      if (activeType !== 'all' && type !== activeType) {
        return false
      }

      if (
        appliedFilters.transactionType !== 'all' &&
        type !== String(appliedFilters.transactionType).toUpperCase()
      ) {
        return false
      }

      if (
        appliedFilters.category !== 'all' &&
        txn.category !== appliedFilters.category
      ) {
        return false
      }

      if (appliedFilters.dateFrom && txnDate < appliedFilters.dateFrom) {
        return false
      }

      if (appliedFilters.dateTo && txnDate > appliedFilters.dateTo) {
        return false
      }

      return true
    })

    const sortedTransactions = [...nextTransactions]

    switch (appliedFilters.sortBy) {
      case 'oldest':
        sortedTransactions.sort((left, right) => String(left.date).localeCompare(String(right.date)))
        break
      case 'amountHigh':
        sortedTransactions.sort((left, right) => Number(right.amount) - Number(left.amount))
        break
      case 'amountLow':
        sortedTransactions.sort((left, right) => Number(left.amount) - Number(right.amount))
        break
      default:
        sortedTransactions.sort((left, right) => String(right.date).localeCompare(String(left.date)))
        break
    }

    return sortedTransactions
  }, [activeType, appliedFilters, transactions])

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((collection, txn) => {
      const monthLabel = formatMonthLabel(txn.date)
      collection[monthLabel] = [...(collection[monthLabel] ?? []), txn]
      return collection
    }, {})
  }, [filteredTransactions])

  const totalAmount = useMemo(
    () => filteredTransactions.reduce((sum, txn) => sum + (Number(txn.amount) || 0), 0),
    [filteredTransactions],
  )

  const dateRangeLabel = useMemo(() => {
    const datedTransactions = filteredTransactions.filter((txn) => formatDateRange(txn.date))

    if (datedTransactions.length === 0) {
      return 'No dated transactions'
    }

    const ordered = [...datedTransactions].sort((left, right) =>
      String(left.date).localeCompare(String(right.date)),
    )

    const start = formatDateRange(ordered[0]?.date)
    const end = formatDateRange(ordered[ordered.length - 1]?.date)

    if (!start || !end) {
      return 'No dated transactions'
    }

    return `From ${start} to ${end}`
  }, [filteredTransactions])

  const draftDateRangeLabel = useMemo(() => {
    const from = formatDateRange(draftFilters.dateFrom)
    const to = formatDateRange(draftFilters.dateTo)

    if (from && to) {
      return `${from} - ${to}`
    }

    return 'All dates'
  }, [draftFilters.dateFrom, draftFilters.dateTo])

  return (
    <PageShell>
      <div className="space-y-4">
        <article className="glass-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-wn-muted">Total Transactions</p>
              <p className="mt-2 text-2xl font-semibold text-wn-text">
                {filteredTransactions.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-wn-muted">Total Amount</p>
              <p className="mt-2 text-2xl font-semibold text-wn-text">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-wn-muted">{dateRangeLabel}</p>
          <p className="mt-2 text-sm text-wn-muted">
            {getMasterOnlyMessage(appliedFilters.category)}
          </p>
        </article>

        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {chipOptions.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setActiveType(type.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium ${
                  activeType === type.value
                    ? 'bg-wn-accent-strong text-[#04110a]'
                    : 'border border-white/8 bg-white/[0.04] text-wn-text'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen((current) => !current)}
            className="secondary-button h-10 w-10 shrink-0 rounded-2xl px-0 py-0"
            aria-label="Open filters"
          >
            <SlidersHorizontal size={18} strokeWidth={2.1} />
          </button>
        </div>

        {filterOpen ? (
          <article className="glass-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="section-title">Filter & Sort</p>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="text-sm text-wn-muted"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
                <p className="text-sm text-wn-muted">Date Range</p>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <span className="text-sm text-wn-text">{draftDateRangeLabel}</span>
                  <CalendarDays size={17} className="text-wn-muted" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={draftFilters.dateFrom}
                    onChange={(event) =>
                      setDraftFilters((current) => ({ ...current, dateFrom: event.target.value }))
                    }
                    className="form-input"
                  />
                  <input
                    type="date"
                    value={draftFilters.dateTo}
                    onChange={(event) =>
                      setDraftFilters((current) => ({ ...current, dateTo: event.target.value }))
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-wn-text">Category</span>
                <select
                  value={draftFilters.category}
                  onChange={(event) =>
                    setDraftFilters((current) => ({ ...current, category: event.target.value }))
                  }
                  className="form-input"
                >
                  <option value="all">All Categories</option>
                  {transactionCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-wn-text">Transaction Type</span>
                <select
                  value={draftFilters.transactionType}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      transactionType: event.target.value,
                    }))
                  }
                  className="form-input"
                >
                  <option value="all">All Types</option>
                  {chipOptions
                    .filter((option) => option.value !== 'all')
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-wn-text">Sort By</span>
                <select
                  value={draftFilters.sortBy}
                  onChange={(event) =>
                    setDraftFilters((current) => ({ ...current, sortBy: event.target.value }))
                  }
                  className="form-input"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amountHigh">Amount High to Low</option>
                  <option value="amountLow">Amount Low to High</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const resetFilters = {
                      dateFrom: '',
                      dateTo: '',
                      category: 'all',
                      transactionType: 'all',
                      sortBy: 'latest',
                    }
                    setDraftFilters(resetFilters)
                    setAppliedFilters(resetFilters)
                    setActiveType('all')
                  }}
                  className="secondary-button"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedFilters(draftFilters)
                    setFilterOpen(false)
                  }}
                  className="primary-button"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </article>
        ) : null}

        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([monthLabel, items]) => (
            <section key={monthLabel} className="glass-card p-4">
              <p className="text-lg font-semibold text-wn-text">{monthLabel}</p>

              <div className="mt-4 overflow-hidden rounded-[24px] border border-white/6 bg-white/[0.03]">
                {items.map((txn, index) => (
                  <div key={txn.id} className={index !== items.length - 1 ? 'border-b border-white/6' : ''}>
                    <TransactionRow txn={txn} />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {filteredTransactions.length === 0 ? (
            <article className="glass-card p-5">
              <p className="section-title">No matching transactions</p>
              <p className="mt-2 text-sm text-wn-muted">
                Add more transactions or switch the filter chips to see entries here.
              </p>
              {(appliedFilters.category === 'all' || MASTER_ONLY_CATEGORIES.has(appliedFilters.category)) ? (
                <p className="mt-2 text-sm text-wn-muted">
                  {getMasterOnlyMessage(appliedFilters.category)}
                </p>
              ) : null}
            </article>
          ) : null}
        </div>
      </div>
    </PageShell>
  )
}
