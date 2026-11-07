/**
 * ตรรกะการเจริญเติบโตตาม WHO Child Growth Standards
 *
 * z-score ด้วยวิธี LMS (Cole 1990) ตามที่ WHO ใช้:
 *   z = ((X / M)^L − 1) / (L × S)      เมื่อ L ≠ 0
 *   z = ln(X / M) / S                   เมื่อ L = 0
 * แล้วแปลงเป็นเปอร์เซ็นไทล์ด้วยการแจกแจงปกติมาตรฐาน
 *
 * น้ำหนักตามอายุ: เมื่อ |z| > 3 ใช้ "restricted application of LMS" ตามรายงานเทคนิคของ WHO (2006)
 * เพื่อไม่ให้ค่าสุดขั้วเพี้ยน (ส่วนสูงมี L = 1 จึงไม่ต้องปรับ)
 *
 * อายุทุกจุดมาจาก getAgeInMonthsExact() ใน age.ts
 */
import { WHO_LMS, type GrowthIndicator, type GrowthSex, type LmsRow } from '../data/whoGrowth'
import type { GrowthEntry } from '../types'
import { getAgeInMonthsExact } from './age'

/** เส้นเปอร์เซ็นไทล์หลักที่แสดงบนกราฟ พร้อม z-score ของแต่ละเส้น */
export const MAJOR_PERCENTILES = [
  { p: 3, z: -1.8808 },
  { p: 15, z: -1.0364 },
  { p: 50, z: 0 },
  { p: 85, z: 1.0364 },
  { p: 97, z: 1.8808 },
] as const

/**
 * เตือนเมื่อเปอร์เซ็นไทล์ "ตกลง" ข้ามเส้นหลักตั้งแต่กี่เส้นระหว่างการชั่ง 2 ครั้งติดกัน
 * เกณฑ์เฝ้าระวังที่ใช้ทั่วไปคือข้าม 2 เส้นหลัก (เช่น จากเหนือ P50 ลงไปต่ำกว่า P15)
 */
export const CROSSING_ALERT_MIN_LINES = 2

export const MAX_GROWTH_MONTHS = 36

export function zScore(value: number, L: number, M: number, S: number): number {
  if (L === 0) return Math.log(value / M) / S
  return (Math.pow(value / M, L) - 1) / (L * S)
}

/** ค่าที่ตรงกับ z-score หนึ่ง (ใช้วาดเส้นเปอร์เซ็นไทล์) */
export function valueAtZ(z: number, L: number, M: number, S: number): number {
  if (L === 0) return M * Math.exp(S * z)
  return M * Math.pow(1 + L * S * z, 1 / L)
}

/** ฟังก์ชันความน่าจะเป็นสะสมของการแจกแจงปกติ (Abramowitz & Stegun 7.1.26, คลาดเคลื่อน < 1.5×10⁻⁷) */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2))
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const erf = 1 - poly * Math.exp(-(z * z) / 2)
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2
}

/** z-score → เปอร์เซ็นไทล์ 0–100 */
export function zToPercentile(z: number): number {
  return normalCdf(z) * 100
}

/** ค่า L, M, S ที่อายุ (เดือนทศนิยม) — interpolate เชิงเส้นระหว่างเดือน คืน null ถ้าอยู่นอก 0–36 เดือน */
export function getLms(indicator: GrowthIndicator, sex: GrowthSex, ageMonths: number): { L: number; M: number; S: number } | null {
  if (ageMonths < 0 || ageMonths > MAX_GROWTH_MONTHS) return null
  const rows: readonly LmsRow[] = WHO_LMS[indicator][sex]
  const lo = Math.floor(ageMonths)
  const hi = Math.min(lo + 1, MAX_GROWTH_MONTHS)
  const t = ageMonths - lo
  const a = rows[lo]
  const b = rows[hi]
  return { L: a[1] + (b[1] - a[1]) * t, M: a[2] + (b[2] - a[2]) * t, S: a[3] + (b[3] - a[3]) * t }
}

/** z-score ตามเกณฑ์ WHO รวมการปรับค่าสุดขั้วของน้ำหนัก */
export function whoZScore(indicator: GrowthIndicator, sex: GrowthSex, ageMonths: number, value: number): number | null {
  const lms = getLms(indicator, sex, ageMonths)
  if (!lms || value <= 0) return null
  const { L, M, S } = lms
  const z = zScore(value, L, M, S)
  if (indicator !== 'weight' || Math.abs(z) <= 3) return z

  const sd3pos = valueAtZ(3, L, M, S)
  const sd3neg = valueAtZ(-3, L, M, S)
  if (z > 3) {
    const sd23pos = sd3pos - valueAtZ(2, L, M, S)
    return 3 + (value - sd3pos) / sd23pos
  }
  const sd23neg = valueAtZ(-2, L, M, S) - sd3neg
  return -3 + (value - sd3neg) / sd23neg
}

export type GrowthLevel = 'low' | 'normal' | 'high'

/** แปลเปอร์เซ็นไทล์เป็นภาษาคน */
export function interpretGrowth(percentile: number, indicator: GrowthIndicator = 'weight'): { level: GrowthLevel; text: string } {
  const what = indicator === 'weight' ? 'น้ำหนัก' : 'ส่วนสูง'
  if (percentile < 3) return { level: 'low', text: `${what}น้อยกว่าเกณฑ์ ควรปรึกษาแพทย์` }
  if (percentile > 97) return { level: 'high', text: `${what}มากกว่าเกณฑ์` }
  return { level: 'normal', text: 'อยู่ในเกณฑ์' }
}

/** นับว่าเปอร์เซ็นไทล์ตกลงข้ามเส้นหลักกี่เส้น (นับเฉพาะขาลง) */
export function countMajorLinesCrossedDown(previousPercentile: number, currentPercentile: number): number {
  return MAJOR_PERCENTILES.filter(({ p }) => previousPercentile >= p && currentPercentile < p).length
}

/** ข้อมูลเส้นเปอร์เซ็นไทล์รายเดือนสำหรับวาดกราฟ */
export function getPercentileCurves(indicator: GrowthIndicator, sex: GrowthSex, maxMonth = MAX_GROWTH_MONTHS) {
  return WHO_LMS[indicator][sex]
    .filter((row) => row[0] <= maxMonth)
    .map(([month, L, M, S]) => ({
      month,
      p3: valueAtZ(MAJOR_PERCENTILES[0].z, L, M, S),
      p15: valueAtZ(MAJOR_PERCENTILES[1].z, L, M, S),
      p50: M,
      p85: valueAtZ(MAJOR_PERCENTILES[3].z, L, M, S),
      p97: valueAtZ(MAJOR_PERCENTILES[4].z, L, M, S),
    }))
}

export interface MeasurementAssessment {
  value: number
  z: number
  percentile: number
  level: GrowthLevel
  text: string
  /** จำนวนเส้นหลักที่ตกลงข้ามจากครั้งก่อน */
  linesCrossedDown: number
  /** ตกข้ามเส้นหลักถึงเกณฑ์เตือน */
  crossingAlert: boolean
}

export interface AssessedEntry {
  entry: GrowthEntry
  ageMonths: number
  weight?: MeasurementAssessment
  height?: MeasurementAssessment
}

/** ประเมินทุกรายการ: อายุ เปอร์เซ็นไทล์ ความหมาย และการเตือนตกข้ามเส้น — เรียงตามวันที่ */
export function assessGrowth(entries: GrowthEntry[], birthDate: string, sex: GrowthSex): AssessedEntry[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const lastPercentile: Partial<Record<GrowthIndicator, number>> = {}

  return sorted.map((entry) => {
    const ageMonths = getAgeInMonthsExact(birthDate, entry.date)
    const assess = (indicator: GrowthIndicator, value: number | undefined): MeasurementAssessment | undefined => {
      if (value === undefined) return undefined
      const z = whoZScore(indicator, sex, ageMonths, value)
      if (z === null) return undefined
      const percentile = zToPercentile(z)
      const prev = lastPercentile[indicator]
      const linesCrossedDown = prev === undefined ? 0 : countMajorLinesCrossedDown(prev, percentile)
      lastPercentile[indicator] = percentile
      return {
        value,
        z,
        percentile,
        ...interpretGrowth(percentile, indicator),
        linesCrossedDown,
        crossingAlert: linesCrossedDown >= CROSSING_ALERT_MIN_LINES,
      }
    }
    return { entry, ageMonths, weight: assess('weight', entry.weightKg), height: assess('height', entry.heightCm) }
  })
}

/** ป้ายเปอร์เซ็นไทล์อ่านง่าย เช่น "P48" หรือ "< P1" */
export function formatPercentile(p: number): string {
  if (p < 1) return '< P1'
  if (p > 99) return '> P99'
  return `P${Math.round(p)}`
}
