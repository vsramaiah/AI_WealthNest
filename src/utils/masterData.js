import {
  deleteMutualFundMaster,
  getMutualFundMasterFormValues,
  getMutualFundMasters,
  mutualFundMasterSchema,
  mutualFundTransactionSchema,
  resolveSipDebitDay,
  saveMutualFundMaster,
  updateMutualFundMaster,
} from './mutualFunds'
import {
  bondsCategory,
  cryptoCategory,
  epfCategory,
  npsCategory,
  bondsSchema,
  cryptoSchema,
  epfSchema,
  licMasterSchema,
  npsSchema,
  ppfCategory,
  rdMasterSchema,
} from './otherInvestments'
import { loadData, saveData } from './storage'
import { transactionCategoryOptions, transactionSchemas } from './transactionSchemas'

function todayValue() {
  const today = new Date()
  const timezoneOffsetMs = today.getTimezoneOffset() * 60 * 1000
  return new Date(today.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

function getFinancialYearValue(dateValue = todayValue()) {
  const date = parseDate(dateValue)

  if (!date) {
    return ''
  }

  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
  const nextYearShort = String((year + 1) % 100).padStart(2, '0')
  return `${year}-${nextYearShort}`
}

function parseDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = parseDate(value)

  if (!date) {
    return 'Not scheduled'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDayOfMonth(dayValue) {
  const day = Number(dayValue)

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return 'Not scheduled'
  }

  return `Day ${day}`
}

function getDayOfMonthFromDate(value) {
  const date = parseDate(value)
  return date ? date.getDate() : null
}

function formatRecurringDueDate(dayValue, fallbackDate = '') {
  const formattedDay = formatDayOfMonth(dayValue)

  if (formattedDay !== 'Not scheduled') {
    return formattedDay
  }

  const fallbackDay = getDayOfMonthFromDate(fallbackDate)
  return fallbackDay ? formatDayOfMonth(fallbackDay) : 'Not scheduled'
}

function toAmount(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function buildStatusField() {
  return {
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
  }
}

function getRecordStatus(record) {
  return record.status ?? 'ACTIVE'
}

function updateGenericMasterRecord(category, id, fields) {
  const data = loadData()
  let updatedItem = null

  const nextItems = (data.masters[category] ?? []).map((item) => {
    if (item.id !== id) {
      return item
    }

    updatedItem = {
      ...item,
      ...fields,
      id,
      status: fields.status ?? item.status ?? 'ACTIVE',
    }

    return updatedItem
  })

  if (!updatedItem) {
    return null
  }

  saveData({
    ...data,
    masters: {
      ...data.masters,
      [category]: nextItems,
    },
  })

  return updatedItem
}

function deleteGenericMasterRecord(category, id) {
  const data = loadData()
  const nextItems = (data.masters[category] ?? []).filter((item) => item.id !== id)

  if (nextItems.length === (data.masters[category] ?? []).length) {
    return false
  }

  saveData({
    ...data,
    masters: {
      ...data.masters,
      [category]: nextItems,
    },
  })

  return true
}

function createGenericMasterRecord(category, fields) {
  const data = loadData()
  const nextRecord = {
    id: fields.id ?? crypto.randomUUID(),
    ...fields,
    status: fields.status ?? 'ACTIVE',
  }

  saveData({
    ...data,
    masters: {
      ...data.masters,
      [category]: [...(data.masters[category] ?? []), nextRecord],
    },
  })

  return nextRecord
}

function getMfTxnType(master) {
  return master?.transactionType ?? master?.investmentType ?? 'SIP'
}

function getMfMasterAmount(master) {
  if (!master) {
    return ''
  }

  return getMfTxnType(master) === 'LUMPSUM' ? master.amount : master.sipAmount
}

function getMfMasterDate(master) {
  if (!master) {
    return 'Not scheduled'
  }

  return getMfTxnType(master) === 'LUMPSUM'
    ? ''
    : formatRecurringDueDate(
        resolveSipDebitDay(master.sipDueDate, master.sipStartDate),
        master.sipStartDate,
      )
}

const mfSlaveSchema = mutualFundTransactionSchema.filter((field) =>
  ['date', 'amount', 'nav', 'units', 'notes'].includes(field.name),
)

const rdSlaveSchema = [
  {
    name: 'txnType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose transaction type',
    required: true,
    defaultValue: 'DEPOSIT',
    options: [
      { label: 'DEPOSIT', value: 'DEPOSIT' },
      { label: 'INTEREST', value: 'INTEREST' },
    ],
  },
  {
    name: 'date',
    label: 'Transaction Date',
    type: 'date',
    required: true,
    defaultValue: todayValue(),
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
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

const licSlaveSchema = [
  {
    name: 'date',
    label: 'Premium Date',
    type: 'date',
    required: true,
    defaultValue: todayValue(),
  },
  {
    name: 'financialYear',
    label: 'Financial Year',
    type: 'text',
    placeholder: 'Enter financial year',
    required: true,
    defaultValue: getFinancialYearValue(),
  },
  {
    name: 'amount',
    label: 'Premium Amount',
    type: 'number',
    placeholder: 'Enter premium amount',
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

const ppfMasterSchema = [
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
    required: false,
    min: 0,
    step: '0.01',
  },
  {
    name: 'interestRate',
    label: 'Interest Rate (%)',
    type: 'number',
    placeholder: 'Enter interest rate',
    required: false,
    min: 0,
    step: '0.01',
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
    required: false,
  },
  {
    name: 'maturityDate',
    label: 'Maturity Date',
    type: 'date',
    required: false,
  },
  {
    name: 'tenureMonths',
    label: 'Tenure (Months)',
    type: 'number',
    placeholder: 'Enter tenure in months',
    required: false,
    min: 0,
    step: '1',
  },
  {
    name: 'autoDebitDay',
    label: 'Auto Debit Day',
    type: 'number',
    placeholder: 'Enter auto debit day (1-31)',
    required: false,
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

const ppfSlaveSchema = (transactionSchemas[ppfCategory] ?? []).filter((field) =>
  ['txnType', 'date', 'amount', 'notes'].includes(field.name),
)

const epfMasterSchema = [
  ...epfSchema.filter((field) =>
    ['employerName', 'uanNumber', 'memberId', 'joiningDate', 'exitDate', 'notes'].includes(field.name),
  ),
  buildStatusField(),
]

const epfSlaveSchema = epfSchema.filter((field) =>
  ['txnType', 'date', 'employeeContribution', 'employerContribution', 'notes'].includes(field.name),
)

const npsMasterSchema = [
  ...npsSchema.filter((field) => ['pranNumber', 'tier', 'scheme', 'notes'].includes(field.name)),
  buildStatusField(),
]

const npsSlaveSchema = npsSchema.filter((field) =>
  ['txnType', 'date', 'amount', 'notes'].includes(field.name),
)

const bondsMasterSchema = [
  ...bondsSchema.filter((field) =>
    ['bondName', 'issuer', 'couponRate', 'couponPaymentDate', 'maturityDate', 'notes'].includes(field.name),
  ),
  buildStatusField(),
]

const bondsSlaveSchema = bondsSchema.filter((field) =>
  ['txnType', 'purchaseDate', 'faceValue', 'quantity', 'notes'].includes(field.name),
)

const cryptoMasterSchema = [
  ...cryptoSchema.filter((field) =>
    ['coinName', 'symbol', 'network', 'exchange', 'notes'].includes(field.name),
  ),
  buildStatusField(),
]

const cryptoSlaveSchema = cryptoSchema.filter((field) =>
  ['date', 'txnType', 'quantity', 'price', 'charges', 'notes'].includes(field.name),
)

export const masterCategoryConfigs = {
  mf: {
    category: 'mf',
    label: 'Mutual Funds',
    storageKey: 'mf',
    masterSchema: mutualFundMasterSchema,
    listRecords: () => getMutualFundMasters(),
    saveRecord: (fields) => saveMutualFundMaster(fields),
    updateRecord: (id, fields) => updateMutualFundMaster(id, fields),
    deleteRecord: (id) => deleteMutualFundMaster(id),
    getInitialValues: (record) => getMutualFundMasterFormValues(record),
    buildCard: (record) => ({
      title: record.fundName || 'Mutual Fund',
      identifier: record.folioNumber ? `Folio ${record.folioNumber}` : 'Folio unavailable',
      amount: toAmount(getMfMasterAmount(record)),
      dueDate: getMfMasterDate(record),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: (master) => ({
      date: todayValue(),
      amount: getMfMasterAmount(master) ?? '',
      nav: '',
      units: '',
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      txnType: getMfTxnType(master),
      fundId: master.folioNumber || master.fundName || master.id,
      fundName: master.fundName,
      platform: master.platform,
      folioNumber: master.folioNumber,
      transactionType: getMfTxnType(master),
    }),
    slaveSchema: mfSlaveSchema,
  },
  rd: {
    category: 'rd',
    label: 'Recurring Deposits',
    storageKey: 'rd',
    masterSchema: rdMasterSchema,
    listRecords: () => loadData().masters.rd ?? [],
    saveRecord: (fields) => createGenericMasterRecord('rd', fields),
    updateRecord: (id, fields) => updateGenericMasterRecord('rd', id, fields),
    deleteRecord: (id) => deleteGenericMasterRecord('rd', id),
    buildCard: (record) => ({
      title: record.bankName || 'RD Account',
      identifier: record.accountNumber ? `A/C ${record.accountNumber}` : 'Account unavailable',
      amount: toAmount(record.monthlyDeposit),
      dueDate: formatRecurringDueDate(record.autoDebitDay, record.startDate),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: (master) => ({
      txnType: 'DEPOSIT',
      date: todayValue(),
      amount: master?.monthlyDeposit ?? '',
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      txnType: fields.txnType,
      bankName: master.bankName,
      accountNumber: master.accountNumber,
      interestRate: master.interestRate,
      tenureMonths: master.tenureMonths,
      transactionType: fields.txnType,
    }),
    slaveSchema: rdSlaveSchema,
  },
  lic: {
    category: 'lic',
    label: 'LIC Policies',
    storageKey: 'lic',
    masterSchema: licMasterSchema,
    listRecords: () => loadData().masters.lic ?? [],
    saveRecord: (fields) => createGenericMasterRecord('lic', fields),
    updateRecord: (id, fields) => updateGenericMasterRecord('lic', id, fields),
    deleteRecord: (id) => deleteGenericMasterRecord('lic', id),
    buildCard: (record) => ({
      title: record.policyName || 'LIC Policy',
      identifier: record.policyNumber ? `Policy ${record.policyNumber}` : 'Policy unavailable',
      amount: toAmount(record.premiumAmount),
      dueDate: formatRecurringDueDate(null, record.startDate),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: (master) => ({
      date: todayValue(),
      financialYear: getFinancialYearValue(),
      amount: master?.premiumAmount ?? '',
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      txnType: 'PREMIUM',
      policyName: master.policyName,
      policyNumber: master.policyNumber,
      paymentFrequency: master.paymentFrequency,
      transactionType: 'PREMIUM',
    }),
    slaveSchema: licSlaveSchema,
  },
  ppf: {
    category: 'ppf',
    label: 'PPF',
    storageKey: 'ppf',
    masterSchema: ppfMasterSchema,
    listRecords: () => loadData().masters.ppf ?? [],
    saveRecord: (fields) => createGenericMasterRecord('ppf', fields),
    updateRecord: (id, fields) => updateGenericMasterRecord('ppf', id, fields),
    deleteRecord: (id) => deleteGenericMasterRecord('ppf', id),
    buildCard: (record) => ({
      title: record.bankName || 'PPF Account',
      identifier: record.accountNumber ? `A/C ${record.accountNumber}` : 'Account unavailable',
      amount: toAmount(record.depositAmount),
      dueDate: formatRecurringDueDate(record.autoDebitDay, record.startDate),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: (master) => ({
      txnType: 'DEPOSIT',
      date: todayValue(),
      amount: master?.depositAmount ?? '',
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      bankName: master.bankName,
      accountNumber: master.accountNumber,
      depositAmount: master.depositAmount,
      interestRate: master.interestRate,
      startDate: master.startDate,
      maturityDate: master.maturityDate,
      tenureMonths: master.tenureMonths,
      autoDebitDay: master.autoDebitDay,
      transactionType: fields.txnType,
      status: master.status,
    }),
    slaveSchema: ppfSlaveSchema,
  },
  [epfCategory]: {
    category: epfCategory,
    label: 'EPF',
    storageKey: epfCategory,
    masterSchema: epfMasterSchema,
    listRecords: () => loadData().masters[epfCategory] ?? [],
    saveRecord: (fields) => createGenericMasterRecord(epfCategory, fields),
    updateRecord: (id, fields) => updateGenericMasterRecord(epfCategory, id, fields),
    deleteRecord: (id) => deleteGenericMasterRecord(epfCategory, id),
    buildCard: (record) => ({
      title: record.employerName || 'EPF Account',
      identifier: record.memberId ? `Member ${record.memberId}` : record.uanNumber ? `UAN ${record.uanNumber}` : 'Account unavailable',
      amount: 0,
      dueDate: formatDate(record.joiningDate),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: () => ({
      txnType: 'INVEST',
      date: todayValue(),
      employeeContribution: '',
      employerContribution: '',
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      employerName: master.employerName,
      uanNumber: master.uanNumber,
      memberId: master.memberId,
      joiningDate: master.joiningDate,
      exitDate: master.exitDate,
      transactionType: fields.txnType,
    }),
    slaveSchema: epfSlaveSchema,
  },
  [npsCategory]: {
    category: npsCategory,
    label: 'NPS',
    storageKey: npsCategory,
    masterSchema: npsMasterSchema,
    listRecords: () => loadData().masters[npsCategory] ?? [],
    saveRecord: (fields) => createGenericMasterRecord(npsCategory, fields),
    updateRecord: (id, fields) => updateGenericMasterRecord(npsCategory, id, fields),
    deleteRecord: (id) => deleteGenericMasterRecord(npsCategory, id),
    buildCard: (record) => ({
      title: record.scheme || 'NPS Account',
      identifier: record.pranNumber ? `PRAN ${record.pranNumber}` : 'Account unavailable',
      amount: 0,
      dueDate: record.tier || 'Not scheduled',
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: () => ({
      txnType: 'INVEST',
      date: todayValue(),
      amount: '',
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      pranNumber: master.pranNumber,
      tier: master.tier,
      scheme: master.scheme,
      transactionType: fields.txnType,
    }),
    slaveSchema: npsSlaveSchema,
  },
  [bondsCategory]: {
    category: bondsCategory,
    label: 'Bonds',
    storageKey: bondsCategory,
    masterSchema: bondsMasterSchema,
    listRecords: () => loadData().masters[bondsCategory] ?? [],
    saveRecord: (fields) => createGenericMasterRecord(bondsCategory, fields),
    updateRecord: (id, fields) => updateGenericMasterRecord(bondsCategory, id, fields),
    deleteRecord: (id) => deleteGenericMasterRecord(bondsCategory, id),
    buildCard: (record) => ({
      title: record.bondName || 'Bond',
      identifier: record.issuer ? `Issuer ${record.issuer}` : 'Issuer unavailable',
      amount: 0,
      dueDate: formatDate(record.couponPaymentDate || record.maturityDate),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: () => ({
      txnType: 'BUY',
      purchaseDate: todayValue(),
      faceValue: '',
      quantity: '',
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      bondName: master.bondName,
      issuer: master.issuer,
      couponRate: master.couponRate,
      couponPaymentDate: master.couponPaymentDate,
      maturityDate: master.maturityDate,
      transactionType: fields.txnType,
    }),
    slaveSchema: bondsSlaveSchema,
  },
  [cryptoCategory]: {
    category: cryptoCategory,
    label: 'Crypto',
    storageKey: cryptoCategory,
    masterSchema: cryptoMasterSchema,
    listRecords: () => loadData().masters[cryptoCategory] ?? [],
    saveRecord: (fields) => createGenericMasterRecord(cryptoCategory, fields),
    updateRecord: (id, fields) => updateGenericMasterRecord(cryptoCategory, id, fields),
    deleteRecord: (id) => deleteGenericMasterRecord(cryptoCategory, id),
    buildCard: (record) => ({
      title: record.coinName || 'Crypto',
      identifier: record.symbol ? `${record.symbol}` : 'Symbol unavailable',
      amount: 0,
      dueDate: record.network || 'Not scheduled',
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: () => ({
      date: todayValue(),
      txnType: 'BUY',
      quantity: '',
      price: '',
      charges: 0,
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      coinName: master.coinName,
      symbol: master.symbol,
      network: master.network,
      exchange: master.exchange,
      transactionType: fields.txnType,
    }),
    slaveSchema: cryptoSlaveSchema,
  },
}

const masterSlaveCategorySet = new Set(Object.keys(masterCategoryConfigs))

export const masterCategoryOptions = Object.values(masterCategoryConfigs).map((config) => ({
  label: config.label,
  value: config.category,
}))

export const slaveCategoryOptions = transactionCategoryOptions

export function hasMasterConfig(category) {
  return Boolean(masterCategoryConfigs[category])
}

export function requiresMasterSelection(category) {
  return masterSlaveCategorySet.has(category)
}

export function getMasterCategoryConfig(category) {
  return masterCategoryConfigs[category] ?? null
}

export function getMasterFormInitialValues(category, record) {
  const config = getMasterCategoryConfig(category)

  if (!config || !record) {
    return record
  }

  return config.getInitialValues ? config.getInitialValues(record) : record
}

export function listMasterRecords() {
  return Object.values(masterCategoryConfigs).reduce((collection, config) => {
    collection[config.category] = config.listRecords().map((record) => ({
      ...record,
      category: config.category,
    }))
    return collection
  }, {})
}

export function listActiveMasterRecords(category) {
  const config = getMasterCategoryConfig(category)

  if (!config) {
    return []
  }

  return config
    .listRecords()
    .filter((record) => getRecordStatus(record) === 'ACTIVE')
    .map((record) => ({
      ...record,
      category,
    }))
}

export function saveMasterRecord(category, fields, existingId = null) {
  const config = getMasterCategoryConfig(category)

  if (!config) {
    return null
  }

  if (existingId) {
    return config.updateRecord(existingId, fields)
  }

  if (config.saveRecord) {
    return config.saveRecord(fields)
  }

  return null
}

export function toggleMasterRecordStatus(category, record) {
  const nextStatus = getRecordStatus(record) === 'ACTIVE' ? 'CLOSED' : 'ACTIVE'
  return saveMasterRecord(category, { ...record, status: nextStatus }, record.id)
}

export function deleteMasterRecord(category, id) {
  const config = getMasterCategoryConfig(category)

  if (!config?.deleteRecord) {
    return false
  }

  return config.deleteRecord(id)
}

export function buildMasterCardMeta(category, record) {
  const config = getMasterCategoryConfig(category)
  return config?.buildCard(record) ?? null
}

export function getSlaveSchema(category) {
  const config = getMasterCategoryConfig(category)

  if (config && 'slaveSchema' in config) {
    return config.slaveSchema
  }

  return transactionSchemas[category] ?? []
}

export function buildSlaveInitialValues(category, master, editingTransaction = null) {
  if (editingTransaction && editingTransaction.category === category) {
    return editingTransaction.rawData ?? null
  }

  const config = getMasterCategoryConfig(category)

  if (config?.buildSlaveInitialValues) {
    return config.buildSlaveInitialValues(master)
  }

  return null
}

export function buildSlaveRawData(category, fields, master = null) {
  const config = getMasterCategoryConfig(category)

  if (master && config?.buildSlaveRawData) {
    return config.buildSlaveRawData(fields, master)
  }

  return fields
}
