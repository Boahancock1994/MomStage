import { describe, expect, it } from 'vitest'
import { getBabyAge, getPregnancyWeek } from '../lib/age'
import { createDemoChildren } from './demo'

describe('createDemoChildren', () => {
  it('ทุกวันของปี ลูกตัวอย่างอายุ 4 เดือนเต็ม (12 ± 1 วัน) และครรภ์ 26 สัปดาห์ เหลือ 98 วัน', () => {
    for (let i = 0; i < 366; i++) {
      const today = new Date(2026, 0, 1 + i)
      const [born, pregnant] = createDemoChildren(today)
      const age = getBabyAge(born.birthDate!, today)
      expect(age.months, today.toDateString()).toBe(4)
      expect(Math.abs(age.days - 12), today.toDateString()).toBeLessThanOrEqual(1)
      expect(getPregnancyWeek(pregnant.dueDate!, today)).toMatchObject({ weeks: 26, days: 0, daysUntilDue: 98 })
    }
  })
})
