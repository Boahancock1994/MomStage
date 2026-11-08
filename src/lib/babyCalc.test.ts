import { describe, expect, it } from 'vitest'
import type { CareEvent } from '../types'
import {
  DEFAULT_CALC_SETTINGS,
  buildMonthlyExpenses,
  calcDiaperCost,
  calcFormulaUsage,
  calcMilkPlan,
  compareScenarios,
  entryAmount,
  extraAmount,
  getDiapersPerDay,
} from './babyCalc'
import { formatDuration, summarizeCare } from './careLog'

describe('ปริมาณนม', () => {
  it('น้ำหนัก 5 กก. 8 มื้อ → 750 มล./วัน ≈ 94 มล./มื้อ', () => {
    expect(calcMilkPlan(5, 8)).toEqual({ dailyMl: 750, perFeedMl: 94, capped: false })
  })
  it('จำกัดไม่เกิน 1,000 มล./วัน', () => {
    expect(calcMilkPlan(8, 6)).toMatchObject({ dailyMl: 1000, capped: true })
  })
})

describe('ค่าใช้จ่าย', () => {
  it('นมผง 750 มล./วัน = 25 ช้อน = 107.5 ก./วัน · กระป๋อง 600 ก. ราคา 600 บาท', () => {
    const f = calcFormulaUsage(750, 600, 600)
    expect(f.scoopsPerDay).toBe(25)
    expect(f.gramsPerDay).toBeCloseTo(107.5, 6)
    expect(f.cansPerMonth).toBeCloseTo(5.375, 6) // 3,225 ก. ÷ 600
    expect(f.costPerMonth).toBeCloseTo(3225, 6)
  })

  it('ผ้าอ้อมตามช่วงอายุ', () => {
    expect(getDiapersPerDay(0)).toMatchObject({ min: 10, max: 12 })
    expect(getDiapersPerDay(5)).toMatchObject({ min: 8, max: 10 })
    expect(getDiapersPerDay(6)).toMatchObject({ min: 6, max: 8 })
    expect(getDiapersPerDay(12)).toMatchObject({ min: 4, max: 6 })
    expect(calcDiaperCost(3, 5)).toEqual({ min: 1200, max: 1500, avg: 1350 })
  })

  it('เปรียบเทียบ 3 แบบ: นมแม่ล้วนไม่มีค่านมผง นมผสมครึ่งหนึ่ง', () => {
    const [breast, mixed, formula] = compareScenarios({ dailyMl: 750, ageMonths: 3, pricePerCan: 600, gramsPerCan: 600, diaperPrice: 5 })
    expect(breast).toMatchObject({ formula: 0, total: 1350 })
    expect(mixed.formula).toBeCloseTo(1612.5, 6)
    expect(formula.total).toBeCloseTo(3225 + 1350, 6)
  })

  it('ค่าใช้จ่ายอื่นรวมเข้าทุกแบบ', () => {
    const [breast] = compareScenarios({ dailyMl: 750, ageMonths: 3, pricePerCan: 600, gramsPerCan: 600, diaperPrice: 5, otherMonthly: 500 })
    expect(breast).toMatchObject({ other: 500, total: 1850 })
  })
})

describe('buildMonthlyExpenses', () => {
  const entry = (id: string, price: string, quantity = '1', unit = 'ชิ้น') => ({ id, price, quantity, unit })
  const extras = [
    { id: 'v', name: 'วัคซีนเสริม', entries: [entry('v1', '1200', '1', 'เข็ม')] },
    { id: 'c', name: 'เสื้อผ้า', entries: [entry('c1', '150', '3', 'ชุด'), entry('c2', '299', '1', 'ชุด')] },
    { id: 'x', name: 'ยังไม่กรอกราคา', entries: [entry('x1', '', '2')] },
  ]

  it('นมแม่ล้วน ไม่ต้องกรอกราคานมผงหรือน้ำหนัก ก็ได้รายการผ้าอ้อม + ค่าใช้จ่ายอื่น', () => {
    const r = buildMonthlyExpenses({ settings: { ...DEFAULT_CALC_SETTINGS, diaperPrice: '5', extras }, dailyMl: null, ageMonths: 3 })
    expect(r.missing).toEqual([])
    expect(r.lines.map((l) => l.id)).toEqual(['diapers', 'v', 'c']) // ข้ามรายการที่กรอกไม่ครบ
    expect(r.total).toBe(1350 + 1200 + 450 + 299)
  })

  it('กรอกจำนวนผ้าอ้อมต่อวันเอง ใช้แทนค่ากลางตามอายุ', () => {
    const base = { ...DEFAULT_CALC_SETTINGS, diaperPrice: '5' }
    const auto = buildMonthlyExpenses({ settings: base, dailyMl: null, ageMonths: 3 })
    expect(auto.lines[0]).toMatchObject({ id: 'diapers', amount: 9 * 5 * 30 })
    const custom = buildMonthlyExpenses({ settings: { ...base, diapersPerDay: '6' }, dailyMl: null, ageMonths: 3 })
    expect(custom.lines[0]).toMatchObject({ id: 'diapers', amount: 6 * 5 * 30, detail: '6 ชิ้น/วัน × 5 บาท' })
  })

  it('หลายยอดในรายการเดียว และรายการชื่อซ้ำ (ต่างช่องว่าง/ตัวพิมพ์) รวมเป็นบรรทัดเดียว', () => {
    const dup = [
      ...extras,
      { id: 'c-again', name: '  เสื้อผ้า ', entries: [entry('c3', '100', '2')] },
      { id: 'w', name: 'Wipes', entries: [entry('w1', '45', '2')] },
      { id: 'w2', name: 'wipes', entries: [entry('w3', '45', '1')] },
    ]
    const r = buildMonthlyExpenses({ settings: { ...DEFAULT_CALC_SETTINGS, extras: dup }, dailyMl: null, ageMonths: 3 })
    const clothes = r.lines.find((l) => l.label === 'เสื้อผ้า')!
    expect(clothes.amount).toBe(450 + 299 + 200)
    expect(clothes.detail).toBe('รวม 3 ยอด')
    expect(r.lines.filter((l) => l.label === 'เสื้อผ้า')).toHaveLength(1)
    expect(r.lines.find((l) => l.label === 'Wipes')!.amount).toBe(135)
    expect(r.lines).toHaveLength(3)
  })

  it('นมผงล้วนแต่ยังไม่กรอกข้อมูลนมผง → บอกสิ่งที่ขาด และไม่มีรายการนมผง', () => {
    const r = buildMonthlyExpenses({ settings: { ...DEFAULT_CALC_SETTINGS, feedingType: 'formula' }, dailyMl: null, ageMonths: 3 })
    expect(r.missing).toHaveLength(2)
    expect(r.lines).toEqual([])
  })

  it('นมผสมคิดนมผงครึ่งหนึ่ง', () => {
    const r = buildMonthlyExpenses({
      settings: { ...DEFAULT_CALC_SETTINGS, feedingType: 'mixed', pricePerCan: '600', gramsPerCan: '600' },
      dailyMl: 750,
      ageMonths: 3,
    })
    expect(r.lines[0]).toMatchObject({ id: 'formula' })
    expect(r.lines[0].amount).toBeCloseTo(1612.5, 6)
  })

  it('entryAmount = ราคา × จำนวน, กรอกไม่ครบหรือติดลบ = null · extraAmount รวมเฉพาะยอดที่ครบ', () => {
    expect(entryAmount(entry('a', '150', '3'))).toBe(450)
    expect(entryAmount(entry('b', '', '2'))).toBeNull()
    expect(entryAmount(entry('c', '-5'))).toBeNull()
    expect(extraAmount({ id: 'e', name: 'x', entries: [entry('a', '150', '3'), entry('b', '')] })).toBe(450)
    expect(extraAmount({ id: 'e', name: 'x', entries: [entry('b', '')] })).toBeNull()
  })
})

describe('summarizeCare', () => {
  const now = new Date(2026, 10, 7, 14, 0)
  const at = (h: number, m = 0, day = 7) => new Date(2026, 10, day, h, m).toISOString()

  const log: CareEvent[] = [
    { id: '1', type: 'feed', start: at(6), end: at(6, 20) },
    { id: '2', type: 'feed', start: at(9), end: at(9, 15) },
    { id: '3', type: 'feed', start: at(10, 30), end: at(10, 45) },
    { id: 'y', type: 'feed', start: at(22, 0, 6), end: at(22, 20, 6) }, // เมื่อวาน ไม่นับ
    { id: 's1', type: 'sleep', start: at(23, 0, 6), end: at(5) }, // ข้ามคืน: นับเฉพาะ 00:00–05:00 = 5 ชม.
    { id: 's2', type: 'sleep', start: at(12), end: at(13, 30) }, // 1.5 ชม.
  ]

  it('นับมื้อวันนี้ ชั่วโมงนอนรวม (ตัดส่วนข้ามคืน) และเวลาห่างจากมื้อล่าสุด', () => {
    const s = summarizeCare(log, now, 3)
    expect(s.feedsToday).toBe(3)
    expect(s.sleepMinutesToday).toBe(390)
    expect(s.minutesSinceLastFeed).toBe(210) // 10:30 → 14:00
    expect(s.feedGapWarning).toBe(false) // อายุ 3 เดือน ไม่เตือน
  })

  it('อายุ < 1 เดือน และห่างเกิน 3 ชม. → เตือน / กำลังให้นมอยู่ → ไม่เตือน', () => {
    expect(summarizeCare(log, now, 0).feedGapWarning).toBe(true)
    const feeding = [...log, { id: 'a', type: 'feed' as const, start: at(13, 50) }]
    const s = summarizeCare(feeding, now, 0)
    expect(s.minutesSinceLastFeed).toBe(0)
    expect(s.activeFeed?.id).toBe('a')
    expect(s.feedGapWarning).toBe(false)
  })

  it('การนอนที่ยังไม่จบนับถึงตอนนี้', () => {
    const s = summarizeCare([{ id: 'n', type: 'sleep', start: at(13) }], now, 3)
    expect(s.sleepMinutesToday).toBe(60)
    expect(s.activeSleep?.id).toBe('n')
    expect(s.minutesSinceLastFeed).toBeNull()
  })

  it('formatDuration', () => {
    expect(formatDuration(45)).toBe('45 นาที')
    expect(formatDuration(120)).toBe('2 ชม.')
    expect(formatDuration(135)).toBe('2 ชม. 15 นาที')
  })
})
