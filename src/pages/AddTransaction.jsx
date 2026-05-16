import { ChevronRight, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CategoryIconBadge } from '../components/CategoryVisuals'
import DynamicForm from '../components/DynamicForm'
import PageShell from '../components/PageShell'
import StockBasketForm from '../components/StockBasketForm'
import {
  buildMasterCardMeta,
  deleteMasterRecord,
  getMasterFormInitialValues,
  buildSlaveInitialValues,
  buildSlaveRawData,
  getMasterCategoryConfig,
  getSlaveSchema,
  listActiveMasterRecords,
  listMasterRecords,
  masterCategoryOptions,
  requiresMasterSelection,
  saveMasterRecord,
  slaveCategoryOptions,
  toggleMasterRecordStatus,
} from '../utils/masterData'
import { addInvestmentTransaction, editInvestmentTransaction } from '../utils/transactionEngine'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

function TabChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition',
        active
          ? 'bg-wn-accent-strong text-[#04110a] shadow-[0_10px_24px_rgba(34,197,94,0.22)]'
          : 'text-wn-muted',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function CategoryCard({ option, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className="glass-card flex min-h-32 flex-col items-start justify-between p-4 text-left hover:bg-white/[0.05]"
    >
      <CategoryIconBadge categoryId={option.value} size={20} />
      <div>
        <p className="text-base font-semibold text-wn-text">{option.label}</p>
        <p className="mt-1 text-sm text-wn-muted">Tap to continue</p>
      </div>
    </button>
  )
}

function RecordCard({ category, record, meta, onDelete, onEdit, onToggleStatus, statusActionLabel }) {
  const hasDueDate = Boolean(`${meta.dueDate ?? ''}`.trim())

  return (
    <article className="glass-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-wn-text">{meta.title}</p>
          <p className="mt-0.5 text-xs text-wn-muted">{meta.identifier}</p>
        </div>
        <CategoryIconBadge categoryId={category} size={16} className="h-9 w-9 shrink-0" />
      </div>

      <div className={`mt-3 grid gap-2 ${hasDueDate ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
          <p className="metric-label">Amount</p>
          <p className="mt-1.5 text-xs font-semibold text-wn-text">{formatCurrency(meta.amount)}</p>
        </div>
        {hasDueDate ? (
          <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
            <p className="metric-label">Due Date</p>
            <p className="mt-1.5 text-xs font-semibold text-wn-text">{meta.dueDate}</p>
          </div>
        ) : null}
        <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
          <p className="metric-label">Status</p>
          <p className={`mt-1.5 text-xs font-semibold ${meta.status === 'ACTIVE' ? 'text-emerald-300' : 'text-amber-300'}`}>
            {meta.status}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onDelete(record)}
          className="inline-flex items-center justify-center rounded-2xl border border-rose-500/35 bg-rose-300/22 px-4 py-2.5 text-sm font-medium text-rose-950 hover:bg-rose-300/28"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => onEdit(record)}
          className="inline-flex items-center justify-center rounded-2xl border border-sky-500/35 bg-sky-300/20 px-4 py-2.5 text-sm font-medium text-sky-950 hover:bg-sky-300/26"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onToggleStatus(record)}
          className="inline-flex items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-300/22 px-4 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-300/28"
        >
          {statusActionLabel}
        </button>
      </div>
    </article>
  )
}

export default function AddTransaction() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [editingTransaction, setEditingTransaction] = useState(
    () => location.state?.editingTransaction ?? null,
  )

  const activeTab = searchParams.get('tab') ?? (editingTransaction ? 'slave' : 'master')
  const masterCategory = searchParams.get('masterCategory') ?? ''
  const slaveCategory = searchParams.get('slaveCategory') ?? (editingTransaction?.category ?? '')
  const selectedMasterId = searchParams.get('masterId') ?? String(editingTransaction?.rawData?.masterId ?? '')

  const [editingMaster, setEditingMaster] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveMessageTone, setSaveMessageTone] = useState('success')
  const [isSavingMaster, setIsSavingMaster] = useState(false)
  const [isSavingSlave, setIsSavingSlave] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [slaveFormResetKey, setSlaveFormResetKey] = useState(0)
  const [pendingDeleteMaster, setPendingDeleteMaster] = useState(null)

  const masterGroups = useMemo(() => listMasterRecords(), [refreshKey])
  const activeMasterRecords = useMemo(
    () => (slaveCategory ? listActiveMasterRecords(slaveCategory) : []),
    [refreshKey, slaveCategory],
  )
  const selectedMaster = useMemo(
    () =>
      activeMasterRecords.find((record) => String(record.id) === String(selectedMasterId)) ??
      Object.values(masterGroups)
        .flat()
        .find((record) => String(record.id) === String(selectedMasterId)) ??
      null,
    [activeMasterRecords, masterGroups, selectedMasterId],
  )

  const activeMasterConfig = useMemo(
    () => (masterCategory ? getMasterCategoryConfig(masterCategory) : null),
    [masterCategory],
  )
  const slaveSchema = useMemo(() => {
    if (!slaveCategory) {
      return []
    }

    return getSlaveSchema(slaveCategory)
  }, [slaveCategory])

  const slaveInitialValues = useMemo(
    () => buildSlaveInitialValues(slaveCategory, selectedMaster, editingTransaction),
    [editingTransaction, selectedMaster, slaveCategory],
  )

  function updateFlowParams(nextValues) {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        nextParams.delete(key)
      } else {
        nextParams.set(key, String(value))
      }
    })

    setSearchParams(nextParams)
  }

  function setStatusMessage(message, tone = 'success') {
    setSaveMessage(message)
    setSaveMessageTone(tone)
  }

  function resetMasterFlow() {
    setEditingMaster(null)
    setStatusMessage('', 'success')
    updateFlowParams({
      tab: 'master',
      masterCategory: '',
    })
  }

  function resetSlaveFlow() {
    setStatusMessage('', 'success')
    updateFlowParams({
      tab: 'slave',
      slaveCategory: '',
      masterId: '',
    })
  }

  function handleMasterCategorySelect(category) {
    setEditingMaster(null)
    setStatusMessage('', 'success')
    updateFlowParams({
      tab: 'master',
      masterCategory: category,
    })
  }

  function handleMasterEdit(category, record) {
    updateFlowParams({
      tab: 'master',
      masterCategory: category,
    })
    setEditingMaster(record)
    setStatusMessage('', 'success')
  }

  function handleMasterSubmit(payload) {
    setIsSavingMaster(true)

    try {
      const saved = saveMasterRecord(payload.category, payload.fields, editingMaster?.id ?? null)

      if (!saved) {
        setStatusMessage('Account record could not be saved.', 'error')
        return
      }

      setRefreshKey((value) => value + 1)
      setStatusMessage(editingMaster ? 'Account record updated.' : 'Account record created.')
      setEditingMaster(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected storage error.'
      setStatusMessage(`Account record could not be saved. ${message}`, 'error')
    } finally {
      setIsSavingMaster(false)
    }
  }

  function handleMasterStatusToggle(category, record) {
    toggleMasterRecordStatus(category, record)
    setRefreshKey((value) => value + 1)
    setStatusMessage(record.status === 'ACTIVE' ? 'Account record closed.' : 'Account record reopened.')
  }

  function handleMasterDelete(category, record) {
    setPendingDeleteMaster({ category, record })
  }

  function confirmMasterDelete() {
    if (!pendingDeleteMaster) {
      return
    }

    const { category, record } = pendingDeleteMaster

    const deleted = deleteMasterRecord(category, record.id)

    if (!deleted) {
      setStatusMessage('Account record could not be deleted.', 'error')
      setPendingDeleteMaster(null)
      return
    }

    if (editingMaster?.id === record.id) {
      setEditingMaster(null)
    }

    setRefreshKey((value) => value + 1)
    setStatusMessage('Account record deleted.')
    setPendingDeleteMaster(null)
  }

  function handleSlaveCategorySelect(category) {
    if (editingTransaction && editingTransaction.category !== category) {
      setEditingTransaction(null)
      setSlaveFormResetKey((value) => value + 1)
      setStatusMessage(
        'Category changed. Edit mode was cleared to avoid reusing fields from the previous entry.',
        'info',
      )
    } else {
      setStatusMessage('', 'success')
    }

    updateFlowParams({
      tab: 'slave',
      slaveCategory: category,
      masterId: editingTransaction?.category === category ? editingTransaction?.rawData?.masterId ?? '' : '',
    })
  }

  function handleSlaveSubmit(payload) {
    const rawData = buildSlaveRawData(payload.category, payload.fields, selectedMaster)
    const needsForcedTransaction =
      Boolean(selectedMaster?.id) && requiresMasterSelection(payload.category)

    setIsSavingSlave(true)

    try {
      if (editingTransaction) {
        editInvestmentTransaction(editingTransaction.id, payload.category, rawData, {
          forceTransaction: needsForcedTransaction,
        })
      } else {
        addInvestmentTransaction(payload.category, rawData, {
          forceTransaction: needsForcedTransaction,
        })
      }

      setRefreshKey((value) => value + 1)
      setStatusMessage(editingTransaction ? 'Entry updated locally.' : 'Entry saved locally.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected storage error.'
      setStatusMessage(`Entry could not be saved. ${message}`, 'error')
    } finally {
      setIsSavingSlave(false)
    }
  }

  function handleAddAnotherEntry() {
    setStatusMessage('', 'success')
    setSlaveFormResetKey((value) => value + 1)
  }

  const showSlaveMasterSelection =
    slaveCategory &&
    requiresMasterSelection(slaveCategory) &&
    !editingTransaction &&
    !selectedMasterId

  const canRenderSlaveForm =
    Boolean(slaveCategory) &&
    (!requiresMasterSelection(slaveCategory) || Boolean(selectedMaster) || Boolean(editingTransaction))

  return (
    <PageShell>
      <div className="space-y-4">
        <div className="sticky top-0 z-10 space-y-3 bg-wn-bg/96 pb-2 pt-1 backdrop-blur-xl">
          <article className="rounded-[24px] border border-wn-border bg-wn-card/88 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
            <div className="flex gap-2 rounded-full border border-wn-border bg-white/[0.03] p-1">
              <TabChip
                active={activeTab === 'master'}
                label="Accounts"
                onClick={() => {
                  setStatusMessage('', 'success')
                  updateFlowParams({
                    tab: 'master',
                    slaveCategory: '',
                    masterId: '',
                  })
                }}
              />
              <TabChip
                active={activeTab === 'slave'}
                label="Add Entry"
                onClick={() => {
                  setStatusMessage('', 'success')
                  updateFlowParams({
                    tab: 'slave',
                    masterCategory: '',
                  })
                }}
              />
            </div>

            <p className="mt-3 px-2 text-sm text-wn-muted">
              {activeTab === 'master'
                ? 'Create and manage reusable account records.'
                : editingTransaction
                  ? 'Update the selected investment entry.'
                  : 'Record a new transaction against an account or direct category.'}
            </p>
          </article>
        </div>

        {activeTab === 'master' ? (
          <section className="space-y-4">
            {masterCategory && activeMasterConfig ? (
              <section className="space-y-4">
                <article className="glass-card p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <CategoryIconBadge categoryId={masterCategory} size={21} className="h-12 w-12" />
                      <div>
                        <p className="text-base font-semibold text-wn-text">
                          {editingMaster ? `Edit ${activeMasterConfig.label}` : `New ${activeMasterConfig.label}`}
                        </p>
                        <p className="mt-1 text-sm text-wn-muted">
                          {editingMaster
                            ? 'Update account details without removing historical records.'
                            : 'Create an account record for future transaction entries.'}
                        </p>
                      </div>
                    </div>

                    <button type="button" onClick={resetMasterFlow} className="secondary-button h-10 w-10 rounded-2xl px-0 py-0">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </article>

                <DynamicForm
                  category={masterCategory}
                  schema={activeMasterConfig.masterSchema}
                  initialValues={getMasterFormInitialValues(masterCategory, editingMaster)}
                  submitLabel={editingMaster ? 'Update Account' : 'Save Account'}
                  isSubmitting={isSavingMaster}
                  showCalculatedSummary={false}
                  title="Account Details"
                  description="Maintain reusable account information for this category. Transaction totals are not shown here."
                  onSubmit={handleMasterSubmit}
                />
              </section>
            ) : (
              <>
                <div className="px-1 pt-2">
                  <p className="section-title">Choose Category</p>
                  <p className="mt-1 text-sm text-wn-muted">
                    Select a category to create or update its account record.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {masterCategoryOptions.map((option) => (
                    <CategoryCard key={option.value} option={option} onSelect={handleMasterCategorySelect} />
                  ))}
                </div>

                <article className="glass-card mt-2 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/14 text-emerald-400">
                      <ShieldCheck size={20} strokeWidth={2.1} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-wn-text">What is Account Data?</p>
                      <p className="mt-1 text-sm leading-6 text-wn-muted">
                        Accounts data is one-time setup that you will use for adding transactions.
                      </p>
                    </div>
                  </div>
                </article>

                <div className="space-y-5">
                  {Object.entries(masterGroups).map(([category, records]) => {
                    if (records.length === 0) {
                      return null
                    }

                    const label = getMasterCategoryConfig(category)?.label ?? category

                    return (
                      <section key={category} className="space-y-3">
                        <div className="flex items-center justify-between gap-3 px-1">
                          <p className="text-base font-semibold text-wn-text">{label}</p>
                          <span className="text-xs uppercase tracking-[0.18em] text-wn-muted">
                            {records.length} records
                          </span>
                        </div>

                        <div className="space-y-3">
                          {records.map((record) => {
                            const meta = buildMasterCardMeta(category, record)

                            return (
                              <RecordCard
                                key={`${category}-${record.id}`}
                                category={category}
                                record={record}
                                meta={meta}
                                onDelete={() => handleMasterDelete(category, record)}
                                onEdit={() => handleMasterEdit(category, record)}
                                onToggleStatus={() => handleMasterStatusToggle(category, record)}
                                statusActionLabel={meta.status === 'ACTIVE' ? 'Close' : 'Reopen'}
                              />
                            )
                          })}
                        </div>
                      </section>
                    )
                  })}
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            {slaveCategory ? (
              <article className="glass-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CategoryIconBadge categoryId={slaveCategory} size={21} className="h-12 w-12" />
                    <div>
                      <p className="text-base font-semibold text-wn-text">
                        {slaveCategoryOptions.find((option) => option.value === slaveCategory)?.label ?? slaveCategory}
                      </p>
                      <p className="mt-1 text-sm text-wn-muted">
                        {requiresMasterSelection(slaveCategory)
                          ? 'Only active account records are available for selection.'
                          : 'This category supports direct transaction entry without an account link.'}
                      </p>
                    </div>
                  </div>

                  <button type="button" onClick={resetSlaveFlow} className="secondary-button h-10 w-10 rounded-2xl px-0 py-0">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </article>
            ) : (
              <>
                <div className="px-1 pt-2">
                  <p className="section-title">Choose Category</p>
                  <p className="mt-1 text-sm text-wn-muted">
                    Select a category to open the relevant entry form.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {slaveCategoryOptions.map((option) => (
                    <CategoryCard key={option.value} option={option} onSelect={handleSlaveCategorySelect} />
                  ))}
                </div>

                <article className="glass-card mt-2 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/14 text-sky-400">
                      <ShieldCheck size={20} strokeWidth={2.1} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-wn-text">What is Add Entry?</p>
                      <p className="mt-1 text-sm leading-6 text-wn-muted">
                        Add Entry is used to record transactions for the selected category or account.
                      </p>
                    </div>
                  </div>
                </article>
              </>
            )}

            {showSlaveMasterSelection ? (
              <section className="space-y-3">
                <div className="px-1">
                  <p className="section-title">Select Active Account</p>
                  <p className="mt-1 text-sm text-wn-muted">
                    Closed account records are excluded from this selection list.
                  </p>
                </div>

                {activeMasterRecords.length > 0 ? (
                  <div className="space-y-3">
                    {activeMasterRecords.map((record) => {
                      const meta = buildMasterCardMeta(slaveCategory, record)
                      const hasDueDate = Boolean(`${meta.dueDate ?? ''}`.trim())

                      return (
                        <button
                          key={`${slaveCategory}-${record.id}`}
                          type="button"
                          onClick={() =>
                            updateFlowParams({
                              tab: 'slave',
                              slaveCategory,
                              masterId: record.id,
                            })
                          }
                          className="glass-card block w-full p-3.5 text-left hover:bg-white/[0.05]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-wn-text">{meta.title}</p>
                              <p className="mt-0.5 text-xs text-wn-muted">{meta.identifier}</p>
                            </div>
                            <CategoryIconBadge categoryId={slaveCategory} size={16} className="h-9 w-9 shrink-0" />
                          </div>

                          <div className={`mt-3 grid gap-2 ${hasDueDate ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
                              <p className="metric-label">Amount</p>
                              <p className="mt-1.5 text-xs font-semibold text-wn-text">{formatCurrency(meta.amount)}</p>
                            </div>
                            {hasDueDate ? (
                              <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
                                <p className="metric-label">Due Date</p>
                                <p className="mt-1.5 text-xs font-semibold text-wn-text">{meta.dueDate}</p>
                              </div>
                            ) : null}
                            <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
                              <p className="metric-label">Status</p>
                              <p className="mt-1.5 text-xs font-semibold text-emerald-300">{meta.status}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <article className="glass-card p-5">
                    <p className="section-title">No Active Accounts</p>
                    <p className="mt-2 text-sm text-wn-muted">
                      Create an account record first or reopen an existing one before adding entries.
                    </p>
                  </article>
                )}
              </section>
            ) : null}

            {selectedMaster ? (
              <article className="glass-card p-4">
                <p className="text-sm text-wn-muted">Selected Account</p>
                <p className="mt-2 text-base font-semibold text-wn-text">
                  {buildMasterCardMeta(slaveCategory, selectedMaster)?.title}
                </p>
                <p className="mt-1 text-sm text-wn-muted">
                  {buildMasterCardMeta(slaveCategory, selectedMaster)?.identifier}
                </p>
              </article>
            ) : null}

            {canRenderSlaveForm && slaveSchema.length > 0 ? (
              slaveCategory === 'stocks' ? (
                <StockBasketForm
                  key={`${slaveCategory}-${editingTransaction?.id ?? 'new'}-${slaveFormResetKey}`}
                  category={slaveCategory}
                  initialValues={slaveInitialValues}
                  submitLabel={editingTransaction ? 'Update Entry' : 'Save Entry'}
                  isSubmitting={isSavingSlave}
                  title="Transaction Details"
                  description="Record multiple stock line items in one broker trade with combined charges."
                  onSubmit={handleSlaveSubmit}
                />
              ) : (
                <DynamicForm
                  key={`${slaveCategory}-${selectedMasterId || 'direct'}-${editingTransaction?.id ?? 'new'}-${slaveFormResetKey}`}
                  category={slaveCategory}
                  schema={slaveSchema}
                  initialValues={slaveInitialValues}
                  submitLabel={editingTransaction ? 'Update Entry' : 'Save Entry'}
                  isSubmitting={isSavingSlave}
                  title="Transaction Details"
                  description="Fields are generated from the selected category configuration."
                  onSubmit={handleSlaveSubmit}
                />
              )
            ) : null}

            {canRenderSlaveForm && slaveSchema.length === 0 ? (
              <article className="glass-card p-5">
                <p className="section-title">Entry Form Not Configured</p>
                <p className="mt-2 text-sm text-wn-muted">
                  This category is enabled for the account-entry workflow, but its entry form is not configured yet.
                </p>
              </article>
            ) : null}
          </section>
        )}

        {saveMessage ? (
          <article className="glass-card p-5">
            <p className="section-title">Status</p>
            <p
              className={[
                'mt-3 rounded-[20px] border px-4 py-3 text-sm font-medium',
                saveMessageTone === 'error'
                  ? 'border-rose-500/35 bg-rose-400/14 text-rose-200'
                  : saveMessageTone === 'info'
                    ? 'border-sky-500/35 bg-sky-400/14 text-sky-200'
                  : 'border-emerald-500/35 bg-emerald-400/16 text-emerald-900',
              ].join(' ')}
            >
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
            ) : activeTab === 'slave' && saveMessageTone !== 'error' ? (
              <button
                type="button"
                onClick={handleAddAnotherEntry}
                className="mt-4 secondary-button"
              >
                Add Another Entry
              </button>
            ) : null}
          </article>
        ) : null}

        {pendingDeleteMaster ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 px-4 pb-6 pt-10 backdrop-blur sm:items-center">
            <article
              role="dialog"
              aria-modal="true"
              aria-label="Delete account confirmation"
              className="glass-card w-full max-w-md p-5"
            >
              <p className="section-title">Delete Account Record?</p>
              <p className="mt-2 text-sm text-wn-muted">
                This will permanently remove the saved account record. Historical entries linked to it will not be restored automatically.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDeleteMaster(null)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmMasterDelete}
                  className="inline-flex items-center justify-center rounded-2xl border border-rose-500/35 bg-rose-300/22 px-4 py-3 text-sm font-medium text-rose-950 hover:bg-rose-300/28"
                >
                  Delete
                </button>
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </PageShell>
  )
}
