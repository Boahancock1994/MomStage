/**
 * โพสต์ตัวอย่าง 12 โพสต์ ครอบคลุมทุกช่วงวัย (ตั้งครรภ์ 3 ไตรมาส + 5 ช่วงหลังคลอด)
 * ให้หน้าชุมชนไม่ว่างตอนเปิดครั้งแรก — เป็นประสบการณ์สมมติ ไม่มีชื่อแบรนด์และไม่มีลิงก์
 * วันที่โพสต์คำนวณถอยจาก "วันนี้" ตาม daysAgo
 */
import type { PostCategory, StageTag } from '../lib/posts'

export interface SeedPost {
  id: string
  authorName: string
  stageTag: StageTag
  childAgeMonthsAtPost: number | null
  pregnancyWeekAtPost?: number
  category: PostCategory
  title: string
  body: string
  productName?: string
  helpfulCount: number
  daysAgo: number
}

export const COMMUNITY_SEED: SeedPost[] = [
  {
    id: 'seed-01',
    authorName: 'แม่น้องข้าวตัง',
    stageTag: 'preg-t1',
    childAgeMonthsAtPost: null,
    pregnancyWeekAtPost: 9,
    category: 'mom-health',
    title: 'แพ้ท้องหนักมาก ทำอย่างไรให้กินได้บ้าง',
    body: 'ช่วง 8–10 สัปดาห์อาเจียนทุกเช้า ที่ช่วยได้คือกินขนมปังกรอบก่อนลุกจากเตียง แบ่งกินมื้อเล็ก ๆ ทุก 2 ชั่วโมง และจิบน้ำขิงอุ่น ถ้าอาเจียนจนกินอะไรไม่ได้เลยหรือปัสสาวะน้อย หมอบอกให้รีบมาโรงพยาบาลนะคะ',
    helpfulCount: 24,
    daysAgo: 3,
  },
  {
    id: 'seed-02',
    authorName: 'แม่ปุยฝ้าย',
    stageTag: 'preg-t2',
    childAgeMonthsAtPost: null,
    pregnancyWeekAtPost: 22,
    category: 'mom-health',
    title: 'ตรวจน้ำตาลตอน 24 สัปดาห์ เตรียมตัวยังไง',
    body: 'คุณหมอนัดตรวจคัดกรองเบาหวานขณะตั้งครรภ์ ต้องดื่มน้ำตาลแล้วเจาะเลือดหลัง 1 ชั่วโมง วันนั้นกินตามปกติได้ แต่พยายามลดของหวานก่อนหน้าสักสองสามวัน และเผื่อเวลาอยู่โรงพยาบาลครึ่งเช้าค่ะ',
    helpfulCount: 15,
    daysAgo: 6,
  },
  {
    id: 'seed-03',
    authorName: 'แม่น้องภูผา',
    stageTag: 'preg-t3',
    childAgeMonthsAtPost: null,
    pregnancyWeekAtPost: 34,
    category: 'review',
    title: 'รีวิวหมอนรองครรภ์ทรงตัว U ใช้มา 2 เดือน',
    body: 'ช่วงท้องใหญ่นอนตะแคงซ้ายแล้วปวดหลัง ใช้หมอนทรงตัว U รองทั้งท้องและเข่า หลับยาวขึ้นมาก ข้อเสียคือใหญ่ กินที่บนเตียงเยอะ ถ้าห้องเล็กอาจเลือกแบบลิ่มแทน',
    productName: 'หมอนรองครรภ์ทรงตัว U',
    helpfulCount: 31,
    daysAgo: 2,
  },
  {
    id: 'seed-04',
    authorName: 'แม่น้องใบบัว',
    stageTag: 'preg-t3',
    childAgeMonthsAtPost: null,
    pregnancyWeekAtPost: 36,
    category: 'breastfeeding',
    title: 'เตรียมตัวให้นมแม่ตั้งแต่ก่อนคลอด',
    body: 'ไปเข้าโรงเรียนพ่อแม่ของโรงพยาบาล ได้ฝึกท่าอุ้มกับตุ๊กตาและดูวิธีให้ลูกอมหัวนมลึก ๆ พอคลอดจริงไม่ตื่นเต้นมาก แนะนำให้พาสามีไปด้วย จะได้ช่วยจัดท่าตอนกลางคืนค่ะ',
    helpfulCount: 12,
    daysAgo: 9,
  },
  {
    id: 'seed-05',
    authorName: 'แม่น้องมะปราง',
    stageTag: 'm0-3',
    childAgeMonthsAtPost: 1,
    category: 'breastfeeding',
    title: 'น้ำนมมาน้อยช่วงสัปดาห์แรก',
    body: 'สามวันแรกน้ำนมน้อยมากจนเครียด พยาบาลแนะนำให้ลูกดูดบ่อย ๆ ทุก 2–3 ชั่วโมง ดื่มน้ำมาก ๆ และพักผ่อน พอวันที่ 5 น้ำนมเริ่มมาเยอะขึ้น ดูว่าลูกพอไหมจากผ้าอ้อมเปียกวันละ 6 ผืนขึ้นไปค่ะ',
    helpfulCount: 42,
    daysAgo: 1,
  },
  {
    id: 'seed-06',
    authorName: 'แม่น้องข้าวปั้น',
    stageTag: 'm0-3',
    childAgeMonthsAtPost: 2,
    category: 'sleep',
    title: 'ลูกสลับกลางวันกลางคืน แก้ได้',
    body: 'กลางวันเปิดม่านให้ห้องสว่าง เล่นพูดคุยตอนตื่น กลางคืนเปิดไฟสลัว ให้นมเงียบ ๆ ไม่เล่นด้วย ทำแบบนี้ประมาณสองสัปดาห์ ลูกเริ่มหลับยาวตอนกลางคืนขึ้นค่ะ',
    helpfulCount: 27,
    daysAgo: 4,
  },
  {
    id: 'seed-07',
    authorName: 'แม่น้องน้ำใส',
    stageTag: 'm4-6',
    childAgeMonthsAtPost: 5,
    category: 'solids',
    title: 'เตรียมเริ่มอาหารตามวัย ต้องรอครบ 6 เดือนไหม',
    body: 'ถามคุณหมอที่คลินิกเด็กดี แนะนำนมแม่อย่างเดียวถึง 6 เดือนแล้วค่อยเริ่มอาหารบดละเอียดวันละมื้อ ระหว่างนี้เตรียมเก้าอี้กินข้าวและช้อนนิ่มไว้ก่อน สังเกตว่าลูกนั่งตัวตรงได้และสนใจอาหารที่เรากินค่ะ',
    helpfulCount: 19,
    daysAgo: 5,
  },
  {
    id: 'seed-08',
    authorName: 'แม่น้องอิ่มบุญ',
    stageTag: 'm4-6',
    childAgeMonthsAtPost: 6,
    category: 'review',
    title: 'รีวิวเก้าอี้กินข้าวแบบพับได้',
    body: 'ชอบที่มีสายรัดห้าจุดและถาดถอดล้างได้ พับเก็บข้างตู้เย็นได้ ข้อควรระวังคือขาเก้าอี้ค่อนข้างเบา ต้องวางบนพื้นเรียบ และอย่าปล่อยให้ลูกนั่งคนเดียวค่ะ',
    productName: 'เก้าอี้กินข้าวเด็กแบบพับได้',
    helpfulCount: 9,
    daysAgo: 8,
  },
  {
    id: 'seed-09',
    authorName: 'แม่น้องโอบอุ่น',
    stageTag: 'm7-12',
    childAgeMonthsAtPost: 9,
    category: 'solids',
    title: 'ลูกเริ่มหยิบอาหารกินเอง เมนูไหนปลอดภัย',
    body: 'ช่วง 9 เดือนลูกอยากหยิบเอง ใช้ฟักทองนึ่ง มันนึ่ง กล้วยหั่นเป็นแท่งพอดีมือ นิ่มพอบี้ด้วยนิ้วได้ เลี่ยงของแข็งกลม ๆ อย่างองุ่นทั้งลูกหรือถั่ว และนั่งอยู่ข้าง ๆ ทุกครั้งค่ะ',
    helpfulCount: 22,
    daysAgo: 7,
  },
  {
    id: 'seed-10',
    authorName: 'แม่น้องพริกไทย',
    stageTag: 'm7-12',
    childAgeMonthsAtPost: 11,
    category: 'sleep',
    title: 'ฟันขึ้นแล้วตื่นกลางดึกบ่อย',
    body: 'ลูกตื่นงอแงคืนละหลายรอบช่วงฟันกรามขึ้น ให้กัดยางกัดเย็น ๆ ก่อนนอน และรักษาเวลานอนให้เหมือนเดิมทุกคืน ประมาณหนึ่งสัปดาห์ก็กลับมาหลับดีค่ะ ถ้ามีไข้สูงร่วมด้วยควรไปหาหมอ',
    helpfulCount: 14,
    daysAgo: 10,
  },
  {
    id: 'seed-11',
    authorName: 'แม่น้องตะวัน',
    stageTag: 'y1-2',
    childAgeMonthsAtPost: 18,
    category: 'mom-health',
    title: 'กลับไปทำงานแล้วเหนื่อยมาก แบ่งเวลายังไง',
    body: 'แบ่งงานบ้านกับสามีเป็นตาราง ทำกับข้าวเตรียมไว้วันอาทิตย์ และให้เวลากับลูกเต็มที่ช่วงก่อนนอนครึ่งชั่วโมงโดยไม่จับมือถือ รู้สึกผิดน้อยลงเยอะค่ะ ถ้าเศร้าหรือหมดแรงต่อเนื่องหลายสัปดาห์ ลองคุยกับคุณหมอนะคะ',
    helpfulCount: 18,
    daysAgo: 12,
  },
  {
    id: 'seed-12',
    authorName: 'แม่น้องเมฆา',
    stageTag: 'y2-3',
    childAgeMonthsAtPost: 28,
    category: 'review',
    title: 'รีวิวกระโถนฝึกขับถ่ายทรงเตี้ย',
    body: 'เริ่มฝึกตอน 2 ขวบครึ่ง เลือกแบบที่นั่งแล้วเท้าวางถึงพื้น ลูกรู้สึกมั่นคงไม่กลัว ทำความสะอาดง่ายเพราะถังในยกออกได้ ใช้ร่วมกับการพาไปนั่งหลังตื่นนอนและหลังกินข้าว ประมาณ 3 สัปดาห์ก็บอกได้เองค่ะ',
    productName: 'กระโถนฝึกขับถ่ายทรงเตี้ย',
    helpfulCount: 11,
    daysAgo: 14,
  },
]
