/** โครงสร้างข้อมูลที่เก็บใน localStorage — แก้ที่นี่ที่เดียวแล้ว TypeScript จะเตือนทุกจุดที่ต้องแก้ตาม */

export type ChildMode = 'pregnant' | 'born'
export type ChildSex = 'boy' | 'girl'

export interface GrowthEntry {
  id: string
  /** "yyyy-MM-dd" วันที่ชั่ง/วัด */
  date: string
  /** กรอกอย่างน้อยหนึ่งค่า */
  weightKg?: number
  heightCm?: number
}

/** คำตอบแต่ละข้อของควิซพัฒนาการ */
export type QuizAnswer = 'yes' | 'no' | 'unsure'

export interface QuizResult {
  id: string
  /** "yyyy-MM-dd" วันที่ทำควิซ */
  date: string
  /** รหัสช่วงอายุ DSPM เช่น "m3-4" — อ้างอิงกับ src/data/dspm.ts */
  ageGroupId: string
  /** อายุลูก (เดือนเต็ม) ณ วันที่ทำ — null ถ้ายังไม่เกิด */
  ageMonths: number | null
  /** รหัสข้อ → คำตอบ */
  answers: Record<string, QuizAnswer>
  /** จำนวนข้อที่ทำได้ */
  score: number
  total: number
  /** วันนัดทำซ้ำ (มีเมื่อมีข้อที่ยังทำไม่ได้หรือไม่แน่ใจ) */
  retestDate?: string
  /** เป็นการทำซ้ำของผลก่อนหน้าในช่วงอายุเดียวกัน */
  isRetest: boolean
  /** ทำซ้ำแล้วยังทำไม่ได้ → ควรปรึกษาเจ้าหน้าที่คลินิกเด็กดี */
  referral: boolean
}

export type CareType = 'feed' | 'sleep'

/** บันทึกการให้นม/การนอน 1 ครั้ง */
export interface CareEvent {
  id: string
  type: CareType
  /** ISO datetime เริ่ม */
  start: string
  /** ISO datetime จบ — ไม่มี = ยังดำเนินอยู่ */
  end?: string
}

export type FeedingType = 'breast' | 'mixed' | 'formula'

/** ยอดหนึ่งยอดของรายการค่าใช้จ่าย (เช่น ซื้อเสื้อผ้าแต่ละครั้ง) — เก็บเป็นสตริงตามที่พิมพ์ */
export interface ExpenseEntry {
  id: string
  /** ราคาต่อหน่วย (บาท) */
  price: string
  /** จำนวนต่อเดือน */
  quantity: string
  /** หน่วย เช่น ชิ้น ครั้ง แพ็ค */
  unit: string
}

/** ค่าใช้จ่ายอื่น ๆ ต่อเดือนที่แม่เพิ่มเอง — หนึ่งรายการมีได้หลายยอด และยอดทั้งหมดรวมเป็นแท่งเดียวในกราฟ */
export interface ExtraExpense {
  id: string
  name: string
  entries: ExpenseEntry[]
}

/** ค่าที่แม่กรอกในเครื่องคิดเลข — จำไว้ให้ครั้งหน้า (เก็บเป็นสตริงเพื่อไม่ให้ช่องตัวเลขกระโดดตอนพิมพ์ทศนิยม) */
export interface CalcSettings {
  weightKg: string
  feedsPerDay: string
  feedingType: FeedingType
  pricePerCan: string
  gramsPerCan: string
  diaperPrice: string
  /** จำนวนผ้าอ้อมต่อวัน — ว่าง = ใช้ค่ากลางตามช่วงอายุ */
  diapersPerDay: string
  extras: ExtraExpense[]
}

export interface Child {
  id: string
  name: string
  mode: ChildMode
  /** วันกำหนดคลอด "yyyy-MM-dd" — ใช้เมื่อ mode = 'pregnant' */
  dueDate?: string
  /** วันเกิด "yyyy-MM-dd" — ใช้เมื่อ mode = 'born' */
  birthDate?: string
  sex?: ChildSex
  /** รหัสวัคซีน → วันที่ฉีดจริง "yyyy-MM-dd" */
  vaccineLog: Record<string, string>
  growthLog: GrowthEntry[]
  quizResults: QuizResult[]
  /** รหัสรายการใน src/data/checklist.ts → ติ๊กแล้วหรือยัง */
  checklist: Record<string, boolean>
  /** บันทึกการให้นมและการนอน */
  careLog: CareEvent[]
  calcSettings: CalcSettings
  /** เวลาเกิด "HH:mm" (ไม่บังคับ) — ใช้หาวันเกิดทางโหราศาสตร์ในเครื่องมือตั้งชื่อ */
  birthTime?: string
  /** ชื่อที่กดหัวใจเก็บไว้ */
  favoriteNames: string[]
}

export interface AppState {
  /** เวอร์ชันโครงสร้างข้อมูล ไว้ย้ายข้อมูลเก่าเมื่อเปลี่ยน schema */
  version: 1
  children: Child[]
  activeChildId: string | null
}
