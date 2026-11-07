/**
 * เครื่องคิดเลขแม่ลูกอ่อน: ปริมาณนม / ค่าใช้จ่ายต่อเดือน
 *
 * เกณฑ์ที่ใช้ (ค่าประมาณสำหรับวางแผน ไม่ใช่คำสั่งแพทย์):
 * - ทารกอายุต่ำกว่า 6 เดือน ต้องการนมประมาณ 150 มล./กก./วัน
 *   (ช่วงที่ใช้ทั่วไปคือ 150–200 มล./กก./วัน — เช่น NHS "Bottle feeding advice")
 *   และโดยทั่วไปไม่เกินราว 1,000 มล./วัน
 * - นมผงสูตรมาตรฐาน 1 ช้อนตวง ≈ 4.3 กรัม ผสมน้ำ 30 มล. (ตรวจกับฉลากยี่ห้อที่ใช้จริงเสมอ)
 * - ผ้าอ้อมต่อวันตามอายุ: แรกเกิด 10–12, 1–5 เดือน 8–10, 6–12 เดือน 6–8, 1 ปีขึ้นไป 4–6 ชิ้น
 * - "นมผสม" สมมติว่าเป็นนมผงครึ่งหนึ่งของปริมาณทั้งหมด
 * - ค่าใช้จ่ายอื่น ๆ ต่อเดือนที่แม่เพิ่มเอง: แต่ละยอด = ราคาต่อหน่วย × จำนวน
 *   รายการเดียวมีได้หลายยอด และรายการที่ชื่อซ้ำกันรวมเป็นยอดเดียวในกราฟ
 */

import type { CalcSettings, ExpenseEntry, ExtraExpense, FeedingType } from '../types'

/** ค่าเริ่มต้นของเครื่องคิดเลข (ลูกแต่ละคนจำค่าของตัวเองไว้ใน store) */
export const DEFAULT_CALC_SETTINGS: CalcSettings = {
  weightKg: '',
  feedsPerDay: '8',
  feedingType: 'breast',
  pricePerCan: '',
  gramsPerCan: '',
  diaperPrice: '',
  extras: [],
}

export const ML_PER_KG_PER_DAY = 150
export const MAX_ML_PER_DAY = 1000
export const MILK_RULE_MAX_AGE_MONTHS = 6
export const GRAMS_PER_SCOOP = 4.3
export const ML_PER_SCOOP = 30
export const DAYS_PER_COST_MONTH = 30
export const MIXED_FORMULA_SHARE = 0.5

export interface MilkPlan {
  /** มล./วัน (ปัดเป็นจำนวนเต็ม) */
  dailyMl: number
  perFeedMl: number
  /** ถูกจำกัดที่ MAX_ML_PER_DAY */
  capped: boolean
}

export function calcMilkPlan(weightKg: number, feedsPerDay: number): MilkPlan {
  if (!(weightKg > 0) || !(feedsPerDay > 0)) throw new Error('น้ำหนักและจำนวนมื้อต้องมากกว่า 0')
  const raw = weightKg * ML_PER_KG_PER_DAY
  const dailyMl = Math.round(Math.min(raw, MAX_ML_PER_DAY))
  return { dailyMl, perFeedMl: Math.round(dailyMl / feedsPerDay), capped: raw > MAX_ML_PER_DAY }
}

/** จำนวนผ้าอ้อมต่อวันตามอายุเต็มเดือน */
export function getDiapersPerDay(ageMonths: number): { min: number; max: number; label: string } {
  if (ageMonths < 1) return { min: 10, max: 12, label: 'แรกเกิด' }
  if (ageMonths < 6) return { min: 8, max: 10, label: '1–5 เดือน' }
  if (ageMonths < 12) return { min: 6, max: 8, label: '6–12 เดือน' }
  return { min: 4, max: 6, label: '1 ปีขึ้นไป' }
}

export interface FormulaUsage {
  scoopsPerDay: number
  gramsPerDay: number
  gramsPerMonth: number
  cansPerMonth: number
  costPerMonth: number
}

/** ปริมาณและค่านมผงต่อเดือน เมื่อให้นมผง dailyMl ต่อวัน */
export function calcFormulaUsage(dailyMl: number, pricePerCan: number, gramsPerCan: number): FormulaUsage {
  const scoopsPerDay = dailyMl / ML_PER_SCOOP
  const gramsPerDay = scoopsPerDay * GRAMS_PER_SCOOP
  const gramsPerMonth = gramsPerDay * DAYS_PER_COST_MONTH
  const cansPerMonth = gramsPerCan > 0 ? gramsPerMonth / gramsPerCan : 0
  return { scoopsPerDay, gramsPerDay, gramsPerMonth, cansPerMonth, costPerMonth: cansPerMonth * pricePerCan }
}

export function calcDiaperCost(ageMonths: number, pricePerPiece: number): { min: number; max: number; avg: number } {
  const { min, max } = getDiapersPerDay(ageMonths)
  const perMonth = (n: number) => n * pricePerPiece * DAYS_PER_COST_MONTH
  return { min: perMonth(min), max: perMonth(max), avg: perMonth((min + max) / 2) }
}

export const FEEDING_LABELS: Record<FeedingType, string> = {
  breast: 'นมแม่ล้วน',
  mixed: 'นมผสม',
  formula: 'นมผงล้วน',
}

const FORMULA_SHARE: Record<FeedingType, number> = { breast: 0, mixed: MIXED_FORMULA_SHARE, formula: 1 }

/** แปลงข้อความที่กรอกเป็นตัวเลข — ว่าง ไม่ใช่ตัวเลข หรือติดลบ = null */
export function parseAmount(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** ยอดหนึ่งยอด = ราคา × จำนวน (null = กรอกไม่ครบ) */
export function entryAmount(e: ExpenseEntry): number | null {
  const price = parseAmount(e.price)
  const qty = parseAmount(e.quantity)
  return price === null || qty === null ? null : price * qty
}

/** ยอดรวมของรายการ = ผลรวมยอดที่กรอกครบ (null = ยังไม่มียอดที่กรอกครบเลย) */
export function extraAmount(e: ExtraExpense): number | null {
  const amounts = e.entries.map(entryAmount).filter((a): a is number => a !== null)
  return amounts.length === 0 ? null : amounts.reduce((s, a) => s + a, 0)
}

/** คีย์สำหรับจับคู่ชื่อซ้ำ: ไม่สนช่องว่างหัวท้าย ช่องว่างซ้อน และตัวพิมพ์เล็กใหญ่ */
export function expenseNameKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

export type ExpenseCategory = 'formula' | 'diapers' | 'other'

export interface ExpenseLine {
  id: string
  label: string
  detail: string
  category: ExpenseCategory
  /** บาท — ต่อเดือน หรือ ครั้งเดียว ตามกลุ่มที่อยู่ */
  amount: number
}

/**
 * รายการค่าใช้จ่ายต่อเดือนตามแบบการให้นมที่เลือก
 * นมแม่ล้วนไม่ต้องกรอกราคานมผง · ผ้าอ้อมและค่าใช้จ่ายอื่นนับเมื่อกรอกครบ
 * missing = สิ่งที่ยังต้องกรอกเพื่อให้คำนวณได้ครบ
 * ค่าใช้จ่ายอื่นที่ชื่อเดียวกันรวมเป็นบรรทัดเดียว (= แท่งเดียวในกราฟ)
 */
export function buildMonthlyExpenses(params: {
  settings: CalcSettings
  /** มล./วัน จากแท็บปริมาณนม (null = ยังไม่ได้กรอกน้ำหนัก) */
  dailyMl: number | null
  ageMonths: number
}): { lines: ExpenseLine[]; total: number; missing: string[] } {
  const { settings, dailyMl, ageMonths } = params
  const lines: ExpenseLine[] = []
  const missing: string[] = []

  const share = FORMULA_SHARE[settings.feedingType]
  if (share > 0) {
    const price = parseAmount(settings.pricePerCan)
    const grams = parseAmount(settings.gramsPerCan)
    if (dailyMl === null) missing.push('น้ำหนักลูกในแท็บปริมาณนม')
    if (price === null || !grams) missing.push('ราคาและน้ำหนักกระป๋องนมผง')
    if (dailyMl !== null && price !== null && grams) {
      const usage = calcFormulaUsage(dailyMl * share, price, grams)
      lines.push({
        id: 'formula',
        label: 'นมผง',
        detail: `${usage.cansPerMonth.toFixed(1)} กระป๋อง/เดือน${share < 1 ? ' (ครึ่งหนึ่งของปริมาณนม)' : ''}`,
        category: 'formula',
        amount: usage.costPerMonth,
      })
    }
  }

  const diaperPrice = parseAmount(settings.diaperPrice)
  if (diaperPrice !== null && diaperPrice > 0) {
    const perDay = getDiapersPerDay(ageMonths)
    lines.push({
      id: 'diapers',
      label: 'ผ้าอ้อม',
      detail: `${(perDay.min + perDay.max) / 2} ชิ้น/วัน × ${diaperPrice} บาท`,
      category: 'diapers',
      amount: calcDiaperCost(ageMonths, diaperPrice).avg,
    })
  }

  // รวมรายการชื่อซ้ำ: เก็บลำดับตามที่พบครั้งแรก
  const groups = new Map<string, { id: string; label: string; amount: number; count: number }>()
  for (const e of settings.extras) {
    const valid = e.entries.map(entryAmount).filter((a): a is number => a !== null && a > 0)
    if (valid.length === 0) continue
    const key = expenseNameKey(e.name) || `__unnamed-${e.id}`
    const g = groups.get(key) ?? { id: e.id, label: e.name.trim() || 'ค่าใช้จ่ายอื่น', amount: 0, count: 0 }
    g.amount += valid.reduce((s, a) => s + a, 0)
    g.count += valid.length
    groups.set(key, g)
  }
  for (const g of groups.values()) {
    lines.push({ id: g.id, label: g.label, detail: g.count > 1 ? `รวม ${g.count} ยอด` : '1 ยอด', category: 'other', amount: g.amount })
  }

  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), missing }
}

export interface ScenarioCost {
  scenario: FeedingType
  label: string
  formula: number
  diapers: number
  other: number
  total: number
}

/** เปรียบเทียบค่าใช้จ่ายต่อเดือน 3 แบบ (ใช้เมื่อกรอกข้อมูลนมผงครบ) */
export function compareScenarios(params: {
  dailyMl: number
  ageMonths: number
  pricePerCan: number
  gramsPerCan: number
  diaperPrice: number
  /** ค่าใช้จ่ายอื่นแบบต่อเดือนเท่านั้น */
  otherMonthly?: number
}): ScenarioCost[] {
  const fullFormula = calcFormulaUsage(params.dailyMl, params.pricePerCan, params.gramsPerCan).costPerMonth
  const diapers = params.diaperPrice > 0 ? calcDiaperCost(params.ageMonths, params.diaperPrice).avg : 0
  const other = params.otherMonthly ?? 0
  return (['breast', 'mixed', 'formula'] as const).map((scenario) => {
    const formula = fullFormula * FORMULA_SHARE[scenario]
    return { scenario, label: FEEDING_LABELS[scenario], formula, diapers, other, total: formula + diapers + other }
  })
}
