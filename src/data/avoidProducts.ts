/**
 * เครื่องสำอางและยาที่ควรเลี่ยง/ระวัง ช่วงตั้งครรภ์ และหลังคลอดระหว่างให้นมลูก
 *
 * สรุปจากคำแนะนำทั่วไปของ ACOG, US FDA (NSAIDs ≥ 20 สัปดาห์, codeine/tramadol ในแม่ให้นม),
 * NHS และ LactMed (NIH) — เป็นข้อมูลทั่วไป ไม่ครอบคลุมยาทุกตัว
 * หลักสำคัญ: ห้ามหยุดยาที่แพทย์สั่งเอง ให้ถามแพทย์หรือเภสัชกรทุกครั้งก่อนใช้ยา
 */

export type Phase = 'pregnant' | 'postpartum'
/** avoid = ควรเลี่ยง · caution = ใช้ได้บางกรณี ปรึกษาแพทย์/เภสัชกรก่อน · null = ไม่มีข้อห้ามเฉพาะในช่วงนั้น */
export type AvoidLevel = 'avoid' | 'caution' | null
export type ProductKind = 'cosmetic' | 'medicine'

export interface AvoidProduct {
  kind: ProductKind
  name: string
  /** ชื่อที่พบบนฉลากหรือชื่อการค้า ให้แม่ใช้เทียบได้ */
  lookFor: string
  why: Record<Phase, string | null>
  level: Record<Phase, AvoidLevel>
}

export const AVOID_PRODUCTS: AvoidProduct[] = [
  // เครื่องสำอาง
  {
    kind: 'cosmetic',
    name: 'เรตินอยด์ (ครีมรักษาสิว/ลดริ้วรอย)',
    lookFor: 'Retinol, Retinyl palmitate, Tretinoin (Retin-A), Adapalene, Tazarotene',
    level: { pregnant: 'avoid', postpartum: 'caution' },
    why: {
      pregnant: 'เป็นอนุพันธ์วิตามินเอ แบบกินทำให้ทารกพิการได้ แบบทาจึงแนะนำให้เลี่ยงตลอดการตั้งครรภ์',
      postpartum: 'แบบทาซึมเข้าน้ำนมน้อย แต่ไม่ควรทาบริเวณหน้าอกหรือจุดที่ลูกสัมผัส',
    },
  },
  {
    kind: 'cosmetic',
    name: 'ไฮโดรควิโนน (ครีมทาฝ้า หน้าขาว)',
    lookFor: 'Hydroquinone',
    level: { pregnant: 'avoid', postpartum: 'caution' },
    why: {
      pregnant: 'ซึมผ่านผิวเข้าสู่ร่างกายได้มากเมื่อเทียบกับสารอื่น ฝ้าช่วงท้องมักจางเองหลังคลอด',
      postpartum: 'ข้อมูลความปลอดภัยในแม่ให้นมมีน้อย ใช้เฉพาะเมื่อแพทย์ผิวหนังแนะนำ',
    },
  },
  {
    kind: 'cosmetic',
    name: 'ครีมหน้าขาวไม่มีเลข อย. หรือไม่ทราบส่วนผสม',
    lookFor: 'ครีมขายออนไลน์ที่ไม่มีเลขจดแจ้ง อย. อาจมีปรอท (Mercury) หรือสเตียรอยด์',
    level: { pregnant: 'avoid', postpartum: 'avoid' },
    why: {
      pregnant: 'ปรอทผ่านรกและสะสมในสมองทารก',
      postpartum: 'ปรอทผ่านน้ำนมและติดมือไปถึงลูกได้',
    },
  },
  {
    kind: 'cosmetic',
    name: 'ซาลิไซลิกแอซิดความเข้มข้นสูง / ทรีตเมนต์ผลัดผิว (peel)',
    lookFor: 'Salicylic acid (BHA) มากกว่า 2%, chemical peel',
    level: { pregnant: 'avoid', postpartum: null },
    why: {
      pregnant: 'ความเข้มข้นสูงหรือทาบริเวณกว้างอาจถูกดูดซึมคล้ายยาแอสไพริน ส่วนโฟมล้างหน้าไม่เกิน 2% ใช้ได้',
      postpartum: null,
    },
  },
  {
    kind: 'cosmetic',
    name: 'ยืดผมเคราตินที่ปล่อยฟอร์มาลดีไฮด์',
    lookFor: 'Formaldehyde, Formalin, Methylene glycol (ยืดผม/บราซิลเลียนเคราติน)',
    level: { pregnant: 'avoid', postpartum: 'caution' },
    why: {
      pregnant: 'ไอระเหยของฟอร์มาลดีไฮด์ระคายเคืองและเป็นสารก่อมะเร็ง',
      postpartum: 'ถ้าทำ ให้ทำในที่อากาศถ่ายเทและไม่พาลูกไปด้วย',
    },
  },
  {
    kind: 'cosmetic',
    name: 'ทำสีผม ดัดผม',
    lookFor: 'ยาย้อมผมถาวร น้ำยาดัด',
    level: { pregnant: 'caution', postpartum: null },
    why: {
      pregnant: 'ข้อมูลส่วนใหญ่ไม่พบอันตราย แต่แนะนำให้รอพ้นไตรมาสแรก ทำในที่อากาศถ่ายเท และเลือกสูตรไม่มีแอมโมเนีย',
      postpartum: null,
    },
  },

  // ยา
  {
    kind: 'medicine',
    name: 'ยาแก้ปวดกลุ่ม NSAIDs',
    lookFor: 'Ibuprofen (Brufen, Gofen), Diclofenac (Voltaren), Naproxen, Mefenamic acid (Ponstan)',
    level: { pregnant: 'avoid', postpartum: null },
    why: {
      pregnant: 'ตั้งแต่ 20 สัปดาห์ขึ้นไปอาจทำให้น้ำคร่ำน้อยและหลอดเลือดหัวใจทารกปิดก่อนกำหนด ปวดหัวหรือมีไข้ใช้พาราเซตามอลแทน',
      postpartum: 'ไอบูโพรเฟนเป็นยาแก้ปวดที่ใช้ได้ขณะให้นม',
    },
  },
  {
    kind: 'medicine',
    name: 'แอสไพรินขนาดแก้ปวด',
    lookFor: 'Aspirin 300–500 มก., ยาแก้ปวดผงที่มีแอสไพริน',
    level: { pregnant: 'avoid', postpartum: 'avoid' },
    why: {
      pregnant: 'ขนาดแก้ปวดเสี่ยงเลือดออก ยกเว้นแอสไพรินขนาดต่ำที่แพทย์สั่งเพื่อป้องกันครรภ์เป็นพิษ',
      postpartum: 'ผ่านน้ำนม เด็กเล็กเสี่ยงกลุ่มอาการเรย์ (Reye’s syndrome)',
    },
  },
  {
    kind: 'medicine',
    name: 'ยารักษาสิวแบบกิน (ไอโซเตรติโนอิน)',
    lookFor: 'Isotretinoin (Roaccutane, Acnotin)',
    level: { pregnant: 'avoid', postpartum: 'avoid' },
    why: {
      pregnant: 'ทำให้ทารกพิการรุนแรง ต้องคุมกำเนิดระหว่างใช้และหลังหยุดยาอย่างน้อย 1 เดือน',
      postpartum: 'ผ่านน้ำนมได้และไม่มีข้อมูลความปลอดภัย',
    },
  },
  {
    kind: 'medicine',
    name: 'ยาปฏิชีวนะกลุ่มเตตราไซคลิน',
    lookFor: 'Tetracycline, Doxycycline, Minocycline',
    level: { pregnant: 'avoid', postpartum: 'caution' },
    why: {
      pregnant: 'ทำให้ฟันของลูกเปลี่ยนสีถาวรและกระทบการสร้างกระดูก',
      postpartum: 'ใช้ระยะสั้นได้ตามแพทย์สั่ง เลี่ยงการใช้ต่อเนื่องนาน',
    },
  },
  {
    kind: 'medicine',
    name: 'ยาแก้ปวดหรือแก้ไอที่มีโคเดอีน / ทรามาดอล',
    lookFor: 'Codeine (ยาแก้ไอบางสูตร), Tramadol (Tramol)',
    level: { pregnant: 'caution', postpartum: 'avoid' },
    why: {
      pregnant: 'ใช้ต่อเนื่องช่วงใกล้คลอดอาจทำให้ทารกมีอาการขาดยาหลังคลอด',
      postpartum: 'แม่บางคนเปลี่ยนยาเป็นมอร์ฟีนได้เร็ว ทำให้ลูกที่กินนมแม่ง่วงซึมหรือหายใจช้า',
    },
  },
  {
    kind: 'medicine',
    name: 'ยาลดน้ำมูก แก้คัดจมูกชนิดกิน',
    lookFor: 'Pseudoephedrine, Phenylephrine (ยาแก้หวัดสูตรผสม)',
    level: { pregnant: 'caution', postpartum: 'caution' },
    why: {
      pregnant: 'เลี่ยงในไตรมาสแรก และในคนที่มีความดันสูง',
      postpartum: 'ซูโดเอฟีดรีนทำให้น้ำนมลดลงได้ ใช้น้ำเกลือล้างจมูกแทนก่อน',
    },
  },
  {
    kind: 'medicine',
    name: 'ยาคุมกำเนิดชนิดฮอร์โมนรวม',
    lookFor: 'ยาคุมที่มีเอสโตรเจน (Ethinylestradiol) เช่น ยาคุมแบบ 21/28 เม็ดทั่วไป',
    level: { pregnant: null, postpartum: 'caution' },
    why: {
      pregnant: null,
      postpartum: 'เอสโตรเจนทำให้น้ำนมลดลง ช่วงให้นมใช้ยาคุมฮอร์โมนเดี่ยว (Progestin-only) แทน',
    },
  },
  {
    kind: 'medicine',
    name: 'ยาขับเลือด ยาสตรี ยาดอง ยาสมุนไพรไม่ทราบส่วนผสม',
    lookFor: 'ยาสตรี ยาประสะไพล ยาดองเหล้า ยาลูกกลอน',
    level: { pregnant: 'avoid', postpartum: 'caution' },
    why: {
      pregnant: 'บางชนิดกระตุ้นการบีบตัวของมดลูก เสี่ยงแท้งหรือคลอดก่อนกำหนด ยาลูกกลอนอาจมีสเตียรอยด์',
      postpartum: 'ยาดองมีแอลกอฮอล์ผ่านน้ำนม ยาสมุนไพรบางชนิดยังไม่มีข้อมูลในแม่ให้นม',
    },
  },
  {
    kind: 'medicine',
    name: 'ยาลดความอ้วน ยาระบาย ชาดีท็อกซ์',
    lookFor: 'ยาลดน้ำหนัก, ไซบูทรามีน, ชาสมุนไพรขับถ่าย',
    level: { pregnant: 'avoid', postpartum: 'avoid' },
    why: {
      pregnant: 'ร่างกายต้องการพลังงานเพิ่มสำหรับลูก บางผลิตภัณฑ์ลักลอบใส่ยาอันตราย',
      postpartum: 'ทำให้น้ำนมลดและสารบางตัวผ่านน้ำนม ควรลดน้ำหนักช้า ๆ ด้วยอาหารและการเคลื่อนไหว',
    },
  },
]

/** ทางเลือกที่ใช้ได้ทั่วไป (ยังควรใช้ตามขนาดบนฉลาก) */
export const SAFER_CHOICES: Record<Phase, { name: string; note: string }[]> = {
  pregnant: [
    { name: 'กันแดดชนิดแร่ (Zinc oxide, Titanium dioxide)', note: 'ช่วยป้องกันฝ้าที่มักเกิดช่วงตั้งครรภ์' },
    { name: 'Azelaic acid, Benzoyl peroxide ความเข้มข้นต่ำ', note: 'ใช้รักษาสิวแทนเรตินอยด์ได้' },
    { name: 'วิตามินซี, ไนอาซินาไมด์ (Niacinamide)', note: 'ช่วยเรื่องฝ้าและผิวหมองคล้ำ' },
    { name: 'พาราเซตามอล (Paracetamol)', note: 'ยาแก้ปวด ลดไข้ ที่ใช้ได้ตลอดการตั้งครรภ์ ตามขนาดบนฉลาก' },
  ],
  postpartum: [
    { name: 'พาราเซตามอล และไอบูโพรเฟน', note: 'ยาแก้ปวดที่ใช้ได้ขณะให้นม ตามขนาดบนฉลาก' },
    { name: 'ยาแก้แพ้ชนิดไม่ง่วง (Loratadine, Cetirizine)', note: 'ใช้ระยะสั้นได้ขณะให้นม' },
    { name: 'น้ำเกลือล้างจมูก', note: 'แก้คัดจมูกโดยไม่กระทบน้ำนม' },
    { name: 'ยาคุมฮอร์โมนเดี่ยว ห่วงอนามัย ยาฝังคุมกำเนิด', note: 'คุมกำเนิดได้โดยไม่ลดน้ำนม' },
  ],
}

export const productsFor = (phase: Phase, kind: ProductKind) =>
  AVOID_PRODUCTS.filter((p) => p.kind === kind && p.level[phase] !== null).sort(
    (a, b) => Number(b.level[phase] === 'avoid') - Number(a.level[phase] === 'avoid'),
  )
