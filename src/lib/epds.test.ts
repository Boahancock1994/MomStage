import { describe, expect, it } from 'vitest'
import { EPDS_QUESTIONS, optionScore, scoreEpds } from './epds'

/** หา index ของตัวเลือกที่ได้คะแนนตามที่ต้องการในแต่ละข้อ */
const answersFor = (scores: number[]) => EPDS_QUESTIONS.map((q, i) => [0, 1, 2, 3].find((idx) => optionScore(q, idx) === scores[i])!)

describe('EPDS', () => {
  it('มี 10 ข้อ ข้อละ 4 ตัวเลือก และข้อ 1, 2, 4 ไม่คิดคะแนนกลับ', () => {
    expect(EPDS_QUESTIONS).toHaveLength(10)
    expect(EPDS_QUESTIONS.every((q) => q.options.length === 4)).toBe(true)
    expect(EPDS_QUESTIONS.filter((q) => !q.reversed).map((q) => q.id)).toEqual([1, 2, 4])
  })

  it('คิดคะแนนกลับ: ตัวเลือกแรกของข้อ 3 ได้ 3 คะแนน ตัวเลือกแรกของข้อ 1 ได้ 0', () => {
    expect(optionScore(EPDS_QUESTIONS[0], 0)).toBe(0)
    expect(optionScore(EPDS_QUESTIONS[2], 0)).toBe(3)
  })

  it('เกณฑ์ 9 / 10 / 12 / 13', () => {
    expect(scoreEpds(answersFor([3, 3, 3, 0, 0, 0, 0, 0, 0, 0])).level).toBe('low')
    expect(scoreEpds(answersFor([3, 3, 3, 1, 0, 0, 0, 0, 0, 0])).level).toBe('possible')
    expect(scoreEpds(answersFor([3, 3, 3, 3, 0, 0, 0, 0, 0, 0])).level).toBe('possible')
    expect(scoreEpds(answersFor([3, 3, 3, 3, 1, 0, 0, 0, 0, 0]))).toMatchObject({ score: 13, level: 'likely' })
  })

  it('ข้อ 10 ตอบว่าเคยคิดทำร้ายตัวเอง → selfHarm แม้คะแนนรวมต่ำ', () => {
    const r = scoreEpds(answersFor([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]))
    expect(r).toMatchObject({ score: 1, level: 'low', selfHarm: true })
    expect(scoreEpds(answersFor(Array(10).fill(0))).selfHarm).toBe(false)
  })

  it('คะแนนเต็ม 30 และตอบไม่ครบจะ error', () => {
    expect(scoreEpds(answersFor(Array(10).fill(3))).score).toBe(30)
    expect(() => scoreEpds([0, 1])).toThrow()
  })
})
