const STORAGE_KEY = 'wealthNestData'

const defaultData = {
  transactions: [],
  masters: {
    mf: [],
    fd: [],
    rd: [],
    lic: [],
    ppf: [],
  },
}

function normalizeTransactionRecord(txn) {
  const rawData = txn?.rawData ?? txn?.fields ?? {}

  return {
    ...txn,
    rawData,
    // Preserve compatibility with existing readers while keeping
    // raw data separate from derived calculations.
    fields: rawData,
    calculated:
      txn?.calculated && typeof txn.calculated === 'object' ? txn.calculated : {},
  }
}

export function getTransactionRawData(txn) {
  return txn?.rawData ?? txn?.fields ?? {}
}

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(defaultData))
}

export function getDefaultData() {
  return cloneDefaultData()
}

function buildStorageSaveError(error) {
  if (error?.name === 'QuotaExceededError') {
    return new Error('Local storage is full. Clear some data or export a backup before saving again.')
  }

  return new Error('Local storage is unavailable. Please try again.')
}

function normalizeData(data) {
  return {
    transactions: Array.isArray(data?.transactions)
      ? data.transactions.map(normalizeTransactionRecord)
      : [],
    masters: {
      mf: Array.isArray(data?.masters?.mf) ? data.masters.mf : [],
      fd: Array.isArray(data?.masters?.fd) ? data.masters.fd : [],
      rd: Array.isArray(data?.masters?.rd) ? data.masters.rd : [],
      lic: Array.isArray(data?.masters?.lic) ? data.masters.lic : [],
      ppf: Array.isArray(data?.masters?.ppf) ? data.masters.ppf : [],
    },
  }
}

function hasValidShape(data) {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.transactions) &&
    data.masters &&
    typeof data.masters === 'object' &&
    Array.isArray(data.masters.mf) &&
    Array.isArray(data.masters.fd) &&
    Array.isArray(data.masters.rd) &&
    Array.isArray(data.masters.lic) &&
    Array.isArray(data.masters.ppf)
  )
}

export function isValidDataShape(data) {
  return hasValidShape(data)
}

export function loadData() {
  const rawData = window.localStorage.getItem(STORAGE_KEY)

  if (!rawData) {
    const initialData = cloneDefaultData()
    saveData(initialData)
    return initialData
  }

  try {
    const parsedData = JSON.parse(rawData)
    const normalizedData = normalizeData(parsedData)

    if (hasValidShape(normalizedData)) {
      if (!hasValidShape(parsedData)) {
        saveData(normalizedData)
      }

      return normalizedData
    }
  } catch {
    // Fall back to a clean structure if stored JSON is malformed.
  }

  const resetData = cloneDefaultData()
  saveData(resetData)
  return resetData
}

export function saveData(data) {
  const nextData = normalizeData(data)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData))
  } catch (error) {
    throw buildStorageSaveError(error)
  }

  return nextData
}

export function addTransaction(txn) {
  const data = loadData()
  const nextTransaction = normalizeTransactionRecord({
    ...txn,
    id: txn?.id ?? crypto.randomUUID(),
  })

  const nextData = {
    ...data,
    transactions: [...data.transactions, nextTransaction],
  }

  saveData(nextData)
  return nextTransaction
}

export function updateTransaction(id, txn) {
  const data = loadData()

  const nextTransactions = data.transactions.map((item) =>
    item.id === id ? normalizeTransactionRecord({ ...item, ...txn, id }) : item,
  )

  const nextData = {
    ...data,
    transactions: nextTransactions,
  }

  saveData(nextData)
  return nextTransactions.find((item) => item.id === id) ?? null
}

export function deleteTransaction(id) {
  const data = loadData()
  const nextTransactions = data.transactions.filter((item) => item.id !== id)

  const nextData = {
    ...data,
    transactions: nextTransactions,
  }

  saveData(nextData)
  return nextTransactions.length !== data.transactions.length
}

export { STORAGE_KEY, defaultData }
