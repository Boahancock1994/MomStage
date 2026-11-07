/**
 * ข้อมูลตัวอย่างสำหรับปุ่ม "ลองดูตัวอย่าง" ในหน้า onboarding
 * คำนวณวันที่จาก "วันนี้" ทุกครั้ง เพื่อให้อายุตรงตามที่ตั้งใจไม่ว่าจะเปิดแอปวันไหน
 *
 *  1. น้องมะลิ — คลอดแล้ว อายุ 4 เดือน 12 วัน (บางวันไม่มีวันเกิดที่ให้ 12 วันพอดี จะได้ค่าที่ใกล้ที่สุด) (วัคซีน 4 เดือนกำลังถึงกำหนด, โรต้าเข็มแรกยังไม่ได้หยอด = เลยกำหนด)
 *  2. เบบี๋ข้าวหอม — ตั้งครรภ์ 26 สัปดาห์พอดี (อีก 98 วันคลอด)
 */
import { addDays, addMonths, subDays, subMonths } from 'date-fns'
import { FULL_TERM_DAYS } from './constants'
import { getBabyAge, toISODate } from '../lib/age'
import { DEFAULT_CALC_SETTINGS } from '../lib/babyCalc'
import type { Child } from '../types'

export function createDemoChildren(today: Date): Omit<Child, 'id'>[] {
  const birth = findBirthDateForAge(today, 4, 12)
  const at = (months: number, extraDays = 0) => toISODate(addDays(addMonths(birth, months), extraDays))

  return [
    {
      name: 'น้องมะลิ',
      mode: 'born',
      birthDate: toISODate(birth),
      sex: 'girl',
      vaccineLog: {
        bcg: at(0, 1),
        hb1: at(0),
        dtphbhib1: at(2, 3),
        ipv1: at(2, 3),
      },
      growthLog: [
        { id: 'g1', date: at(0), weightKg: 3.1, heightCm: 50 },
        { id: 'g2', date: at(1, 2), weightKg: 4.3, heightCm: 54 },
        { id: 'g3', date: at(2, 3), weightKg: 5.4, heightCm: 57.5 },
        { id: 'g4', date: at(4, 5), weightKg: 6.2, heightCm: 62 },
      ],
      quizResults: [],
      checklist: { 'm4-highchair': true, 'm4-spoon': true },
      careLog: [],
      calcSettings: DEFAULT_CALC_SETTINGS,
      favoriteNames: [],
    },
    {
      name: 'เบบี๋ข้าวหอม',
      mode: 'pregnant',
      // อายุครรภ์ 26 สัปดาห์ = 182 วัน → เหลือ 280 − 182 = 98 วันถึงกำหนดคลอด
      dueDate: toISODate(addDays(today, FULL_TERM_DAYS - 26 * 7)),
      vaccineLog: {},
      growthLog: [],
      quizResults: [],
      checklist: { 't2-clothes': true, 't2-diaper': true, 't2-bed': true },
      careLog: [],
      calcSettings: DEFAULT_CALC_SETTINGS,
      favoriteNames: [],
    },
  ]
}

/**
 * หาวันเกิดที่ทำให้อายุ = months เดือน days วัน ตามสูตรของ getBabyAge
 * ไล่หาจากวันเกิดใกล้เคียง เลือกอันที่ได้เดือนตรงและจำนวนวันใกล้ที่สุด
 * (เช่น วันที่ 12 ก.ค. ไม่มีวันเกิดที่ให้ "4 เดือน 12 วัน" พอดี เพราะ ก.พ. สั้น)
 */
function findBirthDateForAge(today: Date, months: number, days: number): Date {
  const start = subMonths(subDays(today, days), months)
  let best = start
  let bestDiff = Infinity
  for (let shift = -5; shift <= 5; shift++) {
    const candidate = addDays(start, shift)
    const age = getBabyAge(candidate, today)
    const diff = age.months === months ? Math.abs(age.days - days) : Infinity
    if (diff < bestDiff) {
      best = candidate
      bestDiff = diff
    }
  }
  return best
}
