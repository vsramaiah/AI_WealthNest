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
          <div className="overflow-hidden rounded-[24px] border border-wn-border bg-wn-card/90">
            {reminders.map((reminder) => (
              <article key={reminder.id} className="border-b border-wn-border p-4 last:border-b-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-wn-text">{reminder.title}</p>
                    <p className="mt-1 text-sm text-wn-muted">{reminder.message}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-wn-success">
                    {Number(reminder.amount) > 0 ? formatCurrency(reminder.amount) : '-'}
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-wn-muted">
                  <span>{reminder.type}</span>
                  <span className="h-1 w-1 rounded-full bg-wn-muted/60" />
                  <span>{reminder.dueDate}</span>
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
