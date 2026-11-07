import { describe, expect, it } from 'vitest'
import { DEFAULT_CALC_SETTINGS } from './babyCalc'
import type { Child } from '../types'
import { buildVaccineSummaryText, getActionableVaccines, getVaccineSchedule, getVaccineStatus } from './vaccine'

function makeChild(patch: Partial<Child>): Child {
  return {
    id: 'test',
    name: 'น้องทดสอบ',
    mode: 'born',
    vaccineLog: {},
    growthLog: [],
    quizResults: [],
    checklist: {},
    careLog: [],
    calcSettings: DEFAULT_CALC_SETTINGS,
    favoriteNames: [],
    ...patch,
  }
}

const find = (schedule: NonNullable<ReturnType<typeof getVaccineSchedule>>, id: string) =>
  schedule.items.find((v) => v.id === id)!

describe('getVaccineSchedule', () => {
  it('คำนวณวันนัดและสถานะ done / overdue / due / upcoming ได้ถูกต้อง', () => {
    // เกิด 1 ก.ค. 2026, วันนี้ 7 พ.ย. 2026 (อายุ 4 เดือน 6 วัน)
    const child = makeChild({ birthDate: '2026-07-01', vaccineLog: { bcg: '2026-07-02' } })
    const s = getVaccineSchedule(child, new Date(2026, 10, 7))!

    expect(s.isEstimate).toBe(false)
    expect(find(s, 'bcg')).toMatchObject({ status: 'done', givenDate: '2026-07-02' })
    // HB1 ครบกำหนดวันเกิด เลยมา 129 วัน ยังไม่ได้ฉีด → overdue
    expect(find(s, 'hb1')).toMatchObject({ dueDate: '2026-07-01', daysFromDue: 129, status: 'overdue' })
    // เข็ม 2 เดือน (1 ก.ย.) เลยมา 67 วัน → overdue
    expect(find(s, 'dtphbhib1')).toMatchObject({ dueDate: '2026-09-01', status: 'overdue' })
    // เข็ม 4 เดือน (1 พ.ย.) เลยมา 6 วัน → due
    expect(find(s, 'dtphbhib2')).toMatchObject({ dueDate: '2026-11-01', daysFromDue: 6, status: 'due' })
    // เข็ม 6 เดือน (1 ม.ค. 2027) อีก 55 วัน → upcoming
    expect(find(s, 'dtphbhib3')).toMatchObject({ dueDate: '2027-01-01', daysFromDue: -55, status: 'upcoming' })
  })

  it('ขอบเขตของกฎ: −14 วัน = due, −15 = upcoming, +30 = due, +31 = overdue', () => {
    const due = new Date(2026, 5, 15)
    expect(getVaccineStatus(due, new Date(2026, 5, 1))).toBe('due') // ก่อน 14 วัน
    expect(getVaccineStatus(due, new Date(2026, 4, 31))).toBe('upcoming') // ก่อน 15 วัน
    expect(getVaccineStatus(due, new Date(2026, 6, 15))).toBe('due') // หลัง 30 วัน
    expect(getVaccineStatus(due, new Date(2026, 6, 16))).toBe('overdue') // หลัง 31 วัน
    expect(getVaccineStatus(due, new Date(2026, 6, 16), '2026-06-20')).toBe('done') // ฉีดแล้วชนะทุกกฎ
  })

  it('ปีอธิกสุรทิน: เกิด 31 ธ.ค. 2027 นัด 2 เดือน = 29 ก.พ. 2028 / เกิด 29 ก.พ. 2028 นัด 1 ปี = 28 ก.พ. 2029', () => {
    const dec31 = getVaccineSchedule(makeChild({ birthDate: '2027-12-31' }), new Date(2028, 0, 1))!
    expect(find(dec31, 'dtphbhib1').dueDate).toBe('2028-02-29')
    expect(find(dec31, 'dtphbhib2').dueDate).toBe('2028-04-30')

    const feb29 = getVaccineSchedule(makeChild({ birthDate: '2028-02-29' }), new Date(2028, 2, 1))!
    expect(find(feb29, 'laje1').dueDate).toBe('2029-02-28')
    expect(find(feb29, 'mmr2').dueDate).toBe('2029-08-29')
  })

  it('ยังตั้งครรภ์: ใช้วันกำหนดคลอดเป็นวันเกิดโดยประมาณ ทุกเข็มเป็น upcoming', () => {
    const child = makeChild({ mode: 'pregnant', dueDate: '2027-02-14', vaccineLog: { bcg: '2027-01-01' } })
    const s = getVaccineSchedule(child, new Date(2026, 10, 7))!
    expect(s.isEstimate).toBe(true)
    expect(find(s, 'bcg').dueDate).toBe('2027-02-14')
    expect(find(s, 'mmr1').dueDate).toBe('2027-11-14')
    expect(s.items.every((v) => v.status === 'upcoming')).toBe(true)
  })

  it('ไม่มีวันที่ = คืน null', () => {
    expect(getVaccineSchedule(makeChild({ birthDate: undefined }))).toBeNull()
  })

  it('เข็มเฉพาะกรณี (optional) ไม่ถูกนับเป็นเข็มค้าง และเรียง overdue ก่อน due', () => {
    const child = makeChild({ birthDate: '2026-07-01', vaccineLog: { bcg: '2026-07-02', hb1: '2026-07-01' } })
    const actionable = getActionableVaccines(getVaccineSchedule(child, new Date(2026, 10, 7))!)
    expect(actionable.some((v) => v.id === 'hb2')).toBe(false)
    expect(actionable[0].status).toBe('overdue')
    expect(actionable[actionable.length - 1].status).toBe('due')
  })

  it('ข้อความส่งออกมีชื่อ หัวข้อเลยกำหนด และรายการที่ฉีดแล้ว', () => {
    const child = makeChild({ birthDate: '2026-07-01', vaccineLog: { bcg: '2026-07-02' } })
    const today = new Date(2026, 10, 7)
    const text = buildVaccineSummaryText(child, getVaccineSchedule(child, today)!, today)
    expect(text).toContain('สรุปวัคซีนของ น้องทดสอบ (อายุ 4 เดือน 6 วัน)')
    expect(text).toContain('เลยกำหนดแล้ว')
    expect(text).toContain('ฉีดแล้ว 1 เข็ม')
  })
})
