/**
 * ชิ้นส่วนของหน้าหลัก (dashboard): การ์ดสรุป วงแหวนความคืบหน้า และกราฟเส้นจิ๋ว
 * กราฟทุกตัวเป็นภาพประกอบ (aria-hidden) — ตัวเลขที่เป็นข้อความข้าง ๆ คือข้อมูลจริงที่ screen reader อ่าน
 */
import { CaretRightIcon, type Icon } from './icons'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** การ์ดที่กดทั้งใบเพื่อไปหน้ารายละเอียด */
export function Tile({
  to,
  title,
  icon: TileIcon,
  children,
  className = '',
}: {
  to: string
  title: string
  icon: Icon
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-primary/40 active:scale-[0.99] ${className}`}
    >
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
        <TileIcon size={18} className="shrink-0 text-primary-strong" aria-hidden="true" />
        <span className="flex-1">{title}</span>
        <CaretRightIcon size={16} className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
      </h2>
      {children}
    </Link>
  )
}

/** วงแหวนความคืบหน้า มีตัวเลขอยู่กลางวง */
export function Ring({
  value,
  max,
  size = 88,
  tone = 'accent',
  children,
}: {
  value: number
  max: number
  size?: number
  tone?: 'accent' | 'primary'
  children: ReactNode
}) {
  const stroke = 9
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-muted" />
        {ratio > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference * ratio} ${circumference}`}
            className={tone === 'accent' ? 'stroke-accent-strong' : 'stroke-primary-strong'}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-tight">{children}</div>
    </div>
  )
}

/** กราฟเส้นจิ๋ว (ค่าเดียว) จุดสุดท้ายเน้นด้วยวงกลม */
export function Sparkline({ values, width = 120, height = 36 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null
  const pad = 5
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (width - pad * 2),
    height - pad - ((v - min) / span) * (height - pad * 2),
  ])
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-accent-strong"
      />
      <circle cx={lx} cy={ly} r={4} strokeWidth={2} className="fill-accent-strong stroke-surface" />
    </svg>
  )
}

/** แถวตัวเลขสรุป: ไอคอนสี + ข้อความ + ตัวเลข (สีไม่ใช่ตัวสื่อความหมายอย่างเดียว) */
export function StatRow({ icon: RowIcon, iconClass, label, value }: { icon: Icon; iconClass: string; label: string; value: number }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <RowIcon size={16} weight="fill" className={`shrink-0 ${iconClass}`} aria-hidden="true" />
      <span className="flex-1 text-ink-muted">{label}</span>
      <span className="font-semibold tabular-nums text-ink">{value}</span>
    </li>
  )
}
