import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { toDay, type DateInput } from './age'

/** แสดงวันที่แบบไทย ปี พ.ศ. เช่น "7 พฤศจิกายน 2569" หรือแบบสั้น "7 พ.ย. 69" */
export function formatThaiDate(input: DateInput, short = false): string {
  const d = toDay(input)
  const dayMonth = format(d, short ? 'd MMM' : 'd MMMM', { locale: th })
  const buddhistYear = d.getFullYear() + 543
  return `${dayMonth} ${short ? String(buddhistYear).slice(-2) : buddhistYear}`
}

/** แปลงอายุเป็นเดือนให้อ่านง่าย เช่น 0 → "แรกเกิด", 18 → "1 ปี 6 เดือน" */
export function formatAgeMonths(months: number): string {
  if (months === 0) return 'แรกเกิด'
  if (months < 12) return `${months} เดือน`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest === 0 ? `${years} ปี` : `${years} ปี ${rest} เดือน`
}

/** ข้อความระยะเวลาสัมพัทธ์ เช่น "อีก 5 วัน", "วันนี้", "เลยมา 3 วัน" */
export function formatRelativeDays(daysFromNow: number): string {
  if (daysFromNow === 0) return 'วันนี้'
  if (daysFromNow > 0) return `อีก ${daysFromNow} วัน`
  return `เลยมา ${-daysFromNow} วัน`
}
