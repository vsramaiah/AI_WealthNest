import { ArrowLeft, Pencil, Share2, Trash2, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import {
  getInvestmentTransactionById,
  removeInvestmentTransaction,
} from '../utils/transactionEngine'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function buildDetailRows(txn) {
  const raw = txn.rawData ?? {}
  const calculated = txn.calculated ?? {}

  switch (txn.category) {
    case 'stocks':
      return [
        ['Trade Date', formatDate(raw.tradeDate)],
        ['Exchange', raw.exchange || 'Not available'],
        ['Broker', raw.broker || 'Not available'],
        ['Order Type', raw.orderType || 'Not available'],
        ['Stock Ticker', raw.ticker || 'Not available'],
        ['Stock Name', raw.stockName || 'Not available'],
        ['Quantity', raw.quantity ?? 'Not available'],
        ['Price Per Share', formatCurrency(raw.pricePerShare ?? 0)],
        ['Gross Value', formatCurrency(calculated.grossValue ?? 0)],
        ['Charges', formatCurrency(raw.charges ?? 0)],
        ['Total Amount', formatCurrency(calculated.totalAmount ?? txn.amount ?? 0), true],
      ]
    case 'mf':
      return [
        ['Transaction Date', formatDate(raw.date)],
        ['Fund ID', raw.fundId || 'Not available'],
        ['Transaction Type', raw.txnType || 'Not available'],
        ['Amount', formatCurrency(raw.amount ?? 0)],
        ['NAV', raw.nav ? formatCurrency(raw.nav) : formatCurrency(calculated.nav ?? 0)],
        ['Units', raw.units ?? calculated.units ?? 'Not available'],
      ]
    default:
      return [
        ['Date', formatDate(txn.date)],
        ['Category', txn.category],
        ['Type', txn.type],
        ['Amount', formatCurrency(txn.amount ?? 0), true],
      ]
  }
}

function buildShareText(txn) {
  const rows = buildDetailRows(txn)
  return [
    `${txn.title}`,
    `${txn.type} • ${txn.category}`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join('\n')
}

function DetailGrid({ rows }) {
  return (
    <article className="glass-card overflow-hidden p-0">
      {rows.map(([label, value, highlight], index) => (
        <div
          key={label}
          className={`flex items-center justify-between gap-4 px-4 py-3 ${
            index !== rows.length - 1 ? 'border-b border-white/6' : ''
          }`}
        >
          <span className={`text-sm ${highlight ? 'font-semibold text-emerald-300' : 'text-wn-muted'}`}>
            {label}
          </span>
          <span className={`text-sm text-right ${highlight ? 'font-semibold text-emerald-300' : 'text-wn-text'}`}>
            {value}
          </span>
        </div>
      ))}
    </article>
  )
}

export default function TransactionDetails() {
  const navigate = useNavigate()
  const { transactionId } = useParams()
  const [statusMessage, setStatusMessage] = useState('')
  const txn = getInvestmentTransactionById(transactionId)

  if (!txn) {
    return (
      <PageShell>
        <article className="glass-card p-5">
          <p className="section-title">Transaction not found</p>
          <p className="mt-2 text-sm text-wn-muted">
            This transaction may have been deleted or is no longer available.
          </p>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="mt-4 secondary-button"
          >
            Back to Transactions
          </button>
        </article>
      </PageShell>
    )
  }

  const rows = buildDetailRows(txn)
  const raw = txn.rawData ?? {}

  async function handleShare() {
    const text = buildShareText(txn)

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${txn.title} transaction`,
          text,
        })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setStatusMessage('Transaction details copied for sharing.')
      } else {
        setStatusMessage('Share is not supported on this device.')
      }
    } catch {
      setStatusMessage('Share was cancelled or unavailable.')
    }
  }

  function handleDelete() {
    const confirmed = window.confirm(`Delete ${txn.title} from transactions?`)

    if (!confirmed) {
      return
    }

    const deleted = removeInvestmentTransaction(txn.id, txn.category)

    if (deleted) {
      navigate('/transactions')
    }
  }

  return (
    <PageShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="secondary-button h-10 w-10 rounded-2xl px-0 py-0"
          >
            <ArrowLeft size={18} strokeWidth={2.1} />
          </button>
          <p className="text-lg font-semibold text-wn-text">Transaction Details</p>
          <button
            type="button"
            onClick={handleShare}
            className="secondary-button h-10 w-10 rounded-2xl px-0 py-0"
          >
            <Share2 size={18} strokeWidth={2.1} />
          </button>
        </div>

        <article className="glass-card p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-[0_16px_32px_rgba(0,0,0,0.24)]">
            <TrendingUp size={28} strokeWidth={2.1} />
          </div>
          <p className="mt-4 text-2xl font-semibold text-wn-text">{txn.title}</p>
          <p className="mt-2 text-sm font-medium text-emerald-400">
            {txn.type} • {raw.exchange ?? txn.category.toUpperCase()}
          </p>
          <p className="mt-5 text-[2.2rem] font-semibold tracking-tight text-wn-text">
            {formatCurrency(txn.amount ?? 0)}
          </p>
          <p className="mt-2 text-sm text-wn-muted">{formatDate(txn.date)}</p>
        </article>

        <DetailGrid rows={rows} />

        {raw.notes ? (
          <article className="glass-card p-5">
            <p className="section-title">Notes</p>
            <p className="mt-3 text-sm text-wn-text">{raw.notes}</p>
          </article>
        ) : null}

        {statusMessage ? (
          <article className="glass-card p-4">
            <p className="text-sm text-wn-muted">{statusMessage}</p>
          </article>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm font-semibold text-rose-300"
          >
            <Trash2 size={17} />
            <span className="ml-2">Delete</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('/add', {
                state: {
                  editingTransaction: txn,
                },
              })
            }
            className="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/12 px-4 py-4 text-sm font-semibold text-sky-300"
          >
            <Pencil size={17} />
            <span className="ml-2">Edit</span>
          </button>
        </div>
      </div>
    </PageShell>
  )
}
