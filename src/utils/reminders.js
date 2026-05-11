import { getMutualFundMasters } from './mutualFunds'
import { resolveSipDebitDay } from './mutualFunds'
import { loadData } from './storage'

function normalizeDate(dateString) {
  if (!dateString) {
    return null
  }

  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
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
  const today = new Date()
  const nextDate = new Date(today.getFullYear(), today.getMonth(), dueDay)

  if (nextDate < today) {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }

  return nextDate
}

export function generateSipSchedule() {
  return getMutualFundMasters()
    .filter((master) => master.investmentType === 'SIP' && master.status === 'ACTIVE')
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
}

export function getReminders() {
  const reminders = []

  generateSipSchedule().forEach((sip) => {
    reminders.push({
      id: `sip-${sip.id}`,
      type: 'SIP',
      title: sip.title,
      message: `${sip.subtitle} · Due ${sip.dueDate}`,
      dueDate: sip.dueDate,
    })
  })

  const data = loadData()

  ;['fd', 'rd', 'lic'].forEach((category) => {
    ;(data.masters[category] ?? []).forEach((item) => {
      const targetDate = item.maturityDate ?? item.startDate

      if (!targetDate) {
        return
      }

      reminders.push({
        id: `${category}-${item.id}`,
        type: 'Reminder',
        title: item.bankName ?? item.policyName ?? category.toUpperCase(),
        message: `Important date on ${targetDate}`,
        dueDate: targetDate,
      })
    })
  })

  return reminders.sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))
}
