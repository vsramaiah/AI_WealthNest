import { isValidDataShape, loadData, saveData } from './storage'
import { listInvestmentTransactions } from './transactionEngine'

function pad(value) {
  return String(value).padStart(2, '0')
}

export function buildBackupTimestamp(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')
}

export function buildBackupFilename(date = new Date()) {
  return `wealthnest-backup-${buildBackupTimestamp(date)}.json`
}

export function createBackupPayload() {
  return {
    exportedAt: new Date().toISOString(),
    wealthNestData: loadData(),
  }
}

export function downloadJsonBackup() {
  const payload = createBackupPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = buildBackupFilename()
  link.click()
  URL.revokeObjectURL(url)
  return payload
}

export function restoreJsonBackup(parsed) {
  const candidate = parsed?.wealthNestData ?? parsed

  if (!isValidDataShape(candidate)) {
    throw new Error('Invalid WealthNest backup shape.')
  }

  saveData(candidate)
  return true
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '')
  return `"${stringValue.replaceAll('"', '""')}"`
}

export function downloadTransactionsCsv() {
  const rows = listInvestmentTransactions().map((txn) => [
    txn.id,
    txn.category,
    txn.type,
    txn.date,
    txn.title,
    txn.amount,
  ])
  const csv = [
    ['id', 'category', 'type', 'date', 'title', 'amount'],
    ...rows,
  ]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wealthnest-transactions-${buildBackupTimestamp()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
