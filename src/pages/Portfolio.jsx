import { ArrowUpRight, Landmark, Layers3, Shield, TrendingUp, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CategoryIconBadge } from '../components/CategoryVisuals'
import PageShell from '../components/PageShell'
import { getPortfolioOverview } from '../utils/portfolioSummary'

const GROUP_ICONS = {
  Market: TrendingUp,
  'Fixed Income': Landmark,
  Insurance: Shield,
  'Real Assets': Layers3,
  default: Wallet,
}

const GROUP_ICON_GRADIENTS = {
  Market: 'from-emerald-500 to-teal-400',
  'Fixed Income': 'from-amber-500 to-yellow-400',
  Insurance: 'from-violet-500 to-fuchsia-400',
  'Real Assets': 'from-sky-500 to-cyan-400',
  default: 'from-slate-500 to-slate-400',
}

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

export default function Portfolio() {
  const overview = useMemo(() => getPortfolioOverview(), [])
  const location = useLocation()
  const [activeGroup, setActiveGroup] = useState(() => location.state?.initialGroup ?? 'All')

  const groupOptions = useMemo(
    () => ['All', ...overview.groupedAllocation.map((group) => group.group)],
    [overview.groupedAllocation],
  )

  const resolvedGroup = groupOptions.includes(activeGroup) ? activeGroup : 'All'

  const visibleGroups =
    resolvedGroup === 'All'
      ? overview.groupedAllocation
      : overview.groupedAllocation.filter((group) => group.group === resolvedGroup)

  return (
    <PageShell>
      <div className="space-y-4">
        <article className="glass-card p-5">
          <p className="metric-label">Total Value</p>
          <p className="mt-3 text-[2.15rem] font-semibold tracking-tight text-wn-text">
            {formatCurrency(overview.totalNetWorth)}
          </p>
          <p className="mt-2 text-sm font-medium text-emerald-400">
            {overview.groupedAllocation.length} asset groups tracked
          </p>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {groupOptions.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={`shrink-0 ${resolvedGroup === group ? 'pill-chip pill-chip-active' : 'pill-chip'}`}
              >
                {group}
              </button>
            ))}
          </div>
        </article>

        <div className="space-y-5">
          {visibleGroups.map((group) => {
            const GroupIcon = GROUP_ICONS[group.group] ?? GROUP_ICONS.default
            const groupIconGradient =
              GROUP_ICON_GRADIENTS[group.group] ?? GROUP_ICON_GRADIENTS.default

            return (
              <section key={group.group} className="space-y-3">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-3">
                    <div className={`icon-badge bg-gradient-to-br ${groupIconGradient}`}>
                      <GroupIcon size={18} strokeWidth={2.1} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-wn-text">{group.group}</p>
                      <p className="text-sm text-wn-muted">
                        {group.categories.length} categories
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-wn-text">
                    {formatCurrency(group.value)}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/portfolio/${category.id}`}
                      className="glass-card block p-4 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <CategoryIconBadge categoryId={category.id} size={18} className="h-10 w-10 shrink-0" />
                          <div>
                            <p className="text-base font-semibold text-wn-text">{category.label}</p>
                            <p className="mt-1 text-sm text-wn-muted">{category.group}</p>
                          </div>
                        </div>
                        <ArrowUpRight size={18} className="text-wn-muted" />
                      </div>

                      <div
                        className={`mt-4 grid gap-3 ${
                          isRealEstateCategory(category)
                            ? 'grid-cols-1'
                            : isInsuranceCategory(category)
                              ? 'grid-cols-2'
                              : 'grid-cols-3'
                        }`}
                      >
                        <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                          <p className="metric-label">
                            {isStockCategory(category)
                              || isCryptoCategory(category)
                              ? 'Invested'
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
                            {formatCurrency(category.value)}
                          </p>
                        </div>
                        {isRealEstateCategory(category) ? null : (
                          <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                            <p className="metric-label">
                              {isStockCategory(category)
                                || isCryptoCategory(category)
                                ? 'Gross Value'
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
                                  : formatCurrency(isStockCategory(category) || isCryptoCategory(category) ? category.grossValue : category.invested)}
                            </p>
                          </div>
                        )}
                        {isInsuranceCategory(category) || isMutualFundCategory(category) || isRealEstateCategory(category) ? null : (
                          <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                            <p className="metric-label">
                              {isStockCategory(category) || isCryptoCategory(category) || isGoldSilverCategory(category) ? 'Charges' : isFixedIncomeCategory(category) ? 'Interest' : 'P/L'}
                            </p>
                            <p className={`mt-2 text-sm font-semibold ${isStockCategory(category) || isCryptoCategory(category) || isGoldSilverCategory(category) ? 'text-wn-text' : profitTone(category.profitLoss)}`}>
                              {formatCurrency(isStockCategory(category) || isCryptoCategory(category) || isGoldSilverCategory(category) ? category.charges : category.profitLoss)}
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
