/**
 * สรุปสถานะ "ตอนนี้" ของลูกหนึ่งคน + ตรวจความถูกต้องของวันที่ที่ผู้ใช้กรอก
 * ใช้ร่วมกันทั้งหน้า onboarding, settings และ header
 */
import { subMonths } from 'date-fns'
import { FULL_TERM_DAYS, MAX_CHILD_AGE_MONTHS, MAX_PREGNANCY_WEEKS } from '../data/constants'
import type { Child, ChildMode } from '../types'
import {
  describeBabyAge,
  describePregnancy,
  getBabyAge,
  getPregnancyWeek,
  toDay,
  type BabyAge,
  type PregnancyWeek,
} from './age'

export type ChildStatus =
  | { mode: 'pregnant'; pregnancy: PregnancyWeek; label: string }
  | { mode: 'born'; age: BabyAge; label: string }

export function getChildStatus(child: Child, today: Date = new Date()): ChildStatus | null {
  if (child.mode === 'pregnant' && child.dueDate) {
    const pregnancy = getPregnancyWeek(child.dueDate, today)
    return { mode: 'pregnant', pregnancy, label: describePregnancy(pregnancy) }
  }
  if (child.mode === 'born' && child.birthDate) {
    const age = getBabyAge(child.birthDate, today)
    return { mode: 'born', age, label: describeBabyAge(age) }
  }
  return null
}

/**
 * ตรวจวันที่ตามโหมด คืนข้อความผิดพลาด (ภาษาไทย) หรือ null ถ้าถูกต้อง
 *
 * - ตั้งครรภ์: กำหนดคลอดต้องอยู่ในช่วงที่อายุครรภ์ 0–42 สัปดาห์
 *   คือ ไม่เกินวันนี้ + 280 วัน และไม่ย้อนหลังเกิน 14 วัน (40 → 42 สัปดาห์)
 * - คลอดแล้ว: วันเกิดต้องไม่อยู่ในอนาคต และลูกต้องอายุไม่เกิน 3 ขวบ
 */
export function validateChildDate(mode: ChildMode, date: string, today: Date = new Date()): string | null {
  if (!date) return mode === 'pregnant' ? 'กรุณาเลือกวันกำหนดคลอด' : 'กรุณาเลือกวันเกิดของลูก'
  const d = toDay(date)
  if (Number.isNaN(d.getTime())) return 'รูปแบบวันที่ไม่ถูกต้อง'
  const now = toDay(today)

  if (mode === 'pregnant') {
    const p = getPregnancyWeek(d, now)
    if (p.totalDays < 0) {
      return `กำหนดคลอดไกลเกิน ${FULL_TERM_DAYS} วัน ลองตรวจสอบวันที่อีกครั้ง`
    }
    if (p.weeks >= MAX_PREGNANCY_WEEKS) {
      return `เลยกำหนดคลอดเกิน 2 สัปดาห์แล้ว ถ้าคลอดแล้วให้เลือก "คลอดแล้ว" แทน`
    }
    return null
  }

  if (d > now) return 'วันเกิดต้องไม่เป็นวันในอนาคต'
  if (d < subMonths(now, MAX_CHILD_AGE_MONTHS)) {
    return 'แม่สเตจดูแลลูกตั้งแต่ตั้งครรภ์ถึงอายุ 3 ขวบ — ลูกอายุเกินช่วงที่แอปรองรับ'
  }
  return null
}
