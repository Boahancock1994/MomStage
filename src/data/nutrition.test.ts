import { describe, expect, it } from 'vitest'
import { AVOID, DAILY_SERVINGS, FOOD_GROUP_ORDER, FOODS, SUPPLEMENTS, avoidFor, foodsFor, supplementsFor } from './nutrition'

describe('ข้อมูลอาหารแม่', () => {
  it('ทั้งสองช่วงมีอาหารครบทุกหมู่ มีอาหารเสริมและสิ่งที่ควรเลี่ยง', () => {
    for (const phase of ['pregnant', 'postpartum'] as const) {
      const foods = foodsFor(phase)
      for (const g of FOOD_GROUP_ORDER) expect(foods.some((f) => f.group === g)).toBe(true)
      expect(supplementsFor(phase).length).toBeGreaterThan(0)
      expect(avoidFor(phase).length).toBeGreaterThan(0)
      expect(DAILY_SERVINGS.every((s) => s.amount[phase])).toBe(true)
    }
  })

  it('ทุกรายการมีประโยชน์และปริมาณ ไม่มีชื่อซ้ำ', () => {
    expect(FOODS.every((f) => f.benefit && f.amount)).toBe(true)
    expect(SUPPLEMENTS.every((s) => s.benefit && s.dose)).toBe(true)
    expect(AVOID.every((a) => a.why)).toBe(true)
    expect(new Set(FOODS.map((f) => f.name)).size).toBe(FOODS.length)
  })

  it('อาหารเฉพาะหลังคลอดไม่โผล่ในช่วงตั้งครรภ์ และของดิบเลี่ยงเฉพาะช่วงตั้งครรภ์', () => {
    expect(foodsFor('pregnant').some((f) => f.name.includes('หัวปลี'))).toBe(false)
    expect(foodsFor('postpartum').some((f) => f.name.includes('หัวปลี'))).toBe(true)
    expect(avoidFor('pregnant').some((a) => a.name.includes('ดิบ/ไม่สุก'))).toBe(true)
  })
})
