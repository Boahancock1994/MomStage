/**
 * ตรรกะนัดฝากครรภ์: บอกว่ารายการไหน "ผ่านแล้ว / ช่วงนี้ / กำลังจะถึง" จากอายุครรภ์ปัจจุบัน
 * และคำนวณช่วงวันที่จริงของแต่ละรายการ
 *
 * อายุครรภ์มาจาก getPregnancyWeek() ใน age.ts เท่านั้น
 * ช่วงวันที่ของสัปดาห์ที่ N: วันแรก = LMP + N สัปดาห์, วันสุดท้ายของสัปดาห์ที่ M = LMP + (M+1) สัปดาห์ − 1 วัน
 * โดย LMP (วันแรกของประจำเดือนครั้งสุดท้าย) = วันกำหนดคลอด − 280 วัน
 */
import { addDays, addWeeks, subDays } from 'date-fns'
import { ANTENATAL_ITEMS, type AntenatalItem } from '../data/antenatal'
import { FULL_TERM_DAYS } from '../data/constants'
import { getPregnancyWeek, toDay, toISODate, type DateInput, type PregnancyWeek } from './age'

export type MilestoneStatus = 'past' | 'current' | 'upcoming'

export interface PregnancyMilestone extends AntenatalItem {
  status: MilestoneStatus
  /** วันแรกของช่วง "yyyy-MM-dd" */
  startDate: string
  /** วันสุดท้ายของช่วง "yyyy-MM-dd" */
  endDate: string
}

export interface PregnancyMilestones {
  pregnancy: PregnancyWeek
  trimester: 1 | 2 | 3
  daysUntilDue: number
  items: PregnancyMilestone[]
}

export function getMilestoneStatus(item: Pick<AntenatalItem, 'weekFrom' | 'weekTo'>, week: number): MilestoneStatus {
  if (week > item.weekTo) return 'past'
  if (week >= item.weekFrom) return 'current'
  return 'upcoming'
}

export function getPregnancyMilestones(dueDate: DateInput, today: DateInput = new Date()): PregnancyMilestones {
  const pregnancy = getPregnancyWeek(dueDate, today)
  const lmp = subDays(toDay(dueDate), FULL_TERM_DAYS)

  const items = ANTENATAL_ITEMS.map(
    (item): PregnancyMilestone => ({
      ...item,
      status: getMilestoneStatus(item, pregnancy.weeks),
      startDate: toISODate(addWeeks(lmp, item.weekFrom)),
      endDate: toISODate(addDays(addWeeks(lmp, item.weekTo + 1), -1)),
    }),
  ).sort((a, b) => a.weekTo - b.weekTo || a.weekFrom - b.weekFrom)

  return {
    pregnancy,
    trimester: pregnancy.trimester,
    daysUntilDue: pregnancy.daysUntilDue,
    items,
  }
}

/** นัดฝากครรภ์ครั้งถัดไป (ช่วงนี้ หรือที่ใกล้ที่สุดที่ยังไม่ถึง) */
export function getNextVisit(m: PregnancyMilestones): PregnancyMilestone | undefined {
  return (
    m.items.find((i) => i.kind === 'visit' && i.status === 'current') ??
    m.items.find((i) => i.kind === 'visit' && i.status === 'upcoming')
  )
}
