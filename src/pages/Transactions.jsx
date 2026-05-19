import { CalendarDays, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CategoryIconBadge } from '../components/CategoryVisuals'
import PageShell from '../components/PageShell'
import { hasMasterConfig } from '../utils/masterData'
import { getStockLineItems } from '../utils/stockTransactions'
import { transactionCategoryOptions } from '../utils/transactionSchemas'
import { listInvestmentTransactions } from '../utils/transactionEngine'

// Keep the empty state aligned with categories that depend on saved account records.
const MASTER_ONLY_CATEGORIES = new Set(
  transactionCategoryOptions
    .map((option) => option.value)
    .filter((category) => hasMasterConfig(category)),
)

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
    const lineItems = getStockLineItems(raw)

    if (lineItems.length > 1) {
      const totalQuantity = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      return `${lineItems.length} stocks - Qty ${totalQuantity} - Charges ${formatCurrency(raw.charges ?? 0)}`
    }

    const item = lineItems[0] ?? {}
    return `${item.quantity ?? 0} Shares @ ${formatCurrency(item.pricePerShare ?? 0)}`
  }

  if (txn.category === 'mf') {
    const folioText = raw.folioNumber ? `Folio ${raw.folioNumber}` : raw.fundId ? `ID ${raw.fundId}` : ''
    const unitsText = raw.units ? `${raw.units} Units` : formatCurrency(raw.amount ?? 0)
    return folioText ? `${folioText} - ${unitsText}` : unitsText
  }

  if (txn.category === 'ppf') {
    return raw.txnType === 'INTEREST'
      ? 'Interest Credited'
      : formatCurrency(raw.amount ?? raw.depositAmount ?? 0)
  }

  if (txn.category === 'fd') {
    return formatCurrency(raw.depositAmount ?? txn.amount ?? 0)
  }

  if (txn.category === 'rd' || txn.category === 'epf') {
    return raw.txnType === 'INTEREST'
      ? 'Interest Credited'
      : formatCurrency(
          raw.amount ??
            raw.depositAmount ??
            ((Number(raw.employeeContribution) || 0) + (Number(raw.employerContribution) || 0)) ??
            txn.amount,
        )
  }

  return raw.notes || formatCurrency(txn.amount)
}

function formatTxnTitle(txn) {
  const raw = txn.rawData ?? {}

  if (txn.category === 'mf') {
    return raw.fundName || txn.title
  }

  if (txn.category === 'stocks') {
    const lineItems = getStockLineItems(raw)
    return lineItems.length > 1 ? `${lineItems.length} Stocks Basket` : txn.title
  }

  return txn.title
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

function parseComparableDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getCategoryLabel(category) {
  return transactionCategoryOptions.find((option) => option.value === category)?.label ?? category
}

function getMasterOnlyMessage(category) {
  if (category && category !== 'all' && hasMasterConfig(category)) {
    return `${getCategoryLabel(category)} uses saved account records for due-date tracking and reminders.`
  }

  return 'Saved account records also support due-date tracking and reminders across the app.'
}

function matchesRecordFilter(txn, recordFilter) {
  if (!recordFilter?.category || txn.category !== recordFilter.category) {
    return false
  }

  const raw = txn.rawData ?? {}
  const itemId = String(recordFilter.itemId ?? '').trim()

  switch (recordFilter.category) {
    case 'mf':
    case 'rd':
    case 'lic':
    case 'ppf':
    case 'epf':
    case 'nps':
    case 'crypto':
      return String(raw.masterId ?? '').trim() === itemId
    case 'stocks':
      return getStockLineItems(raw).some(
        (item) => String(item.ticker ?? '').trim().toUpperCase() === itemId.toUpperCase(),
      )
    case 'goldSilver':
      return String(raw.assetType ?? '').trim().toLowerCase() === itemId.toLowerCase()
    case 'bonds':
      return String(raw.masterId ?? '').trim() === itemId || String(txn.id) === itemId
    case 'fd':
    case 'realEstate':
      return String(txn.id) === itemId
    default:
      return String(txn.id) === itemId
  }
}

function toneForType(type) {
  const normalized = String(type).toUpperCase()

  if (normalized === 'BUY' || normalized === 'SIP' || normalized === 'INVEST' || normalized === 'DEPOSIT' || normalized === 'INTEREST' || normalized === 'TRANSFER IN') {
    return 'text-emerald-400'
  }

  if (normalized === 'SELL' || normalized === 'REDEEM' || normalized === 'TRANSFER OUT') {
    return 'text-rose-400'
  }

  return 'text-sky-400'
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

          <CategoryIconBadge
            categoryId={txn.category}
            size={16}
            className="h-8 w-8 shrink-0"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-wn-text">
              {txn.type} - {formatTxnTitle(txn)}
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
  const location = useLocation()
  const recordFilter = location.state?.recordFilter ?? null
  const transactions = useMemo(() => listInvestmentTransactions(), [location.key])
  const [activeType, setActiveType] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: recordFilter?.category ?? 'all',
    transactionType: 'all',
    sortBy: 'latest',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: recordFilter?.category ?? 'all',
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
      const txnDate = parseComparableDate(txn.date)
      const dateFrom = parseComparableDate(appliedFilters.dateFrom)
      const dateTo = parseComparableDate(appliedFilters.dateTo)

      if (recordFilter && !matchesRecordFilter(txn, recordFilter)) {
        return false
      }

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

      if (dateFrom && (!txnDate || txnDate < dateFrom)) {
        return false
      }

      if (dateTo && (!txnDate || txnDate > dateTo)) {
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
  }, [activeType, appliedFilters, recordFilter, transactions])

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

  const combinedFilterLabel = useMemo(() => {
    const parts = []

    if (recordFilter?.title) {
      parts.push(`Entry: ${recordFilter.title}`)
    }

    if (activeType !== 'all') {
      parts.push(`Quick type: ${activeType}`)
    }

    if (appliedFilters.category !== 'all') {
      parts.push(`Category: ${getCategoryLabel(appliedFilters.category)}`)
    }

    if (appliedFilters.transactionType !== 'all') {
      parts.push(`Panel type: ${appliedFilters.transactionType}`)
    }

    if (appliedFilters.dateFrom || appliedFilters.dateTo) {
      parts.push(`Dates: ${draftDateRangeLabel}`)
    }

    return parts.join(' | ')
  }, [
    activeType,
    appliedFilters.category,
    appliedFilters.dateFrom,
    appliedFilters.dateTo,
    appliedFilters.transactionType,
    draftDateRangeLabel,
    recordFilter?.title,
  ])

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
          {combinedFilterLabel ? (
            <p className="mt-2 text-sm text-wn-muted">
              Active filters: {combinedFilterLabel}
            </p>
          ) : null}
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

