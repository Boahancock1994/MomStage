/**
 * คำนวณขนาดยาพาราเซตามอลชนิดน้ำเชื่อมตามน้ำหนักตัว
 *
 * ขนาดยา: 10–15 มก./กก./ครั้ง ทุก 4–6 ชั่วโมง เมื่อมีไข้
 *   อ้างอิง: BNF for Children (Paracetamol, oral) และแนวทางทั่วไปของกุมารแพทย์ไทย
 *   ห่างกันอย่างน้อย 4 ชั่วโมง ไม่เกิน 5 ครั้งใน 24 ชั่วโมง (ตามฉลากยาเด็กที่จำหน่ายในไทย)
 * ไม่คำนวณให้เด็กอายุต่ำกว่า 3 เดือน — ทารกวัยนี้มีไข้ต้องพบแพทย์ก่อนเสมอ (NICE NG143)
 */

export const MG_PER_KG_MIN = 10
export const MG_PER_KG_MAX = 15
/** ไม่เกินขนาดผู้ใหญ่ต่อครั้ง */
export const MAX_SINGLE_DOSE_MG = 500
export const MIN_INTERVAL_HOURS = 4
export const MAX_DOSES_PER_DAY = 5
export const MIN_AGE_MONTHS = 3

/** ความเข้มข้นที่มีจำหน่าย (มก. ต่อ 5 มล.) */
export const CONCENTRATIONS = [120, 160, 250] as const
export type Concentration = (typeof CONCENTRATIONS)[number]

export interface ParacetamolDose {
  minMg: number
  maxMg: number
  minMl: number
  maxMl: number
  /** ปริมาณแนะนำที่ตวงง่าย: ปัดลงเป็นทีละ 0.5 มล. ภายในช่วง */
  suggestedMl: number
  suggestedMg: number
}

/** ปัดลงเป็นทีละ step เพื่อไม่ให้เกินขนาดสูงสุด */
function floorTo(value: number, step: number): number {
  return Math.floor(value / step + 1e-9) * step
}

export function calcParacetamolDose(weightKg: number, mgPer5ml: number): ParacetamolDose {
  if (!(weightKg > 0) || !(mgPer5ml > 0)) throw new Error('น้ำหนักและความเข้มข้นต้องมากกว่า 0')
  const mgPerMl = mgPer5ml / 5
  const minMg = Math.min(weightKg * MG_PER_KG_MIN, MAX_SINGLE_DOSE_MG)
  const maxMg = Math.min(weightKg * MG_PER_KG_MAX, MAX_SINGLE_DOSE_MG)
  const minMl = minMg / mgPerMl
  const maxMl = maxMg / mgPerMl

  // ตวงทีละ 0.5 มล. ไม่เกินขนาดสูงสุด และถ้าปัดแล้วต่ำกว่าขนาดต่ำสุด ให้ตวงทีละ 0.1 มล. แทน
  let suggestedMl = floorTo(maxMl, 0.5)
  if (suggestedMl < minMl) suggestedMl = floorTo(maxMl, 0.1)
  suggestedMl = Math.round(suggestedMl * 10) / 10

  return {
    minMg: round1(minMg),
    maxMg: round1(maxMg),
    minMl: round1(minMl),
    maxMl: round1(maxMl),
    suggestedMl,
    suggestedMg: round1(suggestedMl * mgPerMl),
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** ใช้ได้ไหมตามอายุ — null = ไม่ทราบอายุ */
export function isParacetamolAllowed(ageMonths: number | null): boolean {
  return ageMonths !== null && ageMonths >= MIN_AGE_MONTHS
}
