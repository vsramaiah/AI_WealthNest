import { ArrowUpRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { getCategoryDetails } from '../utils/portfolioSummary'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function profitTone(value) {
  return value >= 0 ? 'text-emerald-400' : 'text-rose-400'
}

function isFixedIncomeCategory(category) {
  return category.group === 'Fixed Income'
}

function isInsuranceCategory(category) {
  return category.group === 'Insurance'
}

function isStockCategory(category) {
  return category.id === 'stocks'
}

function isMutualFundCategory(category) {
  return category.id === 'mf'
}

function isCryptoCategory(category) {
  return category.id === 'crypto'
}

function isGoldSilverCategory(category) {
  return category.id === 'goldSilver'
}

function isRealEstateCategory(category) {
  return category.id === 'realEstate'
}

function isGrossChargesTotalCategory(category) {
  return isStockCategory(category) || isCryptoCategory(category)
}

function MetricCard({ label, value, toneClassName = 'text-wn-text' }) {
  return (
    <div className="border-b border-wn-border py-2.5 last:border-b-0">
      <p className="metric-label">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${toneClassName}`}>{value}</p>
    </div>
  )
}

function getSummaryValueLabel(category) {
  if (isGrossChargesTotalCategory(category)) {
    return 'Gross Value'
  }

  if (isGoldSilverCategory(category) || isRealEstateCategory(category) || isMutualFundCategory(category)) {
    return 'Invested'
  }

  if (isInsuranceCategory(category)) {
    return 'Sum Assured'
  }

  if (isFixedIncomeCategory(category)) {
    return 'Total'
  }

  return 'Value'
}

function getSecondaryLabel(category) {
  if (isGrossChargesTotalCategory(category)) {
    return 'Charges'
  }

  if (isGoldSilverCategory(category)) {
    return 'Total Grams'
  }

  if (isMutualFundCategory(category)) {
    return 'Total Units'
  }

  if (isInsuranceCategory(category)) {
    return 'Premium Paid'
  }

  if (isFixedIncomeCategory(category)) {
    return 'Deposit'
  }

  return 'Invested'
}

function getTertiaryLabel(category) {
  if (isGrossChargesTotalCategory(category)) {
    return 'Invested'
  }

  if (isGoldSilverCategory(category)) {
    return 'Charges'
  }

  if (isFixedIncomeCategory(category)) {
    return 'Interest'
  }

  return 'P/L'
}

function getGridClass(category) {
  if (isRealEstateCategory(category)) {
    return 'grid-cols-1'
  }

  if (isInsuranceCategory(category) || isMutualFundCategory(category)) {
    return 'grid-cols-2'
  }

  return 'grid-cols-3'
}

function getDisplayMetrics(category, source) {
  const primary = {
    label: getSummaryValueLabel(category),
    value: formatCurrency(
      isGrossChargesTotalCategory(category) ? source.grossValue ?? 0 : source.value ?? 0,
    ),
  }

  const metrics = [primary]

  if (!isRealEstateCategory(category)) {
    const secondaryValue = isMutualFundCategory(category)
      ? Number(source.totalUnits ?? 0).toFixed(4)
      : isGoldSilverCategory(category)
        ? `${Number(source.totalGrams ?? 0).toFixed(4)} g`
        : formatCurrency(
            isGrossChargesTotalCategory(category) ? source.charges ?? 0 : source.invested ?? 0,
          )

    metrics.push({
      label: getSecondaryLabel(category),
      value: secondaryValue,
    })
  }

  if (!isInsuranceCategory(category) && !isMutualFundCategory(category) && !isRealEstateCategory(category)) {
    const tertiaryValue = isGrossChargesTotalCategory(category)
      ? source.invested ?? 0
      : isGoldSilverCategory(category)
        ? source.charges ?? 0
        : isFixedIncomeCategory(category)
          ? (source.value ?? 0) - (source.invested ?? 0)
          : source.profitLoss ?? 0

    metrics.push({
      label: getTertiaryLabel(category),
      value: formatCurrency(tertiaryValue),
      toneClassName:
        isGrossChargesTotalCategory(category) || isGoldSilverCategory(category)
          ? 'text-wn-text'
          : profitTone(tertiaryValue),
    })
  }

  return metrics
}

export default function AssetDetails() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const category = getCategoryDetails(categoryId)

  if (!category) {
    return (
      <PageShell
        eyebrow="Details"
        title="Asset details unavailable"
        description="We could not find detail data for this category."
        backTo="/portfolio"
        backLabel="Back to Portfolio"
      />
    )
  }

  const summaryMetrics = getDisplayMetrics(category, category)
  const populatedCount = category.details.filter((item) => Number(item.value ?? item.invested ?? 0) > 0).length

  return (
    <PageShell
      eyebrow={category.group}
      title={category.label}
      description="Review the category summary and open any saved record to jump into its transaction history."
      backTo="/portfolio"
      backLabel="Back to Portfolio"
    >
      <div className="space-y-4">
        <article className="glass-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="metric-label">Category Summary</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-wn-text sm:text-[2rem]">
                {formatCurrency(category.value)}
              </p>
              <p className="mt-2 text-sm text-wn-muted">
                {category.label} currently includes {category.details.length}{' '}
                {category.details.length === 1 ? 'record' : 'records'}.
              </p>
            </div>

            <div className="text-right">
              <p className="metric-label">Active Records</p>
              <p className="mt-2 text-sm font-semibold text-wn-text">{populatedCount}</p>
            </div>
          </div>

          <div className={`mt-4 grid gap-4 ${getGridClass(category)}`}>
            {summaryMetrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                toneClassName={metric.toneClassName}
              />
            ))}
          </div>
        </article>

        {category.details.length > 0 ? (
          category.details.map((item) => {
            const itemMetrics = getDisplayMetrics(category, item)

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  navigate('/transactions', {
                    state: {
                      recordFilter: {
                        category: category.id,
                        itemId: item.id,
                        title: item.title,
                      },
                    },
                  })
                }
                className="glass-card block w-full p-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-wn-text">{item.title}</p>
                    <p className="mt-1 text-sm text-wn-muted">{item.subtitle || 'Stored entry'}</p>
                  </div>
                  <div className="shrink-0 p-1 text-wn-muted">
                    <ArrowUpRight size={18} />
                  </div>
                </div>

                <div className={`mt-3 grid gap-4 ${getGridClass(category)}`}>
                  {itemMetrics.map((metric) => (
                    <MetricCard
                      key={`${item.id}-${metric.label}`}
                      label={metric.label}
                      value={metric.value}
                      toneClassName={metric.toneClassName}
                    />
                  ))}
                </div>
              </button>
            )
          })
        ) : (
          <article className="glass-card p-5">
            <p className="section-title">No asset records yet</p>
            <p className="mt-2 text-sm text-wn-muted">
              Add entries in this category to populate the detail view.
            </p>
          </article>
        )}
      </div>
    </PageShell>
  )
}
