import { describe, expect, it } from 'vitest'
import { DSPM_AGE_GROUPS, DSPM_ITEMS } from '../data/dspm'
import { DEFAULT_CALC_SETTINGS } from './babyCalc'
import type { Child, QuizAnswer, QuizResult } from '../types'
import { findPreviousForRetest, getQuizForAge, getQuizStatus, scoreQuiz } from './quiz'

const answerAll = (ids: string[], value: QuizAnswer) => Object.fromEntries(ids.map((id) => [id, value]))

describe('getQuizForAge', () => {
  it('เลือกช่วงอายุตามอายุเต็มเดือน', () => {
    expect(getQuizForAge(0).group.id).toBe('m0-1')
    expect(getQuizForAge(2).group.id).toBe('m1-2')
    expect(getQuizForAge(4).group.id).toBe('m3-4')
    expect(getQuizForAge(9).group.id).toBe('m9')
    expect(getQuizForAge(36).group.id).toBe('m31-36')
    expect(getQuizForAge(40).group.id).toBe('m31-36') // เกินขอบเขต ใช้ช่วงสุดท้าย
  })

  it('ช่วง 3–4 เดือนมี 5 ข้อ ครบ 5 ด้าน', () => {
    const { items } = getQuizForAge(4)
    expect(items.map((i) => i.no)).toEqual([11, 12, 13, 14, 15])
    expect(new Set(items.map((i) => i.domain)).size).toBe(5)
  })

  it('ข้อมูล DSPM ครบทุกช่วง ทุกช่วงมีครบ 5 ด้าน และเลขข้อเรียงต่อกัน 1–83', () => {
    for (const g of DSPM_AGE_GROUPS) {
      const { items } = getQuizForAge(g.ageFrom)
      expect(new Set(items.map((i) => i.domain)).size, g.id).toBe(5)
    }
    expect(DSPM_ITEMS.map((i) => i.no)).toEqual(Array.from({ length: 83 }, (_, i) => i + 1))
  })
})

describe('scoreQuiz', () => {
  const { items } = getQuizForAge(4) // ข้อ 11–15
  const ids = items.map((i) => i.id)
  const date = new Date(2026, 10, 7)

  it('ทำได้ทุกข้อ → สมวัยทุกด้าน ไม่ต้องนัดทำซ้ำ', () => {
    const s = scoreQuiz(answerAll(ids, 'yes'), { items, date })
    expect(s.allOnTrack).toBe(true)
    expect(s.score).toBe(5)
    expect(s.domains.every((d) => d.status === 'onTrack')).toBe(true)
    expect(s.retestDate).toBeUndefined()
    expect(s.referral).toBe(false)
  })

  it('มีข้อที่ยังทำไม่ได้ → ด้านนั้น "ควรส่งเสริม" พร้อมกิจกรรม และนัดทำซ้ำใน 30 วัน', () => {
    const answers = { ...answerAll(ids, 'yes'), 'dspm-13': 'no' as const }
    const s = scoreQuiz(answers, { items, date })
    const rl = s.domains.find((d) => d.domain === 'RL')!
    expect(rl.status).toBe('promote')
    expect(rl.toPromote[0].activityIfNot.length).toBeGreaterThan(10)
    expect(s.domains.filter((d) => d.status === 'onTrack')).toHaveLength(4)
    expect(s.retestDate).toBe('2026-12-07')
    expect(s.referral).toBe(false)
  })

  it('ตอบ "ไม่แน่ใจ" (หรือไม่ได้ตอบ) → ด้านนั้น "ลองสังเกตอีกครั้ง" และยังนัดทำซ้ำ', () => {
    const answers: Record<string, QuizAnswer> = answerAll(ids, 'yes')
    answers['dspm-14'] = 'unsure'
    delete answers['dspm-15']
    const s = scoreQuiz(answers, { items, date })
    expect(s.domains.find((d) => d.domain === 'EL')!.status).toBe('unsure')
    expect(s.domains.find((d) => d.domain === 'PS')!.status).toBe('unsure')
    expect(s.score).toBe(3)
    expect(s.retestDate).toBeDefined()
  })

  it('ทำซ้ำแล้วข้อเดิมยังทำไม่ได้ → แนะนำปรึกษาคลินิกเด็กดี / ทำซ้ำแล้วผ่าน → ไม่ต้อง', () => {
    const previous: QuizResult = {
      id: 'p',
      date: '2026-10-08',
      ageGroupId: 'm3-4',
      ageMonths: 3,
      answers: { ...answerAll(ids, 'yes'), 'dspm-13': 'no' },
      score: 4,
      total: 5,
      retestDate: '2026-11-07',
      isRetest: false,
      referral: false,
    }
    const still = scoreQuiz({ ...answerAll(ids, 'yes'), 'dspm-13': 'no' }, { items, date, previous })
    expect(still.isRetest).toBe(true)
    expect(still.referral).toBe(true)
    expect(still.referralItems.map((i) => i.no)).toEqual([13])

    const passed = scoreQuiz(answerAll(ids, 'yes'), { items, date, previous })
    expect(passed.referral).toBe(false)
    expect(passed.allOnTrack).toBe(true)

    // ไม่ผ่านข้อใหม่ที่ครั้งก่อนผ่าน → ยังไม่ส่งต่อ (เริ่มนับรอบฝึกใหม่)
    const other = scoreQuiz({ ...answerAll(ids, 'yes'), 'dspm-11': 'no' }, { items, date, previous })
    expect(other.referral).toBe(false)
  })
})

describe('สถานะการทำควิซ', () => {
  const base: Child = {
    id: 'c',
    name: 'ทดสอบ',
    mode: 'born',
    birthDate: '2026-07-01',
    vaccineLog: {},
    growthLog: [],
    quizResults: [],
    checklist: {},
    careLog: [],
    calcSettings: DEFAULT_CALC_SETTINGS,
    favoriteNames: [],
  }
  const today = new Date(2026, 10, 7) // อายุ 4 เดือน → ช่วง 3–4 เดือน
  const result = (date: string, retestDate?: string): QuizResult => ({
    id: date,
    date,
    ageGroupId: 'm3-4',
    ageMonths: 4,
    answers: {},
    score: 0,
    total: 5,
    retestDate,
    isRetest: false,
    referral: false,
  })

  it('ยังไม่เคยทำ → ควรทำ / รอวันทำซ้ำ → ยังไม่ต้อง / ถึงวันทำซ้ำ → ควรทำ / ผ่านแล้ว → ไม่ต้อง', () => {
    expect(getQuizStatus(base, today)).toMatchObject({ due: true, reason: 'never' })
    expect(getQuizStatus({ ...base, quizResults: [result('2026-11-01', '2026-12-01')] }, today)).toMatchObject({
      due: false,
      reason: 'waiting',
    })
    expect(getQuizStatus({ ...base, quizResults: [result('2026-10-01', '2026-11-07')] }, today)).toMatchObject({
      due: true,
      reason: 'retest',
    })
    expect(getQuizStatus({ ...base, quizResults: [result('2026-11-01')] }, today)).toMatchObject({ due: false, reason: 'done' })
    expect(getQuizStatus({ ...base, mode: 'pregnant', dueDate: '2027-01-01' }, today)).toBeNull()
  })

  it('findPreviousForRetest ไม่นับผลที่เก่าเกิน 90 วัน', () => {
    expect(findPreviousForRetest([result('2026-10-01', '2026-10-31')], 'm3-4', today)?.id).toBe('2026-10-01')
    expect(findPreviousForRetest([result('2026-07-01', '2026-07-31')], 'm3-4', today)).toBeUndefined()
  })
})
