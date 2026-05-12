import { addTransaction, getTransactionRawData, loadData, saveData } from './storage'

export const mutualFundCategory = 'mf'

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function toUpperTrimmed(value) {
  return String(value ?? '').trim().toUpperCase()
}

function parseDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function resolveSipDebitDay(sipDueDate, sipStartDate = '') {
  const numericValue = Number(sipDueDate)

  if (Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 31) {
    return numericValue
  }

  const dueDate = parseDate(sipDueDate)

  if (dueDate) {
    return dueDate.getDate()
  }

  const startDate = parseDate(sipStartDate)
  return startDate ? startDate.getDate() : null
}

export function getMutualFundMasterFormValues(master) {
  if (!master) {
    return null
  }

  return {
    ...master,
    sipDueDate: resolveSipDebitDay(master.sipDueDate, master.sipStartDate) ?? '',
  }
}

export const mutualFundMasterSchema = [
  {
    name: 'fundName',
    label: 'Fund Name',
    type: 'text',
    placeholder: 'Enter fund name',
    required: true,
  },
  {
    name: 'platform',
    label: 'Platform',
    type: 'text',
    placeholder: 'Enter platform name',
    required: true,
  },
  {
    name: 'folioNumber',
    label: 'Folio Number',
    type: 'text',
    placeholder: 'Enter folio number',
    required: true,
  },
  {
    name: 'transactionType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose investment type',
    required: true,
    options: [
      { label: 'SIP', value: 'SIP' },
      { label: 'LUMPSUM', value: 'LUMPSUM' },
    ],
  },
  {
    name: 'sipAmount',
    label: 'SIP Amount',
    type: 'number',
    placeholder: 'Enter SIP amount',
    required: false,
    min: 0,
    step: '0.01',
  },
  {
    name: 'sipStartDate',
    label: 'SIP Start Date',
    type: 'date',
    required: false,
  },
  {
    name: 'sipEndDate',
    label: 'SIP End Date',
    type: 'date',
    required: false,
  },
  {
    name: 'sipDueDate',
    label: 'SIP Debit Day',
    type: 'number',
    placeholder: 'Enter debit day (1-31)',
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
    options: [
      { label: 'ACTIVE', value: 'ACTIVE' },
      { label: 'STOPPED', value: 'STOPPED' },
      { label: 'REDEEMED', value: 'REDEEMED' },
    ],
  },
  {
    name: 'redeemDate',
    label: 'Redeem Date',
    type: 'date',
    required: false,
    showWhen: {
      status: 'REDEEMED',
    },
  },
  {
    name: 'sipCancelDate',
    label: 'Stop Date',
    type: 'date',
    required: false,
    showWhen: {
      status: 'STOPPED',
    },
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const mutualFundTransactionSchema = [
  {
    name: 'fundId',
    label: 'Fund ID',
    type: 'text',
    placeholder: 'Enter fund ID or folio reference',
    required: true,
  },
  {
    name: 'date',
    label: 'Transaction Date',
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
      { label: 'SIP', value: 'SIP' },
      { label: 'LUMPSUM', value: 'LUMPSUM' },
      { label: 'REDEEM', value: 'REDEEM' },
    ],
  },
  {
    name: 'amount',
    label: 'Amount',
    type: 'number',
    placeholder: 'Enter transaction amount',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'nav',
    label: 'NAV',
    type: 'number',
    placeholder: 'Enter NAV if known',
    required: false,
    min: 0.0001,
    step: '0.0001',
    validate: (value, values) => {
      if (`${value}`.trim() === '' && `${values.units ?? ''}`.trim() === '') {
        return 'Enter NAV or Units.'
      }

      return ''
    },
  },
  {
    name: 'units',
    label: 'Units',
    type: 'number',
    placeholder: 'Enter units if known',
    required: false,
    min: 0.0001,
    step: '0.0001',
    validate: (value, values) => {
      if (`${value}`.trim() === '' && `${values.nav ?? ''}`.trim() === '') {
        return 'Enter Units or NAV.'
      }

      return ''
    },
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export function createMutualFundMaster(fields) {
  const transactionType = fields.transactionType ?? fields.investmentType ?? 'SIP'

  return {
    id: fields.id ?? crypto.randomUUID(),
    ...fields,
    transactionType,
    investmentType: transactionType,
    status: fields.status ?? 'ACTIVE',
  }
}

export function saveMutualFundMaster(fields) {
  const data = loadData()
  const nextMaster = createMutualFundMaster(fields)
  const nextData = {
    ...data,
    masters: {
      ...data.masters,
      mf: [...data.masters.mf, nextMaster],
    },
  }

  saveData(nextData)
  return nextMaster
}

export function getMutualFundMasters() {
  return loadData().masters.mf
}

export function updateMutualFundMaster(id, fields) {
  const data = loadData()
  let updatedMaster = null

  const nextMasters = data.masters.mf.map((item) => {
    if (item.id !== id) {
      return item
    }

    updatedMaster = createMutualFundMaster({
      ...item,
      ...fields,
      id,
    })

    return updatedMaster
  })

  if (!updatedMaster) {
    return null
  }

  saveData({
    ...data,
    masters: {
      ...data.masters,
      mf: nextMasters,
    },
  })

  return updatedMaster
}

export function deleteMutualFundMaster(id) {
  const data = loadData()
  const nextMasters = data.masters.mf.filter((item) => item.id !== id)

  if (nextMasters.length === data.masters.mf.length) {
    return false
  }

  saveData({
    ...data,
    masters: {
      ...data.masters,
      mf: nextMasters,
    },
  })

  return true
}

export function calculateMutualFundTransaction(fields) {
  const amount = toNumber(fields.amount)
  const nav = toNumber(fields.nav)
  const units = toNumber(fields.units)

  let derivedNav = nav
  let derivedUnits = units

  if (amount > 0 && nav > 0 && units <= 0) {
    derivedUnits = amount / nav
  }

  if (amount > 0 && units > 0 && nav <= 0) {
    derivedNav = amount / units
  }

  return {
    nav: derivedNav,
    units: derivedUnits,
  }
}

export function createMutualFundTransaction(fields) {
  return {
    category: mutualFundCategory,
    rawData: fields,
    calculated: calculateMutualFundTransaction(fields),
  }
}

export function saveMutualFundTransaction(fields) {
  return addTransaction(createMutualFundTransaction(fields))
}

export function getMutualFundTransactions(fundId) {
  const normalizedFundId = fundId ? toUpperTrimmed(fundId) : ''

  return loadData().transactions.filter((txn) => {
    if (txn.category !== mutualFundCategory) {
      return false
    }

    if (!normalizedFundId) {
      return true
    }

    return toUpperTrimmed(getTransactionRawData(txn).fundId) === normalizedFundId
  })
}

export function getMutualFundSummary(fundId) {
  const summary = getMutualFundTransactions(fundId).reduce(
    (collection, txn) => {
      const rawData = getTransactionRawData(txn)
      const amount = toNumber(rawData.amount)
      const units = toNumber(txn.calculated?.units)
      const sign = rawData.txnType === 'REDEEM' ? -1 : 1

      collection.totalInvested += amount * sign
      collection.totalUnits += units * sign

      if (rawData.txnType === 'SIP') {
        collection.sipCount += 1
      }

      return collection
    },
    {
      totalInvested: 0,
      totalUnits: 0,
      sipCount: 0,
    },
  )

  return summary
}
