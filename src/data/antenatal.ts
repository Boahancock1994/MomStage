/**
 * นัดฝากครรภ์และการตรวจตามอายุครรภ์ — แนวทางฝากครรภ์คุณภาพ 8 ครั้ง ของกระทรวงสาธารณสุข
 *
 * แหล่งอ้างอิง (ตรวจเมื่อ พ.ย. 2569):
 * [ANC-2565] กรมอนามัย, "คู่มือการฝากครรภ์ สำหรับบุคลากรสาธารณสุข" พิมพ์ครั้งที่ 1 มี.ค. 2565
 *            ตารางกิจกรรมบริการตามช่วงอายุครรภ์ หน้า 6–7: นัด ≤12, 20, 26, 30, 34, 36, 38, 40 สัปดาห์
 *            และแนวปฏิบัติรายไตรมาส หน้า 10–12
 *            https://cloud-atg.moph.go.th/ssjweb/uploads/files/1769692160_809098da_0.pdf
 * [EPI-2568] กรมควบคุมโรค, "มาตรฐานการดำเนินงานสร้างเสริมภูมิคุ้มกันโรค ปี 2568" ตารางที่ 4 ข้อ 13 (วัคซีนไอกรน aP)
 *            https://ddc.moph.go.th/uploads/publish/1660220250103030656.pdf
 *
 * weekFrom–weekTo คือช่วงอายุครรภ์ (สัปดาห์) ที่รายการนี้ "ควรทำ"
 * สำหรับนัดฝากครรภ์ ใช้สัปดาห์นัดในคู่มือเป็น weekTo และเริ่มช่วงต่อจากนัดก่อนหน้า
 * เพื่อให้ทุกสัปดาห์มีนัดที่ "กำลังถึง" เสมอ (การแบ่งช่วงนี้เป็นการตีความของแอป)
 */

export type AntenatalKind = 'visit' | 'test' | 'vaccine' | 'self-care'

export interface AntenatalItem {
  id: string
  title: string
  weekFrom: number
  weekTo: number
  description: string
  source: string
  verified: boolean
  kind: AntenatalKind
}

const ANC = 'กรมอนามัย: คู่มือการฝากครรภ์ สำหรับบุคลากรสาธารณสุข (2565)'
const EPI = 'กรมควบคุมโรค: มาตรฐานการดำเนินงานสร้างเสริมภูมิคุ้มกันโรค ปี 2568'

export const ANTENATAL_ITEMS: AntenatalItem[] = [
  {
    id: 'anc1',
    kind: 'visit',
    title: 'ฝากครรภ์ครั้งที่ 1 (ควรมาก่อน 12 สัปดาห์)',
    weekFrom: 4,
    weekTo: 12,
    description:
      'ซักประวัติ ตรวจร่างกาย เจาะเลือดครั้งที่ 1 (ความเข้มข้นเลือด ธาลัสซีเมีย หมู่เลือด ซิฟิลิส HIV ตับอักเสบบี) ตรวจปัสสาวะ อัลตราซาวด์ครั้งที่ 1 เพื่อกำหนดอายุครรภ์ ตรวจฟัน และรับสมุดบันทึกสุขภาพแม่และเด็ก',
    source: ANC,
    verified: true,
  },
  {
    id: 'supplements',
    kind: 'self-care',
    title: 'กินยาเสริมธาตุเหล็ก กรดโฟลิก ไอโอดีน และแคลเซียมทุกวัน',
    weekFrom: 4,
    weekTo: 40,
    description: 'กินทุกวันตลอดการตั้งครรภ์ตามที่ได้รับจากสถานพยาบาล ช่วยป้องกันภาวะโลหิตจางและส่งเสริมพัฒนาการสมองทารก',
    source: ANC,
    verified: true,
  },
  {
    id: 'quad-test',
    kind: 'test',
    title: 'ตรวจเลือดคัดกรองกลุ่มอาการดาวน์ (Quadruple test)',
    weekFrom: 14,
    weekTo: 18,
    description: 'รับคำปรึกษาและเจาะเลือดคัดกรอง ถ้าผลเสี่ยงสูงจะได้รับการส่งต่อเพื่อตรวจยืนยัน',
    source: ANC,
    verified: true,
  },
  {
    id: 'flu-vaccine',
    kind: 'vaccine',
    title: 'วัคซีนไข้หวัดใหญ่ (อายุครรภ์ 4 เดือนขึ้นไป)',
    weekFrom: 16,
    weekTo: 40,
    description: 'ฉีดได้ตั้งแต่อายุครรภ์ 4 เดือนขึ้นไป ช่วยป้องกันทั้งแม่และทารกช่วงแรกเกิด (แอปแปลง 4 เดือนเป็น 16 สัปดาห์)',
    source: ANC,
    verified: true,
  },
  {
    id: 'anc2',
    kind: 'visit',
    title: 'ฝากครรภ์ครั้งที่ 2 + อัลตราซาวด์ครั้งที่ 2',
    weekFrom: 13,
    weekTo: 20,
    description: 'ตรวจครรภ์และอัลตราซาวด์ช่วง 18–20 สัปดาห์ เพื่อยืนยันอายุครรภ์ ดูการเจริญเติบโตและคัดกรองความผิดปกติของโครงสร้างทารก',
    source: ANC,
    verified: true,
  },
  {
    id: 'pertussis-vaccine',
    kind: 'vaccine',
    title: 'วัคซีนป้องกันไอกรน (aP หรือ Tdap) 1 เข็ม',
    weekFrom: 20,
    weekTo: 32,
    description:
      'ฉีดทุกการตั้งครรภ์ เพื่อส่งภูมิคุ้มกันไปถึงทารกก่อนลูกได้วัคซีนเอง ควรฉีดอย่างน้อย 2 สัปดาห์ก่อนคลอด — มาตรฐานปี 2568 แนะนำ 20–32 สัปดาห์ แต่คู่มือฝากครรภ์ปี 2565 ระบุ Tdap ช่วง 27–36 สัปดาห์',
    source: `${EPI}; ${ANC}`,
    verified: false,
  },
  {
    id: 'anc3',
    kind: 'visit',
    title: 'ฝากครรภ์ครั้งที่ 3',
    weekFrom: 21,
    weekTo: 26,
    description: 'ชั่งน้ำหนัก วัดความดัน วัดความสูงยอดมดลูก ฟังเสียงหัวใจทารก ประเมินความเครียดและภาวะซึมเศร้า',
    source: ANC,
    verified: true,
  },
  {
    id: 'gdm-screen',
    kind: 'test',
    title: 'ตรวจคัดกรองเบาหวานขณะตั้งครรภ์',
    weekFrom: 24,
    weekTo: 28,
    description: 'ตรวจน้ำตาลด้วยการดื่มน้ำตาล 50 กรัม (Glucose challenge test) ทุกราย ถ้าเป็นกลุ่มเสี่ยงจะได้ตรวจตั้งแต่ฝากครรภ์ครั้งแรก',
    source: ANC,
    verified: true,
  },
  {
    id: 'kick-count',
    kind: 'self-care',
    title: 'เริ่มนับลูกดิ้นทุกวัน',
    weekFrom: 28,
    weekTo: 40,
    description: 'ตั้งแต่ 28 สัปดาห์ สังเกตและนับการดิ้นของทารก ถ้าลูกดิ้นน้อยลงให้รีบไปโรงพยาบาล',
    source: ANC,
    verified: true,
  },
  {
    id: 'anc4',
    kind: 'visit',
    title: 'ฝากครรภ์ครั้งที่ 4',
    weekFrom: 27,
    weekTo: 30,
    description: 'ตรวจครรภ์ ตรวจปัสสาวะหาโปรตีน น้ำตาล และแบคทีเรีย เรียนรู้การนับลูกดิ้นและสัญญาณเจ็บครรภ์',
    source: ANC,
    verified: true,
  },
  {
    id: 'lab2',
    kind: 'test',
    title: 'เจาะเลือดครั้งที่ 2 (LAB II)',
    weekFrom: 28,
    weekTo: 32,
    description: 'ตรวจความเข้มข้นเลือด (Hb/Hct) ซิฟิลิส และ HIV ซ้ำในไตรมาส 3 ก่อนส่งต่อไปฝากครรภ์ที่โรงพยาบาลหลัง 32 สัปดาห์',
    source: ANC,
    verified: false,
  },
  {
    id: 'anc5',
    kind: 'visit',
    title: 'ฝากครรภ์ครั้งที่ 5',
    weekFrom: 31,
    weekTo: 34,
    description: 'ตรวจครรภ์ ท่าและส่วนนำของทารก อาจอัลตราซาวด์ครั้งที่ 3 ตามดุลยพินิจแพทย์ เริ่มวางแผนการคลอดและการเลี้ยงลูกด้วยนมแม่',
    source: ANC,
    verified: true,
  },
  {
    id: 'anc6',
    kind: 'visit',
    title: 'ฝากครรภ์ครั้งที่ 6 (เริ่มนัดทุก 2 สัปดาห์)',
    weekFrom: 35,
    weekTo: 36,
    description: 'หลัง 36 สัปดาห์จะนัดถี่ขึ้นเพื่อติดตามความพร้อมก่อนคลอด สังเกตอาการเจ็บครรภ์ น้ำเดิน มูกเลือด',
    source: ANC,
    verified: true,
  },
  {
    id: 'anc7',
    kind: 'visit',
    title: 'ฝากครรภ์ครั้งที่ 7',
    weekFrom: 37,
    weekTo: 38,
    description: 'ตรวจครรภ์ ประเมินความพร้อมคลอด เตรียมกระเป๋าคลอดให้พร้อม',
    source: ANC,
    verified: true,
  },
  {
    id: 'anc8',
    kind: 'visit',
    title: 'ฝากครรภ์ครั้งที่ 8 (ครบกำหนดคลอด)',
    weekFrom: 39,
    weekTo: 40,
    description: 'ตรวจสุขภาพทารกในครรภ์ด้วยเครื่องฟังหัวใจ (NST) และอัลตราซาวด์ดูน้ำคร่ำ แพทย์จะวางแผนหากเลยกำหนดคลอด',
    source: ANC,
    verified: true,
  },
]
