import { getMutualFundMasters, getMutualFundSummary } from './mutualFunds'
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
    grossValue: summary.grossValue ?? 0,
    charges: summary.charges ?? 0,
    totalUnits: summary.totalUnits ?? 0,
    totalGrams: summary.totalGrams ?? 0,
    details: summary.details ?? [],
  }
}

function getStockSummary() {
  const holdings = getStockHoldings()
  const groupedMetrics = loadData().transactions
    .filter((txn) => txn.category === 'stocks')
    .reduce((collection, txn) => {
      const rawData = getTransactionRawData(txn)
      const ticker = String(rawData.ticker ?? '').trim() || txn.id
      const current = collection[ticker] ?? {
        grossValue: 0,
        charges: 0,
        totalAmount: 0,
      }

      current.grossValue += toNumber(txn.calculated?.grossValue)
      current.charges += toNumber(rawData.charges)
      current.totalAmount += toNumber(txn.calculated?.totalAmount)
      collection[ticker] = current

      return collection
    }, {})

  const aggregate = holdings.reduce(
    (summary, holding) => {
      const metrics = groupedMetrics[holding.ticker] ?? {
        grossValue: 0,
        charges: 0,
        totalAmount: 0,
      }

      summary.value += toNumber(metrics.totalAmount)
      summary.invested += toNumber(metrics.grossValue)
      summary.grossValue += toNumber(metrics.grossValue)
      summary.charges += toNumber(metrics.charges)
      summary.totalQuantity += toNumber(holding.totalQuantity)
      summary.details.push({
        id: holding.ticker,
        title: `${holding.stockName} (${holding.ticker})`,
        subtitle: `Qty ${holding.totalQuantity}`,
        value: toNumber(metrics.totalAmount),
        invested: toNumber(metrics.grossValue),
        grossValue: toNumber(metrics.grossValue),
        charges: toNumber(metrics.charges),
      })
      return summary
    },
    {
      value: 0,
      invested: 0,
      grossValue: 0,
      charges: 0,
      totalQuantity: 0,
      details: [],
    },
  )

  return buildSummary('stocks', aggregate)
}

function getMutualFundCategorySummary() {
  const masters = getMutualFundMasters()
  const details = masters.map((master) => {
    const fundId = master.folioNumber || master.fundName || master.id
    const summary = getMutualFundSummary(fundId)

    return {
      id: master.id,
      title: master.fundName || 'Mutual Fund',
      subtitle: master.folioNumber ? `Folio ${master.folioNumber}` : 'Stored entry',
      value: summary.totalInvested,
      invested: summary.totalInvested,
      totalUnits: summary.totalUnits,
    }
  })

  const totalInvested = details.reduce((sum, item) => sum + toNumber(item.value), 0)
  const totalUnits = details.reduce((sum, item) => sum + toNumber(item.totalUnits), 0)

  return buildSummary('mf', {
    value: totalInvested,
    invested: totalInvested,
    totalUnits,
    details,
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
  const grouped = loadData().transactions
    .filter((txn) => txn.category === goldSilverCategory)
    .reduce((collection, txn) => {
      const rawData = getTransactionRawData(txn)
      const assetType = String(rawData.assetType ?? '').trim() || 'Stored entry'
      const current = collection[assetType] ?? {
        id: assetType.toLowerCase(),
        title: assetType,
        subtitle: 'Stored entry',
        value: 0,
        invested: 0,
        totalGrams: 0,
        charges: 0,
      }
      const invested = toNumber(txn.calculated?.totalValue)
      const grams = toNumber(rawData.quantity)
      const charges = toNumber(rawData.charges)

      current.value += invested
      current.invested += invested
      current.totalGrams += grams
      current.charges += charges
      current.subtitle = grams > 0 ? `${current.totalGrams.toFixed(4)} grams` : current.subtitle
      collection[assetType] = current

      return collection
    }, {})

  const details = Object.values(grouped)
  const totalInvested = details.reduce((sum, item) => sum + item.invested, 0)
  const totalGrams = details.reduce((sum, item) => sum + toNumber(item.totalGrams), 0)
  const charges = details.reduce((sum, item) => sum + toNumber(item.charges), 0)

  return buildSummary(goldSilverCategory, {
    value: totalInvested,
    invested: totalInvested,
    totalGrams,
    charges,
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
  const premiumByPolicy = loadData().transactions
    .filter((txn) => txn.category === 'lic')
    .reduce((collection, txn) => {
      const rawData = getTransactionRawData(txn)
      const key =
        String(rawData.masterId ?? '').trim() ||
        String(rawData.policyNumber ?? '').trim() ||
        txn.id

      collection[key] = (collection[key] ?? 0) + toNumber(rawData.amount ?? txn.amount)
      return collection
    }, {})

  return buildSummary('lic', {
    value: items.reduce((sum, item) => sum + toNumber(item.sumAssured), 0),
    invested: items.reduce((sum, item) => {
      const premiumPaid =
        premiumByPolicy[String(item.id)] ??
        premiumByPolicy[String(item.policyNumber ?? '').trim()] ??
        0
      return sum + toNumber(premiumPaid)
    }, 0),
    details: items.map((item) => ({
      id: item.id,
      title: item.policyName,
      subtitle: item.policyNumber,
      value: toNumber(item.sumAssured),
      invested:
        toNumber(
          premiumByPolicy[String(item.id)] ??
          premiumByPolicy[String(item.policyNumber ?? '').trim()] ??
          0,
        ),
    })),
  })
}

function getRealEstateCategorySummary() {
  const details = getTransactionCategorySummary(realEstateCategory, (txn) => {
    const rawData = getTransactionRawData(txn)
    const value = toNumber(rawData.purchaseValue)

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
    const grossValue = toNumber(rawData.quantity) * toNumber(rawData.price)
    const charges = toNumber(rawData.charges)
    const totalAmount =
      normalizeTxnType(rawData.txnType) === 'SELL'
        ? grossValue - charges
        : grossValue + charges

    return {
      id: txn.id,
      title: `${rawData.coinName} (${rawData.symbol})`,
      subtitle: rawData.exchange,
      value: totalAmount,
      invested: grossValue,
      grossValue,
      charges,
    }
  })

  return buildSummary(cryptoCategory, {
    value: details.reduce((sum, item) => sum + item.value, 0),
    invested: details.reduce((sum, item) => sum + item.invested, 0),
    grossValue: details.reduce((sum, item) => sum + toNumber(item.grossValue), 0),
    charges: details.reduce((sum, item) => sum + toNumber(item.charges), 0),
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

function getPortfolioDisplayAmount(category) {
  if (category.group === 'Fixed Income') {
    return toNumber(category.value)
  }

  if (category.group === 'Insurance') {
    return toNumber(category.invested)
  }

  if (category.group === 'Market' || category.group === 'Real Assets') {
    return toNumber(category.invested)
  }

  return toNumber(category.value)
}

export function getPortfolioOverview() {
  const categories = getCategorySummaries()
  const totalNetWorth = categories.reduce((sum, category) => sum + getPortfolioDisplayAmount(category), 0)
  const groupedAllocation = categories.reduce((groups, category) => {
    const currentGroup = groups[category.group] ?? {
      group: category.group,
      value: 0,
      categories: [],
    }

    currentGroup.value += getPortfolioDisplayAmount(category)
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
