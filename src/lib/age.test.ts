import { describe, expect, it } from 'vitest'
import { getBabyAge, getDueDateFromLMP, getPregnancyWeek, toISODate } from './age'

describe('getPregnancyWeek', () => {
  it('วันนี้คือวันกำหนดคลอด = ครรภ์ 40 สัปดาห์พอดี', () => {
    const p = getPregnancyWeek('2026-11-07', '2026-11-07')
    expect(p).toEqual({ weeks: 40, days: 0, totalDays: 280, daysUntilDue: 0, trimester: 3 })
  })

  it('เหลือ 114 วันถึงกำหนดคลอด = 280 − 114 = 166 วัน = 23 สัปดาห์ 5 วัน (ไตรมาส 2)', () => {
    const p = getPregnancyWeek('2027-03-01', '2026-11-07')
    expect(p.daysUntilDue).toBe(114)
    expect(p.weeks).toBe(23)
    expect(p.days).toBe(5)
    expect(p.trimester).toBe(2)
  })

  it('ช่วงที่คร่อม 29 ก.พ. ของปีอธิกสุรทิน 2028 นับวันได้ถูกต้อง', () => {
    // 2028-02-01 → 2028-03-01 = 29 วัน (เพราะ ก.พ. 2028 มี 29 วัน)
    const p = getPregnancyWeek('2028-03-01', '2028-02-01')
    expect(p.daysUntilDue).toBe(29)
    expect(p.totalDays).toBe(251)
    expect(p.weeks).toBe(35)
    expect(p.days).toBe(6)
  })

  it('เลยกำหนดคลอดแล้ว 5 วัน = 40 สัปดาห์ 5 วัน', () => {
    const p = getPregnancyWeek('2026-11-02', '2026-11-07')
    expect(p.daysUntilDue).toBe(-5)
    expect(p.weeks).toBe(40)
    expect(p.days).toBe(5)
  })

  it('ไตรมาส 1 เมื่ออายุครรภ์ต่ำกว่า 14 สัปดาห์', () => {
    // เหลือ 200 วัน → 80 วัน = 11 สัปดาห์ 3 วัน
    const p = getPregnancyWeek('2027-05-26', '2026-11-07')
    expect(p.weeks).toBe(11)
    expect(p.days).toBe(3)
    expect(p.trimester).toBe(1)
  })

  it('กำหนดคลอดจาก LMP = LMP + 280 วัน (กฎของ Naegele)', () => {
    expect(toISODate(getDueDateFromLMP('2026-01-01'))).toBe('2026-10-08')
  })
})

describe('getBabyAge', () => {
  it('เกิดวันนี้ = 0 เดือน 0 วัน', () => {
    expect(getBabyAge('2026-11-07', '2026-11-07')).toEqual({
      months: 0,
      days: 0,
      totalDays: 0,
      totalWeeks: 0,
    })
  })

  it('อายุ 2 เดือน 10 วัน (เคสทั่วไป)', () => {
    const age = getBabyAge('2026-08-28', '2026-11-07')
    expect(age.months).toBe(2)
    expect(age.days).toBe(10)
    expect(age.totalDays).toBe(71)
    expect(age.totalWeeks).toBe(10)
  })

  it('เกิด 29 ก.พ. 2028 (ปีอธิกสุรทิน) ครบ 1 ขวบวันที่ 28 ก.พ. 2029', () => {
    expect(getBabyAge('2028-02-29', '2029-02-28')).toMatchObject({ months: 12, days: 0, totalDays: 365 })
    expect(getBabyAge('2028-02-29', '2029-03-01')).toMatchObject({ months: 12, days: 1 })
  })

  it('เกิดวันที่ 31 ม.ค. ครบ 1 เดือนวันสุดท้ายของ ก.พ. — ปีปกติ 28 ก.พ.', () => {
    expect(getBabyAge('2027-01-31', '2027-02-28')).toMatchObject({ months: 1, days: 0, totalDays: 28 })
    expect(getBabyAge('2027-01-31', '2027-02-27')).toMatchObject({ months: 0, days: 27 })
    expect(getBabyAge('2027-01-31', '2027-03-31')).toMatchObject({ months: 2, days: 0 })
  })

  it('เกิดวันที่ 31 ม.ค. ในปีอธิกสุรทิน ครบ 1 เดือนวันที่ 29 ก.พ.', () => {
    expect(getBabyAge('2028-01-31', '2028-02-29')).toMatchObject({ months: 1, days: 0, totalDays: 29 })
    expect(getBabyAge('2028-01-31', '2028-02-28')).toMatchObject({ months: 0, days: 28 })
  })

  it('days ไม่ติดลบเลยตลอด 3 ปี สำหรับวันเกิดวันที่ 31', () => {
    for (let i = 0; i < 365 * 3; i++) {
      const today = new Date(2027, 0, 31 + i)
      const age = getBabyAge('2027-01-31', today)
      expect(age.days).toBeGreaterThanOrEqual(0)
      expect(age.days).toBeLessThan(31)
    }
  })

  it('วันที่ในอนาคตคืนค่า 0 ไม่ติดลบ', () => {
    expect(getBabyAge('2026-12-01', '2026-11-07').totalDays).toBe(0)
  })
})
