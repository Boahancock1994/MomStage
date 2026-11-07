/**
 * ตรรกะวัคซีน: วันนัดแต่ละเข็ม + สถานะ
 *
 * วันนัด = วันเกิด + ageMonths เดือน (addMonths ของ date-fns จัดการเคสวันที่ 29–31 ให้)
 * ถ้ายังตั้งครรภ์ ใช้วันกำหนดคลอดเป็น "วันเกิดโดยประมาณ" และติดธง isEstimate
 *
 * กฎสถานะ (ตรวจตามลำดับ):
 *   done     — มีวันที่ฉีดใน vaccineLog
 *   overdue  — วันนี้เลยวันนัดมามากกว่า 30 วัน และยังไม่ฉีด
 *   due      — วันนี้อยู่ระหว่าง (วันนัด − 14 วัน) ถึง (วันนัด + 30 วัน)
 *   upcoming — ยังไม่ถึงช่วงข้างบน
 */
import { addMonths, differenceInCalendarDays } from 'date-fns'
import { VACCINES, type Vaccine } from '../data/vaccines'
import type { Child } from '../types'
import { describeBabyAge, getBabyAge, toDay, toISODate } from './age'
import { formatAgeMonths, formatThaiDate } from './format'

export type VaccineStatus = 'done' | 'overdue' | 'due' | 'upcoming'

/** เริ่มนับว่า "ถึงกำหนด" ก่อนวันนัดกี่วัน */
export const DUE_WINDOW_BEFORE_DAYS = 14
/** เลยวันนัดเกินกี่วันจึงนับว่า "เลยกำหนด" */
export const OVERDUE_AFTER_DAYS = 30

export interface ScheduledVaccine extends Vaccine {
  /** วันนัด "yyyy-MM-dd" */
  dueDate: string
  status: VaccineStatus
  /** วันที่ฉีดจริง (ถ้ามี) */
  givenDate?: string
  /** วันนี้ − วันนัด (บวก = เลยมาแล้ว, ลบ = อีกกี่วันถึง) */
  daysFromDue: number
}

export interface VaccineSchedule {
  items: ScheduledVaccine[]
  /** true = ยังไม่คลอด วันที่ทั้งหมดคำนวณจากวันกำหนดคลอด */
  isEstimate: boolean
  /** วันที่ใช้เป็นจุดตั้งต้น (วันเกิด หรือ วันกำหนดคลอด) */
  baseDate: string
}

export function getVaccineStatus(dueDate: Date, today: Date, givenDate?: string): VaccineStatus {
  if (givenDate) return 'done'
  const daysFromDue = differenceInCalendarDays(today, dueDate)
  if (daysFromDue > OVERDUE_AFTER_DAYS) return 'overdue'
  if (daysFromDue >= -DUE_WINDOW_BEFORE_DAYS) return 'due'
  return 'upcoming'
}

/** คืนตารางวัคซีนทุกเข็มของลูกคนนี้ เรียงตามอายุ — คืน null ถ้ายังไม่มีวันที่ให้คำนวณ */
export function getVaccineSchedule(child: Child, today: Date = new Date()): VaccineSchedule | null {
  const isEstimate = child.mode === 'pregnant'
  const base = isEstimate ? child.dueDate : child.birthDate
  if (!base) return null

  const baseDay = toDay(base)
  const now = toDay(today)

  const items = VACCINES.map((v): ScheduledVaccine => {
    const due = addMonths(baseDay, v.ageMonths)
    // ก่อนคลอดยังฉีดไม่ได้ จึงไม่อ่าน vaccineLog
    const givenDate = isEstimate ? undefined : child.vaccineLog[v.id]
    return {
      ...v,
      dueDate: toISODate(due),
      givenDate,
      daysFromDue: differenceInCalendarDays(now, due),
      status: isEstimate ? 'upcoming' : getVaccineStatus(due, now, givenDate),
    }
  }).sort((a, b) => a.ageMonths - b.ageMonths)

  return { items, isEstimate, baseDate: base }
}

/** เข็มที่ต้องสนใจตอนนี้: เลยกำหนดก่อน แล้วตามด้วยถึงกำหนด (ไม่รวมเข็มเฉพาะกรณี) */
export function getActionableVaccines(schedule: VaccineSchedule): ScheduledVaccine[] {
  const rank: Record<VaccineStatus, number> = { overdue: 0, due: 1, upcoming: 2, done: 3 }
  return schedule.items
    .filter((v) => !v.optional && (v.status === 'overdue' || v.status === 'due'))
    .sort((a, b) => rank[a.status] - rank[b.status] || a.ageMonths - b.ageMonths)
}

/** เข็มถัดไปที่ยังไม่ถึงกำหนด (ไม่รวมเข็มเฉพาะกรณี) */
export function getNextUpcomingVaccine(schedule: VaccineSchedule): ScheduledVaccine | undefined {
  return schedule.items.find((v) => !v.optional && v.status === 'upcoming')
}

/**
 * สร้างข้อความสรุปวัคซีนสำหรับก๊อปไปส่ง LINE ให้คนในบ้าน
 * อ่านง่ายบนมือถือ: เลยกำหนด → ถึงกำหนด → เข็มถัดไป → ฉีดแล้ว
 */
export function buildVaccineSummaryText(child: Child, schedule: VaccineSchedule, today: Date = new Date()): string {
  const lines: string[] = []
  const fmt = (iso: string) => formatThaiDate(iso, true)

  if (schedule.isEstimate) {
    lines.push(`ตารางวัคซีนล่วงหน้าของ ${child.name}`)
    lines.push(`(ประมาณจากวันกำหนดคลอด ${fmt(schedule.baseDate)} — วันจริงนับจากวันเกิด)`)
  } else {
    const age = getBabyAge(schedule.baseDate, today)
    lines.push(`สรุปวัคซีนของ ${child.name} (อายุ ${describeBabyAge(age)})`)
  }
  lines.push(`ข้อมูล ณ ${fmt(toISODate(today))} จากแอป MomStage`)

  const section = (title: string, list: ScheduledVaccine[], detail: (v: ScheduledVaccine) => string) => {
    if (list.length === 0) return
    lines.push('', title)
    list.forEach((v) => lines.push(`• ${v.nameTh} — ${detail(v)}`))
  }

  const notOptional = schedule.items.filter((v) => !v.optional)
  section('⚠️ เลยกำหนดแล้ว รีบพาไปฉีด', notOptional.filter((v) => v.status === 'overdue'), (v) => `ครบกำหนด ${fmt(v.dueDate)}`)
  section('📅 ถึงกำหนดช่วงนี้', notOptional.filter((v) => v.status === 'due'), (v) => `นัด ${fmt(v.dueDate)}`)

  const upcoming = notOptional.filter((v) => v.status === 'upcoming')
  const nextAge = upcoming[0]?.ageMonths
  section(
    schedule.isEstimate ? '🗓️ กำหนดการ' : '⏭️ เข็มถัดไป',
    schedule.isEstimate ? upcoming : upcoming.filter((v) => v.ageMonths === nextAge),
    (v) => `อายุ ${formatAgeMonths(v.ageMonths)} (${fmt(v.dueDate)})`,
  )

  const done = schedule.items.filter((v) => v.status === 'done')
  if (done.length > 0) {
    lines.push('', `✅ ฉีดแล้ว ${done.length} เข็ม`)
    done.forEach((v) => lines.push(`• ${v.nameTh} (${fmt(v.givenDate!)})`))
  }

  return lines.join('\n')
}
