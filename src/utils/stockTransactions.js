import { addTransaction, getTransactionRawData, loadData } from './storage'

export const stockCategory = 'stocks'

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

export function getStockLineItems(rawData = {}) {
  const lineItems = Array.isArray(rawData.lineItems) && rawData.lineItems.length > 0
    ? rawData.lineItems
    : [
        {
          ticker: rawData.ticker,
          stockName: rawData.stockName,
          quantity: rawData.quantity,
          pricePerShare: rawData.pricePerShare,
        },
      ]

  return lineItems
    .map((item, index) => ({
      id: item.id ?? `line-${index + 1}`,
      ticker: normalizeText(item.ticker),
      stockName: normalizeText(item.stockName),
      quantity: toNumber(item.quantity),
      pricePerShare: toNumber(item.pricePerShare),
    }))
    .filter((item) => item.ticker || item.stockName || item.quantity || item.pricePerShare)
}

export function allocateStockLineCharges(lineItems, totalCharges) {
  const grossTotal = lineItems.reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.pricePerShare),
    0,
  )
  const charges = toNumber(totalCharges)

  if (grossTotal <= 0 || charges <= 0) {
    return lineItems.map((item) => ({
      ...item,
      grossValue: toNumber(item.quantity) * toNumber(item.pricePerShare),
      allocatedCharges: 0,
      totalAmount: toNumber(item.quantity) * toNumber(item.pricePerShare),
    }))
  }

  let allocatedSum = 0

  return lineItems.map((item, index) => {
    const grossValue = toNumber(item.quantity) * toNumber(item.pricePerShare)
    const allocatedCharges =
      index === lineItems.length - 1
        ? Number((charges - allocatedSum).toFixed(2))
        : Number(((grossValue / grossTotal) * charges).toFixed(2))

    allocatedSum += allocatedCharges

    return {
      ...item,
      grossValue,
      allocatedCharges,
      totalAmount: grossValue + allocatedCharges,
    }
  })
}

export function calculateStockTransaction(fields) {
  const lineItems = getStockLineItems(fields)
  const grossValue = lineItems.reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.pricePerShare),
    0,
  )
  const charges = toNumber(fields.charges)
  const isOutflow = fields.txnType === 'SELL' || fields.txnType === 'TRANSFER OUT'
  const totalAmount = isOutflow ? grossValue - charges : grossValue + charges

  return {
    grossValue,
    totalAmount,
    lineItems: allocateStockLineCharges(lineItems, charges),
  }
}

export function createStockTransaction(fields) {
  return {
    category: stockCategory,
    rawData: fields,
    calculated: calculateStockTransaction(fields),
  }
}

export function saveStockTransaction(fields) {
  return addTransaction(createStockTransaction(fields))
}

export function getStockTransactions() {
  const data = loadData()

  return data.transactions
    .filter((txn) => txn.category === stockCategory)
    .map((txn) => {
      const rawData = getTransactionRawData(txn)
      const lineItems = getStockLineItems(rawData)

      return {
        id: txn.id,
        ticker: lineItems.map((item) => item.ticker).filter(Boolean).join(', '),
        stockName: rawData.batchLabel ?? `${lineItems.length} stock${lineItems.length === 1 ? '' : 's'}`,
        date: rawData.tradeDate,
        amount: txn.calculated?.totalAmount ?? 0,
        txnType: rawData.txnType,
        quantity: lineItems.reduce((sum, item) => sum + toNumber(item.quantity), 0),
      }
    })
    .sort((left, right) => String(right.date).localeCompare(String(left.date)))
}

function getHoldingDeltas(lineItem, txnType) {
  const quantity = toNumber(lineItem.quantity)
  const totalAmount = toNumber(lineItem.totalAmount)

  if (txnType === 'SELL' || txnType === 'TRANSFER OUT') {
    return {
      quantity: -quantity,
      invested: -totalAmount,
    }
  }

  return {
    quantity,
    invested: totalAmount,
  }
}

export function getStockHoldings() {
  const data = loadData()
  const groupedHoldings = data.transactions
    .filter((txn) => txn.category === stockCategory)
    .reduce((collection, txn) => {
      const rawData = getTransactionRawData(txn)
      const txnType = normalizeText(rawData.txnType).toUpperCase()
      const lineItems =
        Array.isArray(txn.calculated?.lineItems) && txn.calculated.lineItems.length > 0
          ? txn.calculated.lineItems
          : allocateStockLineCharges(getStockLineItems(rawData), rawData.charges)

      lineItems.forEach((lineItem) => {
        const ticker = normalizeText(lineItem.ticker)

        if (!ticker) {
          return
        }

        const currentHolding = collection[ticker] ?? {
          ticker,
          stockName: lineItem.stockName || ticker,
          totalQuantity: 0,
          totalInvested: 0,
        }
        const deltas = getHoldingDeltas(lineItem, txnType)

        currentHolding.totalQuantity += deltas.quantity
        currentHolding.totalInvested += deltas.invested

        if (currentHolding.totalQuantity <= 0) {
          delete collection[ticker]
          return
        }

        collection[ticker] = currentHolding
      })

      return collection
    }, {})

  return Object.values(groupedHoldings).sort((left, right) =>
    left.ticker.localeCompare(right.ticker),
  )
}
