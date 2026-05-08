import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CategoryIconBadge } from '../components/CategoryVisuals'
import { useLocation, useNavigate } from 'react-router-dom'
import DynamicForm from '../components/DynamicForm'
import PageShell from '../components/PageShell'
import { addInvestmentTransaction, editInvestmentTransaction } from '../utils/transactionEngine'
import { transactionCategoryOptions, transactionSchemas } from '../utils/transactionSchemas'

function StepDot({ active, complete, label, index }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <div
        className={[
          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
          complete || active ? 'bg-wn-accent-strong text-[#04110a]' : 'bg-white/[0.06] text-wn-muted',
        ].join(' ')}
      >
        {index}
      </div>
      <span className={`text-xs ${active || complete ? 'text-wn-text' : 'text-wn-muted'}`}>{label}</span>
    </div>
  )
}

export default function AddTransaction() {
  const location = useLocation()
  const navigate = useNavigate()
  const editingTransaction = location.state?.editingTransaction ?? null
  const [step, setStep] = useState(() => (editingTransaction ? 2 : 1))
  const [category, setCategory] = useState(() => editingTransaction?.category ?? '')
  const [saveMessage, setSaveMessage] = useState('')

  const activeSchema = category ? transactionSchemas[category] ?? [] : []
  const selectedCategory = useMemo(
    () => transactionCategoryOptions.find((option) => option.value === category) ?? null,
    [category],
  )

  function handleCategorySelect(nextCategory) {
    setCategory(nextCategory)
    setSaveMessage('')
    setStep(2)
  }

  function handleSubmit(payload) {
    editingTransaction
      ? editInvestmentTransaction(editingTransaction.id, payload.category, payload.fields)
      : addInvestmentTransaction(payload.category, payload.fields)

    setSaveMessage(editingTransaction ? 'Transaction updated locally.' : 'Transaction saved locally.')
    setStep(3)
  }

  return (
    <PageShell>
      <div className="space-y-4">
        <article className="glass-card p-5">
          <p className="text-center text-base font-semibold text-wn-text">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </p>
          <div className="mt-5 flex items-start gap-3">
            <StepDot index={1} label="Category" active={step === 1} complete={step > 1} />
            <div className="h-[2px] flex-1 bg-white/8">
              <div className={`h-full bg-wn-accent-strong ${step > 1 ? 'w-full' : 'w-0'}`} />
            </div>
            <StepDot index={2} label="Details" active={step === 2} complete={step > 2} />
            <div className="h-[2px] flex-1 bg-white/8">
              <div className={`h-full bg-wn-accent-strong ${step > 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <StepDot index={3} label="Review" active={step === 3} complete={false} />
          </div>
        </article>

        {step === 1 ? (
          <section className="space-y-3">
            <div className="px-1">
              <p className="section-title">Select Investment Type</p>
              <p className="mt-1 text-sm text-wn-muted">
                Every option opens a dynamic schema-driven form.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {transactionCategoryOptions.map((option) => {
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleCategorySelect(option.value)}
                    className="glass-card flex min-h-32 flex-col items-start justify-between p-4 text-left hover:bg-white/[0.05]"
                  >
                    <CategoryIconBadge categoryId={option.value} size={20} />
                    <div>
                      <p className="text-base font-semibold text-wn-text">{option.label}</p>
                      <p className="mt-1 text-sm text-wn-muted">
                        Tap to continue
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <article className="glass-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedCategory ? (
                    <CategoryIconBadge categoryId={selectedCategory.value} size={21} className="h-12 w-12" />
                  ) : null}
                  <div>
                    <p className="text-base font-semibold text-wn-text">
                      {selectedCategory?.label ?? 'Select a category'}
                    </p>
                    <p className="mt-1 text-sm text-wn-muted">
                      {selectedCategory?.value === 'stocks'
                        ? 'Equity shares listed on NSE/BSE'
                        : 'Schema fields are loaded dynamically from the selected category.'}
                    </p>
                  </div>
                </div>

                <button type="button" onClick={() => setStep(1)} className="secondary-button h-10 w-10 rounded-2xl px-0 py-0">
                  <ChevronRight size={18} />
                </button>
              </div>
            </article>

            {category ? (
              <DynamicForm
                category={category}
                schema={activeSchema}
                initialValues={
                  editingTransaction && editingTransaction.category === category
                    ? editingTransaction.rawData
                    : null
                }
                submitLabel={editingTransaction ? 'Update Transaction' : 'Review Transaction'}
                onSubmit={handleSubmit}
              />
            ) : (
              <article className="glass-card p-5">
                <p className="section-title">Choose a category first</p>
                <p className="mt-2 text-sm text-wn-muted">
                  Go back to step 1 and pick the asset category before filling the form.
                </p>
              </article>
            )}
          </section>
        )}

        {saveMessage ? (
          <article className="glass-card p-5">
            <p className="section-title">Status</p>
            <p className="mt-3 rounded-[20px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {saveMessage}
            </p>

            {editingTransaction ? (
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="mt-4 secondary-button"
              >
                Back to Transactions
              </button>
            ) : null}
          </article>
        ) : null}
      </div>
    </PageShell>
  )
}
