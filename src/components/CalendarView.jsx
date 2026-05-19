import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getCalendarMonthModel } from '../utils/calendarEvents'

const EVENT_STYLES = {
  SIP: 'border-emerald-500/35 bg-emerald-300/20 text-emerald-900',
  BUY: 'border-sky-500/35 bg-sky-300/20 text-sky-950',
  SELL: 'border-rose-400/20 bg-rose-400/12 text-rose-200',
  DEPOSIT: 'border-amber-400/35 bg-amber-300/20 text-amber-950',
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

        <div className="mt-5 grid grid-cols-7 gap-2">
          {model.dayNames.map((dayName) => (
            <div key={dayName} className="px-1 text-center text-[11px] uppercase tracking-[0.22em] text-wn-muted">
              {dayName}
            </div>
          ))}

          {model.days.map((day) => {
            const dayClassName = [
              'min-h-[74px] rounded-[18px] border p-1.5 text-left sm:min-h-[92px] sm:rounded-[20px] sm:p-2',
              day.isCurrentMonth ? 'border-white/8 bg-white/[0.04]' : 'border-white/5 bg-white/[0.02] opacity-45',
              day.isToday ? 'ring-1 ring-wn-accent' : '',
              day.hasEvents ? 'shadow-[0_14px_28px_rgba(0,0,0,0.18)]' : '',
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
                  <p className="mt-2 truncate text-[9px] font-semibold text-wn-text sm:mt-3 sm:text-[10px]">
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
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/55 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-10 backdrop-blur sm:items-center sm:pb-6"
          onClick={() => setSelectedDay(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Day details for ${formatDate(selectedDay.date)}`}
            className="glass-card flex max-h-[calc(100vh-11rem)] w-full max-w-md flex-col overflow-hidden p-5 sm:max-h-[calc(100vh-5rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Day Details</p>
                <h3 className="mt-2 text-xl font-semibold text-wn-text">
                  {formatDate(selectedDay.date)}
                </h3>
                <p className="mt-2 text-sm font-medium text-emerald-300">
                  Total Amount: {formatCurrency(selectedDay.totalAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="secondary-button"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {selectedDay.events.map((event) => (
                <article key={event.id} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        EVENT_STYLES[event.label] ?? EVENT_STYLES.DEPOSIT
                      }`}
                    >
                      {event.label}
                    </span>
                    <span className="text-xs text-wn-muted">{event.category}</span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-wn-text">{event.title}</p>
                  {event.subtitle ? (
                    <p className="mt-1 text-xs text-wn-muted">{event.subtitle}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-wn-muted">Type: {event.rawType}</p>
                  <p className="mt-1 text-sm text-wn-muted">Amount: {formatCurrency(event.amount)}</p>

                  {event.reminderStatus ? (
                    <p className="mt-3 text-xs font-medium text-amber-200">{event.reminderStatus}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
