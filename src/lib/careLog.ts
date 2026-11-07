/**
 * สรุปบันทึกการให้นมและการนอนของ "วันนี้"
 * ใช้ date-fns ทั้งหมดในการคำนวณช่วงเวลา (ข้ามเที่ยงคืนตัดเฉพาะส่วนที่อยู่ในวันนี้)
 */
import { differenceInMinutes, isAfter, isBefore, isSameDay, max, min, parseISO, startOfDay } from 'date-fns'
import type { CareEvent, CareType } from '../types'

/** ทารกอายุต่ำกว่า 1 เดือน ไม่ควรห่างจากมื้อล่าสุดเกินกี่นาที */
export const NEWBORN_MAX_FEED_GAP_MINUTES = 180

export interface CareSummary {
  feedsToday: number
  sleepMinutesToday: number
  /** นาทีนับจากเริ่มมื้อล่าสุด (null = ยังไม่มีบันทึก) */
  minutesSinceLastFeed: number | null
  activeFeed?: CareEvent
  activeSleep?: CareEvent
  /** อายุ < 1 เดือน และห่างจากมื้อล่าสุดเกิน 3 ชม. */
  feedGapWarning: boolean
}

export function getActive(log: CareEvent[], type: CareType): CareEvent | undefined {
  return log.find((e) => e.type === type && !e.end)
}

/** จำนวนนาทีของรายการที่ซ้อนทับกับช่วง [from, to] */
function overlapMinutes(e: CareEvent, from: Date, to: Date): number {
  const start = max([parseISO(e.start), from])
  const end = min([e.end ? parseISO(e.end) : to, to])
  return isAfter(end, start) ? differenceInMinutes(end, start) : 0
}

export function summarizeCare(log: CareEvent[], now: Date, ageMonths: number | null): CareSummary {
  const dayStart = startOfDay(now)
  const feeds = log.filter((e) => e.type === 'feed')

  const feedsToday = feeds.filter((e) => isSameDay(parseISO(e.start), now)).length
  const sleepMinutesToday = log
    .filter((e) => e.type === 'sleep' && !isBefore(e.end ? parseISO(e.end) : now, dayStart))
    .reduce((sum, e) => sum + overlapMinutes(e, dayStart, now), 0)

  const activeFeed = getActive(log, 'feed')
  const lastFeed = [...feeds].sort((a, b) => b.start.localeCompare(a.start))[0]
  const minutesSinceLastFeed = activeFeed ? 0 : lastFeed ? differenceInMinutes(now, parseISO(lastFeed.start)) : null

  return {
    feedsToday,
    sleepMinutesToday,
    minutesSinceLastFeed,
    activeFeed,
    activeSleep: getActive(log, 'sleep'),
    feedGapWarning:
      ageMonths !== null && ageMonths < 1 && minutesSinceLastFeed !== null && minutesSinceLastFeed > NEWBORN_MAX_FEED_GAP_MINUTES,
  }
}

/** แปลงนาทีเป็นข้อความ เช่น 135 → "2 ชม. 15 นาที" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} นาที`
  return m === 0 ? `${h} ชม.` : `${h} ชม. ${m} นาที`
}
