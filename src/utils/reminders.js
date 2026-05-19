import { getMutualFundMasters, resolveSipDebitDay } from './mutualFunds'
import { loadData } from './storage'

function normalizeDate(dateString) {
  if (!dateString) {
    return null
  }

  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfToday() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function isActive(record) {
  return (record?.status ?? 'ACTIVE') === 'ACTIVE'
}

function clampDay(day, year, monthIndex) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  return Math.min(Math.max(Number(day) || 1, 1), lastDay)
}

function buildNextRecurringDate(day, frequencyMonths = 1) {
  const today = startOfToday()
  const currentMonthDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    clampDay(day, today.getFullYear(), today.getMonth()),
  )

  if (currentMonthDate >= today) {
    return currentMonthDate
  }

  return new Date(
    today.getFullYear(),
    today.getMonth() + frequencyMonths,
    clampDay(day, today.getFullYear(), today.getMonth() + frequencyMonths),
  )
}

function getStartDay(value) {
  const date = normalizeDate(value)
  return date ? date.getDate() : null
}

function getSipDueDay(master) {
  return resolveSipDebitDay(master.sipDueDate, master.sipStartDate)
}

function computeNextSipDate(master) {
  const startDate = normalizeDate(master.sipStartDate)

  if (!startDate) {
    return null
  }

  const dueDay = getSipDueDay(master) ?? startDate.getDate()
  return buildNextRecurringDate(dueDay, 1)
}

function getLicFrequencyMonths(paymentFrequency) {
  const normalized = String(paymentFrequency ?? '').toUpperCase()

  if (normalized === 'QUARTERLY') {
    return 3
  }

  if (normalized === 'YEARLY') {
    return 12
  }

  return 1
}

function computeNextLicDate(record) {
  const dueDay = getStartDay(record.startDate)

  if (!dueDay) {
    return null
  }

  return buildNextRecurringDate(dueDay, getLicFrequencyMonths(record.paymentFrequency))
}

function buildDateReminder({
  id,
  type,
  title,
  subtitle,
  amount = 0,
  date,
}) {
  if (!date) {
    return null
  }

  return {
    id,
    type,
    title,
    amount,
    dueDate: formatDate(date),
    message: subtitle || '',
  }
}

export function generateSipSchedule() {
  return getMutualFundMasters()
    .filter((master) => master.investmentType === 'SIP' && isActive(master))
    .map((master) => {
      const nextSipDate = computeNextSipDate(master)

      return {
        id: master.id,
        category: 'mf',
        title: master.fundName,
        subtitle: `SIP via ${master.platform}`,
        amount: Number(master.sipAmount) || 0,
        dueDate: nextSipDate ? formatDate(nextSipDate) : 'Not scheduled',
      }
    })
    .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))
}

export function getReminders() {
  const reminders = []
  const data = loadData()
  const today = startOfToday()

  generateSipSchedule().forEach((sip) => {
    reminders.push({
      id: `sip-${sip.id}`,
      type: 'SIP',
      title: sip.title,
      amount: sip.amount,
      message: sip.subtitle,
      dueDate: sip.dueDate,
    })
  })

  ;(data.masters.rd ?? [])
    .filter(isActive)
    .forEach((record) => {
      const nextDate = buildNextRecurringDate(record.autoDebitDay ?? getStartDay(record.startDate), 1)
      const reminder = buildDateReminder({
        id: `rd-${record.id}`,
        type: 'RD',
        title: record.bankName || 'Recurring Deposit',
        subtitle: record.accountNumber ? `A/C ${record.accountNumber}` : 'Recurring deposit due',
        amount: Number(record.monthlyDeposit) || 0,
        date: nextDate,
      })

      if (reminder) {
        reminders.push(reminder)
      }
    })

  ;(data.masters.ppf ?? [])
    .filter(isActive)
    .forEach((record) => {
      const nextDate = buildNextRecurringDate(record.autoDebitDay ?? getStartDay(record.startDate), 1)
      const reminder = buildDateReminder({
        id: `ppf-${record.id}`,
        type: 'PPF',
        title: record.bankName || 'PPF',
        subtitle: record.accountNumber ? `A/C ${record.accountNumber}` : 'PPF contribution due',
        amount: Number(record.depositAmount) || 0,
        date: nextDate,
      })

      if (reminder) {
        reminders.push(reminder)
      }
    })

  ;(data.masters.lic ?? [])
    .filter(isActive)
    .forEach((record) => {
      const nextDate = computeNextLicDate(record)
      const reminder = buildDateReminder({
        id: `lic-${record.id}`,
        type: 'LIC',
        title: record.policyName || 'LIC',
        subtitle: record.policyNumber ? `Policy ${record.policyNumber}` : 'Premium due',
        amount: Number(record.premiumAmount) || 0,
        date: nextDate,
      })

      if (reminder) {
        reminders.push(reminder)
      }
    })

  ;(data.transactions ?? [])
    .filter((txn) => txn.category === 'fd')
    .forEach((txn) => {
      const raw = txn.rawData ?? {}
      const maturityDate = normalizeDate(raw.maturityDate)

      if (!maturityDate || maturityDate < today) {
        return
      }

      const reminder = buildDateReminder({
        id: `fd-${txn.id}`,
        type: 'FD',
        title: raw.bankName || 'Fixed Deposit',
        subtitle: raw.accountNumber ? `A/C ${raw.accountNumber}` : 'Maturity date',
        amount: Number(raw.depositAmount) || 0,
        date: maturityDate,
      })

      if (reminder) {
        reminders.push(reminder)
      }
    })

  ;(data.masters.bonds ?? [])
    .filter(isActive)
    .forEach((record) => {
      const couponDate = normalizeDate(record.couponPaymentDate)
      const maturityDate = normalizeDate(record.maturityDate)

      if (couponDate && couponDate >= today) {
        const reminder = buildDateReminder({
          id: `bond-coupon-${record.id}`,
          type: 'BOND',
          title: record.bondName || 'Bond',
          subtitle: record.issuer ? `${record.issuer} coupon` : 'Coupon payment due',
          date: couponDate,
        })

        if (reminder) {
          reminders.push(reminder)
        }
      }

      if (maturityDate && maturityDate >= today) {
        const reminder = buildDateReminder({
          id: `bond-maturity-${record.id}`,
          type: 'BOND',
          title: record.bondName || 'Bond',
          subtitle: record.issuer ? `${record.issuer} maturity` : 'Maturity date',
          date: maturityDate,
        })

        if (reminder) {
          reminders.push(reminder)
        }
      }
    })

  return reminders
    .filter((item) => item?.dueDate)
    .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))
}
