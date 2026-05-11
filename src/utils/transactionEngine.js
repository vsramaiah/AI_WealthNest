import {
  deleteTransaction,
  addTransaction,
  getTransactionRawData,
  loadData,
  updateTransaction,
} from './storage'
import {
  calculateMutualFundTransaction,
  mutualFundCategory,
} from './mutualFunds'
import {
  calculateOtherInvestment,
  deleteOtherInvestment,
  isOtherInvestmentMasterCategory,
  saveOtherInvestment,
  updateOtherInvestment,
} from './otherInvestments'
import { calculateStockTransaction, stockCategory } from './stockTransactions'

function cloneRawData(rawData) {
  return JSON.parse(JSON.stringify(rawData ?? {}))
}

export function calculateTransactionByCategory(category, rawData) {
  switch (category) {
    case stockCategory:
      return calculateStockTransaction(rawData)
    case mutualFundCategory:
      return calculateMutualFundTransaction(rawData)
    default:
      return calculateOtherInvestment(category, rawData)
  }
}

export function buildTransactionRecord(category, rawData, overrides = {}) {
  const nextRawData = cloneRawData(rawData)

  return {
    ...overrides,
    category,
    rawData: nextRawData,
    calculated: calculateTransactionByCategory(category, nextRawData),
  }
}

export function addInvestmentTransaction(category, rawData, overrides = {}) {
  if (isOtherInvestmentMasterCategory(category) && !overrides.forceTransaction) {
    return saveOtherInvestment(category, rawData)
  }

  return addTransaction(buildTransactionRecord(category, rawData, overrides))
}

export function editInvestmentTransaction(id, category, rawData, overrides = {}) {
  if (isOtherInvestmentMasterCategory(category) && !overrides.forceTransaction) {
    return updateOtherInvestment(category, id, rawData)
  }

  return updateTransaction(id, buildTransactionRecord(category, rawData, overrides))
}

export function removeInvestmentTransaction(id, category) {
  if (category && isOtherInvestmentMasterCategory(category)) {
    return deleteOtherInvestment(category, id)
  }

  return deleteTransaction(id)
}

export function listInvestmentTransactions() {
  return loadData().transactions
    .map((txn) => {
      const rawData = getTransactionRawData(txn)

      return {
        id: txn.id,
        category: txn.category,
        rawData,
        calculated: txn.calculated ?? {},
        date:
          rawData.tradeDate ??
          rawData.date ??
          rawData.purchaseDate ??
          rawData.startDate ??
          '',
        type:
          rawData.txnType ??
          rawData.transactionType ??
          rawData.assetType ??
          rawData.orderType ??
          'ENTRY',
        amount:
          txn.calculated?.totalAmount ??
          txn.calculated?.totalValue ??
          rawData.amount ??
          rawData.depositAmount ??
          rawData.purchaseValue ??
          rawData.faceValue ??
          0,
        title:
          rawData.stockName ??
          rawData.fundId ??
          rawData.coinName ??
          rawData.propertyName ??
          rawData.bankName ??
          rawData.assetType ??
          rawData.bondName ??
          rawData.employerName ??
          rawData.scheme ??
          rawData.policyName ??
          'Transaction',
      }
    })
    .sort((left, right) => String(right.date).localeCompare(String(left.date)))
}

export function getInvestmentTransactionById(id) {
  return listInvestmentTransactions().find((txn) => txn.id === id) ?? null
}
