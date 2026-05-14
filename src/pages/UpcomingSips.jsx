import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { generateSipSchedule } from '../utils/reminders'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function UpcomingSips() {
  const sipSchedule = generateSipSchedule()

  return (
    <PageShell
      eyebrow="Schedules"
      title="Upcoming SIPs"
      description="Review all upcoming SIP dates generated from your active mutual fund account records."
    >
      <div className="space-y-4">
        <Link to="/home" className="secondary-button inline-flex">
          <ArrowLeft size={16} />
          <span className="ml-2">Back to Home</span>
        </Link>

        {sipSchedule.length > 0 ? (
          <div className="space-y-3">
            {sipSchedule.map((item) => (
              <article key={item.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-wn-text">{item.title}</p>
                    <p className="mt-1 text-sm text-wn-muted">{item.subtitle}</p>
                  </div>
                  <ArrowUpRight size={18} className="text-wn-muted" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                    <p className="metric-label">Invested</p>
                    <p className="mt-2 text-sm font-semibold text-wn-text">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                    <p className="metric-label">Due Date</p>
                    <p className="mt-2 text-sm font-semibold text-wn-text">{item.dueDate}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="glass-card p-5">
            <p className="section-title">No upcoming SIPs</p>
            <p className="mt-2 text-sm text-wn-muted">
              Add an active mutual fund SIP account to generate upcoming SIP entries here.
            </p>
          </article>
        )}
      </div>
    </PageShell>
  )
}
