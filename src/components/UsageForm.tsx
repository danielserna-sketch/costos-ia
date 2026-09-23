import type { UsageEstimate } from '@/types/model'

interface UsageFormProps {
  usage: UsageEstimate
  onChange: (usage: UsageEstimate) => void
}

export function UsageForm({ usage, onChange }: UsageFormProps) {
  const handleChange = (field: keyof UsageEstimate) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number(event.target.value)
    onChange({ ...usage, [field]: Number.isNaN(value) ? 0 : value })
  }

  return (
    <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
      <Field
        label="Tokens de entrada / request"
        value={usage.inputTokens}
        onChange={handleChange('inputTokens')}
      />
      <Field
        label="Tokens de salida / request"
        value={usage.outputTokens}
        onChange={handleChange('outputTokens')}
      />
      <Field
        label="Requests / mes"
        value={usage.requestsPerMonth}
        onChange={handleChange('requestsPerMonth')}
      />
    </section>
  )
}

interface FieldProps {
  label: string
  value: number
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

function Field({ label, value, onChange }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
      {label}
      <input
        type="number"
        min={0}
        value={value}
        onChange={onChange}
        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base font-normal text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  )
}
