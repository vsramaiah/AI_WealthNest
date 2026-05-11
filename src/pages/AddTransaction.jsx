import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CategoryIconBadge } from '../components/CategoryVisuals'
import DynamicForm from '../components/DynamicForm'
import PageShell from '../components/PageShell'
import {
  buildMasterCardMeta,
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

function RecordCard({ category, record, meta, onEdit, onToggleStatus, statusActionLabel }) {
  return (
    <article className="glass-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-wn-text">{meta.title}</p>
          <p className="mt-0.5 text-xs text-wn-muted">{meta.identifier}</p>
        </div>
        <CategoryIconBadge categoryId={category} size={16} className="h-9 w-9 shrink-0" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
          <p className="metric-label">Amount</p>
          <p className="mt-1.5 text-xs font-semibold text-wn-text">{formatCurrency(meta.amount)}</p>
        </div>
        <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
          <p className="metric-label">Due Date</p>
          <p className="mt-1.5 text-xs font-semibold text-wn-text">{meta.dueDate}</p>
        </div>
        <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
          <p className="metric-label">Status</p>
          <p className={`mt-1.5 text-xs font-semibold ${meta.status === 'ACTIVE' ? 'text-emerald-300' : 'text-amber-300'}`}>
            {meta.status}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onEdit(record)} className="secondary-button py-2.5 text-sm">
          Edit
        </button>
        <button
          type="button"
          onClick={() => onToggleStatus(record)}
          className="inline-flex items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-wn-text hover:bg-white/[0.06]"
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
  const editingTransaction = location.state?.editingTransaction ?? null

  const activeTab = searchParams.get('tab') ?? (editingTransaction ? 'slave' : 'master')
  const masterCategory = searchParams.get('masterCategory') ?? ''
  const slaveCategory = searchParams.get('slaveCategory') ?? (editingTransaction?.category ?? '')
  const selectedMasterId = searchParams.get('masterId') ?? String(editingTransaction?.rawData?.masterId ?? '')

  const [editingMaster, setEditingMaster] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

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

  function resetMasterFlow() {
    setEditingMaster(null)
    updateFlowParams({
      tab: 'master',
      masterCategory: '',
    })
  }

  function resetSlaveFlow() {
    updateFlowParams({
      tab: 'slave',
      slaveCategory: '',
      masterId: '',
    })
  }

  function handleMasterCategorySelect(category) {
    setEditingMaster(null)
    setSaveMessage('')
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
    setSaveMessage('')
  }

  function handleMasterSubmit(payload) {
    const saved = saveMasterRecord(payload.category, payload.fields, editingMaster?.id ?? null)

    if (!saved) {
      setSaveMessage('Master record could not be saved.')
      return
    }

    setRefreshKey((value) => value + 1)
    setSaveMessage(editingMaster ? 'Master record updated.' : 'Master record created.')
    setEditingMaster(null)
  }

  function handleMasterStatusToggle(category, record) {
    toggleMasterRecordStatus(category, record)
    setRefreshKey((value) => value + 1)
    setSaveMessage(record.status === 'ACTIVE' ? 'Master record closed.' : 'Master record reopened.')
  }

  function handleSlaveCategorySelect(category) {
    setSaveMessage('')
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
    setSaveMessage(editingTransaction ? 'Slave transaction updated locally.' : 'Slave transaction saved locally.')
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
          <article className="glass-card p-5">
            <p className="text-center text-base font-semibold text-wn-text">
              {editingTransaction ? 'Edit Entry' : 'Create Record'}
            </p>

            <div className="mt-4 flex gap-2 rounded-full border border-white/8 bg-white/[0.03] p-1">
              <TabChip
                active={activeTab === 'master'}
                label="Accounts"
                onClick={() => {
                  setSaveMessage('')
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
                  setSaveMessage('')
                  updateFlowParams({
                    tab: 'slave',
                    masterCategory: '',
                  })
                }}
              />
            </div>
          </article>
        </div>

        {activeTab === 'master' ? (
          <section className="space-y-4">
            <div className="px-1">
              <p className="section-title">Accounts</p>
              <p className="mt-1 text-sm text-wn-muted">
                Maintain account-level records that remain available for reference and audit history.
              </p>
            </div>

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
                  showCalculatedSummary={false}
                  title="Account Details"
                  description="Maintain reusable account information for this category. Transaction totals are not shown here."
                  onSubmit={handleMasterSubmit}
                />
              </section>
            ) : (
              <>
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

                <div className="px-1 pt-2">
                  <p className="section-title">Create or Update Account</p>
                  <p className="mt-1 text-sm text-wn-muted">
                    Select a category to create or update its account record.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {masterCategoryOptions.map((option) => (
                    <CategoryCard key={option.value} option={option} onSelect={handleMasterCategorySelect} />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div className="px-1">
              <p className="section-title">Add Entry</p>
              <p className="mt-1 text-sm text-wn-muted">
                Select a category, link an active account when required, and record the entry.
              </p>
            </div>

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

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
                              <p className="metric-label">Amount</p>
                              <p className="mt-1.5 text-xs font-semibold text-wn-text">{formatCurrency(meta.amount)}</p>
                            </div>
                            <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-2.5">
                              <p className="metric-label">Due Date</p>
                              <p className="mt-1.5 text-xs font-semibold text-wn-text">{meta.dueDate}</p>
                            </div>
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
                <DynamicForm
                  category={slaveCategory}
                  schema={slaveSchema}
                  initialValues={slaveInitialValues}
                  submitLabel={editingTransaction ? 'Update Entry' : 'Save Entry'}
                  title="Transaction Details"
                  description="Fields are generated from the selected category configuration."
                  onSubmit={handleSlaveSubmit}
                />
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
            <p className="mt-3 rounded-[20px] border border-emerald-500/35 bg-emerald-400/16 px-4 py-3 text-sm font-medium text-emerald-900">
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
