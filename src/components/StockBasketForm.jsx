import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { calculateStockTransaction, getStockLineItems } from '../utils/stockTransactions'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

function buildDefaultLine(index = 1) {
  return {
    id: `line-${Date.now()}-${index}`,
    ticker: '',
    stockName: '',
    quantity: '',
    pricePerShare: '',
  }
}

function buildInitialValues(initialValues) {
  const normalizedLineItems = getStockLineItems(initialValues ?? {})

  return {
    broker: initialValues?.broker ?? '',
    tradeDate: initialValues?.tradeDate ?? '',
    exchange: initialValues?.exchange ?? '',
    orderType: initialValues?.orderType ?? '',
    txnType: initialValues?.txnType ?? 'BUY',
    charges: initialValues?.charges ?? 0,
    notes: initialValues?.notes ?? '',
    lineItems:
      normalizedLineItems.length > 0
        ? normalizedLineItems.map((item, index) => ({
            id: item.id ?? `line-${index + 1}`,
            ticker: item.ticker ?? '',
            stockName: item.stockName ?? '',
            quantity: item.quantity ? String(item.quantity) : '',
            pricePerShare: item.pricePerShare ? String(item.pricePerShare) : '',
          }))
        : [buildDefaultLine()],
  }
}

function validate(values) {
  const errors = {}

  if (!String(values.broker).trim()) {
    errors.broker = 'Broker is required.'
  }

  if (!String(values.tradeDate).trim()) {
    errors.tradeDate = 'Trade Date is required.'
  }

  if (!String(values.exchange).trim()) {
    errors.exchange = 'Exchange is required.'
  }

  if (!String(values.orderType).trim()) {
    errors.orderType = 'Order Type is required.'
  }

  if (!String(values.txnType).trim()) {
    errors.txnType = 'Transaction Type is required.'
  }

  if (String(values.charges).trim() === '' || Number(values.charges) < 0) {
    errors.charges = 'Total Charges must be zero or more.'
  }

  const lineErrors = values.lineItems.map((line) => {
    const rowErrors = {}

    if (!String(line.ticker).trim()) {
      rowErrors.ticker = 'Ticker is required.'
    }

    if (!String(line.stockName).trim()) {
      rowErrors.stockName = 'Stock Name is required.'
    }

    if (String(line.quantity).trim() === '' || Number(line.quantity) <= 0) {
      rowErrors.quantity = 'Quantity must be more than zero.'
    }

    if (String(line.pricePerShare).trim() === '' || Number(line.pricePerShare) <= 0) {
      rowErrors.pricePerShare = 'Price Per Share must be more than zero.'
    }

    return rowErrors
  })

  if (lineErrors.some((row) => Object.keys(row).length > 0)) {
    errors.lineItems = lineErrors
  }

  return errors
}

export default function StockBasketForm({
  category,
  initialValues = null,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save Entry',
  title = 'Transaction Details',
  description = 'Record multiple stock line items under one broker contract with shared charges.',
}) {
  const [values, setValues] = useState(() => buildInitialValues(initialValues))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setValues(buildInitialValues(initialValues))
    setErrors({})
  }, [initialValues])

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function updateLineItem(lineId, name, value) {
    setValues((current) => ({
      ...current,
      lineItems: current.lineItems.map((line) =>
        line.id === lineId ? { ...line, [name]: value } : line,
      ),
    }))
    setErrors((current) => ({ ...current, lineItems: current.lineItems ?? [] }))
  }

  function addLineItem() {
    setValues((current) => ({
      ...current,
      lineItems: [...current.lineItems, buildDefaultLine(current.lineItems.length + 1)],
    }))
  }

  function removeLineItem(lineId) {
    setValues((current) => ({
      ...current,
      lineItems:
        current.lineItems.length > 1
          ? current.lineItems.filter((line) => line.id !== lineId)
          : current.lineItems,
    }))
  }

  const normalizedPayload = useMemo(
    () => ({
      category,
      fields: {
        broker: values.broker.trim(),
        tradeDate: values.tradeDate,
        exchange: values.exchange,
        orderType: values.orderType,
        txnType: values.txnType,
        charges: Number(values.charges) || 0,
        notes: values.notes,
        batchLabel: `${values.lineItems.length} stock${values.lineItems.length === 1 ? '' : 's'}`,
        lineItems: values.lineItems.map((line, index) => ({
          id: line.id || `line-${index + 1}`,
          ticker: line.ticker.trim().toUpperCase(),
          stockName: line.stockName.trim(),
          quantity: Number(line.quantity) || 0,
          pricePerShare: Number(line.pricePerShare) || 0,
        })),
      },
    }),
    [category, values],
  )

  const preview = calculateStockTransaction(normalizedPayload.fields)

  function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit(normalizedPayload)
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="glass-card rounded-[28px] border border-white/6 bg-white/[0.03] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="section-title">{title}</p>
            <p className="mt-1 text-sm text-wn-muted">{description}</p>
          </div>
          <div className="icon-badge h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400">
            <Sparkles size={18} strokeWidth={2.2} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-wn-text">Broker<span className="ml-0.5 text-emerald-300">*</span></span>
            <input value={values.broker} onChange={(event) => updateField('broker', event.target.value)} className="form-input" placeholder="Enter broker name" />
            {errors.broker ? <p className="mt-2 text-xs text-rose-300">{errors.broker}</p> : null}
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm font-medium text-wn-text">Trade Date<span className="ml-0.5 text-emerald-300">*</span></span>
            <input type="date" value={values.tradeDate} onChange={(event) => updateField('tradeDate', event.target.value)} className="form-input" />
            {errors.tradeDate ? <p className="mt-2 text-xs text-rose-300">{errors.tradeDate}</p> : null}
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm font-medium text-wn-text">Exchange<span className="ml-0.5 text-emerald-300">*</span></span>
            <select value={values.exchange} onChange={(event) => updateField('exchange', event.target.value)} className="form-input">
              <option value="">Choose exchange</option>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
            {errors.exchange ? <p className="mt-2 text-xs text-rose-300">{errors.exchange}</p> : null}
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm font-medium text-wn-text">Order Type<span className="ml-0.5 text-emerald-300">*</span></span>
            <select value={values.orderType} onChange={(event) => updateField('orderType', event.target.value)} className="form-input">
              <option value="">Choose order type</option>
              <option value="Delivery">Delivery</option>
              <option value="Intraday">Intraday</option>
            </select>
            {errors.orderType ? <p className="mt-2 text-xs text-rose-300">{errors.orderType}</p> : null}
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm font-medium text-wn-text">Transaction Type<span className="ml-0.5 text-emerald-300">*</span></span>
            <select value={values.txnType} onChange={(event) => updateField('txnType', event.target.value)} className="form-input">
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="TRANSFER IN">TRANSFER IN</option>
              <option value="TRANSFER OUT">TRANSFER OUT</option>
            </select>
            {errors.txnType ? <p className="mt-2 text-xs text-rose-300">{errors.txnType}</p> : null}
          </label>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="section-title">Stock Line Items</p>
            <button type="button" onClick={addLineItem} className="secondary-button">
              <Plus size={16} />
              <span className="ml-2">Add Stock</span>
            </button>
          </div>

          {values.lineItems.map((line, index) => {
            const rowErrors = errors.lineItems?.[index] ?? {}

            return (
              <article key={line.id} className="rounded-[22px] border border-white/6 bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-wn-text">Stock {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeLineItem(line.id)}
                    disabled={values.lineItems.length === 1}
                    className="inline-flex items-center justify-center rounded-xl border border-rose-500/25 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-wn-text">Ticker<span className="ml-0.5 text-emerald-300">*</span></span>
                    <input value={line.ticker} onChange={(event) => updateLineItem(line.id, 'ticker', event.target.value)} className="form-input" placeholder="Enter stock ticker" />
                    {rowErrors.ticker ? <p className="mt-2 text-xs text-rose-300">{rowErrors.ticker}</p> : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-wn-text">Stock Name<span className="ml-0.5 text-emerald-300">*</span></span>
                    <input value={line.stockName} onChange={(event) => updateLineItem(line.id, 'stockName', event.target.value)} className="form-input" placeholder="Enter stock name" />
                    {rowErrors.stockName ? <p className="mt-2 text-xs text-rose-300">{rowErrors.stockName}</p> : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-wn-text">Quantity<span className="ml-0.5 text-emerald-300">*</span></span>
                    <input type="number" min="0" step="1" value={line.quantity} onChange={(event) => updateLineItem(line.id, 'quantity', event.target.value)} className="form-input" placeholder="Enter quantity" />
                    {rowErrors.quantity ? <p className="mt-2 text-xs text-rose-300">{rowErrors.quantity}</p> : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-wn-text">Price Per Share<span className="ml-0.5 text-emerald-300">*</span></span>
                    <input type="number" min="0" step="0.01" value={line.pricePerShare} onChange={(event) => updateLineItem(line.id, 'pricePerShare', event.target.value)} className="form-input" placeholder="Enter share price" />
                    {rowErrors.pricePerShare ? <p className="mt-2 text-xs text-rose-300">{rowErrors.pricePerShare}</p> : null}
                  </label>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm font-medium text-wn-text">Total Charges<span className="ml-0.5 text-emerald-300">*</span></span>
            <input type="number" min="0" step="0.01" value={values.charges} onChange={(event) => updateField('charges', event.target.value)} className="form-input" placeholder="Enter combined charges" />
            {errors.charges ? <p className="mt-2 text-xs text-rose-300">{errors.charges}</p> : null}
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm font-medium text-wn-text">Notes</span>
            <input value={values.notes} onChange={(event) => updateField('notes', event.target.value)} className="form-input" placeholder="Optional notes" />
          </label>
        </div>

        <div className="mt-5 rounded-[22px] border border-white/6 bg-white/[0.04] p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-wn-muted">Gross Value</p>
              <p className="mt-2 text-sm font-semibold text-wn-text">{formatCurrency(preview.grossValue)}</p>
            </div>
            <div>
              <p className="text-xs text-wn-muted">Charges</p>
              <p className="mt-2 text-sm font-semibold text-wn-text">{formatCurrency(values.charges)}</p>
            </div>
            <div>
              <p className="text-xs text-wn-muted">Total Amount</p>
              <p className="mt-2 text-sm font-semibold text-emerald-300">{formatCurrency(preview.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`primary-button w-full ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
