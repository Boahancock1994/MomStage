/**
 * แบบคัดกรองภาวะซึมเศร้าหลังคลอด EPDS (Edinburgh Postnatal Depression Scale)
 * Cox, Holden & Sagovsky (1987) Br J Psychiatry 150:782–786 — ใช้ได้โดยอ้างอิงที่มา
 * ข้อความภาษาไทยเรียบเรียงตามความหมายของต้นฉบับ (ไม่ใช่ฉบับแปลที่ผ่านการทดสอบ)
 *
 * 10 ข้อ ข้อละ 0–3 คะแนน รวม 0–30 ถามถึงความรู้สึกใน 7 วันที่ผ่านมา
 * ตัวเลือกเรียงตามลำดับในแบบสอบถามจริง — ข้อ 1, 2, 4 ตัวแรกได้ 0 ส่วนข้ออื่นตัวแรกได้ 3 (คิดคะแนนกลับ)
 * เกณฑ์: < 10 ต่ำ · 10–12 อาจมีภาวะซึมเศร้า · ≥ 13 มีแนวโน้มสูง
 * ข้อ 10 (คิดทำร้ายตัวเอง) ตอบอะไรก็ตามที่ไม่ใช่ "ไม่เคยเลย" = ต้องได้รับความช่วยเหลือทันที ไม่ว่าคะแนนรวมเท่าไร
 */

export interface EpdsQuestion {
  id: number
  text: string
  /** ตัวเลือกตามลำดับที่แสดง */
  options: string[]
  /** true = ตัวเลือกแรกได้ 3 คะแนน (คิดคะแนนกลับ) */
  reversed: boolean
}

export const EPDS_QUESTIONS: EpdsQuestion[] = [
  {
    id: 1,
    text: 'ฉันหัวเราะและมองเห็นเรื่องตลกขบขันได้',
    options: ['ได้เหมือนเคย', 'ได้น้อยกว่าเดิมเล็กน้อย', 'ได้น้อยกว่าเดิมมาก', 'ไม่ได้เลย'],
    reversed: false,
  },
  {
    id: 2,
    text: 'ฉันตั้งตารอสิ่งต่าง ๆ ด้วยความเพลิดเพลิน',
    options: ['เหมือนเคย', 'น้อยกว่าเดิมเล็กน้อย', 'น้อยกว่าเดิมมาก', 'แทบไม่มีเลย'],
    reversed: false,
  },
  {
    id: 3,
    text: 'ฉันโทษตัวเองโดยไม่จำเป็นเมื่อมีอะไรผิดพลาด',
    options: ['ใช่ เกือบตลอดเวลา', 'ใช่ บางครั้ง', 'ไม่บ่อยนัก', 'ไม่เคยเลย'],
    reversed: true,
  },
  {
    id: 4,
    text: 'ฉันรู้สึกกังวลหรือเป็นห่วงโดยไม่มีเหตุผล',
    options: ['ไม่เลย', 'แทบไม่เคย', 'ใช่ บางครั้ง', 'ใช่ บ่อยมาก'],
    reversed: false,
  },
  {
    id: 5,
    text: 'ฉันรู้สึกกลัวหรือตื่นตระหนกโดยไม่มีเหตุผล',
    options: ['ใช่ ค่อนข้างบ่อย', 'ใช่ บางครั้ง', 'ไม่ค่อย', 'ไม่เลย'],
    reversed: true,
  },
  {
    id: 6,
    text: 'เรื่องต่าง ๆ ถาโถมเข้ามาจนรับมือไม่ไหว',
    options: [
      'ใช่ ส่วนใหญ่รับมือไม่ได้เลย',
      'ใช่ บางครั้งรับมือได้ไม่ดีเท่าที่เคย',
      'ไม่ ส่วนใหญ่รับมือได้ดี',
      'ไม่ รับมือได้ดีเหมือนเคย',
    ],
    reversed: true,
  },
  {
    id: 7,
    text: 'ฉันไม่มีความสุขจนนอนหลับยาก',
    options: ['ใช่ เกือบตลอดเวลา', 'ใช่ บางครั้ง', 'ไม่บ่อยนัก', 'ไม่เลย'],
    reversed: true,
  },
  {
    id: 8,
    text: 'ฉันรู้สึกเศร้าหรือทุกข์ใจ',
    options: ['ใช่ เกือบตลอดเวลา', 'ใช่ ค่อนข้างบ่อย', 'ไม่บ่อยนัก', 'ไม่เลย'],
    reversed: true,
  },
  {
    id: 9,
    text: 'ฉันไม่มีความสุขจนร้องไห้',
    options: ['ใช่ เกือบตลอดเวลา', 'ใช่ ค่อนข้างบ่อย', 'นาน ๆ ครั้ง', 'ไม่เคยเลย'],
    reversed: true,
  },
  {
    id: 10,
    text: 'ฉันเคยมีความคิดอยากทำร้ายตัวเอง',
    options: ['ใช่ ค่อนข้างบ่อย', 'บางครั้ง', 'แทบไม่เคย', 'ไม่เคยเลย'],
    reversed: true,
  },
]

export const EPDS_MAX = 30
export const SELF_HARM_QUESTION_ID = 10

/** คะแนนของตัวเลือกที่ index (0–3) */
export function optionScore(q: EpdsQuestion, index: number): number {
  return q.reversed ? 3 - index : index
}

export type EpdsLevel = 'low' | 'possible' | 'likely'

export interface EpdsResult {
  score: number
  level: EpdsLevel
  /** ตอบข้อ 10 ว่าเคยคิดทำร้ายตัวเอง (คะแนน ≥ 1) */
  selfHarm: boolean
}

/** answers = index ของตัวเลือกที่เลือก เรียงตามข้อ (ต้องครบ 10 ข้อ) */
export function scoreEpds(answers: number[]): EpdsResult {
  if (answers.length !== EPDS_QUESTIONS.length || answers.some((a) => a < 0 || a > 3)) {
    throw new Error('EPDS ต้องตอบครบ 10 ข้อ ข้อละ 0–3')
  }
  const scores = EPDS_QUESTIONS.map((q, i) => optionScore(q, answers[i]))
  const score = scores.reduce((s, x) => s + x, 0)
  const level: EpdsLevel = score >= 13 ? 'likely' : score >= 10 ? 'possible' : 'low'
  return { score, level, selfHarm: scores[SELF_HARM_QUESTION_ID - 1] > 0 }
}
