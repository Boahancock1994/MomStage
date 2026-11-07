import { describe, expect, it } from 'vitest'
import { getNextVisit, getPregnancyMilestones } from './pregnancy'

const byId = (m: ReturnType<typeof getPregnancyMilestones>, id: string) => m.items.find((i) => i.id === id)!

describe('getPregnancyMilestones', () => {
  it('ครรภ์ 23 สัปดาห์ 5 วัน: ไตรมาส 2 เหลือ 114 วัน และสถานะแต่ละรายการถูกต้อง', () => {
    const m = getPregnancyMilestones('2027-03-01', '2026-11-07')
    expect(m.pregnancy.weeks).toBe(23)
    expect(m.trimester).toBe(2)
    expect(m.daysUntilDue).toBe(114)

    expect(byId(m, 'anc1').status).toBe('past')
    expect(byId(m, 'anc2').status).toBe('past') // 13–20
    expect(byId(m, 'anc3').status).toBe('current') // 21–26
    expect(byId(m, 'gdm-screen').status).toBe('upcoming') // 24–28
    expect(byId(m, 'anc8').status).toBe('upcoming')
  })

  it('ช่วงวันที่นับจาก LMP = กำหนดคลอด − 280 วัน', () => {
    // กำหนดคลอด 1 มี.ค. 2027 → LMP 25 พ.ค. 2026
    const m = getPregnancyMilestones('2027-03-01', '2026-11-07')
    expect(byId(m, 'anc1')).toMatchObject({ startDate: '2026-06-22', endDate: '2026-08-23' }) // สัปดาห์ 4 ถึงสิ้นสัปดาห์ 12
  })

  it('ขอบสัปดาห์: 12 สัปดาห์ 0 วัน ยังอยู่ช่วงฝากครรภ์ครั้งแรก, 13 สัปดาห์ถือว่าผ่านแล้ว', () => {
    // กำหนดคลอด 1 มี.ค. 2027 → ครบ 12 สัปดาห์ = LMP + 84 วัน = 17 ส.ค. 2026
    expect(byId(getPregnancyMilestones('2027-03-01', '2026-08-17'), 'anc1').status).toBe('current')
    expect(byId(getPregnancyMilestones('2027-03-01', '2026-08-24'), 'anc1').status).toBe('past')
  })

  it('ปีอธิกสุรทิน: วันที่ 29 ก.พ. 2028 นับเป็นวันจริง ช่วงวันที่คร่อม ก.พ. ถูกต้อง', () => {
    // กำหนดคลอด 1 พ.ค. 2028 → LMP 26 ก.ค. 2027, วันนี้ 29 ก.พ. 2028 = เหลือ 62 วัน = 31 สัปดาห์ 1 วัน
    const m = getPregnancyMilestones('2028-05-01', '2028-02-29')
    expect(m.daysUntilDue).toBe(62)
    expect(m.pregnancy.weeks).toBe(31)
    expect(m.trimester).toBe(3)
    expect(byId(m, 'lab2')).toMatchObject({ startDate: '2028-02-07', endDate: '2028-03-12', status: 'current' })
    expect(byId(m, 'anc4')).toMatchObject({ endDate: '2028-02-27', status: 'past' })
    expect(byId(m, 'anc5')).toMatchObject({ startDate: '2028-02-28', status: 'current' })
  })

  it('นัดฝากครรภ์ถัดไป = นัดที่อยู่ในช่วงนี้', () => {
    const m = getPregnancyMilestones('2027-03-01', '2026-11-07')
    expect(getNextVisit(m)?.id).toBe('anc3')
  })
})
