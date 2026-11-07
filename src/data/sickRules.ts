/**
 * ตัวช่วยตัดสินใจเมื่อลูกป่วย — คำถาม (decision tree) และกฎแบ่งระดับความเร่งด่วน
 *
 * แหล่งอ้างอิงแนวทางกุมารเวช (ผู้พัฒนาสรุปจากเอกสาร ยังไม่ได้เปิดตรวจทานตัวเต็มในรอบนี้ — ดู verified):
 * [NICE-NG143] NICE guideline NG143 "Fever in under 5s: assessment and initial management" (2019, ปรับ 2021)
 *              ตาราง traffic light: อายุ < 3 เดือน ไข้ ≥ 38 °C, ผื่นจุดเลือดออกกดไม่จาง, ไม่ตื่น/ปลุกไม่ตื่น,
 *              หายใจเร็ว/อกบุ๋ม, ผิว/ริมฝีปากเขียว = แดง · อายุ 3–6 เดือน ไข้ ≥ 39 °C = เหลือง
 *              https://www.nice.org.uk/guidance/ng143
 * [NICE-CG84]  NICE CG84 "Diarrhoea and vomiting caused by gastroenteritis in under 5s" — สัญญาณขาดน้ำ
 *              (ปัสสาวะลดลง ไม่มีน้ำตา ตาโหล กระหม่อมบุ๋ม) และอาเจียนสีเขียว (น้ำดี)
 *              https://www.nice.org.uk/guidance/cg84
 * [WHO-IMCI]   WHO "Integrated Management of Childhood Illness — Chart Booklet" (2014)
 *              General danger signs: ชัก, ซึม/ไม่รู้สึกตัว, ดื่ม/ดูดนมไม่ได้, อาเจียนทุกอย่าง · หายใจเร็ว/อกบุ๋ม
 *              https://www.who.int/publications/m/item/integrated-management-of-childhood-illness---chart-booklet-(march-2014)
 * [MOMSTAGE]   ไข้เกิน 3 วัน = แดง ตามข้อกำหนดของโปรเจค (NICE จัดไข้ ≥ 5 วันเป็นเหลือง แต่ในไทยไข้เกิน 3 วัน
 *              ต้องระวังไข้เลือดออก จึงเลือกให้ไปโรงพยาบาล)
 */

export type MainSymptom = 'fever' | 'vomit' | 'diarrhea' | 'rash' | 'cough'
export type TriageLevel = 'green' | 'yellow' | 'red'

export const MAIN_SYMPTOMS: { id: MainSymptom; label: string }[] = [
  { id: 'fever', label: 'มีไข้ / ตัวร้อน' },
  { id: 'vomit', label: 'อาเจียน' },
  { id: 'diarrhea', label: 'ท้องเสีย' },
  { id: 'rash', label: 'มีผื่น' },
  { id: 'cough', label: 'ไอ / หายใจผิดปกติ' },
]

/** คำตอบทั้งหมดของแบบสอบถาม */
export interface SickAnswers {
  symptoms: MainSymptom[]
  /** อาการอันตรายที่ติ๊ก */
  danger?: string[]
  /** null = ไม่ได้วัด */
  temperature?: number | null
  feverDays?: 'lt1' | '1to3' | 'gt3'
  dehydration?: string[]
  drinking?: 'normal' | 'less' | 'refuse'
  vomitType?: string[]
  diarrheaType?: string[]
  petechiae?: boolean
  rashType?: string[]
  coughType?: string[]
}

export interface SickContext {
  /** อายุเต็มเดือนจาก store (null = ไม่ทราบ) */
  ageMonths: number | null
}

export type QuestionKind = 'multi' | 'choice' | 'yesno' | 'temperature'

export interface SickOption {
  value: string
  label: string
  hint?: string
}

export interface SickQuestion {
  id: keyof Omit<SickAnswers, 'symptoms'>
  kind: QuestionKind
  title: string
  help?: string
  options?: SickOption[]
  /** ถามข้อนี้เฉพาะเมื่อเงื่อนไขเป็นจริง (ส่วน "ถามต่อเฉพาะที่เกี่ยว" ของ decision tree) */
  showIf: (a: SickAnswers, ctx: SickContext) => boolean
}

const has = (a: SickAnswers, ...s: MainSymptom[]) => s.some((x) => a.symptoms.includes(x))

/** ค่าในคำถามแบบ multi ที่หมายถึง "ไม่มีข้อใดเลย" */
export const NONE = 'none'

export const SICK_QUESTIONS: SickQuestion[] = [
  {
    id: 'danger',
    kind: 'multi',
    title: 'ตอนนี้ลูกมีอาการต่อไปนี้ไหม',
    help: 'เลือกทุกข้อที่มี ถ้าไม่มีเลยให้กด “ไม่มีเลย”',
    options: [
      { value: 'seizure', label: 'ชัก เกร็ง กระตุก หรือตาค้าง' },
      { value: 'unresponsive', label: 'ซึมมาก ปลุกไม่ตื่น หรือไม่ตอบสนองเหมือนปกติ' },
      { value: 'breathing', label: 'หายใจหอบเร็ว หายใจลำบาก หรือหน้าอก/ชายโครงบุ๋มเวลาหายใจ' },
      { value: 'cyanosis', label: 'ริมฝีปาก ลิ้น หรือหน้าเขียวคล้ำ' },
    ],
    showIf: () => true,
  },
  {
    id: 'temperature',
    kind: 'temperature',
    title: 'วัดไข้ได้กี่องศา',
    help: 'ใช้ค่าสูงสุดที่วัดได้ใน 24 ชั่วโมงที่ผ่านมา (ปรอทดิจิทัลวัดทางรักแร้หรือทางหู)',
    showIf: (a) => has(a, 'fever'),
  },
  {
    id: 'feverDays',
    kind: 'choice',
    title: 'มีไข้มากี่วันแล้ว',
    options: [
      { value: 'lt1', label: 'ไม่ถึง 1 วัน' },
      { value: '1to3', label: '1 – 3 วัน' },
      { value: 'gt3', label: 'มากกว่า 3 วัน' },
    ],
    showIf: (a) => has(a, 'fever'),
  },
  {
    id: 'petechiae',
    kind: 'yesno',
    title: 'มีผื่นเป็นจุดเลือดออกเล็ก ๆ สีแดงเข้มหรือม่วง ที่กดแล้วสีไม่จางไหม',
    help: 'ลองใช้แก้วใสกดทับผื่น ถ้ายังมองเห็นจุดแดงชัดผ่านแก้ว แปลว่ากดไม่จาง',
    showIf: (a) => has(a, 'fever', 'rash'),
  },
  {
    id: 'rashType',
    kind: 'multi',
    title: 'ผื่นมีลักษณะแบบนี้ไหม',
    options: [
      { value: 'swelling', label: 'หน้า ตา หรือปากบวม หรือมีเสียงหวีดเวลาหายใจ' },
      { value: 'blister', label: 'เป็นตุ่มน้ำ ผิวลอก หรือเป็นแผลในปาก' },
      { value: 'spreading', label: 'ลามเร็ว หรือคันมากจนนอนไม่ได้' },
    ],
    showIf: (a) => has(a, 'rash'),
  },
  {
    id: 'vomitType',
    kind: 'multi',
    title: 'อาเจียนเป็นแบบนี้ไหม',
    options: [
      { value: 'green', label: 'อาเจียนเป็นสีเขียว หรือมีเลือดปน' },
      { value: 'everything', label: 'อาเจียนทุกครั้งที่กินหรือดื่ม เก็บอะไรไม่อยู่เลย' },
      { value: 'long', label: 'อาเจียนมานานเกิน 24 ชั่วโมง' },
    ],
    showIf: (a) => has(a, 'vomit'),
  },
  {
    id: 'diarrheaType',
    kind: 'multi',
    title: 'ท้องเสียเป็นแบบนี้ไหม',
    options: [
      { value: 'blood', label: 'อุจจาระมีมูกเลือดปน' },
      { value: 'frequent', label: 'ถ่ายเหลวเป็นน้ำมากกว่า 6 ครั้งใน 24 ชั่วโมง' },
      { value: 'long', label: 'ท้องเสียมานานเกิน 7 วัน' },
    ],
    showIf: (a) => has(a, 'diarrhea'),
  },
  {
    id: 'dehydration',
    kind: 'multi',
    title: 'มีสัญญาณขาดน้ำไหม',
    help: 'สำคัญมากเมื่ออาเจียน ท้องเสีย หรือไข้สูง',
    options: [
      { value: 'lowUrine', label: 'ปัสสาวะน้อยกว่า 3 ครั้งใน 24 ชั่วโมง (หรือผ้าอ้อมแห้งนานเกิน 8 ชั่วโมง)' },
      { value: 'noTears', label: 'ร้องไห้ไม่มีน้ำตา' },
      { value: 'sunkenFontanelle', label: 'กระหม่อมหน้าบุ๋มลงไป' },
      { value: 'dryMouth', label: 'ปากและลิ้นแห้งมาก ตาโหลลึก' },
    ],
    showIf: (a) => has(a, 'vomit', 'diarrhea', 'fever'),
  },
  {
    id: 'drinking',
    kind: 'choice',
    title: 'ลูกกินนมหรือดื่มน้ำได้แค่ไหน',
    options: [
      { value: 'normal', label: 'ได้ตามปกติหรือเกือบปกติ' },
      { value: 'less', label: 'ได้น้อยกว่าครึ่งของปกติ' },
      { value: 'refuse', label: 'ไม่ยอมดูดนมหรือดื่มเลย' },
    ],
    showIf: (a) => has(a, 'fever', 'vomit', 'diarrhea'),
  },
  {
    id: 'coughType',
    kind: 'multi',
    title: 'อาการไอเป็นแบบนี้ไหม',
    options: [
      { value: 'wheeze', label: 'มีเสียงหวีดหรือเสียงครืดคราดในอกชัดเจน' },
      { value: 'whoop', label: 'ไอเป็นชุด ๆ ติดกันจนหน้าแดง แล้วหายใจเข้ามีเสียงวู้บ' },
      { value: 'long', label: 'ไอมานานเกิน 2 สัปดาห์' },
    ],
    showIf: (a) => has(a, 'cough'),
  },
]

export interface SickRule {
  id: string
  level: TriageLevel
  reason: string
  source: string
  test: (a: SickAnswers, ctx: SickContext) => boolean
}

const picked = (list: string[] | undefined, value: string) => !!list?.includes(value)

/** กฎทั้งหมด — แดงก่อน เหลืองตาม ผลลัพธ์ใช้ระดับสูงสุดที่ตรง */
export const SICK_RULES: SickRule[] = [
  // ---- แดง: ไปโรงพยาบาลเดี๋ยวนี้ ----
  {
    id: 'infant-fever',
    level: 'red',
    reason: 'ลูกอายุน้อยกว่า 3 เดือนและมีไข้ตั้งแต่ 38.0 °C — ทารกวัยนี้อาจติดเชื้อรุนแรงได้แม้ดูไม่ป่วยมาก',
    source: 'NICE-NG143',
    test: (a, c) => c.ageMonths !== null && c.ageMonths < 3 && (a.temperature ?? 0) >= 38,
  },
  { id: 'seizure', level: 'red', reason: 'มีอาการชัก', source: 'WHO-IMCI', test: (a) => picked(a.danger, 'seizure') },
  {
    id: 'unresponsive',
    level: 'red',
    reason: 'ซึมมาก ปลุกไม่ตื่น หรือไม่ตอบสนอง',
    source: 'NICE-NG143; WHO-IMCI',
    test: (a) => picked(a.danger, 'unresponsive'),
  },
  {
    id: 'breathing',
    level: 'red',
    reason: 'หายใจหอบ หายใจลำบาก หรืออกบุ๋ม',
    source: 'NICE-NG143; WHO-IMCI',
    test: (a) => picked(a.danger, 'breathing'),
  },
  { id: 'cyanosis', level: 'red', reason: 'ริมฝีปากหรือหน้าเขียวคล้ำ', source: 'NICE-NG143', test: (a) => picked(a.danger, 'cyanosis') },
  {
    id: 'sunken-fontanelle',
    level: 'red',
    reason: 'กระหม่อมหน้าบุ๋ม — สัญญาณขาดน้ำรุนแรง',
    source: 'NICE-CG84',
    test: (a) => picked(a.dehydration, 'sunkenFontanelle'),
  },
  {
    id: 'low-urine',
    level: 'red',
    reason: 'ปัสสาวะน้อยกว่า 3 ครั้งใน 24 ชั่วโมง — สัญญาณขาดน้ำ',
    source: 'NICE-CG84',
    test: (a) => picked(a.dehydration, 'lowUrine'),
  },
  {
    id: 'no-tears',
    level: 'red',
    reason: 'ร้องไห้ไม่มีน้ำตา — สัญญาณขาดน้ำ',
    source: 'NICE-CG84',
    test: (a) => picked(a.dehydration, 'noTears'),
  },
  {
    id: 'dry-mouth',
    level: 'red',
    reason: 'ปากลิ้นแห้งมากและตาโหลลึก — สัญญาณขาดน้ำ',
    source: 'NICE-CG84; WHO-IMCI',
    test: (a) => picked(a.dehydration, 'dryMouth'),
  },
  {
    id: 'petechiae',
    level: 'red',
    reason: 'ผื่นจุดเลือดออกที่กดไม่จาง — อาจเป็นการติดเชื้อในกระแสเลือดหรือไข้เลือดออก',
    source: 'NICE-NG143',
    test: (a) => a.petechiae === true,
  },
  {
    id: 'fever-gt3',
    level: 'red',
    reason: 'มีไข้มานานเกิน 3 วัน',
    source: 'MOMSTAGE',
    test: (a) => a.feverDays === 'gt3',
  },
  {
    id: 'refuse-drink',
    level: 'red',
    reason: 'ไม่ยอมดูดนมหรือดื่มน้ำเลย',
    source: 'WHO-IMCI',
    test: (a) => a.drinking === 'refuse',
  },
  {
    id: 'vomit-everything',
    level: 'red',
    reason: 'อาเจียนทุกอย่างที่กินหรือดื่ม',
    source: 'WHO-IMCI',
    test: (a) => picked(a.vomitType, 'everything'),
  },
  {
    id: 'vomit-green',
    level: 'red',
    reason: 'อาเจียนเป็นสีเขียวหรือมีเลือดปน — อาจมีลำไส้อุดตัน',
    source: 'NICE-CG84',
    test: (a) => picked(a.vomitType, 'green'),
  },
  {
    id: 'swelling',
    level: 'red',
    reason: 'หน้า ตา ปากบวม หรือหายใจมีเสียงหวีดร่วมกับผื่น — อาจแพ้รุนแรง',
    source: 'NICE-NG143',
    test: (a) => picked(a.rashType, 'swelling'),
  },

  // ---- เหลือง: ควรพบแพทย์ภายใน 24 ชั่วโมง ----
  {
    id: 'young-high-fever',
    level: 'yellow',
    reason: 'อายุ 3–6 เดือนและไข้ตั้งแต่ 39 °C',
    source: 'NICE-NG143',
    test: (a, c) => c.ageMonths !== null && c.ageMonths >= 3 && c.ageMonths < 6 && (a.temperature ?? 0) >= 39,
  },
  {
    id: 'very-high-fever',
    level: 'yellow',
    reason: 'ไข้สูงตั้งแต่ 40 °C',
    source: 'NICE-NG143',
    test: (a) => (a.temperature ?? 0) >= 40,
  },
  {
    id: 'unknown-age-fever',
    level: 'yellow',
    reason: 'ไม่ทราบอายุลูกในแอป และมีไข้ตั้งแต่ 38 °C — ถ้าลูกอายุน้อยกว่า 3 เดือนให้ไปโรงพยาบาลทันที',
    source: 'NICE-NG143',
    test: (a, c) => c.ageMonths === null && (a.temperature ?? 0) >= 38,
  },
  {
    id: 'drink-less',
    level: 'yellow',
    reason: 'กินนมหรือดื่มน้ำได้น้อยกว่าครึ่งของปกติ',
    source: 'NICE-NG143',
    test: (a) => a.drinking === 'less',
  },
  { id: 'vomit-long', level: 'yellow', reason: 'อาเจียนนานเกิน 24 ชั่วโมง', source: 'NICE-CG84', test: (a) => picked(a.vomitType, 'long') },
  {
    id: 'diarrhea-blood',
    level: 'yellow',
    reason: 'อุจจาระมีมูกเลือด',
    source: 'NICE-CG84; WHO-IMCI',
    test: (a) => picked(a.diarrheaType, 'blood'),
  },
  {
    id: 'diarrhea-frequent',
    level: 'yellow',
    reason: 'ถ่ายเหลวเป็นน้ำบ่อยมาก เสี่ยงขาดน้ำ',
    source: 'NICE-CG84',
    test: (a) => picked(a.diarrheaType, 'frequent'),
  },
  { id: 'diarrhea-long', level: 'yellow', reason: 'ท้องเสียนานเกิน 7 วัน', source: 'NICE-CG84', test: (a) => picked(a.diarrheaType, 'long') },
  {
    id: 'rash-fever',
    level: 'yellow',
    reason: 'มีผื่นร่วมกับไข้',
    source: 'NICE-NG143',
    test: (a) => a.symptoms.includes('rash') && a.symptoms.includes('fever'),
  },
  {
    id: 'rash-blister',
    level: 'yellow',
    reason: 'ผื่นเป็นตุ่มน้ำ ผิวลอก หรือมีแผลในปาก',
    source: 'NICE-NG143',
    test: (a) => picked(a.rashType, 'blister'),
  },
  { id: 'rash-spreading', level: 'yellow', reason: 'ผื่นลามเร็วหรือคันมาก', source: 'NICE-NG143', test: (a) => picked(a.rashType, 'spreading') },
  { id: 'wheeze', level: 'yellow', reason: 'ไอมีเสียงหวีดหรือครืดคราดในอก', source: 'WHO-IMCI', test: (a) => picked(a.coughType, 'wheeze') },
  { id: 'whoop', level: 'yellow', reason: 'ไอเป็นชุด ๆ มีเสียงวู้บ — อาจเป็นไอกรน', source: 'WHO-IMCI', test: (a) => picked(a.coughType, 'whoop') },
  { id: 'cough-long', level: 'yellow', reason: 'ไอนานเกิน 2 สัปดาห์', source: 'WHO-IMCI', test: (a) => picked(a.coughType, 'long') },
  {
    id: 'infant-cough',
    level: 'yellow',
    reason: 'ทารกอายุน้อยกว่า 3 เดือนที่มีอาการไอ',
    source: 'WHO-IMCI',
    test: (a, c) => a.symptoms.includes('cough') && c.ageMonths !== null && c.ageMonths < 3,
  },
]

/** คำแนะนำดูแลที่บ้านตามอาการ (แสดงเมื่อผลเป็นสีเขียวหรือเหลือง) */
export const HOME_CARE: Record<MainSymptom, string[]> = {
  fever: [
    'เช็ดตัวด้วยน้ำอุณหภูมิห้อง (ไม่ใช้น้ำเย็นจัด) ใส่เสื้อผ้าบาง ๆ',
    'ให้ยาลดไข้พาราเซตามอลตามน้ำหนักตัว ห่างกันอย่างน้อย 4 ชั่วโมง',
    'ให้ดื่มนมหรือน้ำบ่อย ๆ วัดไข้ซ้ำทุก 4–6 ชั่วโมง',
  ],
  vomit: ['ให้ดื่มน้ำหรือนมทีละน้อยแต่บ่อย ๆ เช่น ครั้งละ 1–2 ช้อนชา ทุก 5 นาที', 'ถ้าอายุเกิน 6 เดือน ให้ผงเกลือแร่ ORS ผสมตามฉลาก'],
  diarrhea: [
    'ให้นมแม่หรือนมตามปกติต่อไป ไม่ต้องงด',
    'ให้ผงเกลือแร่ ORS หลังถ่ายเหลวแต่ละครั้ง ไม่ใช้เครื่องดื่มเกลือแร่สำหรับนักกีฬา',
    'ล้างมือทุกครั้งหลังเปลี่ยนผ้าอ้อม',
  ],
  rash: ['ใส่เสื้อผ้าโปร่งระบายอากาศ ตัดเล็บให้สั้น', 'ถ่ายรูปผื่นเก็บไว้ให้แพทย์ดูได้ถ้าอาการเปลี่ยน'],
  cough: ['ให้ดื่มน้ำอุ่นบ่อย ๆ (อายุเกิน 1 ปี ใช้น้ำผึ้งเล็กน้อยได้)', 'หยอดน้ำเกลือล้างจมูกก่อนกินนมและก่อนนอน', 'ไม่ซื้อยาแก้ไอให้เด็กเล็กเอง'],
}
