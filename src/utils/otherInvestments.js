import { addTransaction, getTransactionRawData, loadData, saveData } from './storage'

const PPF_INTEREST_RATE = 7.1
const EPF_INTEREST_RATE = 8.25

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function todayLocalDateValue() {
  const today = new Date()
  const timezoneOffsetMs = today.getTimezoneOffset() * 60 * 1000
  return new Date(today.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

function monthsBetween(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }

  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth(),
  )
}

function countElapsedPayments(startDate, frequency) {
  if (!startDate) {
    return 0
  }

  const start = new Date(startDate)
  const today = new Date()

  if (Number.isNaN(start.getTime()) || today < start) {
    return 0
  }

  const monthsElapsed = monthsBetween(startDate, todayLocalDateValue())

  if (frequency === 'Yearly') {
    return Math.floor(monthsElapsed / 12) + 1
  }

  if (frequency === 'Quarterly') {
    return Math.floor(monthsElapsed / 3) + 1
  }

  return monthsElapsed + 1
}

function getTransactionsByCategory(category) {
  return loadData().transactions.filter((txn) => txn.category === category)
}

function getTransactionsByKey(category, fieldName, fieldValue) {
  const normalizedValue = String(fieldValue ?? '').trim().toUpperCase()

  return getTransactionsByCategory(category).filter(
    (txn) =>
      String(getTransactionRawData(txn)[fieldName] ?? '').trim().toUpperCase() ===
      normalizedValue,
  )
}

function getLatestBalance(transactions) {
  return transactions
    .slice()
    .sort((left, right) =>
      String(getTransactionRawData(left).date ?? '').localeCompare(
        String(getTransactionRawData(right).date ?? ''),
      ),
    )
    .reduce((balance, txn) => toNumber(txn.calculated?.balance) || balance, 0)
}

export const goldSilverCategory = 'goldSilver'
export const ppfCategory = 'ppf'
export const epfCategory = 'epf'
export const npsCategory = 'nps'
export const bondsCategory = 'bonds'
export const realEstateCategory = 'realEstate'
export const cryptoCategory = 'crypto'

export const goldSilverSchema = [
  {
    name: 'assetType',
    label: 'Asset Type',
    type: 'select',
    placeholder: 'Choose asset type',
    required: true,
    options: [
      { label: 'Gold', value: 'Gold' },
      { label: 'Silver', value: 'Silver' },
    ],
  },
  {
    name: 'holdingType',
    label: 'Holding Type',
    type: 'select',
    placeholder: 'Choose holding type',
    required: true,
    options: [
      { label: 'Physical', value: 'Physical' },
      { label: 'ETF', value: 'ETF' },
      { label: 'Digital', value: 'Digital' },
    ],
  },
  {
    name: 'txnType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose transaction type',
    required: true,
    options: [
      { label: 'INVEST', value: 'INVEST' },
      { label: 'SELL', value: 'SELL' },
    ],
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date',
    required: true,
  },
  {
    name: 'quantity',
    label: 'Quantity (grams)',
    type: 'number',
    placeholder: 'Enter quantity in grams',
    required: true,
    min: 0.0001,
    step: '0.0001',
  },
  {
    name: 'pricePerGram',
    label: 'Price Per Gram',
    type: 'number',
    placeholder: 'Enter price per gram',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const fdMasterSchema = [
  {
    name: 'bankName',
    label: 'Bank Name',
    type: 'text',
    placeholder: 'Enter bank name',
    required: true,
  },
  {
    name: 'accountNumber',
    label: 'Account Number (Last 4 Digits)',
    type: 'text',
    placeholder: 'Enter last 4 digits',
    required: true,
  },
  {
    name: 'depositAmount',
    label: 'Deposit Amount',
    type: 'number',
    placeholder: 'Enter deposit amount',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'interestRate',
    label: 'Interest Rate (%)',
    type: 'number',
    placeholder: 'Enter interest rate',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
    required: true,
  },
  {
    name: 'maturityDate',
    label: 'Maturity Date',
    type: 'date',
    required: true,
  },
  {
    name: 'tenureMonths',
    label: 'Tenure (Months)',
    type: 'number',
    placeholder: 'Enter tenure in months',
    required: true,
    min: 1,
    step: '1',
  },
  {
    name: 'payoutType',
    label: 'Payout Type',
    type: 'select',
    placeholder: 'Choose payout type',
    required: true,
    options: [
      { label: 'Cumulative', value: 'Cumulative' },
      { label: 'Non-Cumulative', value: 'Non-Cumulative' },
    ],
  },
  {
    name: 'interestPayoutFrequency',
    label: 'Interest Payout Frequency',
    type: 'select',
    placeholder: 'Choose payout frequency',
    required: true,
    options: [
      { label: 'Monthly', value: 'Monthly' },
      { label: 'Quarterly', value: 'Quarterly' },
      { label: 'Half-Yearly', value: 'Half-Yearly' },
      { label: 'Yearly', value: 'Yearly' },
      { label: 'At Maturity', value: 'At Maturity' },
    ],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'Choose status',
    required: true,
    defaultValue: 'ACTIVE',
    options: [
      { label: 'ACTIVE', value: 'ACTIVE' },
      { label: 'CLOSED', value: 'CLOSED' },
    ],
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const rdMasterSchema = [
  {
    name: 'bankName',
    label: 'Bank Name',
    type: 'text',
    placeholder: 'Enter bank name',
    required: true,
  },
  {
    name: 'accountNumber',
    label: 'Account Number (Last 4 Digits)',
    type: 'text',
    placeholder: 'Enter last 4 digits',
    required: true,
  },
  {
    name: 'monthlyDeposit',
    label: 'Monthly Deposit',
    type: 'number',
    placeholder: 'Enter monthly deposit',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'interestRate',
    label: 'Interest Rate (%)',
    type: 'number',
    placeholder: 'Enter interest rate',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
    required: true,
  },
  {
    name: 'maturityDate',
    label: 'Maturity Date',
    type: 'date',
    required: true,
  },
  {
    name: 'tenureMonths',
    label: 'Tenure (Months)',
    type: 'number',
    placeholder: 'Enter tenure in months',
    required: true,
    min: 1,
    step: '1',
  },
  {
    name: 'autoDebitDay',
    label: 'Auto Debit Day',
    type: 'number',
    placeholder: 'Enter debit day',
    required: true,
    min: 1,
    max: 31,
    step: '1',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'Choose status',
    required: true,
    defaultValue: 'ACTIVE',
    options: [
      { label: 'ACTIVE', value: 'ACTIVE' },
      { label: 'CLOSED', value: 'CLOSED' },
    ],
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const ppfSchema = [
  {
    name: 'bankName',
    label: 'Bank Name',
    type: 'text',
    placeholder: 'Enter bank name',
    required: true,
  },
  {
    name: 'accountNumber',
    label: 'Account Number (Last 4 Digits)',
    type: 'text',
    placeholder: 'Enter last 4 digits',
    required: true,
  },
  {
    name: 'txnType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose transaction type',
    required: true,
    options: [
      { label: 'DEPOSIT', value: 'DEPOSIT' },
      { label: 'INTEREST', value: 'INTEREST' },
    ],
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date',
    required: true,
  },
  {
    name: 'amount',
    label: 'Deposit Amount',
    type: 'number',
    placeholder: 'Enter amount',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const epfSchema = [
  {
    name: 'employerName',
    label: 'Employer Name',
    type: 'text',
    placeholder: 'Enter employer name',
    required: true,
  },
  {
    name: 'uanNumber',
    label: 'UAN Number (Last 4 Digits)',
    type: 'text',
    placeholder: 'Enter last 4 digits',
    required: true,
  },
  {
    name: 'memberId',
    label: 'Member ID',
    type: 'text',
    placeholder: 'Enter member ID',
    required: true,
  },
  {
    name: 'txnType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose transaction type',
    required: true,
    options: [
      { label: 'INVEST', value: 'INVEST' },
      { label: 'INTEREST', value: 'INTEREST' },
    ],
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date',
    required: true,
  },
  {
    name: 'joiningDate',
    label: 'Joining Date',
    type: 'date',
    required: false,
  },
  {
    name: 'exitDate',
    label: 'Exit Date',
    type: 'date',
    required: false,
  },
  {
    name: 'employeeContribution',
    label: 'Employee Contribution',
    type: 'number',
    placeholder: 'Enter employee contribution',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'employerContribution',
    label: 'Employer Contribution',
    type: 'number',
    placeholder: 'Enter employer contribution',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const npsSchema = [
  {
    name: 'pranNumber',
    label: 'PRAN Number',
    type: 'text',
    placeholder: 'Enter PRAN number',
    required: true,
  },
  {
    name: 'txnType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose transaction type',
    required: true,
    options: [
      { label: 'INVEST', value: 'INVEST' },
      { label: 'INTEREST', value: 'INTEREST' },
    ],
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date',
    required: true,
  },
  {
    name: 'amount',
    label: 'Amount',
    type: 'number',
    placeholder: 'Enter amount',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'tier',
    label: 'Tier',
    type: 'select',
    placeholder: 'Choose tier',
    required: true,
    options: [
      { label: 'Tier I', value: 'Tier I' },
      { label: 'Tier II', value: 'Tier II' },
    ],
  },
  {
    name: 'scheme',
    label: 'Scheme',
    type: 'text',
    placeholder: 'Enter scheme name',
    required: true,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const bondsSchema = [
  {
    name: 'bondName',
    label: 'Bond Name',
    type: 'text',
    placeholder: 'Enter bond name',
    required: true,
  },
  {
    name: 'txnType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose transaction type',
    required: true,
    options: [
      { label: 'BUY', value: 'BUY' },
      { label: 'SELL', value: 'SELL' },
      { label: 'INTEREST', value: 'INTEREST' },
    ],
  },
  {
    name: 'issuer',
    label: 'Issuer Name',
    type: 'text',
    placeholder: 'Enter issuer name',
    required: true,
  },
  {
    name: 'couponPaymentDate',
    label: 'Coupon Payment Date',
    type: 'date',
    required: true,
  },
  {
    name: 'faceValue',
    label: 'Face Value',
    type: 'number',
    placeholder: 'Enter face value',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    placeholder: 'Enter quantity',
    required: true,
    min: 0,
    step: '1',
  },
  {
    name: 'couponRate',
    label: 'Coupon Rate (%)',
    type: 'number',
    placeholder: 'Enter coupon rate',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'purchaseDate',
    label: 'Purchase Date',
    type: 'date',
    required: true,
  },
  {
    name: 'maturityDate',
    label: 'Maturity Date',
    type: 'date',
    required: true,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const licMasterSchema = [
  {
    name: 'policyName',
    label: 'Policy Name',
    type: 'text',
    placeholder: 'Enter policy name',
    required: true,
  },
  {
    name: 'policyNumber',
    label: 'Policy Number',
    type: 'text',
    placeholder: 'Enter policy number',
    required: true,
  },
  {
    name: 'premiumAmount',
    label: 'Premium Amount',
    type: 'number',
    placeholder: 'Enter premium amount',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'paymentFrequency',
    label: 'Payment Frequency',
    type: 'select',
    placeholder: 'Choose payment frequency',
    required: true,
    options: [
      { label: 'Monthly', value: 'Monthly' },
      { label: 'Quarterly', value: 'Quarterly' },
      { label: 'Yearly', value: 'Yearly' },
    ],
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
    required: true,
  },
  {
    name: 'maturityDate',
    label: 'Maturity Date',
    type: 'date',
    required: true,
  },
  {
    name: 'sumAssured',
    label: 'Sum Assured',
    type: 'number',
    placeholder: 'Enter sum assured',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'nominee',
    label: 'Nominee',
    type: 'text',
    placeholder: 'Enter nominee name',
    required: true,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'Choose status',
    required: true,
    defaultValue: 'ACTIVE',
    options: [
      { label: 'ACTIVE', value: 'ACTIVE' },
      { label: 'CLOSED', value: 'CLOSED' },
    ],
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const realEstateSchema = [
  {
    name: 'propertyName',
    label: 'Property Name',
    type: 'text',
    placeholder: 'Enter property name',
    required: true,
  },
  {
    name: 'purchaseDate',
    label: 'Purchase Date',
    type: 'date',
    required: true,
  },
  {
    name: 'purchaseValue',
    label: 'Purchase Value',
    type: 'number',
    placeholder: 'Enter purchase value',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'ownershipPercent',
    label: 'Ownership Percent',
    type: 'number',
    placeholder: 'Enter ownership percent',
    required: true,
    min: 0,
    max: 100,
    step: '0.01',
  },
  {
    name: 'location',
    label: 'Location',
    type: 'text',
    placeholder: 'Enter location',
    required: true,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const cryptoSchema = [
  {
    name: 'coinName',
    label: 'Coin Name',
    type: 'text',
    placeholder: 'Enter coin name',
    required: true,
  },
  {
    name: 'symbol',
    label: 'Symbol',
    type: 'text',
    placeholder: 'Enter symbol',
    required: true,
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date',
    required: true,
  },
  {
    name: 'txnType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose transaction type',
    required: true,
    options: [
      { label: 'BUY', value: 'BUY' },
      { label: 'SELL', value: 'SELL' },
      { label: 'TRANSFER', value: 'TRANSFER' },
    ],
  },
  {
    name: 'network',
    label: 'Network',
    type: 'text',
    placeholder: 'Enter network',
    required: true,
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    placeholder: 'Enter quantity',
    required: true,
    min: 0.00000001,
    step: '0.00000001',
  },
  {
    name: 'price',
    label: 'Price',
    type: 'number',
    placeholder: 'Enter price',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'charges',
    label: 'Transaction Fee',
    type: 'number',
    placeholder: 'Enter transaction fee',
    required: true,
    min: 0,
    step: '0.01',
    defaultValue: 0,
  },
  {
    name: 'exchange',
    label: 'Wallet / Exchange Name',
    type: 'text',
    placeholder: 'Enter wallet or exchange name',
    required: true,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const otherInvestmentSchemas = {
  [goldSilverCategory]: goldSilverSchema,
  fd: fdMasterSchema,
  rd: rdMasterSchema,
  [ppfCategory]: ppfSchema,
  [epfCategory]: epfSchema,
  [npsCategory]: npsSchema,
  [bondsCategory]: bondsSchema,
  lic: licMasterSchema,
  [realEstateCategory]: realEstateSchema,
  [cryptoCategory]: cryptoSchema,
}

export const otherInvestmentOptions = [
  { label: 'Gold / Silver', value: goldSilverCategory },
  { label: 'Fixed Deposit', value: 'fd' },
  { label: 'Recurring Deposit', value: 'rd' },
  { label: 'PPF', value: ppfCategory },
  { label: 'EPF', value: epfCategory },
  { label: 'NPS', value: npsCategory },
  { label: 'Bonds', value: bondsCategory },
  { label: 'LIC', value: 'lic' },
  { label: 'Real Estate', value: realEstateCategory },
  { label: 'Crypto', value: cryptoCategory },
]

export const otherInvestmentMasterCategories = ['rd', 'lic', ppfCategory, epfCategory, npsCategory, bondsCategory, cryptoCategory]

export function calculateGoldSilver(fields) {
  const sign = String(fields.txnType ?? '').toUpperCase() === 'SELL' ? -1 : 1

  return {
    totalValue: toNumber(fields.quantity) * toNumber(fields.pricePerGram) * sign,
  }
}

export function calculateRealEstate(fields) {
  return {
    totalValue: toNumber(fields.purchaseValue),
  }
}

export function calculateFdMaster(fields) {
  const principal = toNumber(fields.depositAmount)
  const rate = toNumber(fields.interestRate)
  const tenureMonths = toNumber(fields.tenureMonths)
  const interestEarned = (principal * rate * tenureMonths) / (12 * 100)

  return {
    maturityAmount: principal + interestEarned,
    interestEarned,
  }
}

export function calculateRdMaster(fields) {
  const monthlyDeposit = toNumber(fields.monthlyDeposit)
  const rate = toNumber(fields.interestRate)
  const tenureMonths = toNumber(fields.tenureMonths)
  const totalInvested = monthlyDeposit * tenureMonths
  const interestEarned =
    (monthlyDeposit * tenureMonths * (tenureMonths + 1) * rate) / (24 * 100)

  return {
    totalInvested,
    maturityAmount: totalInvested + interestEarned,
  }
}

export function calculatePpf(fields) {
  const amount = toNumber(fields.amount)
  const interestRate = toNumber(fields.interestRate) || PPF_INTEREST_RATE
  const matchingTransactions = getTransactionsByKey(
    ppfCategory,
    'accountNumber',
    fields.accountNumber,
  )
  const previousBalance = getLatestBalance(matchingTransactions)
  const yearlyInterest = (amount * interestRate) / 100

  return {
    yearlyInterest,
    balance: previousBalance + amount + yearlyInterest,
  }
}

export function calculateEpf(fields) {
  const employeeContribution = toNumber(fields.employeeContribution)
  const employerContribution = toNumber(fields.employerContribution)
  const totalContribution = employeeContribution + employerContribution
  const matchingTransactions = getTransactionsByKey(
    epfCategory,
    'uanNumber',
    fields.uanNumber,
  )
  const previousBalance = getLatestBalance(matchingTransactions)

  return {
    totalContribution,
    balance: previousBalance + totalContribution + (totalContribution * EPF_INTEREST_RATE) / 100,
  }
}

export function calculateLicMaster(fields) {
  const premiumAmount = toNumber(fields.premiumAmount)
  const elapsedPayments = countElapsedPayments(fields.startDate, fields.paymentFrequency)

  return {
    totalPremiumPaid: premiumAmount * elapsedPayments,
  }
}

export function calculateOtherInvestment(category, fields) {
  switch (category) {
    case goldSilverCategory:
      return calculateGoldSilver(fields)
    case 'fd':
      return calculateFdMaster(fields)
    case 'rd':
      return calculateRdMaster(fields)
    case ppfCategory:
      return calculatePpf(fields)
    case epfCategory:
      return calculateEpf(fields)
    case 'lic':
      return calculateLicMaster(fields)
    case realEstateCategory:
      return calculateRealEstate(fields)
    default:
      return {}
  }
}

function buildTransaction(category, fields) {
  return {
    category,
    rawData: fields,
    calculated: calculateOtherInvestment(category, fields),
  }
}

function buildMasterEntry(fields, calculated = {}) {
  return {
    id: fields.id ?? crypto.randomUUID(),
    ...fields,
    status: fields.status ?? 'ACTIVE',
    calculated,
  }
}

function saveMasterCategory(category, fields) {
  const data = loadData()
  const entry = buildMasterEntry(fields, calculateOtherInvestment(category, fields))
  const nextData = {
    ...data,
    masters: {
      ...data.masters,
      [category]: [...(data.masters[category] ?? []), entry],
    },
  }

  saveData(nextData)
  return entry
}

function updateMasterCategory(category, id, fields) {
  const data = loadData()
  let updatedEntry = null

  const nextEntries = (data.masters[category] ?? []).map((item) => {
    if (item.id !== id) {
      return item
    }

    updatedEntry = buildMasterEntry(
      {
        ...item,
        ...fields,
        id,
      },
      calculateOtherInvestment(category, {
        ...item,
        ...fields,
        id,
      }),
    )

    return updatedEntry
  })

  if (!updatedEntry) {
    return null
  }

  saveData({
    ...data,
    masters: {
      ...data.masters,
      [category]: nextEntries,
    },
  })

  return updatedEntry
}

function deleteMasterCategory(category, id) {
  const data = loadData()
  const nextEntries = (data.masters[category] ?? []).filter((item) => item.id !== id)

  if (nextEntries.length === (data.masters[category] ?? []).length) {
    return false
  }

  saveData({
    ...data,
    masters: {
      ...data.masters,
      [category]: nextEntries,
    },
  })

  return true
}

export function isOtherInvestmentMasterCategory(category) {
  return otherInvestmentMasterCategories.includes(category)
}

export function saveOtherInvestment(category, fields) {
  if (isOtherInvestmentMasterCategory(category)) {
    return saveMasterCategory(category, fields)
  }

  return addTransaction(buildTransaction(category, fields))
}

export function updateOtherInvestment(category, id, fields) {
  if (isOtherInvestmentMasterCategory(category)) {
    return updateMasterCategory(category, id, fields)
  }

  return null
}

export function deleteOtherInvestment(category, id) {
  if (isOtherInvestmentMasterCategory(category)) {
    return deleteMasterCategory(category, id)
  }

  return false
}

export function getGoldSilverSummary() {
  return getTransactionsByCategory(goldSilverCategory).reduce(
    (summary, txn) => {
      summary.totalValue += toNumber(txn.calculated?.totalValue)
      return summary
    },
    {
      totalValue: 0,
    },
  )
}

export function getFdSummary() {
  return getTransactionsByCategory('fd').reduce(
    (summary, item) => {
      summary.maturityAmount += toNumber(item.calculated?.maturityAmount)
      return summary
    },
    {
      maturityAmount: 0,
    },
  )
}

export function getRdSummary() {
  return (loadData().masters.rd ?? []).reduce(
    (summary, item) => {
      summary.maturityAmount += toNumber(item.calculated?.maturityAmount)
      return summary
    },
    {
      maturityAmount: 0,
    },
  )
}
