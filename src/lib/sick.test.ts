import { describe, expect, it } from 'vitest'
import type { SickAnswers } from '../data/sickRules'
import { calcParacetamolDose, isParacetamolAllowed } from './paracetamol'
import { getApplicableQuestions, getNextQuestion, triage } from './sick'

const base = (patch: Partial<SickAnswers>): SickAnswers => ({ symptoms: ['fever'], danger: [], ...patch })
const age = (m: number | null) => ({ ageMonths: m })

describe('decision tree: ถามต่อเฉพาะที่เกี่ยว', () => {
  it('ไข้อย่างเดียว ไม่ถามเรื่องผื่นลักษณะอื่น อาเจียน หรือไอ', () => {
    const ids = getApplicableQuestions({ symptoms: ['fever'] }, age(12)).map((q) => q.id)
    expect(ids).toContain('temperature')
    expect(ids).toContain('petechiae')
    expect(ids).not.toContain('vomitType')
    expect(ids).not.toContain('coughType')
  })

  it('ไออย่างเดียว ถามแค่อาการอันตรายกับลักษณะการไอ', () => {
    expect(getApplicableQuestions({ symptoms: ['cough'] }, age(12)).map((q) => q.id)).toEqual(['danger', 'coughType'])
  })

  it('getNextQuestion คืนข้อแรกที่ยังไม่ตอบ และ undefined เมื่อครบ', () => {
    expect(getNextQuestion({ symptoms: ['cough'] }, age(12))?.id).toBe('danger')
    expect(getNextQuestion({ symptoms: ['cough'], danger: [] }, age(12))?.id).toBe('coughType')
    expect(getNextQuestion({ symptoms: ['cough'], danger: [], coughType: [] }, age(12))).toBeUndefined()
  })
})

describe('triage: กฎสีแดง', () => {
  it('อายุ < 3 เดือน ไข้ 38.0 °C = แดง แต่อายุ 3 เดือนไข้เท่ากันไม่แดง', () => {
    expect(triage(base({ temperature: 38.0, feverDays: 'lt1', drinking: 'normal' }), age(2)).level).toBe('red')
    expect(triage(base({ temperature: 38.0, feverDays: 'lt1', drinking: 'normal' }), age(3)).level).toBe('green')
    expect(triage(base({ temperature: 37.9 }), age(1)).level).toBe('green')
  })

  it.each([
    ['ชัก', { danger: ['seizure'] }],
    ['ซึมปลุกไม่ตื่น', { danger: ['unresponsive'] }],
    ['หายใจหอบ/อกบุ๋ม', { danger: ['breathing'] }],
    ['ริมฝีปากเขียว', { danger: ['cyanosis'] }],
    ['กระหม่อมบุ๋ม', { dehydration: ['sunkenFontanelle'] }],
    ['ปัสสาวะน้อยกว่า 3 ครั้ง', { dehydration: ['lowUrine'] }],
    ['ร้องไม่มีน้ำตา', { dehydration: ['noTears'] }],
    ['ผื่นจุดเลือดออกกดไม่จาง', { petechiae: true }],
    ['ไข้เกิน 3 วัน', { feverDays: 'gt3' as const }],
  ])('%s = แดง', (_, patch) => {
    const r = triage(base(patch), age(24))
    expect(r.level).toBe('red')
    expect(r.homeCare).toEqual([]) // แดงไม่แนะนำดูแลที่บ้าน
  })
})

describe('triage: เหลือง / เขียว', () => {
  it('อายุ 4 เดือน ไข้ 39 = เหลือง / อายุ 2 ปี ไข้ 39 = เขียว / ไข้ 40 ทุกอายุ = เหลือง', () => {
    expect(triage(base({ temperature: 39 }), age(4)).level).toBe('yellow')
    expect(triage(base({ temperature: 39, feverDays: '1to3', drinking: 'normal' }), age(24)).level).toBe('green')
    expect(triage(base({ temperature: 40 }), age(24)).level).toBe('yellow')
  })

  it('ระดับสูงสุดชนะ และเก็บเหตุผลทุกข้อเรียงแดงก่อน', () => {
    const r = triage(base({ temperature: 40, danger: ['seizure'] }), age(24))
    expect(r.level).toBe('red')
    expect(r.matched.map((m) => m.level)).toEqual(['red', 'yellow'])
  })

  it('ไม่มีอะไรน่ากังวล = เขียว พร้อมคำแนะนำดูแลที่บ้านตามอาการ', () => {
    const r = triage({ symptoms: ['cough'], danger: [], coughType: [] }, age(24))
    expect(r.level).toBe('green')
    expect(r.homeCare.length).toBeGreaterThan(0)
  })
})

describe('calcParacetamolDose', () => {
  it('น้ำหนัก 8 กก. ยา 120 มก./5 มล. → 80–120 มก. = 3.3–5 มล.', () => {
    const d = calcParacetamolDose(8, 120)
    expect(d).toMatchObject({ minMg: 80, maxMg: 120, minMl: 3.3, maxMl: 5, suggestedMl: 5, suggestedMg: 120 })
  })

  it('ความเข้มข้นสูงขึ้น ปริมาณ มล. ลดลง และปริมาณแนะนำไม่เกินขนาดสูงสุด', () => {
    const d160 = calcParacetamolDose(8, 160)
    expect(d160.minMl).toBe(2.5)
    expect(d160.maxMl).toBe(3.8)
    expect(d160.suggestedMl).toBe(3.5)
    const d250 = calcParacetamolDose(8, 250)
    expect(d250.maxMl).toBe(2.4)
    expect(d250.suggestedMg).toBeLessThanOrEqual(d250.maxMg)
    expect(d250.suggestedMg).toBeGreaterThanOrEqual(d250.minMg)
  })

  it('ไม่เกิน 500 มก. ต่อครั้ง', () => {
    expect(calcParacetamolDose(50, 250).maxMg).toBe(500)
  })

  it('ปิดการใช้สำหรับอายุต่ำกว่า 3 เดือนหรือไม่ทราบอายุ', () => {
    expect(isParacetamolAllowed(2)).toBe(false)
    expect(isParacetamolAllowed(null)).toBe(false)
    expect(isParacetamolAllowed(3)).toBe(true)
  })
})
