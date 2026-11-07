/**
 * ตรรกะควิซพัฒนาการตามกระบวนการ DSPM
 *
 * 1. เลือกชุดข้อตามช่วงอายุปัจจุบันอัตโนมัติ (อายุเต็มเดือนจาก getBabyAge)
 * 2. ตอบได้ 3 แบบ: ทำได้ / ยังทำไม่ได้ / ไม่แน่ใจ
 * 3. สรุปรายด้าน 5 ด้าน:
 *      ทำได้ครบทุกข้อ           → "สมวัย"
 *      มีข้อที่ยังทำไม่ได้        → "ควรส่งเสริม" + กิจกรรมฝึกของข้อนั้น
 *      ไม่มีข้อที่ทำไม่ได้ แต่มี "ไม่แน่ใจ" → "ลองสังเกตอีกครั้ง"
 * 4. ถ้ามีข้อที่ยังไม่ผ่าน → นัดทำซ้ำใน 30 วัน (DSPM: ฝึกต่อเนื่อง 1 เดือนแล้วประเมินซ้ำ)
 * 5. ถ้าทำซ้ำแล้วข้อเดิมยังทำไม่ได้ → แนะนำให้ปรึกษาเจ้าหน้าที่คลินิกเด็กดี (ส่งต่อตามคู่มือ)
 */
import { addDays, differenceInCalendarDays } from 'date-fns'
import { DOMAIN_ORDER, DSPM_AGE_GROUPS, DSPM_ITEMS, type DspmAgeGroup, type DspmDomain, type DspmItem } from '../data/dspm'
import type { Child, QuizAnswer, QuizResult } from '../types'
import { getBabyAge, toDay, toISODate } from './age'

/** ฝึกต่อเนื่องกี่วันก่อนประเมินซ้ำ */
export const RETEST_AFTER_DAYS = 30
/** ผลครั้งก่อนต้องไม่เก่ากว่านี้จึงนับว่า "ทำซ้ำ" (วัน) */
export const RETEST_WINDOW_DAYS = 90

export type DomainStatus = 'onTrack' | 'promote' | 'unsure'

export interface DomainResult {
  domain: DspmDomain
  status: DomainStatus
  items: { item: DspmItem; answer: QuizAnswer | undefined }[]
  /** ข้อที่ยังทำไม่ได้ — แสดง activityIfNot */
  toPromote: DspmItem[]
  unsure: DspmItem[]
}

export interface QuizScore {
  domains: DomainResult[]
  score: number
  total: number
  allOnTrack: boolean
  retestDate?: string
  isRetest: boolean
  referral: boolean
  /** ข้อที่ทำซ้ำแล้วยังทำไม่ได้ */
  referralItems: DspmItem[]
}

/** ช่วงอายุ DSPM ของอายุเต็มเดือนนี้ (ต่ำกว่า 0 ใช้ช่วงแรก เกิน 36 ใช้ช่วงสุดท้าย) */
export function getAgeGroupForAge(ageMonths: number): DspmAgeGroup {
  const found = DSPM_AGE_GROUPS.find((g) => ageMonths >= g.ageFrom && ageMonths <= g.ageTo)
  if (found) return found
  return ageMonths < 0 ? DSPM_AGE_GROUPS[0] : DSPM_AGE_GROUPS[DSPM_AGE_GROUPS.length - 1]
}

export function getQuizForGroup(groupId: string): { group: DspmAgeGroup; items: DspmItem[] } {
  const group = DSPM_AGE_GROUPS.find((g) => g.id === groupId) ?? DSPM_AGE_GROUPS[0]
  const items = DSPM_ITEMS.filter((i) => i.ageFrom === group.ageFrom && i.ageTo === group.ageTo)
  return { group, items }
}

/** เลือกข้อของช่วงอายุปัจจุบันให้อัตโนมัติ */
export function getQuizForAge(ageMonths: number): { group: DspmAgeGroup; items: DspmItem[] } {
  return getQuizForGroup(getAgeGroupForAge(ageMonths).id)
}

/** อายุเต็มเดือนของลูกวันนี้ (null ถ้ายังไม่เกิด) */
export function getChildAgeMonths(child: Child, today: Date = new Date()): number | null {
  return child.mode === 'born' && child.birthDate ? getBabyAge(child.birthDate, today).months : null
}

/** ผลล่าสุดของช่วงอายุนี้ที่ยังรอทำซ้ำ และไม่เก่าเกินกำหนด — ใช้เป็น previous ของ scoreQuiz */
export function findPreviousForRetest(results: QuizResult[], groupId: string, today: Date = new Date()): QuizResult | undefined {
  const latest = results
    .filter((r) => r.ageGroupId === groupId)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (!latest?.retestDate) return undefined
  if (differenceInCalendarDays(toDay(today), toDay(latest.date)) > RETEST_WINDOW_DAYS) return undefined
  return latest
}

/**
 * สรุปผลควิซรายด้าน
 * @param answers  รหัสข้อ → คำตอบ (ข้อที่ไม่ได้ตอบนับเป็น "ไม่แน่ใจ")
 * @param options.items     ชุดข้อของควิซนี้ (ค่าเริ่มต้น = ข้อที่อยู่ใน answers)
 * @param options.date      วันที่ทำ ใช้คำนวณวันนัดทำซ้ำ
 * @param options.previous  ผลครั้งก่อนของช่วงอายุเดียวกันที่รอทำซ้ำ
 */
export function scoreQuiz(
  answers: Record<string, QuizAnswer>,
  options: { items?: DspmItem[]; date?: Date; previous?: QuizResult } = {},
): QuizScore {
  const items = options.items ?? DSPM_ITEMS.filter((i) => i.id in answers)
  const date = toDay(options.date ?? new Date())

  const domains: DomainResult[] = DOMAIN_ORDER.flatMap((domain) => {
    const domainItems = items.filter((i) => i.domain === domain)
    if (domainItems.length === 0) return []
    const rows = domainItems.map((item) => ({ item, answer: answers[item.id] }))
    const toPromote = rows.filter((r) => r.answer === 'no').map((r) => r.item)
    const unsure = rows.filter((r) => r.answer !== 'yes' && r.answer !== 'no').map((r) => r.item)
    const status: DomainStatus = toPromote.length > 0 ? 'promote' : unsure.length > 0 ? 'unsure' : 'onTrack'
    return [{ domain, status, items: rows, toPromote, unsure }]
  })

  const score = items.filter((i) => answers[i.id] === 'yes').length
  const allOnTrack = score === items.length && items.length > 0

  const previous = options.previous
  const referralItems = previous ? items.filter((i) => previous.answers[i.id] === 'no' && answers[i.id] === 'no') : []

  return {
    domains,
    score,
    total: items.length,
    allOnTrack,
    retestDate: allOnTrack ? undefined : toISODate(addDays(date, RETEST_AFTER_DAYS)),
    isRetest: !!previous,
    referral: referralItems.length > 0,
    referralItems,
  }
}

export type QuizDueReason = 'never' | 'retest' | 'waiting' | 'done'

/** ควรทำควิซช่วงนี้ไหม — ใช้กับปุ่ม "ทำควิซช่วงนี้" บนหน้า "ตอนนี้" */
export function getQuizStatus(
  child: Child,
  today: Date = new Date(),
): { group: DspmAgeGroup; due: boolean; reason: QuizDueReason; last?: QuizResult } | null {
  const months = getChildAgeMonths(child, today)
  if (months === null) return null
  const group = getAgeGroupForAge(months)
  const last = child.quizResults
    .filter((r) => r.ageGroupId === group.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  if (!last) return { group, due: true, reason: 'never' }
  if (last.retestDate) {
    const isDue = differenceInCalendarDays(toDay(today), toDay(last.retestDate)) >= 0
    return { group, due: isDue, reason: isDue ? 'retest' : 'waiting', last }
  }
  return { group, due: false, reason: 'done', last }
}
