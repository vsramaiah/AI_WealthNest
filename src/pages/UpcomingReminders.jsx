import { Layers3 } from 'lucide-react'
import PageShell from '../components/PageShell'
import { getReminders } from '../utils/reminders'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function UpcomingReminders() {
  const reminders = getReminders()

  return (
    <PageShell
      eyebrow="Schedules"
      title="Upcoming Reminders"
      description="Review all upcoming due dates generated from your saved account and investment records."
      backTo="/home"
      backLabel="Back to Home"
    >
      <div className="space-y-4">
        {reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <article key={reminder.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-wn-text">{reminder.title}</p>
                    <p className="mt-1 text-sm text-wn-muted">{reminder.message}</p>
                  </div>
                  <div className="icon-badge h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-400">
                    <Layers3 size={18} strokeWidth={2.2} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-3">
                    <p className="metric-label">Type</p>
                    <p className="mt-2 text-sm font-semibold text-wn-text">{reminder.type}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-3">
                    <p className="metric-label">Amount</p>
                    <p className="mt-2 text-sm font-semibold text-wn-text">
                      {Number(reminder.amount) > 0 ? formatCurrency(reminder.amount) : '—'}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-3">
                    <p className="metric-label">Due Date</p>
                    <p className="mt-2 text-sm font-semibold text-wn-text">{reminder.dueDate}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="glass-card p-5">
            <p className="section-title">No upcoming reminders</p>
            <p className="mt-2 text-sm text-wn-muted">
              Add active scheduled records to generate reminder entries here.
            </p>
          </article>
        )}
      </div>
    </PageShell>
  )
}
