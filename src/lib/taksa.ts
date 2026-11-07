/**
 * ทักษา — หาอักษรกาลกิณีตามวันเกิด เพื่อช่วยตั้งชื่อ
 *
 * หลักที่ใช้ (ตามตำราทักษาปกรณ์ที่ใช้กันทั่วไป):
 * 1) อักษรไทยแบ่งเป็น 8 วรรค ประจำดาว 8 ดวง
 *      อาทิตย์ = สระทั้งหมด (รวม อ)   จันทร์ = ก ข ค ฆ ง        อังคาร = จ ฉ ช ซ ฌ ญ
 *      พุธ = ฎ ฏ ฐ ฑ ฒ ณ            เสาร์ = ด ต ถ ท ธ น       พฤหัสบดี = บ ป ผ ฝ พ ฟ ภ ม
 *      ราหู = ย ร ล ว                ศุกร์ = ศ ษ ส ห ฬ ฮ
 * 2) เรียงดาวตามวงทักษา (ทวนเข็ม): อาทิตย์ → จันทร์ → อังคาร → พุธ → เสาร์ → พฤหัสบดี → ราหู → ศุกร์
 * 3) เริ่มที่ดาวประจำวันเกิดเป็น "บริวาร" แล้วนับต่อไปตามวง ได้ บริวาร อายุ เดช ศรี มูละ อุตสาหะ มนตรี กาลกิณี
 *    → ดาวลำดับที่ 8 คือ "กาลกิณี" ชื่อที่ดีไม่ควรมีอักษรในวรรคนั้น
 * 4) วันทางโหราศาสตร์เปลี่ยนตอนพระอาทิตย์ขึ้น (ใช้ 06:00) และวันพุธแบ่งเป็น
 *    พุธกลางวัน (06:00–17:59) กับพุธกลางคืน = ราหู (18:00 ถึงก่อน 06:00 ของเช้าวันพฤหัส)
 *
 * แอปนับทุกตัวอักษรที่เขียนในชื่อ รวมตัวการันต์ (์) — ไม่นับวรรณยุกต์ ไม้ไต่คู้นับเป็นสระ
 */
import { getDay, parseISO } from 'date-fns'
import { NAMES, type NameGender, type ThaiName } from '../data/names'

export type TaksaDay = 'sun' | 'mon' | 'tue' | 'wed' | 'wedNight' | 'thu' | 'fri' | 'sat'
export type Planet = 'sun' | 'moon' | 'mars' | 'mercury' | 'saturn' | 'jupiter' | 'rahu' | 'venus'

export const DAY_LABELS: Record<TaksaDay, string> = {
  sun: 'วันอาทิตย์',
  mon: 'วันจันทร์',
  tue: 'วันอังคาร',
  wed: 'วันพุธ (กลางวัน)',
  wedNight: 'วันพุธ (กลางคืน · ราหู)',
  thu: 'วันพฤหัสบดี',
  fri: 'วันศุกร์',
  sat: 'วันเสาร์',
}

export const DAY_ORDER: TaksaDay[] = ['sun', 'mon', 'tue', 'wed', 'wedNight', 'thu', 'fri', 'sat']

/** ดาวประจำวันเกิด */
const DAY_PLANET: Record<TaksaDay, Planet> = {
  sun: 'sun',
  mon: 'moon',
  tue: 'mars',
  wed: 'mercury',
  wedNight: 'rahu',
  thu: 'jupiter',
  fri: 'venus',
  sat: 'saturn',
}

export const PLANET_LABELS: Record<Planet, string> = {
  sun: 'อาทิตย์',
  moon: 'จันทร์',
  mars: 'อังคาร',
  mercury: 'พุธ',
  saturn: 'เสาร์',
  jupiter: 'พฤหัสบดี',
  rahu: 'ราหู',
  venus: 'ศุกร์',
}

const VOWELS = 'อะาิีึืุูเแโใไำั็ๅฤฦ'

/** อักษรประจำดาว (วรรคทักษา) */
export const PLANET_LETTERS: Record<Planet, string> = {
  sun: VOWELS,
  moon: 'กขคฆง',
  mars: 'จฉชซฌญ',
  mercury: 'ฎฏฐฑฒณ',
  saturn: 'ดตถทธน',
  jupiter: 'บปผฝพฟภม',
  rahu: 'ยรลว',
  venus: 'ศษสหฬฮ',
}

/** ลำดับดาวในวงทักษา */
export const TAKSA_CYCLE: Planet[] = ['sun', 'moon', 'mars', 'mercury', 'saturn', 'jupiter', 'rahu', 'venus']

export const ROLES = ['บริวาร', 'อายุ', 'เดช', 'ศรี', 'มูละ', 'อุตสาหะ', 'มนตรี', 'กาลกิณี'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_MEANINGS: Record<Role, string> = {
  บริวาร: 'คนรอบข้าง ครอบครัว',
  อายุ: 'สุขภาพ อายุยืน',
  เดช: 'อำนาจ ความสามารถ',
  ศรี: 'โชคลาภ เสน่ห์ ความเป็นมงคล',
  มูละ: 'ทรัพย์สิน ฐานะ',
  อุตสาหะ: 'ความขยัน การงาน',
  มนตรี: 'ผู้ใหญ่ค้ำชู',
  กาลกิณี: 'อัปมงคล — ไม่ควรมีในชื่อ',
}

/**
 * วันเกิดทางโหราศาสตร์
 * @param date วันเกิด (หรือวันกำหนดคลอด) — "yyyy-MM-dd" หรือ Date
 * @param time เวลาเกิด "HH:mm" (ไม่บังคับ — ถ้าไม่ระบุถือว่าเกิดกลางวัน)
 */
export function getTaksaDay(date: string | Date, time?: string): TaksaDay {
  const d = typeof date === 'string' ? parseISO(date) : date
  let weekday = getDay(d) // 0 = อาทิตย์
  const [h] = time ? time.split(':').map(Number) : [12]
  if (h < 6) weekday = (weekday + 6) % 7 // ก่อนพระอาทิตย์ขึ้นนับเป็นวันก่อนหน้า
  const days: TaksaDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const day = days[weekday]
  if (day === 'wed' && (h >= 18 || h < 6)) return 'wedNight'
  return day
}

/** วันในปฏิทินนี้ต้องรู้เวลาเกิดไหม (พุธ = กลางวัน/กลางคืน, พฤหัสเช้ามืด = พุธกลางคืน, ทุกวันก่อน 06:00 = วันก่อนหน้า) */
export function needsBirthTime(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  const weekday = getDay(d)
  return weekday === 3 || weekday === 4
}

export interface TaksaRow {
  role: Role
  planet: Planet
  letters: string
}

/** ตารางทักษา 8 หมู่ของวันเกิดนี้ */
export function getTaksaTable(day: TaksaDay): TaksaRow[] {
  const start = TAKSA_CYCLE.indexOf(DAY_PLANET[day])
  return ROLES.map((role, i) => {
    const planet = TAKSA_CYCLE[(start + i) % TAKSA_CYCLE.length]
    return { role, planet, letters: PLANET_LETTERS[planet] }
  })
}

export function getKalakiniLetters(day: TaksaDay): string {
  return getTaksaTable(day)[7].letters
}

/** ตัวอักษรนี้อยู่วรรคไหน (null = วรรณยุกต์ ตัวเลข หรือไม่ใช่อักษรไทย) */
export function planetOfChar(ch: string): Planet | null {
  for (const p of TAKSA_CYCLE) if (PLANET_LETTERS[p].includes(ch)) return p
  return null
}

export interface NameAnalysis {
  chars: { char: string; role: Role }[]
  /** อักษรกาลกิณีที่พบในชื่อ (ไม่ซ้ำ) */
  kalakini: string[]
  ok: boolean
  /** ชื่อมีอักษรไทยให้ตรวจไหม */
  hasThai: boolean
  /** มีอักษรเดชหรือศรี (มักถือว่าดี) */
  hasDechOrSri: boolean
}

export function analyzeName(name: string, day: TaksaDay): NameAnalysis {
  const table = getTaksaTable(day)
  const roleOf = new Map(table.map((r) => [r.planet, r.role]))
  const chars = [...name.trim()].flatMap((char) => {
    const planet = planetOfChar(char)
    return planet ? [{ char, role: roleOf.get(planet)! }] : []
  })
  const kalakini = [...new Set(chars.filter((c) => c.role === 'กาลกิณี').map((c) => c.char))]
  return {
    chars,
    kalakini,
    ok: chars.length > 0 && kalakini.length === 0,
    hasThai: chars.length > 0,
    hasDechOrSri: chars.some((c) => c.role === 'เดช' || c.role === 'ศรี'),
  }
}

/** ชื่อในฐานข้อมูลที่ไม่มีอักษรกาลกิณี (ชื่อที่มีอักษรเดช/ศรีขึ้นก่อน) */
export function filterNames(day: TaksaDay, gender?: NameGender, names: ThaiName[] = NAMES): ThaiName[] {
  return names
    .filter((n) => !gender || n.gender === gender)
    .map((n) => ({ n, a: analyzeName(n.name, day) }))
    .filter(({ a }) => a.ok)
    .sort((x, y) => Number(y.a.hasDechOrSri) - Number(x.a.hasDechOrSri) || x.n.name.localeCompare(y.n.name, 'th'))
    .map(({ n }) => n)
}
