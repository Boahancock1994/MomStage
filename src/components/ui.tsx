/** ชิ้นส่วน UI ที่ใช้ซ้ำทั้งแอป — รวมไว้ที่เดียวเพื่อให้หน้าตาสม่ำเสมอ */
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-primary-strong hover:bg-primary-soft',
  danger: 'border border-danger/30 bg-surface text-danger hover:bg-danger-soft',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </section>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-bold leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
    </header>
  )
}

/** ปุ่มเลือกแบบแบ่งช่อง (segmented control) ใช้ radio input ข้างใน เพื่อให้คีย์บอร์ดและ screen reader ใช้ได้ */
export function Segmented<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string
  legend: string
  value: T | undefined
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium text-ink">{legend}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((opt) => {
          const checked = value === opt.value
          return (
            <label
              key={opt.value}
              className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-center font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-strong ${
                checked
                  ? 'border-primary-strong bg-primary-soft text-primary-strong'
                  : 'border-line bg-surface text-ink-muted hover:bg-surface-muted'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {opt.icon}
              <span>{opt.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string
  label: string
  hint?: ReactNode
  error?: string | null
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-medium text-ink">
        {label}
        {required && (
          <span className="text-primary-strong" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-2 text-sm text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export const inputClass =
  'block min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-primary-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-primary-strong aria-[invalid=true]:border-danger'

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
    >
      <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${clamped}%` }} />
    </div>
  )
}

/** ป้ายสถานะ: สี + ไอคอน + ข้อความ (ไม่สื่อความหมายด้วยสีอย่างเดียว) */
export type Tone = 'success' | 'warning' | 'danger' | 'neutral'

const toneStyles: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-muted text-ink-muted',
}

export function Badge({ tone, icon, children }: { tone: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneStyles[tone]}`}>
      {icon}
      {children}
    </span>
  )
}
