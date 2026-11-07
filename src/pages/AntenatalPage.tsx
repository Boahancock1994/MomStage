/**
 * นัดฝากครรภ์ — ไทม์ไลน์ 8 นัดตามแนวทางฝากครรภ์คุณภาพ พร้อมการตรวจและวัคซีนตามอายุครรภ์
 * ตรรกะอยู่ใน src/lib/pregnancy.ts
 */
import { CheckCircleIcon, ClockIcon, HeartbeatIcon, StethoscopeIcon, SyringeIcon, TestTubeIcon, UserIcon, type Icon } from '../components/icons'
import { Link } from 'react-router-dom'
import { Badge, Card, PageHeader, ProgressBar } from '../components/ui'
import { FULL_TERM_DAYS } from '../data/constants'
import type { AntenatalKind } from '../data/antenatal'
import { describePregnancy } from '../lib/age'
import { formatThaiDate } from '../lib/format'
import { getPregnancyMilestones, type MilestoneStatus, type PregnancyMilestone } from '../lib/pregnancy'
import { useToday } from '../lib/useToday'
import { useAppStore } from '../store/useAppStore'

const KIND_META: Record<AntenatalKind, { label: string; icon: Icon }> = {
  visit: { label: 'นัดฝากครรภ์', icon: StethoscopeIcon },
  test: { label: 'ตรวจ', icon: TestTubeIcon },
  vaccine: { label: 'วัคซีน', icon: SyringeIcon },
  'self-care': { label: 'ดูแลตัวเอง', icon: UserIcon },
}

const STATUS_META: Record<MilestoneStatus, { label: string; tone: 'success' | 'warning' | 'neutral'; icon: Icon }> = {
  past: { label: 'ผ่านแล้ว', tone: 'neutral', icon: CheckCircleIcon },
  current: { label: 'ช่วงนี้', tone: 'warning', icon: HeartbeatIcon },
  upcoming: { label: 'กำลังจะถึง', tone: 'neutral', icon: ClockIcon },
}

export default function AntenatalPage() {
  const { activeChild } = useAppStore()
  const today = useToday()
  if (!activeChild) return null

  if (activeChild.mode !== 'pregnant' || !activeChild.dueDate) {
    return (
      <>
        <PageHeader title="นัดฝากครรภ์" subtitle="ใช้สำหรับช่วงตั้งครรภ์" />
        <Card>
          <p className="text-ink-muted">{activeChild.name} คลอดแล้ว ดูวัคซีนและสิ่งที่ต้องทำของลูกได้ที่หน้าวัคซีน</p>
          <Link to="/vaccine" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-strong hover:underline">
            ไปหน้าวัคซีน
          </Link>
        </Card>
      </>
    )
  }

  const m = getPregnancyMilestones(activeChild.dueDate, today)
  const current = m.items.filter((i) => i.status === 'current')
  const upcoming = m.items.filter((i) => i.status === 'upcoming')
  const past = m.items.filter((i) => i.status === 'past')

  return (
    <>
      <PageHeader title="นัดฝากครรภ์" subtitle="ตามแนวทางฝากครรภ์คุณภาพ 8 ครั้ง กระทรวงสาธารณสุข" />

      <Card className="mb-6">
        <p className="text-sm font-medium text-ink-muted">ตอนนี้</p>
        <p className="text-2xl font-bold">{describePregnancy(m.pregnancy)}</p>
        <p className="text-ink-muted">
          ไตรมาส {m.trimester} ·{' '}
          {m.daysUntilDue >= 0 ? `อีก ${m.daysUntilDue} วันถึงกำหนดคลอด` : `เลยกำหนดคลอด ${-m.daysUntilDue} วัน`}
        </p>
        <div className="mt-3">
          <ProgressBar value={(m.pregnancy.totalDays / FULL_TERM_DAYS) * 100} label="ความคืบหน้าของการตั้งครรภ์" />
          <p className="mt-1 text-xs text-ink-muted">กำหนดคลอด {formatThaiDate(activeChild.dueDate)}</p>
        </div>
      </Card>

      <Section title="ช่วงนี้ต้องทำ" items={current} emptyText="ช่วงนี้ไม่มีนัดเฉพาะ ดูนัดถัดไปในหัวข้อ “กำลังจะถึง” ด้านล่าง" />
      <Section title="กำลังจะถึง" items={upcoming} emptyText="ครบทุกนัดแล้ว ช่วงนี้เตรียมกระเป๋าคลอดตามเช็กลิสต์ และสังเกตอาการเจ็บครรภ์" />
      {past.length > 0 && (
        <details className="mt-6">
          <summary className="flex min-h-11 cursor-pointer items-center text-lg font-semibold">
            ผ่านมาแล้ว ({past.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {past.map((item) => (
              <MilestoneRow key={item.id} item={item} />
            ))}
          </ul>
        </details>
      )}

      <p className="mt-8 text-xs text-ink-muted">
        อ้างอิง: กรมอนามัย คู่มือการฝากครรภ์สำหรับบุคลากรสาธารณสุข (2565) และกรมควบคุมโรค มาตรฐานการดำเนินงานสร้างเสริมภูมิคุ้มกันโรค
        (2568) — วันนัดจริงขึ้นกับสถานพยาบาลของคุณ
      </p>
    </>
  )
}

function Section({ title, items, emptyText }: { title: string; items: PregnancyMilestone[]; emptyText: string }) {
  return (
    <section className="mt-6 first-of-type:mt-0">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-ink-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <MilestoneRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  )
}

function MilestoneRow({ item }: { item: PregnancyMilestone }) {
  const kind = KIND_META[item.kind]
  const status = STATUS_META[item.status]
  const KindIcon = kind.icon
  const StatusIcon = status.icon
  const isCurrent = item.status === 'current'

  return (
    <li
      className={`rounded-2xl border bg-surface p-4 ${isCurrent ? 'border-accent/60' : 'border-line'} ${
        item.status === 'past' ? 'opacity-80' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${
            isCurrent ? 'bg-accent-soft text-accent-strong' : 'bg-primary-soft text-primary-strong'
          }`}
        >
          <KindIcon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone} icon={<StatusIcon size={14} weight="bold" aria-hidden="true" />}>
              {status.label}
            </Badge>
            <span className="text-xs text-ink-muted">
              {kind.label} · สัปดาห์ที่ {item.weekFrom === item.weekTo ? item.weekTo : `${item.weekFrom}–${item.weekTo}`}
            </span>
          </div>
          <h3 className="mt-1 font-semibold leading-snug">{item.title}</h3>
          <p className="text-sm text-ink-muted">
            {formatThaiDate(item.startDate, true)} – {formatThaiDate(item.endDate, true)}
          </p>
          <p className="mt-1 text-sm text-ink">{item.description}</p>
        </div>
      </div>
    </li>
  )
}
