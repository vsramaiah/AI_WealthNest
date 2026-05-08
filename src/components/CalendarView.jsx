import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getCalendarMonthModel } from '../utils/calendarEvents'

const EVENT_STYLES = {
  SIP: 'border-emerald-400/20 bg-emerald-400/12 text-emerald-200',
  BUY: 'border-sky-400/20 bg-sky-400/12 text-sky-200',
  SELL: 'border-rose-400/20 bg-rose-400/12 text-rose-200',
  DEPOSIT: 'border-amber-300/20 bg-amber-300/12 text-amber-100',
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

  return (
    <section className="space-y-4">
      {model.reminderBanners.length > 0 ? (
        <div className="space-y-3">
          {model.reminderBanners.slice(0, 3).map((reminder) => (
            <article
              key={reminder.id}
              className="glass-card border border-amber-300/20 bg-amber-300/10 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-wn-text">{reminder.reminderStatus}</p>
                <span className="pill-chip border-amber-300/20 text-amber-100">
                  {reminder.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-wn-muted">
                {reminder.title} on {formatDate(reminder.date)}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      <article className="glass-card p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
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

          {model.days.map((day) => (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => day.hasEvents && setSelectedDay(day)}
              className={[
                'min-h-[92px] rounded-[20px] border p-2 text-left',
                day.isCurrentMonth ? 'border-white/8 bg-white/[0.04]' : 'border-white/5 bg-white/[0.02] opacity-45',
                day.isToday ? 'ring-1 ring-wn-accent' : '',
                day.hasEvents ? 'shadow-[0_14px_28px_rgba(0,0,0,0.18)]' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${day.isToday ? 'text-wn-accent' : 'text-wn-text'}`}>
                  {day.dayNumber}
                </span>
                {day.hasEvents ? <span className="h-2 w-2 rounded-full bg-wn-accent" /> : null}
              </div>

              {day.hasEvents ? (
                <p className="mt-3 truncate text-[10px] font-semibold text-wn-text">
                  {formatCurrency(day.totalAmount)}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </article>

      {selectedDay ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 px-4 pb-6 pt-10 backdrop-blur sm:items-center">
          <div className="glass-card w-full max-w-md p-5">
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

            <div className="mt-4 space-y-3">
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
