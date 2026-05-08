import { getMutualFundMasters } from './mutualFunds'
import { loadData } from './storage'
import { listInvestmentTransactions } from './transactionEngine'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function toDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function parseDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, date.getDate())
}

function addDays(date, count) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count)
}

function normalizeEventType(type) {
  const normalizedType = String(type ?? '').toUpperCase()

  if (normalizedType === 'SIP') {
    return 'SIP'
  }

  if (normalizedType === 'BUY') {
    return 'BUY'
  }

  if (normalizedType === 'SELL' || normalizedType === 'REDEEM') {
    return 'SELL'
  }

  return 'DEPOSIT'
}

function buildReminderStatus(date) {
  const today = new Date()
  const todayKey = toDateKey(today)
  const tomorrowKey = toDateKey(addDays(today, 1))
  const dateKey = toDateKey(date)

  if (dateKey === todayKey) {
    return 'Due Today'
  }

  if (dateKey === tomorrowKey) {
    return 'Due Tomorrow'
  }

  if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    return 'Missed'
  }

  return ''
}

function buildTransactionEvents() {
  return listInvestmentTransactions()
    .filter((txn) => txn.date)
    .map((txn) => {
      const date = parseDate(txn.date)

      if (!date) {
        return null
      }

      return {
        id: `txn-${txn.id}`,
        dateKey: toDateKey(date),
        date,
        label: normalizeEventType(txn.type),
        rawType: txn.type,
        title: txn.title,
        category: txn.category,
        amount: Number(txn.amount) || 0,
        generated: false,
        reminderStatus: '',
      }
    })
    .filter(Boolean)
}

function getMonthlyRecurringDates(viewDate, anchorDate, dayOfMonth) {
  const start = startOfMonth(viewDate)
  const end = endOfMonth(viewDate)
  const results = []
  const startAnchor = parseDate(anchorDate) ?? start

  let cursor = new Date(start.getFullYear(), start.getMonth(), dayOfMonth)

  if (cursor < startAnchor) {
    cursor = new Date(startAnchor.getFullYear(), startAnchor.getMonth(), dayOfMonth)
  }

  while (cursor <= end) {
    if (cursor >= startAnchor) {
      results.push(new Date(cursor))
    }

    cursor = addMonths(cursor, 1)
  }

  return results
}

function getLicPremiumDates(viewDate, policy) {
  const start = parseDate(policy.startDate)
  const end = parseDate(policy.maturityDate)

  if (!start || !end) {
    return []
  }

  const frequency = policy.paymentFrequency
  const stepMonths =
    frequency === 'Yearly' ? 12 : frequency === 'Quarterly' ? 3 : 1
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const results = []
  let cursor = new Date(start)

  while (cursor <= end) {
    if (cursor >= monthStart && cursor <= monthEnd) {
      results.push(new Date(cursor))
    }

    cursor = addMonths(cursor, stepMonths)
  }

  return results
}

function buildGeneratedEvents(viewDate) {
  const events = []
  const data = loadData()

  getMutualFundMasters()
    .filter((master) => master.investmentType === 'SIP' && master.status === 'ACTIVE')
    .forEach((master) => {
      const start = parseDate(master.sipStartDate)
      const end = parseDate(master.sipEndDate)
      const cancelDate = parseDate(master.sipCancelDate)
      const baseDay =
        parseDate(master.sipDueDate)?.getDate() ??
        parseDate(master.sipStartDate)?.getDate() ??
        1

      getMonthlyRecurringDates(viewDate, master.sipStartDate, baseDay).forEach((date) => {
        if (start && date < start) {
          return
        }

        if (end && date > end) {
          return
        }

        if (cancelDate && date > cancelDate) {
          return
        }

        events.push({
          id: `mf-sip-${master.id}-${toDateKey(date)}`,
          dateKey: toDateKey(date),
          date,
          label: 'SIP',
          rawType: 'SIP',
          title: master.fundName,
          category: 'mf',
          amount: Number(master.sipAmount) || 0,
          generated: true,
          reminderStatus: buildReminderStatus(date),
        })
      })
    })

  ;(data.masters.rd ?? []).forEach((rd) => {
    const day = Number(rd.autoDebitDay) || parseDate(rd.startDate)?.getDate() || 1
    const start = parseDate(rd.startDate)
    const maturity = parseDate(rd.maturityDate)

    getMonthlyRecurringDates(viewDate, rd.startDate, day).forEach((date) => {
      if (start && date < start) {
        return
      }

      if (maturity && date > maturity) {
        return
      }

      events.push({
        id: `rd-${rd.id}-${toDateKey(date)}`,
        dateKey: toDateKey(date),
        date,
        label: 'DEPOSIT',
        rawType: 'DEPOSIT',
        title: rd.bankName,
        category: 'rd',
        amount: Number(rd.monthlyDeposit) || 0,
        generated: true,
        reminderStatus: buildReminderStatus(date),
      })
    })
  })

  ;(data.masters.lic ?? []).forEach((policy) => {
    getLicPremiumDates(viewDate, policy).forEach((date) => {
      events.push({
        id: `lic-${policy.id}-${toDateKey(date)}`,
        dateKey: toDateKey(date),
        date,
        label: 'DEPOSIT',
        rawType: 'PREMIUM',
        title: policy.policyName,
        category: 'lic',
        amount: Number(policy.premiumAmount) || 0,
        generated: true,
        reminderStatus: buildReminderStatus(date),
      })
    })
  })

  return events
}

export function getCalendarMonthModel(viewDate) {
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const gridStart = addDays(monthStart, -monthStart.getDay())
  const gridEnd = addDays(monthEnd, 6 - monthEnd.getDay())
  const mergedEvents = [...buildTransactionEvents(), ...buildGeneratedEvents(viewDate)]
  const eventsByDate = mergedEvents.reduce((map, event) => {
    map[event.dateKey] = [...(map[event.dateKey] ?? []), event]
    return map
  }, {})
  const days = []
  let cursor = new Date(gridStart)

  while (cursor <= gridEnd) {
    const dateKey = toDateKey(cursor)
    const events = (eventsByDate[dateKey] ?? []).sort((left, right) =>
      left.label.localeCompare(right.label),
    )
    const totalAmount = events.reduce((sum, event) => sum + (Number(event.amount) || 0), 0)

    days.push({
      date: new Date(cursor),
      dateKey,
      dayNumber: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === viewDate.getMonth(),
      isToday: dateKey === toDateKey(new Date()),
      hasEvents: events.length > 0,
      totalAmount,
      events,
    })

    cursor = addDays(cursor, 1)
  }

  const reminderBanners = mergedEvents
    .filter((event) => event.generated && event.reminderStatus)
    .sort((left, right) => left.date - right.date)

  return {
    monthLabel: viewDate.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    }),
    dayNames: DAY_NAMES,
    days,
    reminderBanners,
  }
}
