import { addTransaction, getTransactionRawData, loadData } from './storage'

export const stockCategory = 'stocks'

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export function calculateStockTransaction(fields) {
  const quantity = toNumber(fields.quantity)
  const pricePerShare = toNumber(fields.pricePerShare)
  const charges = toNumber(fields.charges)
  const grossValue = quantity * pricePerShare
  const totalAmount =
    fields.txnType === 'SELL' ? grossValue - charges : grossValue + charges

  return {
    grossValue,
    totalAmount,
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

      return {
        id: txn.id,
        ticker: rawData.ticker,
        stockName: rawData.stockName,
        date: rawData.tradeDate,
        amount: txn.calculated?.totalAmount ?? 0,
        txnType: rawData.txnType,
        quantity: rawData.quantity,
      }
    })
    .sort((left, right) => String(right.date).localeCompare(String(left.date)))
}

function getHoldingDeltas(txn) {
  const rawData = getTransactionRawData(txn)
  const quantity = toNumber(rawData.quantity)
  const totalAmount = toNumber(txn.calculated?.totalAmount)

  if (rawData.txnType === 'SELL') {
    return {
      quantity: -quantity,
      invested: -totalAmount,
    }
  }

  if (rawData.txnType === 'TRANSFER') {
    return {
      quantity: 0,
      invested: 0,
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
      const ticker = rawData.ticker
      const currentHolding = collection[ticker] ?? {
        ticker,
        stockName: rawData.stockName,
        totalQuantity: 0,
        totalInvested: 0,
      }
      const deltas = getHoldingDeltas(txn)

      currentHolding.totalQuantity += deltas.quantity
      currentHolding.totalInvested += deltas.invested

      if (currentHolding.totalQuantity <= 0) {
        delete collection[ticker]
        return collection
      }

      collection[ticker] = currentHolding

      return collection
    }, {})

  return Object.values(groupedHoldings).sort((left, right) =>
    left.ticker.localeCompare(right.ticker),
  )
}
