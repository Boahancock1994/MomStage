/**
 * ปฏิทินวัคซีน — timeline เรียงตามอายุ สีตามสถานะ กดเข็มเพื่อบันทึกวันที่ฉีดจริง
 * ตรรกะทั้งหมดอยู่ใน src/lib/vaccine.ts หน้านี้แค่แสดงผล
 */
import { CaretDownIcon, CopyIcon, ExportIcon, InfoIcon, ShareNetworkIcon } from '../components/icons'
import { useId, useState } from 'react'
import { Badge, Button, Card, PageHeader, inputClass } from '../components/ui'
import { VaccineStatusBadge } from '../components/VaccineStatusBadge'
import { toISODate } from '../lib/age'
import { formatAgeMonths, formatRelativeDays, formatThaiDate } from '../lib/format'
import { useToday } from '../lib/useToday'
import { buildVaccineSummaryText, getVaccineSchedule, type ScheduledVaccine, type VaccineStatus } from '../lib/vaccine'
import { useAppStore } from '../store/useAppStore'
import type { Child } from '../types'

export default function VaccinePage() {
  const { activeChild } = useAppStore()
  const today = useToday()
  if (!activeChild) return null

  const schedule = getVaccineSchedule(activeChild, today)
  if (!schedule) return <PageHeader title="ปฏิทินวัคซีน" subtitle="ยังไม่มีวันที่สำหรับคำนวณ กรุณาแก้ไขข้อมูลลูกในหน้าตั้งค่า" />

  const required = schedule.items.filter((v) => !v.optional)
  const count = (s: VaccineStatus) => required.filter((v) => v.status === s).length

  // จัดกลุ่มตามอายุที่ต้องฉีด
  const groups = new Map<number, ScheduledVaccine[]>()
  schedule.items.forEach((v) => groups.set(v.ageMonths, [...(groups.get(v.ageMonths) ?? []), v]))

  return (
    <>
      <PageHeader
        title="ปฏิทินวัคซีน"
        subtitle={
          schedule.isEstimate
            ? `ตารางล่วงหน้าของ ${activeChild.name}`
            : `${activeChild.name} · ตามตารางวัคซีนพื้นฐานกระทรวงสาธารณสุข`
        }
      />

      {schedule.isEstimate ? (
        <div className="mb-4 flex gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4" role="note">
          <InfoIcon size={22} className="mt-0.5 shrink-0 text-accent-strong" aria-hidden="true" />
          <p className="text-sm text-ink">
            <strong>วันที่ทั้งหมดเป็นค่าประมาณ</strong> คำนวณจากวันกำหนดคลอด {formatThaiDate(schedule.baseDate)}{' '}
            เมื่อคลอดแล้วให้เปลี่ยนเป็นโหมด “คลอดแล้ว” ในหน้าตั้งค่า แอปจะคำนวณใหม่จากวันเกิดจริง
          </p>
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <StatTile label="ฉีดแล้ว" value={`${count('done')}/${required.length}`} tone="text-success" />
          <StatTile label="เลยกำหนด" value={count('overdue')} tone={count('overdue') ? 'text-danger' : 'text-ink'} />
          <StatTile label="ถึงกำหนด" value={count('due')} tone={count('due') ? 'text-warning' : 'text-ink'} />
        </div>
      )}

      <ExportPanel child={activeChild} text={buildVaccineSummaryText(activeChild, schedule, today)} />

      <ol className="mt-6 space-y-6" aria-label="ไทม์ไลน์วัคซีนตามอายุ">
        {[...groups.entries()].map(([ageMonths, items]) => (
          <AgeGroup
            key={ageMonths}
            ageMonths={ageMonths}
            items={items}
            child={activeChild}
            estimate={schedule.isEstimate}
            today={today}
          />
        ))}
      </ol>

      <p className="mt-8 text-xs text-ink-muted">
        อ้างอิง: กรมควบคุมโรค กำหนดการให้วัคซีนตามแผนงานสร้างเสริมภูมิคุ้มกันโรค ปี 2564 และมาตรฐานการดำเนินงานฯ ปี 2568 —
        “ถึงกำหนด” คือช่วง 14 วันก่อนถึง 30 วันหลังวันนัด, เกิน 30 วันนับว่า “เลยกำหนด”
      </p>
    </>
  )
}

function StatTile({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-3 text-center">
      <p className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  )
}

/** สถานะรวมของกลุ่มอายุ ใช้กำหนดสีจุดบน timeline */
function groupStatus(items: ScheduledVaccine[]): VaccineStatus {
  const required = items.filter((v) => !v.optional)
  const list = required.length ? required : items
  for (const s of ['overdue', 'due', 'upcoming'] as const) if (list.some((v) => v.status === s)) return s
  return 'done'
}

const dotColor: Record<VaccineStatus, string> = {
  done: 'bg-success',
  due: 'bg-warning-line',
  overdue: 'bg-danger',
  upcoming: 'bg-line',
}

function AgeGroup({
  ageMonths,
  items,
  child,
  estimate,
  today,
}: {
  ageMonths: number
  items: ScheduledVaccine[]
  child: Child
  estimate: boolean
  today: Date
}) {
  const status = groupStatus(items)
  const dueDate = items[0].dueDate
  return (
    <li className="relative pl-7">
      <span className="absolute bottom-[-1.5rem] left-[7px] top-6 w-0.5 bg-line" aria-hidden="true" />
      <span
        className={`absolute left-0 top-1.5 size-4 rounded-full border-4 border-canvas ${dotColor[status]}`}
        aria-hidden="true"
      />
      <h2 className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-semibold">{formatAgeMonths(ageMonths)}</span>
        <span className="text-sm text-ink-muted">
          {estimate ? 'ประมาณ ' : ''}
          {formatThaiDate(dueDate)}
          {!estimate && status !== 'done' && !items.every((v) => v.optional) && ` · ${formatRelativeDays(-items[0].daysFromDue)}`}
        </span>
      </h2>
      <ul className="mt-2 space-y-2">
        {items.map((v) => (
          <VaccineRow key={v.id} vaccine={v} child={child} estimate={estimate} today={today} />
        ))}
      </ul>
    </li>
  )
}

function VaccineRow({
  vaccine: v,
  child,
  estimate,
  today,
}: {
  vaccine: ScheduledVaccine
  child: Child
  estimate: boolean
  today: Date
}) {
  const { setVaccineDate } = useAppStore()
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(v.givenDate ?? toISODate(today))

  const border =
    v.status === 'overdue' ? 'border-danger/40' : v.status === 'due' ? 'border-warning-line' : 'border-line'

  return (
    <li className={`rounded-2xl border bg-surface ${border}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${uid}-panel`}
        className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium leading-snug">{v.nameTh}</span>
          <span className="block text-xs text-ink-muted">
            {v.name}
            {v.givenDate && ` · ฉีดเมื่อ ${formatThaiDate(v.givenDate, true)}`}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1">
          {/* เข็มเฉพาะกรณีที่ยังไม่ได้ฉีด ไม่แสดงว่าค้าง เพราะเด็กส่วนใหญ่ไม่ต้องฉีด */}
          {v.optional && v.status !== 'done' ? (
            <Badge tone="neutral">เฉพาะกรณี</Badge>
          ) : (
            <VaccineStatusBadge status={v.status} estimate={estimate} />
          )}
        </span>
        <CaretDownIcon
          size={18}
          className={`shrink-0 text-ink-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={`${uid}-panel`} className="border-t border-line px-4 pb-4 pt-3">
          {v.note && <p className="text-sm text-ink-muted">{v.note}</p>}

          {estimate ? (
            <p className="mt-2 text-sm text-ink-muted">บันทึกวันที่ฉีดได้หลังคลอดแล้ว</p>
          ) : (
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault()
                setVaccineDate(child.id, v.id, date)
                setOpen(false)
              }}
            >
              <label htmlFor={`${uid}-date`} className="mb-1 block text-sm font-medium">
                วันที่ฉีดจริง
              </label>
              <input
                id={`${uid}-date`}
                type="date"
                required
                value={date}
                min={child.birthDate}
                max={toISODate(today)}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="submit" className="flex-1">
                  {v.givenDate ? 'บันทึกการแก้ไข' : 'บันทึกว่าฉีดแล้ว'}
                </Button>
                {v.givenDate && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setVaccineDate(child.id, v.id, null)
                      setOpen(false)
                    }}
                  >
                    ยังไม่ได้ฉีด
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </li>
  )
}

/** ปุ่ม "ส่งออกเป็นข้อความ" — แสดงตัวอย่างข้อความ แล้วคัดลอกหรือแชร์ต่อ */
function ExportPanel({ child, text }: { child: Child; text: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
  }

  return (
    <Card className="!p-4">
      <Button variant="secondary" className="w-full" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ExportIcon size={20} aria-hidden="true" />
        ส่งออกเป็นข้อความ
      </Button>
      {open && (
        <div className="mt-3">
          <label htmlFor="vaccine-export" className="mb-1 block text-sm font-medium">
            ข้อความสรุป (ก๊อปไปส่ง LINE ให้คนในบ้านได้)
          </label>
          <textarea
            id="vaccine-export"
            readOnly
            value={text}
            rows={10}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-2xl border border-line bg-surface-muted p-3 text-sm leading-relaxed text-ink"
          />
          <div className="mt-2 flex gap-2">
            <Button className="flex-1" onClick={copy}>
              <CopyIcon size={20} aria-hidden="true" />
              คัดลอกข้อความ
            </Button>
            {canShare && (
              <Button
                variant="secondary"
                onClick={() => navigator.share({ title: `วัคซีนของ ${child.name}`, text }).catch(() => {})}
              >
                <ShareNetworkIcon size={20} aria-hidden="true" />
                แชร์
              </Button>
            )}
          </div>
          <p className="mt-2 min-h-5 text-sm" aria-live="polite">
            {copied === 'ok' && <span className="text-success">คัดลอกแล้ว วางในแชทได้เลย</span>}
            {copied === 'fail' && <span className="text-danger">คัดลอกอัตโนมัติไม่ได้ กดค้างที่ข้อความแล้วเลือกคัดลอก</span>}
          </p>
        </div>
      )}
    </Card>
  )
}
