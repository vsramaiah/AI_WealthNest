import { CalendarDays, Download, Funnel, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CategoryIconBadge } from '../components/CategoryVisuals'
import PageShell from '../components/PageShell'
import { downloadTransactionsCsv } from '../utils/dataPortability'
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

function joinMetaParts(parts) {
  return parts.filter(Boolean).join(' - ')
}

function formatTxnMeta(txn) {
  const raw = txn.rawData ?? {}
  const txnType = normalizeType(raw.txnType ?? txn.type)

  if (txn.category === 'stocks') {
    const lineItems = getStockLineItems(raw)

    if (lineItems.length > 1) {
      const totalQuantity = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      return joinMetaParts([
        `${lineItems.length} stocks`,
        `Qty ${totalQuantity}`,
        `Charges ${formatCurrency(raw.charges ?? 0)}`,
      ])
    }

    const item = lineItems[0] ?? {}
    return joinMetaParts([
      item.ticker,
      `${item.quantity ?? 0} Shares @ ${formatCurrency(item.pricePerShare ?? 0)}`,
      raw.broker,
    ])
  }

  if (txn.category === 'mf') {
    const folioText = raw.folioNumber ? `Folio ${raw.folioNumber}` : raw.fundId ? `ID ${raw.fundId}` : ''
    const unitsText = raw.units ? `${raw.units} Units` : formatCurrency(raw.amount ?? 0)
    return joinMetaParts([folioText, unitsText])
  }

  if (txn.category === 'goldSilver') {
    return joinMetaParts([
      raw.assetType,
      raw.quantity ? `${raw.quantity} grams` : '',
      raw.holdingType,
    ])
  }

  if (txn.category === 'ppf') {
    return joinMetaParts([
      txnType,
      raw.bankName,
      raw.accountNumber ? `A/C ${raw.accountNumber}` : '',
      formatCurrency(raw.amount ?? raw.depositAmount ?? txn.amount ?? 0),
    ])
  }

  if (txn.category === 'fd') {
    return joinMetaParts([
      raw.bankName,
      raw.accountNumber ? `A/C ${raw.accountNumber}` : '',
      formatCurrency(raw.depositAmount ?? txn.amount ?? 0),
    ])
  }

  if (txn.category === 'rd' || txn.category === 'epf') {
    const contributionAmount =
      raw.amount ??
      raw.depositAmount ??
      ((Number(raw.employeeContribution) || 0) + (Number(raw.employerContribution) || 0)) ??
      txn.amount

    return joinMetaParts([
      txnType,
      raw.bankName || raw.employerName,
      raw.accountNumber ? `A/C ${raw.accountNumber}` : '',
      raw.memberId ? `Member ${raw.memberId}` : '',
      formatCurrency(contributionAmount),
    ])
  }

  if (txn.category === 'nps') {
    return joinMetaParts([
      txnType,
      raw.tier,
      raw.scheme,
      raw.pranNumber ? `PRAN ${raw.pranNumber}` : '',
      formatCurrency(raw.amount ?? txn.amount ?? 0),
    ])
  }

  if (txn.category === 'bonds') {
    return joinMetaParts([
      txnType,
      raw.issuerName,
      raw.quantity ? `Qty ${raw.quantity}` : '',
      raw.couponRate ? `${raw.couponRate}% coupon` : '',
    ])
  }

  if (txn.category === 'lic') {
    return joinMetaParts([
      raw.policyNumber ? `Policy ${raw.policyNumber}` : '',
      raw.financialYear,
      raw.paymentFrequency,
      formatCurrency(raw.premiumAmount ?? txn.amount ?? 0),
    ])
  }

  if (txn.category === 'realEstate') {
    return joinMetaParts([
      raw.location,
      raw.ownershipPercent ? `${raw.ownershipPercent}% ownership` : '',
      formatCurrency(raw.purchaseValue ?? txn.amount ?? 0),
    ])
  }

  if (txn.category === 'crypto') {
    return joinMetaParts([
      txnType,
      raw.symbol,
      raw.quantity ? `Qty ${raw.quantity}` : '',
      raw.exchange || raw.walletName || raw.walletExchangeName,
      raw.charges ? `Fee ${formatCurrency(raw.charges)}` : '',
    ])
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

function normalizeType(type) {
  return String(type || '').toUpperCase()
}

function isReductionType(type) {
  const normalized = normalizeType(type)
  return normalized === 'SELL' || normalized === 'REDEEM' || normalized === 'TRANSFER OUT'
}

function summarizeAmounts(items) {
  return items.reduce(
    (summary, txn) => {
      const amount = Number(txn.amount) || 0

      if (isReductionType(txn.type)) {
        summary.reduced += amount
      } else {
        summary.added += amount
      }

      summary.total += amount
      return summary
    },
    { added: 0, reduced: 0, total: 0 },
  )
}

function buildSearchText(txn) {
  const raw = txn.rawData ?? {}
  const stockText = getStockLineItems(raw)
    .map((item) => [item.ticker, item.stockName].filter(Boolean).join(' '))
    .join(' ')

  return [
    txn.id,
    txn.category,
    txn.type,
    txn.title,
    formatTxnTitle(txn),
    formatTxnMeta(txn),
    raw.fundName,
    raw.fundId,
    raw.folioNumber,
    raw.bankName,
    raw.accountNumber,
    raw.policyName,
    raw.policyNumber,
    raw.broker,
    raw.ticker,
    raw.stockName,
    stockText,
    raw.issuerName,
    raw.bondName,
    raw.propertyName,
    raw.coinName,
    raw.symbol,
    raw.exchange,
    raw.employerName,
    raw.memberId,
    raw.uanNumber,
    raw.pranNumber,
    raw.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function matchesRecordFilter(txn, recordFilter) {
  if (!recordFilter?.category || txn.category !== recordFilter.category) {
    return false
  }

  const raw = txn.rawData ?? {}
  const itemId = String(recordFilter.itemId ?? '').trim()
  const normalizedItemId = itemId.toUpperCase()

  switch (recordFilter.category) {
    case 'mf':
    case 'lic':
    case 'crypto':
      return String(raw.masterId ?? '').trim() === itemId
    case 'rd':
    case 'ppf':
      return (
        String(raw.masterId ?? '').trim() === itemId ||
        String(raw.accountNumber ?? '').trim().toUpperCase() === normalizedItemId
      )
    case 'epf':
      return (
        String(raw.masterId ?? '').trim() === itemId ||
        String(raw.uanNumber ?? '').trim().toUpperCase() === normalizedItemId ||
        String(raw.memberId ?? '').trim().toUpperCase() === normalizedItemId
      )
    case 'nps':
      return (
        String(raw.masterId ?? '').trim() === itemId ||
        String(raw.pranNumber ?? '').trim().toUpperCase() === normalizedItemId
      )
    case 'stocks':
      return getStockLineItems(raw).some(
        (item) => String(item.ticker ?? '').trim().toUpperCase() === normalizedItemId,
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
  const normalized = normalizeType(type)

  if (normalized === 'BUY' || normalized === 'SIP' || normalized === 'LUMPSUM' || normalized === 'INVEST' || normalized === 'DEPOSIT' || normalized === 'TRANSFER IN') {
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
      className="block w-full px-3 py-3 text-left hover:bg-white/[0.03]"
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
  const navigate = useNavigate()
  const recordFilter = location.state?.recordFilter ?? null
  const transactions = useMemo(() => listInvestmentTransactions(), [location.key])
  const [activeType, setActiveType] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
    const normalizedSearch = searchQuery.trim().toLowerCase()
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

      if (normalizedSearch && !buildSearchText(txn).includes(normalizedSearch)) {
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
  }, [activeType, appliedFilters, recordFilter, searchQuery, transactions])

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((collection, txn) => {
      const monthLabel = formatMonthLabel(txn.date)
      collection[monthLabel] = [...(collection[monthLabel] ?? []), txn]
      return collection
    }, {})
  }, [filteredTransactions])

  const amountSummary = useMemo(() => summarizeAmounts(filteredTransactions), [filteredTransactions])

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

  const appliedDateRangeLabel = useMemo(() => {
    const from = formatDateRange(appliedFilters.dateFrom)
    const to = formatDateRange(appliedFilters.dateTo)

    if (from && to) {
      return `${from} - ${to}`
    }

    if (from) {
      return `From ${from}`
    }

    if (to) {
      return `Until ${to}`
    }

    return 'All dates'
  }, [appliedFilters.dateFrom, appliedFilters.dateTo])

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
      parts.push(`Dates: ${appliedDateRangeLabel}`)
    }

    if (appliedFilters.sortBy !== 'latest') {
      const sortLabels = {
        oldest: 'Oldest first',
        amountHigh: 'Amount high to low',
        amountLow: 'Amount low to high',
      }
      parts.push(`Sort: ${sortLabels[appliedFilters.sortBy] ?? appliedFilters.sortBy}`)
    }

    return parts.join(' | ')
  }, [
    activeType,
    appliedFilters.category,
    appliedFilters.dateFrom,
    appliedFilters.dateTo,
    appliedFilters.sortBy,
    appliedFilters.transactionType,
    appliedDateRangeLabel,
    recordFilter?.title,
  ])

  const hasActiveFilters = Boolean(
    recordFilter ||
      activeType !== 'all' ||
      appliedFilters.category !== 'all' ||
      appliedFilters.transactionType !== 'all' ||
      appliedFilters.dateFrom ||
      appliedFilters.dateTo ||
      appliedFilters.sortBy !== 'latest' ||
      searchQuery.trim(),
  )

  const resetFilters = () => {
    const nextFilters = {
      dateFrom: '',
      dateTo: '',
      category: 'all',
      transactionType: 'all',
      sortBy: 'latest',
    }

    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setActiveType('all')
    setSearchQuery('')

    if (recordFilter) {
      navigate('/transactions', { replace: true })
    }
  }

  return (
    <PageShell title="Transaction History">
      <div className="space-y-4">
        <article className="glass-card p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-sm text-wn-muted">Total Transactions</p>
              <p className="mt-2 truncate text-2xl font-semibold text-wn-text">
                {filteredTransactions.length}
              </p>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-sm text-wn-muted">Total Amount</p>
              <p className="mt-2 max-w-full overflow-hidden whitespace-nowrap text-[clamp(1.05rem,4.8vw,1.5rem)] font-semibold leading-tight text-wn-text">
                {formatCurrency(amountSummary.total)}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-wn-border pt-3">
            <p className="text-sm text-wn-muted">{dateRangeLabel}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-wn-border px-3 py-2">
                <p className="text-[0.65rem] uppercase tracking-[0.16em] text-wn-muted">Credits</p>
                <p className="mt-1 truncate text-sm font-semibold text-emerald-400">
                  {formatCurrency(amountSummary.added)}
                </p>
              </div>
              <div className="rounded-2xl border border-wn-border px-3 py-2">
                <p className="text-[0.65rem] uppercase tracking-[0.16em] text-wn-muted">Debits</p>
                <p className="mt-1 truncate text-sm font-semibold text-rose-400">
                  {formatCurrency(amountSummary.reduced)}
                </p>
              </div>
            </div>
          </div>

          {combinedFilterLabel ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-wn-muted">
              <span>Active filters: {combinedFilterLabel}</span>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-wn-border-strong px-3 py-1 text-xs font-semibold text-wn-text"
              >
                Clear
              </button>
            </div>
          ) : null}
          <p className="mt-2 text-sm text-wn-muted">
            {getMasterOnlyMessage(appliedFilters.category)}
          </p>
        </article>

        <article className="glass-card p-3">
          <div className="flex items-center gap-3">
            <Search size={17} className="shrink-0 text-wn-muted" strokeWidth={2.1} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search fund, ticker, bank, folio, policy..."
              className="min-w-0 flex-1 bg-transparent text-sm text-wn-text outline-none placeholder:text-wn-muted"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0px] font-semibold leading-none text-wn-muted hover:bg-white/[0.05] hover:text-wn-text"
                aria-label="Clear search"
              >
                <X size={15} strokeWidth={2.4} />
                ×
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setFilterOpen((current) => !current)}
              className={`secondary-button h-9 w-9 shrink-0 rounded-2xl px-0 py-0 ${
                hasActiveFilters
                  ? 'border-wn-accent/60 bg-wn-accent/15 text-wn-accent-strong shadow-[0_0_18px_var(--color-wn-accent-glow)]'
                  : ''
              }`}
              aria-label="Open filters"
            >
              <Funnel size={17} strokeWidth={2.1} />
            </button>
          </div>
        </article>

        <div className="flex items-center justify-between gap-3 px-1 py-1">
          <div className="flex gap-3 overflow-x-auto px-1 pb-2 pt-1">
            {chipOptions.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setActiveType(type.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium ${
                  activeType === type.value
                    ? 'bg-wn-accent-strong text-[#04110a]'
                    : 'text-wn-muted hover:bg-white/[0.04] hover:text-wn-text'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => downloadTransactionsCsv(filteredTransactions, 'wealthnest-filtered-transactions')}
            disabled={filteredTransactions.length === 0}
            className={`secondary-button h-10 w-10 shrink-0 rounded-2xl px-0 py-0 ${
              filteredTransactions.length === 0 ? 'cursor-not-allowed opacity-60' : ''
            }`}
            aria-label="Export current list"
          >
            <Download size={17} strokeWidth={2.1} />
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
              <div className="border-b border-wn-border pb-4">
                <p className="text-sm text-wn-muted">Date Range</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-wn-text">{draftDateRangeLabel}</span>
                  <CalendarDays size={17} className="text-wn-muted" />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={resetFilters}
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
            <section key={monthLabel} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-wn-text">{monthLabel}</p>
                <div className="text-right">
                  <p className="text-sm font-semibold text-wn-text">
                    {formatCurrency(summarizeAmounts(items).total)}
                  </p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-wn-muted">
                    {items.length} {items.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-wn-border bg-wn-card/90">
                {items.map((txn, index) => (
                  <div key={txn.id} className={index !== items.length - 1 ? 'border-b border-wn-border' : ''}>
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

