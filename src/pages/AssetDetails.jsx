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

  return (
    <PageShell
      eyebrow={category.group}
      title={category.label}
      description="A category-level detail view with summary cards and individual saved records."
      backTo="/portfolio"
      backLabel="Back to Portfolio"
    >
      <div className="space-y-4">
        <article className="glass-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="metric-label">Category Summary</p>
              <p className="mt-2 text-2xl font-semibold text-wn-text">
                {formatCurrency(category.value)}
              </p>
            </div>
            <ArrowUpRight className="text-wn-muted" size={18} />
          </div>

          <div
            className={`mt-5 grid gap-3 ${
              isRealEstateCategory(category)
                ? 'grid-cols-1'
                : isInsuranceCategory(category) || isMutualFundCategory(category)
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
            }`}
          >
            <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
              <p className="metric-label">
                {isGrossChargesTotalCategory(category)
                  ? 'Gross Value'
                  : isGoldSilverCategory(category)
                    ? 'Invested'
                  : isRealEstateCategory(category)
                    ? 'Invested'
                  : isMutualFundCategory(category)
                    ? 'Invested'
                  : isInsuranceCategory(category)
                    ? 'Sum Assured'
                    : isFixedIncomeCategory(category)
                      ? 'Total'
                      : 'Value'}
              </p>
              <p className="mt-2 text-sm font-semibold text-wn-text">
                {formatCurrency(
                  isGrossChargesTotalCategory(category) ? category.grossValue ?? 0 : category.value,
                )}
              </p>
            </div>
            {isRealEstateCategory(category) ? null : (
              <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                <p className="metric-label">
                  {isGrossChargesTotalCategory(category)
                    ? 'Charges'
                    : isGoldSilverCategory(category)
                      ? 'Total Grams'
                    : isMutualFundCategory(category)
                      ? 'Total Units'
                    : isInsuranceCategory(category)
                      ? 'Premium Paid'
                      : isFixedIncomeCategory(category)
                        ? 'Deposit'
                        : 'Invested'}
                </p>
                <p className="mt-2 text-sm font-semibold text-wn-text">
                  {isMutualFundCategory(category)
                    ? Number(category.totalUnits ?? 0).toFixed(4)
                    : isGoldSilverCategory(category)
                      ? `${Number(category.totalGrams ?? 0).toFixed(4)} g`
                      : formatCurrency(
                          isGrossChargesTotalCategory(category)
                            ? category.charges ?? 0
                            : category.invested,
                        )}
                </p>
              </div>
            )}
            {isInsuranceCategory(category) || isMutualFundCategory(category) || isRealEstateCategory(category) ? null : (
              <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                <p className="metric-label">
                  {isGrossChargesTotalCategory(category)
                    ? 'Invested'
                    : isGoldSilverCategory(category)
                      ? 'Charges'
                      : isFixedIncomeCategory(category)
                        ? 'Interest'
                        : 'P/L'}
                </p>
                <p className={`mt-2 text-sm font-semibold ${isGrossChargesTotalCategory(category) || isGoldSilverCategory(category) ? 'text-wn-text' : profitTone(category.profitLoss)}`}>
                  {formatCurrency(
                    isGrossChargesTotalCategory(category)
                      ? category.invested
                      : isGoldSilverCategory(category)
                        ? category.charges
                        : category.profitLoss,
                  )}
                </p>
              </div>
            )}
          </div>
        </article>

        {category.details.length > 0 ? (
          category.details.map((item) => (
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
              className="glass-card block w-full p-5 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-wn-text">{item.title}</p>
                  <p className="mt-1 text-sm text-wn-muted">{item.subtitle || 'Stored entry'}</p>
                </div>
                <ArrowUpRight className="text-wn-muted" size={18} />
              </div>

              <div
                className={`mt-4 grid gap-3 ${
                  isRealEstateCategory(category)
                    ? 'grid-cols-1'
                    : 
                  isInsuranceCategory(category)
                    || isMutualFundCategory(category)
                    ? 'grid-cols-2'
                    : isFixedIncomeCategory(category)
                      ? 'grid-cols-3'
                      : 'grid-cols-2'
                }`}
              >
                <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                  <p className="metric-label">
                    {isGrossChargesTotalCategory(category)
                      ? 'Gross Value'
                      : isGoldSilverCategory(category)
                        ? 'Invested'
                      : isRealEstateCategory(category)
                        ? 'Invested'
                      : isMutualFundCategory(category)
                        ? 'Invested'
                      : isInsuranceCategory(category)
                        ? 'Sum Assured'
                        : isFixedIncomeCategory(category)
                          ? 'Total'
                          : 'Value'}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-wn-text">
                    {formatCurrency(
                      isGrossChargesTotalCategory(category) ? item.grossValue ?? 0 : item.value ?? 0,
                    )}
                  </p>
                </div>
                {isRealEstateCategory(category) ? null : (
                  <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                    <p className="metric-label">
                      {isGrossChargesTotalCategory(category)
                        ? 'Charges'
                        : isGoldSilverCategory(category)
                          ? 'Total Grams'
                        : isMutualFundCategory(category)
                          ? 'Total Units'
                        : isInsuranceCategory(category)
                          ? 'Premium Paid'
                          : isFixedIncomeCategory(category)
                            ? 'Deposit'
                            : 'Invested'}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-wn-text">
                      {isMutualFundCategory(category)
                        ? Number(item.totalUnits ?? 0).toFixed(4)
                        : isGoldSilverCategory(category)
                          ? `${Number(item.totalGrams ?? 0).toFixed(4)} g`
                          : formatCurrency(
                              isGrossChargesTotalCategory(category)
                                ? item.charges ?? 0
                                : item.invested ?? 0,
                            )}
                    </p>
                  </div>
                )}
                {isGrossChargesTotalCategory(category) || isGoldSilverCategory(category) ? (
                  <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                    <p className="metric-label">
                      {isGrossChargesTotalCategory(category) ? 'Invested' : 'Charges'}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-wn-text">
                      {formatCurrency(
                        isGrossChargesTotalCategory(category)
                          ? item.invested ?? 0
                          : item.charges ?? 0,
                      )}
                    </p>
                  </div>
                ) : null}
                {isFixedIncomeCategory(category) && !isInsuranceCategory(category) ? (
                  <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                    <p className="metric-label">Interest</p>
                    <p className={`mt-2 text-sm font-semibold ${profitTone((item.value ?? 0) - (item.invested ?? 0))}`}>
                      {formatCurrency((item.value ?? 0) - (item.invested ?? 0))}
                    </p>
                  </div>
                ) : null}
              </div>
            </button>
          ))
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
