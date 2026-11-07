/**
 * ตรรกะคำนวณอายุ — หัวใจของแอป
 *
 * ทุกหน้าในแอปเรียกใช้ไฟล์นี้เพื่อรู้ว่า "ตอนนี้" ลูกอยู่ช่วงไหน
 * คำนวณวันที่ทั้งหมดด้วย date-fns (ไม่คำนวณมิลลิวินาทีเอง) เพื่อให้ถูกต้องเรื่อง
 * ปีอธิกสุรทิน เดือนที่มี 28–31 วัน และเวลาออมแสง
 *
 * วันที่รับเข้ามาเป็นสตริงรูปแบบ ISO "yyyy-MM-dd" (แบบที่เก็บใน localStorage)
 * หรือเป็น Date ก็ได้ ระบบจะตัดเวลาทิ้งเหลือแค่ "วัน" เสมอ
 */
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInMonths,
  format,
  parseISO,
  startOfDay,
} from 'date-fns'
import {
  FULL_TERM_DAYS,
  TRIMESTER_2_START_WEEK,
  TRIMESTER_3_START_WEEK,
} from '../data/constants'

export type DateInput = string | Date

/** แปลง input ให้เป็น Date เวลา 00:00 ตามเขตเวลาเครื่อง */
export function toDay(input: DateInput): Date {
  return startOfDay(typeof input === 'string' ? parseISO(input) : input)
}

/** แปลง Date เป็นสตริง "yyyy-MM-dd" สำหรับเก็บข้อมูล / ใส่ใน <input type="date"> */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export interface PregnancyWeek {
  /** อายุครรภ์เต็มสัปดาห์ เช่น 24 (ของ 24+3) */
  weeks: number
  /** วันที่เกินจากสัปดาห์เต็ม 0–6 เช่น 3 (ของ 24+3) */
  days: number
  /** อายุครรภ์รวมเป็นวัน */
  totalDays: number
  /** จำนวนวันที่เหลือถึงกำหนดคลอด (ติดลบ = เลยกำหนดแล้ว) */
  daysUntilDue: number
  /** ไตรมาส 1–3 */
  trimester: 1 | 2 | 3
}

/**
 * คำนวณอายุครรภ์จากวันกำหนดคลอด
 *
 * สูตร: อายุครรภ์ = 40 สัปดาห์ − เวลาที่เหลือถึงกำหนดคลอด
 *       ทำในหน่วย "วัน" ก่อน (280 − วันที่เหลือ) แล้วค่อยแปลงเป็นสัปดาห์+วัน
 *       เพื่อไม่ให้เศษสัปดาห์คลาดเคลื่อน
 *
 * ตัวอย่าง: กำหนดคลอด 2027-03-01, วันนี้ 2026-11-07
 *   วันที่เหลือ = 114 วัน → อายุครรภ์ = 280 − 114 = 166 วัน = 23 สัปดาห์ 5 วัน
 */
export function getPregnancyWeek(dueDate: DateInput, today: DateInput = new Date()): PregnancyWeek {
  const daysUntilDue = differenceInCalendarDays(toDay(dueDate), toDay(today))
  const totalDays = FULL_TERM_DAYS - daysUntilDue
  const weeks = Math.floor(totalDays / 7)
  const days = totalDays - weeks * 7

  let trimester: 1 | 2 | 3 = 1
  if (weeks >= TRIMESTER_3_START_WEEK) trimester = 3
  else if (weeks >= TRIMESTER_2_START_WEEK) trimester = 2

  return { weeks, days, totalDays, daysUntilDue, trimester }
}

/**
 * คำนวณวันกำหนดคลอดจากวันแรกของประจำเดือนครั้งสุดท้าย (LMP)
 * ตามกฎของ Naegele: กำหนดคลอด = LMP + 280 วัน
 */
export function getDueDateFromLMP(lmp: DateInput): Date {
  return addDays(toDay(lmp), FULL_TERM_DAYS)
}

export interface BabyAge {
  /** อายุเต็มเดือน */
  months: number
  /** วันที่เกินจากเดือนเต็ม */
  days: number
  /** อายุรวมเป็นวัน (วันเกิด = 0) */
  totalDays: number
  /** อายุรวมเป็นสัปดาห์เต็ม */
  totalWeeks: number
}

/**
 * คำนวณอายุลูกเป็น "เดือน + วัน" แบบเดียวกับที่หมอเด็กใช้นัดวัคซีน
 *
 * วิธีคิด:
 *  1. months = จำนวนเดือนเต็มระหว่างวันเกิดถึงวันนี้ (date-fns differenceInMonths)
 *  2. anchor = วันเกิด + months เดือน (วันครบเดือนล่าสุด)
 *  3. days   = วันนี้ − anchor
 *
 * เคสวันเกิดวันที่ 31: date-fns จะเลื่อนวันครบเดือนไปเป็นวันสุดท้ายของเดือนที่สั้นกว่า
 *   เช่น เกิด 31 ม.ค. → ครบ 1 เดือนวันที่ 28 ก.พ. (หรือ 29 ก.พ. ในปีอธิกสุรทิน)
 * มีลูปป้องกันกรณี anchor เลยวันนี้ เพื่อให้ days ไม่ติดลบเด็ดขาด
 */
export function getBabyAge(birthDate: DateInput, today: DateInput = new Date()): BabyAge {
  const birth = toDay(birthDate)
  const now = toDay(today)

  const totalDays = differenceInCalendarDays(now, birth)
  if (totalDays < 0) {
    // ยังไม่ถึงวันเกิด (ไม่ควรเกิดขึ้นเพราะฟอร์มตรวจไว้แล้ว) — คืนค่า 0 แทนค่าติดลบ
    return { months: 0, days: 0, totalDays: 0, totalWeeks: 0 }
  }

  let months = differenceInMonths(now, birth)
  let anchor = addMonths(birth, months)
  while (months > 0 && anchor > now) {
    months -= 1
    anchor = addMonths(birth, months)
  }
  const days = differenceInCalendarDays(now, anchor)

  return { months, days, totalDays, totalWeeks: Math.floor(totalDays / 7) }
}

/** จำนวนวันเฉลี่ยต่อเดือนตามนิยามของ WHO Child Growth Standards (365.25 / 12) */
export const DAYS_PER_MONTH = 30.4375

/**
 * อายุเป็น "เดือนทศนิยม" ณ วันที่กำหนด — ใช้เป็นแกน X ของกราฟการเจริญเติบโต
 * = จำนวนวันตั้งแต่เกิด ÷ 30.4375 (วิธีเดียวกับตาราง WHO)
 */
export function getAgeInMonthsExact(birthDate: DateInput, onDate: DateInput): number {
  return getBabyAge(birthDate, onDate).totalDays / DAYS_PER_MONTH
}

/** ข้อความสั้นสำหรับแสดงผล เช่น "ครรภ์ 24 สัปดาห์ 3 วัน" หรือ "1 ขวบ 2 เดือน 5 วัน" */
export function describePregnancy(p: PregnancyWeek): string {
  return p.days > 0 ? `ครรภ์ ${p.weeks} สัปดาห์ ${p.days} วัน` : `ครรภ์ ${p.weeks} สัปดาห์`
}

export function describeBabyAge(age: BabyAge): string {
  if (age.totalDays === 0) return 'เกิดวันนี้'
  if (age.months === 0) return `${age.days} วัน`
  const years = Math.floor(age.months / 12)
  const months = age.months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ขวบ`)
  if (months > 0) parts.push(`${months} เดือน`)
  if (age.days > 0) parts.push(`${age.days} วัน`)
  return parts.join(' ')
}
