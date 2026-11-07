import { describe, expect, it } from 'vitest'
import {
  assessGrowth,
  countMajorLinesCrossedDown,
  getLms,
  interpretGrowth,
  valueAtZ,
  whoZScore,
  zScore,
  zToPercentile,
} from './growth'

describe('zScore (สูตร LMS ของ WHO)', () => {
  it('เด็กชาย 6 เดือน หนัก 7.9 กก. อยู่ใกล้ P50', () => {
    // WHO weight-for-age boys 6 mo: L=0.1257, M=7.934, S=0.10958
    const lms = getLms('weight', 'boy', 6)!
    expect(lms.M).toBeCloseTo(7.934, 3)
    const z = zScore(7.9, lms.L, lms.M, lms.S)
    expect(Math.abs(z)).toBeLessThan(0.1)
    const p = zToPercentile(z)
    expect(p).toBeGreaterThan(45)
    expect(p).toBeLessThan(55)
  })

  it('ค่าเท่ากับ M ได้ z = 0 และใช้สูตร ln เมื่อ L = 0', () => {
    expect(zScore(7.934, 0.1257, 7.934, 0.10958)).toBeCloseTo(0, 10)
    expect(zScore(Math.E * 10, 0, 10, 0.5)).toBeCloseTo(2, 10)
  })

  it('ย้อนกลับได้ตรงกับเส้น z = ±2 ในตารางเปอร์เซ็นไทล์ WHO (ไฟล์ CDC)', () => {
    // CDC WHO-Boys-Weight-for-age: 6 เดือน 2.3rd = 6.352967, 97.7th = 9.848832
    const w = getLms('weight', 'boy', 6)!
    expect(valueAtZ(-2, w.L, w.M, w.S)).toBeCloseTo(6.353, 2)
    expect(valueAtZ(2, w.L, w.M, w.S)).toBeCloseTo(9.849, 2)
    // CDC WHO-Girls-Length-for-age: 12 เดือน 2.3rd = 68.865
    const h = getLms('height', 'girl', 12)!
    expect(valueAtZ(-2, h.L, h.M, h.S)).toBeCloseTo(68.865, 1)
  })

  it('zToPercentile ตรงกับตารางการแจกแจงปกติ', () => {
    expect(zToPercentile(0)).toBeCloseTo(50, 5)
    expect(zToPercentile(1.96)).toBeCloseTo(97.5, 1)
    expect(zToPercentile(-1.8808)).toBeCloseTo(3, 1)
  })

  it('น้ำหนักสุดขั้ว (|z| > 3) ใช้วิธีปรับของ WHO ได้ค่าต่อเนื่อง', () => {
    const w = getLms('weight', 'boy', 6)!
    const sd3 = valueAtZ(3, w.L, w.M, w.S)
    expect(whoZScore('weight', 'boy', 6, sd3)).toBeCloseTo(3, 6)
    expect(whoZScore('weight', 'boy', 6, sd3 + 0.5)!).toBeGreaterThan(3)
    expect(whoZScore('weight', 'boy', 40, 15)).toBeNull() // เกิน 36 เดือน
  })
})

describe('interpretGrowth', () => {
  it('ต่ำกว่า P3 / P3–P97 / สูงกว่า P97', () => {
    expect(interpretGrowth(2, 'weight')).toEqual({ level: 'low', text: 'น้ำหนักน้อยกว่าเกณฑ์ ควรปรึกษาแพทย์' })
    expect(interpretGrowth(3).level).toBe('normal')
    expect(interpretGrowth(50).text).toBe('อยู่ในเกณฑ์')
    expect(interpretGrowth(97).level).toBe('normal')
    expect(interpretGrowth(98, 'weight').text).toBe('น้ำหนักมากกว่าเกณฑ์')
    expect(interpretGrowth(1, 'height').text).toBe('ส่วนสูงน้อยกว่าเกณฑ์ ควรปรึกษาแพทย์')
  })
})

describe('การเตือนตกข้ามเส้นหลัก', () => {
  it('นับเส้นที่ตกข้ามเฉพาะขาลง', () => {
    expect(countMajorLinesCrossedDown(60, 40)).toBe(1) // ข้าม P50
    expect(countMajorLinesCrossedDown(60, 10)).toBe(2) // ข้าม P50, P15
    expect(countMajorLinesCrossedDown(90, 2)).toBe(4)
    expect(countMajorLinesCrossedDown(10, 60)).toBe(0) // ขาขึ้นไม่นับ
  })

  it('assessGrowth เตือนเมื่อน้ำหนักตกจากราว P50 ลงต่ำกว่า P15', () => {
    const result = assessGrowth(
      [
        { id: 'b', date: '2026-07-01', weightKg: 6.0 }, // 4 เดือน — ต่ำกว่า P15
        { id: 'a', date: '2026-03-01', weightKg: 3.35, heightCm: 50 }, // แรกเกิด ~P50
      ],
      '2026-03-01',
      'boy',
    )
    expect(result[0].entry.id).toBe('a') // เรียงตามวันที่
    expect(result[0].height?.percentile).toBeGreaterThan(40)
    expect(result[1].ageMonths).toBeCloseTo(122 / 30.4375, 6)
    expect(result[1].weight?.linesCrossedDown).toBeGreaterThanOrEqual(2)
    expect(result[1].weight?.crossingAlert).toBe(true)
  })
})
