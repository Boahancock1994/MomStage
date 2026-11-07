import { describe, expect, it } from 'vitest'
import { DEFAULT_CALC_SETTINGS } from './babyCalc'
import type { Child } from '../types'
import { getRelevantStages } from './checklist'

function makeChild(patch: Partial<Child>): Child {
  return { id: 't', name: 't', mode: 'born', vaccineLog: {}, growthLog: [], quizResults: [], checklist: {}, careLog: [], calcSettings: DEFAULT_CALC_SETTINGS, favoriteNames: [], ...patch }
}

describe('getRelevantStages', () => {
  it('ลูก 4 เดือน → ช่วง 4–6 เดือน และช่วงถัดไป 7–11 เดือน พร้อมเปอร์เซ็นต์', () => {
    const child = makeChild({ birthDate: '2026-07-01', checklist: { 'm4-highchair': true, 'm4-spoon': true, 'm4-bib': true } })
    const { current, next } = getRelevantStages(child, new Date(2026, 10, 7))
    expect(current?.stage.id).toBe('m4-6')
    expect(current?.doneCount).toBe(3)
    expect(current?.percent).toBe(50) // 3 จาก 6 รายการ
    expect(next?.stage.id).toBe('m7-11')
  })

  it('ครรภ์ 33 สัปดาห์ → กระเป๋าคลอด และช่วงถัดไปคือแรกเกิด', () => {
    // เหลือ 49 วัน → 231 วัน = 33 สัปดาห์
    const { current, next } = getRelevantStages(makeChild({ mode: 'pregnant', dueDate: '2026-12-26' }), new Date(2026, 10, 7))
    expect(current?.stage.id).toBe('preg-bag')
    expect(next?.stage.id).toBe('newborn')
  })
})
