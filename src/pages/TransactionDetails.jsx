import { Pencil, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CategoryIconBadge } from '../components/CategoryVisuals'
import PageShell from '../components/PageShell'
import { getCategoryMeta } from '../utils/categoryCatalog'
import { getStockLineItems } from '../utils/stockTransactions'
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

function formatText(value, fallback = 'Not available') {
  return `${value ?? ''}`.trim() || fallback
}

function buildDetailRows(txn) {
  const raw = txn.rawData ?? {}
  const calculated = txn.calculated ?? {}

  switch (txn.category) {
    case 'stocks': {
      const lineItems = getStockLineItems(raw)
      return [
        ['Trade Date', formatDate(raw.tradeDate)],
        ['Exchange', formatText(raw.exchange)],
        ['Broker', formatText(raw.broker)],
        ['Order Type', formatText(raw.orderType)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Stocks Count', lineItems.length],
        ['Stocks', lineItems.map((item) => `${item.stockName || item.ticker} (${item.ticker})`).join(', ') || 'Not available'],
        ['Total Quantity', lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)],
        ['Gross Value', formatCurrency(calculated.grossValue ?? 0)],
        ['Charges', formatCurrency(raw.charges ?? 0)],
        ['Total Amount', formatCurrency(calculated.totalAmount ?? txn.amount ?? 0), true],
      ]
    }
    case 'mf':
      return [
        ['Transaction Date', formatDate(raw.date)],
        ['Fund Name', formatText(raw.fundName ?? txn.title)],
        ['Fund ID', formatText(raw.fundId)],
        ['Folio Number', formatText(raw.folioNumber)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Amount', formatCurrency(raw.amount ?? 0)],
        ['NAV', raw.nav ? formatCurrency(raw.nav) : formatCurrency(calculated.nav ?? 0)],
        ['Units', raw.units ?? calculated.units ?? 'Not available'],
      ]
    case 'fd':
      return [
        ['Bank Name', formatText(raw.bankName)],
        ['Account Number', formatText(raw.accountNumber)],
        ['Deposit Amount', formatCurrency(raw.depositAmount ?? 0)],
        ['Interest Rate', raw.interestRate ? `${raw.interestRate}%` : 'Not available'],
        ['Start Date', formatDate(raw.startDate)],
        ['Maturity Date', formatDate(raw.maturityDate)],
        ['Payout Type', formatText(raw.payoutType)],
        ['Interest Frequency', formatText(raw.interestPayoutFrequency)],
        ['Maturity Amount', formatCurrency(calculated.maturityAmount ?? txn.amount ?? 0), true],
      ]
    case 'rd':
      return [
        ['Transaction Date', formatDate(raw.date)],
        ['Bank Name', formatText(raw.bankName)],
        ['Account Number', formatText(raw.accountNumber)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Amount', formatCurrency(raw.amount ?? 0), true],
        ['Interest Rate', raw.interestRate ? `${raw.interestRate}%` : 'Not available'],
        ['Tenure', raw.tenureMonths ? `${raw.tenureMonths} months` : 'Not available'],
      ]
    case 'ppf':
      return [
        ['Transaction Date', formatDate(raw.date)],
        ['Bank Name', formatText(raw.bankName)],
        ['Account Number', formatText(raw.accountNumber)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Amount', formatCurrency(raw.amount ?? raw.depositAmount ?? 0)],
        ['Interest Rate', raw.interestRate ? `${raw.interestRate}%` : 'Not available'],
        ['Balance', formatCurrency(calculated.balance ?? txn.amount ?? 0), true],
      ]
    case 'epf':
      return [
        ['Transaction Date', formatDate(raw.date)],
        ['Employer Name', formatText(raw.employerName)],
        ['UAN Number', formatText(raw.uanNumber)],
        ['Member ID', formatText(raw.memberId)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Employee Contribution', formatCurrency(raw.employeeContribution ?? 0)],
        ['Employer Contribution', formatCurrency(raw.employerContribution ?? 0)],
        ['Total Contribution', formatCurrency(calculated.totalContribution ?? txn.amount ?? 0), true],
      ]
    case 'nps':
      return [
        ['Transaction Date', formatDate(raw.date)],
        ['PRAN Number', formatText(raw.pranNumber)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Tier', formatText(raw.tier)],
        ['Scheme', formatText(raw.scheme)],
        ['Amount', formatCurrency(raw.amount ?? txn.amount ?? 0), true],
      ]
    case 'bonds':
      return [
        ['Bond Name', formatText(raw.bondName)],
        ['Issuer', formatText(raw.issuer)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Purchase Date', formatDate(raw.purchaseDate)],
        ['Coupon Payment Date', formatDate(raw.couponPaymentDate)],
        ['Maturity Date', formatDate(raw.maturityDate)],
        ['Face Value', formatCurrency(raw.faceValue ?? 0)],
        ['Quantity', raw.quantity ?? 'Not available'],
        ['Coupon Rate', raw.couponRate ? `${raw.couponRate}%` : 'Not available'],
        ['Total Amount', formatCurrency(txn.amount ?? 0), true],
      ]
    case 'realEstate':
      return [
        ['Property Name', formatText(raw.propertyName)],
        ['Location', formatText(raw.location)],
        ['Purchase Date', formatDate(raw.purchaseDate)],
        ['Ownership Percent', raw.ownershipPercent ? `${raw.ownershipPercent}%` : 'Not available'],
        ['Purchase Value', formatCurrency(raw.purchaseValue ?? txn.amount ?? 0), true],
      ]
    case 'crypto':
      return [
        ['Transaction Date', formatDate(raw.date)],
        ['Coin Name', formatText(raw.coinName)],
        ['Symbol', formatText(raw.symbol)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Network', formatText(raw.network)],
        ['Exchange', formatText(raw.exchange)],
        ['Quantity', raw.quantity ?? 'Not available'],
        ['Price', formatCurrency(raw.price ?? 0)],
        ['Charges', formatCurrency(raw.charges ?? 0)],
        ['Total Amount', formatCurrency(txn.amount ?? 0), true],
      ]
    case 'lic':
      return [
        ['Premium Date', formatDate(raw.date)],
        ['Policy Name', formatText(raw.policyName)],
        ['Policy Number', formatText(raw.policyNumber)],
        ['Financial Year', formatText(raw.financialYear)],
        ['Payment Frequency', formatText(raw.paymentFrequency)],
        ['Premium Amount', formatCurrency(raw.amount ?? txn.amount ?? 0), true],
      ]
    case 'goldSilver':
      return [
        ['Transaction Date', formatDate(raw.date)],
        ['Asset Type', formatText(raw.assetType)],
        ['Holding Type', formatText(raw.holdingType)],
        ['Transaction Type', formatText(raw.txnType)],
        ['Quantity', raw.quantity ? `${raw.quantity} g` : 'Not available'],
        ['Price Per Gram', formatCurrency(raw.pricePerGram ?? 0)],
        ['Total Value', formatCurrency(calculated.totalValue ?? txn.amount ?? 0), true],
      ]
    default:
      return [
        ['Date', formatDate(txn.date)],
        ['Category', getCategoryMeta(txn.category).label],
        ['Type', txn.type],
        ['Amount', formatCurrency(txn.amount ?? 0), true],
      ]
  }
}

function buildShareText(txn) {
  const rows = buildDetailRows(txn)
  return [
    `${txn.title}`,
    `${txn.type} • ${getCategoryMeta(txn.category).label}`,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const txn = getInvestmentTransactionById(transactionId)

  if (!txn) {
    return (
      <PageShell backTo="/transactions" backLabel="Back to Transactions">
        <article className="glass-card p-5">
          <p className="section-title">Transaction not found</p>
          <p className="mt-2 text-sm text-wn-muted">
            This transaction may have been deleted or is no longer available.
          </p>
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
    const deleted = removeInvestmentTransaction(txn.id, txn.category)

    if (deleted) {
      navigate('/transactions')
      return
    }

    setShowDeleteConfirm(false)
    setStatusMessage('Transaction could not be deleted.')
  }

  return (
    <PageShell backTo="/transactions" backLabel="Back to Transactions">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="w-10 shrink-0" />
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
          <div className="mx-auto w-fit">
            <CategoryIconBadge
              categoryId={txn.category}
              size={28}
              className="h-16 w-16 shadow-[0_16px_32px_rgba(0,0,0,0.24)]"
            />
          </div>
          <p className="mt-4 text-2xl font-semibold text-wn-text">{txn.title}</p>
          <p className="mt-2 text-sm font-medium text-emerald-400">
            {txn.type} • {raw.exchange ?? getCategoryMeta(txn.category).label}
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
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center justify-center rounded-2xl border border-rose-500/35 bg-rose-300/22 px-4 py-4 text-sm font-semibold text-rose-950 hover:bg-rose-300/28"
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
            className="inline-flex items-center justify-center rounded-2xl border border-sky-500/35 bg-sky-300/20 px-4 py-4 text-sm font-semibold text-sky-950 hover:bg-sky-300/26"
          >
            <Pencil size={17} />
            <span className="ml-2">Edit</span>
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-black/55 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-10 backdrop-blur sm:items-center sm:pb-6">
            <article
              role="dialog"
              aria-modal="true"
              aria-label="Delete transaction confirmation"
              className="glass-card w-full max-w-md p-5"
            >
              <p className="section-title">Delete Transaction?</p>
              <p className="mt-2 text-sm text-wn-muted">
                This will permanently remove {txn.title} from your transaction history.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center justify-center rounded-2xl border border-rose-500/35 bg-rose-300/22 px-4 py-3 text-sm font-semibold text-rose-950 hover:bg-rose-300/28"
                >
                  Delete
                </button>
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </PageShell>
  )
}
