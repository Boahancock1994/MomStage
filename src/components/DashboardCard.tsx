/** การ์ดที่กดทั้งใบเพื่อไปหน้ารายละเอียด ใช้ในหน้า "ตอนนี้" */
import { CaretRightIcon, type Icon } from './icons'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function DashboardCard({
  to,
  title,
  icon: CardIcon,
  linkLabel,
  children,
  className = '',
}: {
  to: string
  title: string
  icon: Icon
  linkLabel: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`group block rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-primary/40 active:scale-[0.99] ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <CardIcon size={22} className="text-primary-strong" aria-hidden="true" />
        <h2 className="flex-1 text-lg font-semibold">{title}</h2>
        <span className="flex items-center gap-0.5 text-sm font-medium text-primary-strong">
          {linkLabel}
          <CaretRightIcon size={16} className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
      {children}
    </Link>
  )
}
