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
  const items = loadData().masters.fd ?? []
  const total = getFdSummary()

  return buildSummary('fd', {
    value: total.maturityAmount,
    invested: items.reduce((sum, item) => sum + toNumber(item.depositAmount), 0),
    details: items.map((item) => ({
      id: item.id,
      title: item.bankName,
      subtitle: `A/C ${item.accountNumber}`,
      value: toNumber(item.calculated?.maturityAmount),
      invested: toNumber(item.depositAmount),
    })),
  })
}

function getRdCategorySummary() {
  const items = loadData().masters.rd ?? []
  const total = getRdSummary()

  return buildSummary('rd', {
    value: total.maturityAmount,
    invested: items.reduce(
      (sum, item) => sum + toNumber(item.calculated?.totalInvested ?? item.monthlyDeposit * item.tenureMonths),
      0,
    ),
    details: items.map((item) => ({
      id: item.id,
      title: item.bankName,
      subtitle: `A/C ${item.accountNumber}`,
      value: toNumber(item.calculated?.maturityAmount),
      invested: toNumber(item.calculated?.totalInvested),
    })),
  })
}

function getPpfCategorySummary() {
  const details = buildAccountLevelSummary(
    ppfCategory,
    'accountNumber',
    'bankName',
    'accountNumber',
    (txn) => txn.calculated?.balance,
    (_txn, rawData) => rawData.amount,
  ).map((item) => ({
    ...item,
    subtitle: item.subtitle ? `A/C ${item.subtitle}` : 'Stored entry',
  }))

  return buildSummary(ppfCategory, {
    value: details.reduce((sum, item) => sum + item.value, 0),
    invested: details.reduce((sum, item) => sum + item.invested, 0),
    details,
  })
}

function getEpfCategorySummary() {
  const details = getTransactionCategorySummary(epfCategory, (txn) => {
    const rawData = getTransactionRawData(txn)

    return {
      id: txn.id,
      title: rawData.employerName,
      subtitle: `UAN ${rawData.uanNumber}`,
      value: toNumber(txn.calculated?.balance),
      invested: toNumber(txn.calculated?.totalContribution),
    }
  })

  return buildSummary(epfCategory, {
    value: details.reduce((sum, item) => sum + item.value, 0),
    invested: details.reduce((sum, item) => sum + item.invested, 0),
    details,
  })
}

function getNpsCategorySummary() {
  const details = getTransactionCategorySummary(npsCategory, (txn) => {
    const rawData = getTransactionRawData(txn)
    const amount = toNumber(rawData.amount)

    return {
      id: txn.id,
      title: rawData.scheme,
      subtitle: rawData.tier,
      value: amount,
      invested: amount,
    }
  })

  return buildSummary(npsCategory, {
    value: details.reduce((sum, item) => sum + item.value, 0),
    invested: details.reduce((sum, item) => sum + item.invested, 0),
    details,
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
