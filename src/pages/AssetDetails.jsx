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

function isAccountRecordCategory(category) {
  return ['mf', 'rd', 'ppf', 'epf', 'nps', 'lic'].includes(category.id)
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

function getSummaryAmount(category) {
  if (isGrossChargesTotalCategory(category)) {
    return category.grossValue ?? 0
  }

  if (isGoldSilverCategory(category) || isRealEstateCategory(category) || isMutualFundCategory(category)) {
    return category.invested ?? 0
  }

  if (isInsuranceCategory(category)) {
    return category.value ?? 0
  }

  return category.value ?? 0
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
  const detailCount = category.details.length

  return (
    <PageShell
      eyebrow={category.group}
      title={category.label}
      description="Review category totals, saved records, and linked transaction history."
      backTo="/portfolio"
      backLabel="Back to Portfolio"
    >
      <div className="space-y-4">
        <article className="glass-card p-5 sm:p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="metric-label">Category Summary</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-wn-text sm:text-[2rem]">
                {formatCurrency(getSummaryAmount(category))}
              </p>
            </div>

            <div className="text-right">
              <p className="metric-label">Records</p>
              <p className="mt-2 text-sm font-semibold text-wn-text">{detailCount}</p>
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
              <article
                key={item.id}
                className="glass-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-wn-text">{item.title || category.label}</p>
                    <p className="mt-1 text-sm text-wn-muted">
                      {item.subtitle || 'Saved record'}
                    </p>
                  </div>
                  <button
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
                    className="secondary-button shrink-0 px-3 py-2 text-xs"
                    aria-label={`View transactions for ${item.title || category.label}`}
                  >
                    <span>View</span>
                    <ArrowUpRight className="ml-1.5" size={15} />
                  </button>
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
              </article>
            )
          })
        ) : (
          <article className="glass-card p-5">
            <p className="section-title">
              {isAccountRecordCategory(category) ? 'No saved records yet' : 'No asset records yet'}
            </p>
            <p className="mt-2 text-sm leading-6 text-wn-muted">
              {isAccountRecordCategory(category)
                ? 'Create an account record from Add > Accounts, then add entries against it to see linked transaction history here.'
                : 'Add entries in this category to populate the detail view.'}
            </p>
            <button
              type="button"
              onClick={() =>
                navigate('/add', {
                  state: {},
                })
              }
              className="mt-4 primary-button w-full"
            >
              Go to Add
            </button>
          </article>
        )}
      </div>
    </PageShell>
  )
}
