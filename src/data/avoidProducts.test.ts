import { describe, expect, it } from 'vitest'
import { AVOID_PRODUCTS, SAFER_CHOICES, productsFor } from './avoidProducts'

describe('เครื่องสำอางและยาที่ควรเลี่ยง', () => {
  it('ทั้งสองช่วงมีทั้งเครื่องสำอางและยา และมีทางเลือกที่ใช้แทนได้', () => {
    for (const phase of ['pregnant', 'postpartum'] as const) {
      expect(productsFor(phase, 'cosmetic').length).toBeGreaterThan(0)
      expect(productsFor(phase, 'medicine').length).toBeGreaterThan(0)
      expect(SAFER_CHOICES[phase].length).toBeGreaterThan(0)
    }
  })

  it('รายการที่แสดงในช่วงไหน ต้องมีเหตุผลของช่วงนั้น', () => {
    for (const p of AVOID_PRODUCTS) {
      for (const phase of ['pregnant', 'postpartum'] as const) {
        if (p.level[phase]) expect(p.why[phase]).toBeTruthy()
      }
    }
  })

  it('เรียง "ควรเลี่ยง" ก่อน "ปรึกษาก่อนใช้"', () => {
    const levels = productsFor('postpartum', 'medicine').map((p) => p.level.postpartum)
    expect(levels.indexOf('caution')).toBeGreaterThan(levels.lastIndexOf('avoid'))
  })

  it('NSAIDs เลี่ยงตอนตั้งครรภ์ แต่ไม่อยู่ในรายการช่วงให้นม (ไอบูโพรเฟนใช้ได้)', () => {
    const nsaid = (phase: 'pregnant' | 'postpartum') => productsFor(phase, 'medicine').some((p) => p.name.includes('NSAIDs'))
    expect(nsaid('pregnant')).toBe(true)
    expect(nsaid('postpartum')).toBe(false)
  })
})
