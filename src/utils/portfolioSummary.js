import { getMutualFundSummary } from './mutualFunds'
import {
  bondsCategory,
  cryptoCategory,
  epfCategory,
  getFdSummary,
  getGoldSilverSummary,
  getRdSummary,
  goldSilverCategory,
  npsCategory,
  ppfCategory,
  realEstateCategory,
} from './otherInvestments'
import { getTransactionRawData, loadData } from './storage'
import { getStockHoldings } from './stockTransactions'
import { categoryCatalog, getCategoryMeta } from './categoryCatalog'

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function buildSummary(categoryId, summary) {
  const meta = getCategoryMeta(categoryId)

  return {
    ...meta,
    value: summary.value ?? 0,
    invested: summary.invested ?? 0,
    profitLoss: (summary.value ?? 0) - (summary.invested ?? 0),
    details: summary.details ?? [],
  }
}

function getStockSummary() {
  const holdings = getStockHoldings()
  const aggregate = holdings.reduce(
    (summary, holding) => {
      summary.value += toNumber(holding.totalInvested)
      summary.invested += toNumber(holding.totalInvested)
      summary.totalQuantity += toNumber(holding.totalQuantity)
      summary.details.push({
        id: holding.ticker,
        title: `${holding.stockName} (${holding.ticker})`,
        subtitle: `Qty ${holding.totalQuantity}`,
        value: toNumber(holding.totalInvested),
        invested: toNumber(holding.totalInvested),
      })
      return summary
    },
    {
      value: 0,
      invested: 0,
      totalQuantity: 0,
      details: [],
    },
  )

  return buildSummary('stocks', aggregate)
}

function getMutualFundCategorySummary() {
  const summary = getMutualFundSummary()

  return buildSummary('mf', {
    value: summary.totalInvested,
    invested: summary.totalInvested,
    details: [
      {
        id: 'mf-summary',
        title: 'Mutual Fund Book',
        subtitle: `Units ${summary.totalUnits.toFixed(4)}`,
        value: summary.totalInvested,
        invested: summary.totalInvested,
      },
    ],
  })
}

function getTransactionCategorySummary(categoryId, mapper) {
  return loadData().transactions
    .filter((txn) => txn.category === categoryId)
    .map((txn) => mapper(txn))
}

function normalizeTxnType(value) {
  return String(value ?? '').trim().toUpperCase()
}

function buildFixedIncomeTransactionSummary({
  categoryId,
  keyField,
  titleField,
  subtitleField,
  amountResolver,
  depositTypes = ['DEPOSIT', 'INVEST'],
  interestTypes = ['INTEREST'],
}) {
  const grouped = loadData().transactions
    .filter((txn) => txn.category === categoryId)
    .reduce((collection, txn) => {
      const rawData = getTransactionRawData(txn)
      const accountKey = String(rawData[keyField] ?? '').trim() || txn.id
      const amount = toNumber(amountResolver(txn, rawData))
      const txnType = normalizeTxnType(rawData.txnType ?? rawData.transactionType)
      const current = collection[accountKey] ?? {
        id: accountKey,
        title: rawData[titleField] || 'Stored entry',
        subtitle: rawData[subtitleField] || '',
        total: 0,
        deposit: 0,
        interest: 0,
      }

      if (depositTypes.includes(txnType)) {
        current.deposit += amount
      } else if (interestTypes.includes(txnType)) {
        current.interest += amount
      }

      current.total = current.deposit + current.interest
      current.title = rawData[titleField] || current.title
      current.subtitle = rawData[subtitleField] || current.subtitle
      collection[accountKey] = current

      return collection
    }, {})

  const details = Object.values(grouped).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle ? `A/C ${item.subtitle}` : 'Stored entry',
    value: item.total,
    invested: item.deposit,
  }))

  return buildSummary(categoryId, {
    value: details.reduce((sum, item) => sum + item.value, 0),
    invested: details.reduce((sum, item) => sum + item.invested, 0),
    details,
  })
}

function buildAccountLevelSummary(categoryId, keyField, titleField, subtitleField, valueField, investedField) {
  const grouped = loadData().transactions
    .filter((txn) => txn.category === categoryId)
    .reduce((collection, txn) => {
      const rawData = getTransactionRawData(txn)
      const accountKey = String(rawData[keyField] ?? '').trim() || txn.id
      const entryDate = String(rawData.date ?? '')
      const current = collection[accountKey]
      const investedAmount = toNumber(investedField(txn, rawData))

      if (!current) {
        collection[accountKey] = {
          id: accountKey,
          title: rawData[titleField] || 'Stored entry',
          subtitle: rawData[subtitleField] || '',
          value: toNumber(valueField(txn, rawData)),
          invested: investedAmount,
          lastDate: entryDate,
        }
        return collection
      }

      current.invested += investedAmount

      if (entryDate >= current.lastDate) {
        current.value = toNumber(valueField(txn, rawData))
        current.title = rawData[titleField] || current.title
        current.subtitle = rawData[subtitleField] || current.subtitle
        current.lastDate = entryDate
      }

      return collection
    }, {})

  return Object.values(grouped).map(({ lastDate, ...detail }) => detail)
}

function getGoldSilverCategorySummary() {
  const details = getTransactionCategorySummary(goldSilverCategory, (txn) => {
    const rawData = getTransactionRawData(txn)
    const value = toNumber(txn.calculated?.totalValue)

    return {
      id: txn.id,
      title: rawData.assetType,
      subtitle: rawData.date,
      value,
      invested: value,
    }
  })

  const total = getGoldSilverSummary().totalValue

  return buildSummary(goldSilverCategory, {
    value: total,
    invested: total,
    details,
  })
}

function getMasterCategorySummary(categoryId, items, valueSelector, investedSelector, titleSelector) {
  const details = items.map((item) => ({
    id: item.id,
    title: titleSelector(item),
    subtitle: item.maturityDate ?? item.startDate ?? '',
    value: valueSelector(item),
    invested: investedSelector(item),
  }))

  return buildSummary(categoryId, {
    value: details.reduce((total, item) => total + item.value, 0),
    invested: details.reduce((total, item) => total + item.invested, 0),
    details,
  })
}

function getFdCategorySummary() {
  const items = loadData().transactions.filter((txn) => txn.category === 'fd')

  return buildSummary('fd', {
    value: items.reduce((sum, item) => sum + toNumber(item.calculated?.maturityAmount), 0),
    invested: items.reduce((sum, item) => sum + toNumber(getTransactionRawData(item).depositAmount), 0),
    details: items.map((item) => ({
      id: item.id,
      title: getTransactionRawData(item).bankName,
      subtitle: getTransactionRawData(item).accountNumber
        ? `A/C ${getTransactionRawData(item).accountNumber}`
        : 'Stored entry',
      value: toNumber(item.calculated?.maturityAmount),
      invested: toNumber(getTransactionRawData(item).depositAmount),
    })),
  })
}

function getRdCategorySummary() {
  const items = loadData().masters.rd ?? []

  return buildSummary('rd', {
    value: items.reduce((sum, item) => {
      const totalInvested = toNumber(item.monthlyDeposit) * toNumber(item.tenureMonths)
      const maturityAmount = toNumber(item.calculated?.maturityAmount)
      return sum + (maturityAmount || totalInvested)
    }, 0),
    invested: items.reduce(
      (sum, item) => sum + toNumber(item.calculated?.totalInvested ?? item.monthlyDeposit * item.tenureMonths),
      0,
    ),
    details: items.map((item) => ({
      id: item.id,
      title: item.bankName,
      subtitle: `A/C ${item.accountNumber}`,
      value: toNumber(item.calculated?.maturityAmount ?? item.monthlyDeposit * item.tenureMonths),
      invested: toNumber(item.calculated?.totalInvested ?? item.monthlyDeposit * item.tenureMonths),
    })),
  })
}

function getPpfCategorySummary() {
  return buildFixedIncomeTransactionSummary({
    categoryId: ppfCategory,
    keyField: 'accountNumber',
    titleField: 'bankName',
    subtitleField: 'accountNumber',
    amountResolver: (_txn, rawData) => rawData.amount,
  })
}

function getEpfCategorySummary() {
  return buildFixedIncomeTransactionSummary({
    categoryId: epfCategory,
    keyField: 'uanNumber',
    titleField: 'employerName',
    subtitleField: 'uanNumber',
    amountResolver: (_txn, rawData) =>
      toNumber(rawData.employeeContribution) + toNumber(rawData.employerContribution),
  })
}

function getNpsCategorySummary() {
  return buildFixedIncomeTransactionSummary({
    categoryId: npsCategory,
    keyField: 'pranNumber',
    titleField: 'scheme',
    subtitleField: 'pranNumber',
    amountResolver: (_txn, rawData) => rawData.amount,
  })
}

function getBondsCategorySummary() {
  const details = getTransactionCategorySummary(bondsCategory, (txn) => {
    const rawData = getTransactionRawData(txn)
    const value = toNumber(rawData.faceValue) * toNumber(rawData.quantity)

    return {
      id: txn.id,
      title: rawData.bondName,
      subtitle: rawData.issuer,
      value,
      invested: value,
    }
  })

  return buildSummary(bondsCategory, {
    value: details.reduce((sum, item) => sum + item.value, 0),
    invested: details.reduce((sum, item) => sum + item.invested, 0),
    details,
  })
}

function getLicCategorySummary() {
  const items = loadData().masters.lic ?? []

  return buildSummary('lic', {
    value: items.reduce((sum, item) => sum + toNumber(item.sumAssured), 0),
    invested: items.reduce((sum, item) => sum + toNumber(item.calculated?.totalPremiumPaid), 0),
    details: items.map((item) => ({
      id: item.id,
      title: item.policyName,
      subtitle: item.policyNumber,
      value: toNumber(item.sumAssured),
      invested: toNumber(item.calculated?.totalPremiumPaid),
    })),
  })
}

function getRealEstateCategorySummary() {
  const details = getTransactionCategorySummary(realEstateCategory, (txn) => {
    const rawData = getTransactionRawData(txn)
    const value =
      toNumber(rawData.purchaseValue) * (toNumber(rawData.ownershipPercent) / 100)

    return {
      id: txn.id,
      title: rawData.propertyName,
      subtitle: rawData.location,
      value,
      invested: value,
    }
  })

  return buildSummary(realEstateCategory, {
    value: details.reduce((sum, item) => sum + item.value, 0),
    invested: details.reduce((sum, item) => sum + item.invested, 0),
    details,
  })
}

function getCryptoCategorySummary() {
  const details = getTransactionCategorySummary(cryptoCategory, (txn) => {
    const rawData = getTransactionRawData(txn)
    const value = toNumber(rawData.quantity) * toNumber(rawData.price)

    return {
      id: txn.id,
      title: `${rawData.coinName} (${rawData.symbol})`,
      subtitle: rawData.exchange,
      value,
      invested: value,
    }
  })

  return buildSummary(cryptoCategory, {
    value: details.reduce((sum, item) => sum + item.value, 0),
    invested: details.reduce((sum, item) => sum + item.invested, 0),
    details,
  })
}

export function getCategorySummaries() {
  const summaries = {
    stocks: getStockSummary(),
    mf: getMutualFundCategorySummary(),
    goldSilver: getGoldSilverCategorySummary(),
    fd: getFdCategorySummary(),
    rd: getRdCategorySummary(),
    ppf: getPpfCategorySummary(),
    epf: getEpfCategorySummary(),
    nps: getNpsCategorySummary(),
    bonds: getBondsCategorySummary(),
    lic: getLicCategorySummary(),
    realEstate: getRealEstateCategorySummary(),
    crypto: getCryptoCategorySummary(),
  }

  return categoryCatalog.map((category) => summaries[category.id] ?? buildSummary(category.id, {}))
}

export function getPortfolioOverview() {
  const categories = getCategorySummaries()
  const totalNetWorth = categories.reduce((sum, category) => sum + category.value, 0)
  const groupedAllocation = categories.reduce((groups, category) => {
    const currentGroup = groups[category.group] ?? {
      group: category.group,
      value: 0,
      categories: [],
    }

    currentGroup.value += category.value
    currentGroup.categories.push(category)
    groups[category.group] = currentGroup

    return groups
  }, {})

  return {
    totalNetWorth,
    categories,
    groupedAllocation: Object.values(groupedAllocation).map((group) => ({
      ...group,
      allocationPercent: totalNetWorth > 0 ? (group.value / totalNetWorth) * 100 : 0,
    })),
  }
}

export function getCategoryDetails(categoryId) {
  return getCategorySummaries().find((category) => category.id === categoryId) ?? null
}
