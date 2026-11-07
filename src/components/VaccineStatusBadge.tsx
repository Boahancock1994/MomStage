import { CalendarCheckIcon, CheckCircleIcon, ClockIcon, WarningCircleIcon } from './icons'
import type { VaccineStatus } from '../lib/vaccine'
import { Badge, type Tone } from './ui'

const VACCINE_STATUS_META: Record<VaccineStatus, { label: string; tone: Tone; icon: typeof CheckCircleIcon }> = {
  done: { label: 'ฉีดแล้ว', tone: 'success', icon: CheckCircleIcon },
  due: { label: 'ถึงกำหนด', tone: 'warning', icon: CalendarCheckIcon },
  overdue: { label: 'เลยกำหนด', tone: 'danger', icon: WarningCircleIcon },
  upcoming: { label: 'ยังไม่ถึง', tone: 'neutral', icon: ClockIcon },
}

export function VaccineStatusBadge({ status, estimate }: { status: VaccineStatus; estimate?: boolean }) {
  const meta = VACCINE_STATUS_META[status]
  const StatusIcon = meta.icon
  return (
    <Badge tone={meta.tone} icon={<StatusIcon size={14} weight="bold" aria-hidden="true" />}>
      {estimate ? 'ประมาณการ' : meta.label}
    </Badge>
  )
}
