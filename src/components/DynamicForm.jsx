import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { calculateTransactionByCategory } from '../utils/transactionEngine'

function buildInitialValues(schema) {
  return schema.reduce((values, field) => {
    values[field.name] = field.defaultValue ?? ''
    return values
  }, {})
}

function isFieldVisible(field, values) {
  if (typeof field.showWhen === 'function') {
    return field.showWhen(values)
  }

  if (field.showWhen && typeof field.showWhen === 'object') {
    return Object.entries(field.showWhen).every(
      ([name, expectedValue]) => values?.[name] === expectedValue,
    )
  }

  return true
}

function validateField(field, value, values) {
  if (!isFieldVisible(field, values)) {
    return ''
  }

  if (field.required && `${value}`.trim() === '') {
    return `${field.label} is required.`
  }

  if (field.type === 'number' && `${value}`.trim() !== '') {
    const numericValue = Number(value)

    if (Number.isNaN(numericValue)) {
      return `${field.label} must be a valid number.`
    }

    if (field.min !== undefined && numericValue < field.min) {
      return `${field.label} must be at least ${field.min}.`
    }

    if (field.max !== undefined && numericValue > field.max) {
      return `${field.label} must be no more than ${field.max}.`
    }
  }

  if (typeof field.validate === 'function') {
    return field.validate(value, values)
  }

  return ''
}

function buildPayload(category, values, schema) {
  return {
    category,
    fields: schema.reduce((payload, field) => {
      const rawValue = values[field.name]

      payload[field.name] =
        field.type === 'number' && `${rawValue}`.trim() !== ''
          ? Number(rawValue)
          : rawValue

      return payload
    }, {}),
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const expandedSummaryCategories = new Set(['stocks', 'goldSilver', 'crypto'])

function shouldUseSegmentedControl(field) {
  return field.type === 'select' && field.name === 'txnType' && (field.options?.length ?? 0) <= 3
}

function getFieldSpan(field) {
  const halfWidthFields = new Set([
    'exchange',
    'orderType',
    'ticker',
    'stockName',
    'quantity',
    'pricePerShare',
    'nav',
    'units',
    'faceValue',
    'interestRate',
    'employeeContribution',
    'employerContribution',
    'tier',
    'scheme',
  ])

  return halfWidthFields.has(field.name) ? 'sm:col-span-1' : 'sm:col-span-2'
}

function DynamicField({ field, value, error, onChange }) {
  return (
    <label className={`block ${getFieldSpan(field)}`}>
      <div className="mb-2 flex items-center gap-3">
        <span className="text-sm font-medium text-wn-text">
          {field.label}
          {field.required ? <span className="ml-0.5 text-emerald-300">*</span> : null}
        </span>
      </div>

      {shouldUseSegmentedControl(field) ? (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[0.04] p-1">
          {field.options?.map((option) => {
            const active = value === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(field.name, option.value)}
                className={[
                  'rounded-[14px] px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-wn-accent-strong text-[#04110a] shadow-[0_8px_18px_rgba(34,197,94,0.24)]'
                    : 'text-wn-text',
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      ) : field.type === 'select' ? (
        <select
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          className="form-input"
        >
          <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          inputMode={field.type === 'number' ? 'decimal' : undefined}
          value={value}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.name, event.target.value)}
          className="form-input"
        />
      )}

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </label>
  )
}

export default function DynamicForm({
  category,
  schema,
  initialValues = null,
  submitLabel = 'Review Transaction',
  onSubmit,
  showCalculatedSummary = true,
  title = 'Transaction Details',
  description = 'Fields are generated dynamically from the selected category schema.',
}) {
  const [values, setValues] = useState(() => ({
    ...buildInitialValues(schema),
    ...(initialValues ?? {}),
  }))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setValues({
      ...buildInitialValues(schema),
      ...(initialValues ?? {}),
    })
    setErrors({})
  }, [initialValues, schema])

  const visibleSchema = schema.filter((field) => isFieldVisible(field, values))

  function handleChange(name, value) {
    setValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [name]: value,
      }

      schema.forEach((field) => {
        if (!isFieldVisible(field, nextValues) && currentValues[field.name] !== '') {
          nextValues[field.name] = field.defaultValue ?? ''
        }
      })

      return nextValues
    })

    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors
      }

      return {
        ...currentErrors,
        [name]: '',
      }
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = visibleSchema.reduce((collection, field) => {
      const error = validateField(field, values[field.name], values)

      if (error) {
        collection[field.name] = error
      }

      return collection
    }, {})

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit(buildPayload(category, values, schema))
  }

  const calculatedPreview = showCalculatedSummary
    ? calculateTransactionByCategory(category, buildPayload(category, values, schema).fields)
    : null
  const grossValue = showCalculatedSummary
    ? calculatedPreview?.grossValue ??
      (Number(values.quantity) || 0) * (Number(values.pricePerShare) || 0)
    : 0
  const charges = showCalculatedSummary ? Number(values.charges) || 0 : 0
  const totalAmount = showCalculatedSummary
    ? calculatedPreview?.totalAmount ??
      calculatedPreview?.totalValue ??
      (Number(values.amount) || 0)
    : 0
  const showExpandedSummary = expandedSummaryCategories.has(category)

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="glass-card rounded-[28px] border border-white/6 bg-white/[0.03] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="section-title">{title}</p>
            <p className="mt-1 text-sm text-wn-muted">{description}</p>
          </div>
          <div className="icon-badge h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400">
            <Sparkles size={18} strokeWidth={2.2} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {visibleSchema.map((field) => (
            <DynamicField
              key={field.name}
              field={field}
              value={values[field.name] ?? ''}
              error={errors[field.name]}
              onChange={handleChange}
            />
          ))}
        </div>

        {showCalculatedSummary ? (
          <div className="mt-5 rounded-[22px] border border-white/6 bg-white/[0.04] p-4">
            {showExpandedSummary ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-wn-muted">Gross Value</p>
                  <p className="mt-2 text-sm font-semibold text-wn-text">
                    {formatCurrency(Number(grossValue) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-wn-muted">Charges</p>
                  <p className="mt-2 text-sm font-semibold text-wn-text">
                    {formatCurrency(Number(charges) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-wn-muted">Total Amount</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-300">
                    {formatCurrency(Number(totalAmount) || 0)}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-wn-muted">Total Amount</p>
                <p className="mt-2 text-sm font-semibold text-emerald-300">
                  {formatCurrency(Number(totalAmount) || 0)}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <button type="submit" className="primary-button w-full">
        {submitLabel}
      </button>
    </form>
  )
}
