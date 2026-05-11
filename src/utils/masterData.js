import {
  getMutualFundMasterFormValues,
  getMutualFundMasters,
  mutualFundMasterSchema,
  mutualFundTransactionSchema,
  resolveSipDebitDay,
  saveMutualFundMaster,
  updateMutualFundMaster,
} from './mutualFunds'
import {
  licMasterSchema,
  ppfCategory,
  rdMasterSchema,
} from './otherInvestments'
import { loadData, saveData } from './storage'
import { transactionCategoryOptions, transactionSchemas } from './transactionSchemas'

function todayValue() {
  return new Date().toISOString().slice(0, 10)
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
  return master.transactionType ?? master.investmentType ?? 'SIP'
}

const mfSlaveSchema = mutualFundTransactionSchema.filter((field) =>
  ['date', 'amount', 'nav', 'units', 'notes'].includes(field.name),
)

const rdSlaveSchema = [
  {
    name: 'date',
    label: 'Deposit Date',
    type: 'date',
    required: true,
    defaultValue: todayValue(),
  },
  {
    name: 'amount',
    label: 'Deposit Amount',
    type: 'number',
    placeholder: 'Enter deposit amount',
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

export const masterCategoryConfigs = {
  mf: {
    category: 'mf',
    label: 'Mutual Funds',
    storageKey: 'mf',
    masterSchema: mutualFundMasterSchema,
    listRecords: () => getMutualFundMasters(),
    saveRecord: (fields) => saveMutualFundMaster(fields),
    updateRecord: (id, fields) => updateMutualFundMaster(id, fields),
    getInitialValues: (record) => getMutualFundMasterFormValues(record),
    buildCard: (record) => ({
      title: record.fundName || 'Mutual Fund',
      identifier: record.folioNumber ? `Folio ${record.folioNumber}` : 'Folio unavailable',
      amount: toAmount(record.sipAmount),
      dueDate: formatRecurringDueDate(
        resolveSipDebitDay(record.sipDueDate, record.sipStartDate),
        record.sipStartDate,
      ),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: (master) => ({
      date: todayValue(),
      amount: master?.sipAmount ?? '',
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
    buildCard: (record) => ({
      title: record.bankName || 'RD Account',
      identifier: record.accountNumber ? `A/C ${record.accountNumber}` : 'Account unavailable',
      amount: toAmount(record.monthlyDeposit),
      dueDate: formatRecurringDueDate(record.autoDebitDay, record.startDate),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: (master) => ({
      date: todayValue(),
      amount: master?.monthlyDeposit ?? '',
      notes: '',
    }),
    buildSlaveRawData: (fields, master) => ({
      ...fields,
      masterId: master.id,
      txnType: 'DEPOSIT',
      bankName: master.bankName,
      accountNumber: master.accountNumber,
      interestRate: master.interestRate,
      tenureMonths: master.tenureMonths,
      transactionType: 'DEPOSIT',
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
    buildCard: (record) => ({
      title: record.policyName || 'LIC Policy',
      identifier: record.policyNumber ? `Policy ${record.policyNumber}` : 'Policy unavailable',
      amount: toAmount(record.premiumAmount),
      dueDate: formatRecurringDueDate(null, record.startDate),
      status: getRecordStatus(record),
    }),
    buildSlaveInitialValues: (master) => ({
      date: todayValue(),
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
    label: 'PPF Accounts',
    storageKey: 'ppf',
    masterSchema: ppfMasterSchema,
    listRecords: () => loadData().masters.ppf ?? [],
    saveRecord: (fields) => createGenericMasterRecord('ppf', fields),
    updateRecord: (id, fields) => updateGenericMasterRecord('ppf', id, fields),
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
  if (editingTransaction) {
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
