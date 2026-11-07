/**
 * ตรรกะ checklist: หา "ช่วงปัจจุบัน" และ "ช่วงถัดไป" จากอายุ แล้วคำนวณเปอร์เซ็นต์ที่เตรียมแล้ว
 * ตั้งครรภ์ใช้สัปดาห์จาก getPregnancyWeek / คลอดแล้วใช้เดือนจาก getBabyAge (age.ts)
 */
import { CHECKLIST_ITEMS, CHECKLIST_STAGES, type ChecklistItem, type ChecklistStage } from '../data/checklist'
import type { Child } from '../types'
import { getBabyAge, getPregnancyWeek } from './age'

export interface StageProgress {
  stage: ChecklistStage
  items: ChecklistItem[]
  doneCount: number
  /** 0–100 ปัดเป็นจำนวนเต็ม */
  percent: number
}

export function getStageProgress(stage: ChecklistStage, checked: Record<string, boolean>): StageProgress {
  const items = CHECKLIST_ITEMS.filter((i) => i.stage === stage.id)
  const doneCount = items.filter((i) => checked[i.id]).length
  const percent = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100)
  return { stage, items, doneCount, percent }
}

/** หา index ของช่วงปัจจุบันใน CHECKLIST_STAGES (-1 ถ้ายังไม่มีวันที่) */
export function getCurrentStageIndex(child: Child, today: Date = new Date()): number {
  let mode: 'pregnant' | 'born'
  let value: number
  if (child.mode === 'pregnant' && child.dueDate) {
    mode = 'pregnant'
    value = Math.max(0, getPregnancyWeek(child.dueDate, today).weeks)
  } else if (child.mode === 'born' && child.birthDate) {
    mode = 'born'
    value = getBabyAge(child.birthDate, today).months
  } else {
    return -1
  }

  const idx = CHECKLIST_STAGES.findIndex((s) => s.mode === mode && value >= s.from && value < s.to)
  if (idx >= 0) return idx
  // เกินช่วงสุดท้ายของโหมดนั้น → ใช้ช่วงสุดท้ายของโหมด
  return CHECKLIST_STAGES.map((s) => s.mode).lastIndexOf(mode)
}

/** ช่วงปัจจุบันและช่วงถัดไป (ช่วงสุดท้ายของตั้งครรภ์ต่อด้วยช่วงแรกเกิด) */
export function getRelevantStages(child: Child, today: Date = new Date()): { current?: StageProgress; next?: StageProgress } {
  const idx = getCurrentStageIndex(child, today)
  if (idx < 0) return {}
  const current = getStageProgress(CHECKLIST_STAGES[idx], child.checklist)
  const nextStage = CHECKLIST_STAGES[idx + 1]
  return { current, next: nextStage ? getStageProgress(nextStage, child.checklist) : undefined }
}
