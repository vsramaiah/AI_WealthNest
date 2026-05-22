import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getCalendarMonthModel } from '../utils/calendarEvents'

const EVENT_STYLES = {
  SIP: 'border-emerald-500/35 bg-emerald-300/20 text-emerald-900',
  BUY: 'border-sky-500/35 bg-sky-300/20 text-sky-950',
  SELL: 'border-rose-400/20 bg-rose-400/12 text-rose-200',
  DEPOSIT: 'border-amber-400/35 bg-amber-300/20 text-amber-950',
}

const AMOUNT_STYLES = {
  SIP: 'text-emerald-400',
  BUY: 'text-emerald-400',
  DEPOSIT: 'text-emerald-400',
  SELL: 'text-rose-400',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function groupEventsByType(events) {
  return events.reduce((groups, event) => {
    const key = event.label || 'DEPOSIT'
    groups[key] = [...(groups[key] ?? []), event]
    return groups
  }, {})
}

export default function CalendarView() {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const model = useMemo(() => getCalendarMonthModel(viewDate), [viewDate])

  useEffect(() => {
    if (!selectedDay) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedDay(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedDay])

  return (
    <section className="space-y-4">
      <article className="glass-card p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
            aria-label="Previous month"
            className="secondary-button h-11 w-11 rounded-2xl px-0 py-0"
          >
            <ChevronLeft size={18} strokeWidth={2.1} />
          </button>

          <div className="text-center">
            <p className="eyebrow">Calendar</p>
            <p className="mt-2 text-lg font-semibold text-wn-text">{model.monthLabel}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
            }
            aria-label="Next month"
            className="secondary-button h-11 w-11 rounded-2xl px-0 py-0"
          >
            <ChevronRight size={18} strokeWidth={2.1} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {model.dayNames.map((dayName) => (
            <div key={dayName} className="px-1 text-center text-[11px] uppercase tracking-[0.22em] text-wn-muted">
              {dayName}
            </div>
          ))}

          {model.days.map((day) => {
            const dayClassName = [
              'min-h-[64px] rounded-[16px] border p-1.5 text-left transition sm:min-h-[86px] sm:rounded-[20px] sm:p-2',
              day.isCurrentMonth ? 'border-white/8 bg-white/[0.04]' : 'border-white/5 bg-white/[0.02] opacity-45',
              day.isToday ? 'ring-1 ring-wn-accent' : '',
              day.hasEvents ? 'shadow-[0_12px_24px_rgba(0,0,0,0.14)] hover:border-wn-accent/50' : '',
            ].join(' ')

            const content = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-semibold sm:text-xs ${day.isToday ? 'text-wn-accent' : 'text-wn-text'}`}>
                    {day.dayNumber}
                  </span>
                  {day.hasEvents ? <span className="h-1.5 w-1.5 rounded-full bg-wn-accent sm:h-2 sm:w-2" /> : null}
                </div>

                {day.hasEvents ? (
                  <p className="mt-2 truncate text-[9px] font-semibold text-emerald-400 sm:mt-3 sm:text-[10px]">
                    {formatCurrency(day.totalAmount)}
                  </p>
                ) : null}
              </>
            )

            if (!day.hasEvents) {
              return (
                <div key={day.dateKey} className={dayClassName}>
                  {content}
                </div>
              )
            }

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={dayClassName}
              >
                {content}
              </button>
            )
          })}
        </div>
      </article>

      {selectedDay ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-3 pb-[calc(6.8rem+env(safe-area-inset-bottom))] pt-8 backdrop-blur sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedDay(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Day details for ${formatDate(selectedDay.date)}`}
            className="glass-card flex max-h-[min(70vh,34rem)] w-full max-w-md flex-col overflow-hidden p-4 sm:max-h-[calc(100vh-5rem)] sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Day Details</p>
                <h3 className="mt-2 text-xl font-semibold text-wn-text">
                  {formatDate(selectedDay.date)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="secondary-button px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-[24px] border border-wn-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-wn-muted">Spent / Invested</p>
                <p className="text-lg font-semibold text-emerald-400">
                  {formatCurrency(selectedDay.totalAmount)}
                </p>
              </div>
              <p className="mt-2 text-xs text-wn-muted">
                Based on saved transaction history only.
              </p>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              {Object.entries(groupEventsByType(selectedDay.events)).map(([type, events]) => (
                <section key={type} className="border-b border-wn-border py-3 last:border-b-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        EVENT_STYLES[type] ?? EVENT_STYLES.DEPOSIT
                      }`}
                    >
                      {type}
                    </span>
                    <span className="text-xs text-wn-muted">
                      {events.length} {events.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>

                  {events.map((event) => (
                    <article key={event.id} className="flex items-start justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-wn-text">{event.title}</p>
                        <p className="mt-1 truncate text-xs text-wn-muted">
                          {[event.subtitle, event.rawType, event.category].filter(Boolean).join(' - ')}
                        </p>
                      </div>
                      <p className={`shrink-0 text-sm font-semibold ${AMOUNT_STYLES[type] ?? 'text-sky-400'}`}>
                        {formatCurrency(event.amount)}
                      </p>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
