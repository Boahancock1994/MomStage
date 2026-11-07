/**
 * ตรรกะตัวช่วยตัดสินใจเมื่อลูกป่วย
 *
 * 1. getNextQuestion() ถามทีละข้อ เฉพาะข้อที่ showIf เป็นจริงตามอาการหลักและอายุ
 * 2. triage() ตรวจกฎทั้งหมด ผลลัพธ์ = ระดับสูงสุดที่ตรง (แดง > เหลือง > เขียว) พร้อมเหตุผลทุกข้อ
 * อายุลูกมาจาก getBabyAge() ใน age.ts ผ่าน store
 */
import { HOME_CARE, SICK_QUESTIONS, SICK_RULES, type SickAnswers, type SickContext, type SickQuestion, type SickRule, type TriageLevel } from '../data/sickRules'
import type { Child } from '../types'
import { getBabyAge } from './age'

export const TRIAGE_META: Record<TriageLevel, { title: string; summary: string }> = {
  green: { title: 'ดูอาการที่บ้านได้', summary: 'ยังไม่พบสัญญาณอันตราย ดูแลตามคำแนะนำและสังเกตอาการต่อ' },
  yellow: { title: 'ควรพบแพทย์ภายใน 24 ชม.', summary: 'มีอาการที่ควรให้แพทย์ตรวจ แต่ยังไม่ใช่ภาวะฉุกเฉิน' },
  red: { title: 'ไปโรงพยาบาลเดี๋ยวนี้', summary: 'มีสัญญาณอันตราย ไปห้องฉุกเฉินใกล้บ้านทันที หรือโทร 1669' },
}

export function getSickContext(child: Child | null, today: Date = new Date()): SickContext {
  if (!child || child.mode !== 'born' || !child.birthDate) return { ageMonths: null }
  return { ageMonths: getBabyAge(child.birthDate, today).months }
}

/** รายการคำถามที่ต้องถามตามคำตอบปัจจุบัน (เปลี่ยนตามอาการหลักที่เลือก) */
export function getApplicableQuestions(answers: SickAnswers, ctx: SickContext): SickQuestion[] {
  return SICK_QUESTIONS.filter((q) => q.showIf(answers, ctx))
}

/** คำถามข้อถัดไปที่ยังไม่ได้ตอบ (undefined = ถามครบแล้ว) */
export function getNextQuestion(answers: SickAnswers, ctx: SickContext): SickQuestion | undefined {
  return getApplicableQuestions(answers, ctx).find((q) => answers[q.id] === undefined)
}

export interface TriageResult {
  level: TriageLevel
  /** กฎที่ตรงทั้งหมด เรียงแดงก่อน */
  matched: SickRule[]
  homeCare: string[]
}

const RANK: Record<TriageLevel, number> = { green: 0, yellow: 1, red: 2 }

export function triage(answers: SickAnswers, ctx: SickContext): TriageResult {
  const matched = SICK_RULES.filter((r) => r.test(answers, ctx)).sort((a, b) => RANK[b.level] - RANK[a.level])
  const level: TriageLevel = matched[0]?.level ?? 'green'
  const homeCare = level === 'red' ? [] : answers.symptoms.flatMap((s) => HOME_CARE[s])
  return { level, matched, homeCare }
}
