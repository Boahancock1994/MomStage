import { describe, expect, it } from 'vitest'
import { NAMES } from '../data/names'
import { DAY_ORDER, analyzeName, filterNames, getKalakiniLetters, getTaksaDay, getTaksaTable, planetOfChar } from './taksa'

describe('อักษรกาลกิณีประจำวัน (ตรงกับตารางทักษาที่ใช้ทั่วไป)', () => {
  it.each([
    ['sun', 'ศษสหฬฮ'],
    ['mon', 'อะาิีึืุูเแโใไำั็ๅฤฦ'],
    ['tue', 'กขคฆง'],
    ['wed', 'จฉชซฌญ'],
    ['wedNight', 'บปผฝพฟภม'],
    ['thu', 'ดตถทธน'],
    ['fri', 'ยรลว'],
    ['sat', 'ฎฏฐฑฒณ'],
  ] as const)('%s → %s', (day, letters) => {
    expect(getKalakiniLetters(day)).toBe(letters)
  })

  it('ตารางเกิดวันอาทิตย์เริ่มที่บริวาร = สระ และเรียงตามวงทักษา', () => {
    expect(getTaksaTable('sun').map((r) => `${r.role}:${r.planet}`)).toEqual([
      'บริวาร:sun',
      'อายุ:moon',
      'เดช:mars',
      'ศรี:mercury',
      'มูละ:saturn',
      'อุตสาหะ:jupiter',
      'มนตรี:rahu',
      'กาลกิณี:venus',
    ])
  })
})

describe('getTaksaDay', () => {
  it('วันในสัปดาห์จากวันที่ (7 พ.ย. 2026 = วันเสาร์)', () => {
    expect(getTaksaDay('2026-11-07')).toBe('sat')
    expect(getTaksaDay('2026-11-04')).toBe('wed') // พุธ ไม่ระบุเวลา = กลางวัน
  })

  it('พุธ 18:00 ขึ้นไป = ราหู · พฤหัสก่อน 06:00 = ยังเป็นพุธกลางคืน · พุธ 17:59 = พุธกลางวัน', () => {
    expect(getTaksaDay('2026-11-04', '18:00')).toBe('wedNight')
    expect(getTaksaDay('2026-11-05', '03:30')).toBe('wedNight')
    expect(getTaksaDay('2026-11-04', '17:59')).toBe('wed')
    expect(getTaksaDay('2026-11-05', '06:00')).toBe('thu')
  })

  it('ก่อนพระอาทิตย์ขึ้นนับเป็นวันก่อนหน้า (จันทร์ 05:00 = อาทิตย์)', () => {
    expect(getTaksaDay('2026-11-09', '05:00')).toBe('sun')
    expect(getTaksaDay('2026-11-09', '07:00')).toBe('mon')
  })
})

describe('analyzeName', () => {
  it('จับอักษรกาลกิณีในชื่อ และไม่นับวรรณยุกต์', () => {
    expect(analyzeName('ศศิธร', 'sun')).toMatchObject({ ok: false, kalakini: ['ศ'] })
    expect(analyzeName('ธนพร', 'mon').ok).toBe(true) // ไม่มีสระ — เกิดวันจันทร์ใช้ได้
    expect(analyzeName('ธนากร', 'mon')).toMatchObject({ ok: false, kalakini: ['า'] })
    expect(planetOfChar('่')).toBeNull()
    expect(analyzeName('น้ำทิพย์', 'tue').chars.some((c) => c.char === '้')).toBe(false)
  })

  it('นับตัวการันต์ด้วย และชื่อภาษาอังกฤษตรวจไม่ได้', () => {
    expect(analyzeName('กันต์', 'thu').kalakini).toEqual(['น', 'ต']) // วันพฤหัส กาลกิณี = ด ต ถ ท ธ น
    expect(analyzeName('Anna', 'sun')).toMatchObject({ hasThai: false, ok: false })
  })

  it('บอกบทบาทของแต่ละตัวอักษร (เกิดวันอาทิตย์: ก = อายุ, จ = เดช)', () => {
    expect(analyzeName('กจ', 'sun').chars.map((c) => c.role)).toEqual(['อายุ', 'เดช'])
  })
})

describe('ฐานข้อมูลชื่อและการกรอง', () => {
  it('มีอย่างน้อย 150 ชื่อ ไม่ซ้ำ แยกชาย/หญิง พร้อมความหมาย', () => {
    expect(NAMES.length).toBeGreaterThanOrEqual(150)
    expect(new Set(NAMES.map((n) => n.name)).size).toBe(NAMES.length)
    expect(NAMES.filter((n) => n.gender === 'boy').length).toBeGreaterThanOrEqual(70)
    expect(NAMES.filter((n) => n.gender === 'girl').length).toBeGreaterThanOrEqual(70)
    expect(NAMES.every((n) => n.meaning.length > 0)).toBe(true)
  })

  it('ทุกวันมีชื่อที่ผ่านทั้งชายและหญิง และไม่มีชื่อที่ติดกาลกิณีหลุดมา', () => {
    for (const day of DAY_ORDER) {
      for (const g of ['boy', 'girl'] as const) {
        const list = filterNames(day, g)
        expect(list.length, `${day} ${g}`).toBeGreaterThan(0)
        expect(list.every((n) => analyzeName(n.name, day).kalakini.length === 0)).toBe(true)
      }
    }
  })
})
