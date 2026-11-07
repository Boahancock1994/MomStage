/**
 * ตารางวัคซีนพื้นฐานตามแผนงานสร้างเสริมภูมิคุ้มกันโรค (EPI) ของกระทรวงสาธารณสุข
 *
 * แหล่งอ้างอิง (ตรวจเมื่อ พ.ย. 2569):
 * [EPI-2564] กรมควบคุมโรค, "กำหนดการให้วัคซีนตามแผนงานสร้างเสริมภูมิคุ้มกันโรค ของกระทรวงสาธารณสุข ปี 2564"
 *            https://ddc.moph.go.th/uploads/publish/1077420201130094835.pdf
 *            — หมายเหตุข้อ 4: ปรับ MMR2 จาก 2 ปี 6 เดือน เป็น 1 ปี 6 เดือน ตั้งแต่ 1 ม.ค. 2564
 * [EPI-2568] กองโรคติดต่อทั่วไป กรมควบคุมโรค, "มาตรฐานการดำเนินงานสร้างเสริมภูมิคุ้มกันโรค ปี 2568"
 *            ตารางที่ 4 หน้า 23–26  https://ddc.moph.go.th/uploads/publish/1660220250103030656.pdf
 *            — IPV 2 ครั้ง อายุ 2 และ 4 เดือน / OPV 3 ครั้งหลัง อายุ 6 เดือน 18 เดือน และ 4–6 ปี
 *
 * ageMonths = อายุ (เดือน) ที่ควรได้รับ → วันนัด = วันเกิด + ageMonths (คำนวณใน src/lib/vaccine.ts)
 * optional  = ให้เฉพาะบางกรณี ไม่นับเป็นเข็มค้าง
 * verified  = false แปลว่ายังมีจุดที่ต้องให้คนตรวจซ้ำ (ดูเหตุผลใน note)
 */

export interface Vaccine {
  id: string
  /** ชื่อย่อสากล */
  name: string
  nameTh: string
  ageMonths: number
  note: string
  source: string
  verified: boolean
  optional?: boolean
}

const EPI_2564 = 'กรมควบคุมโรค: กำหนดการให้วัคซีนตามแผนงาน EPI ปี 2564'
const EPI_2568 = 'กรมควบคุมโรค: มาตรฐานการดำเนินงานสร้างเสริมภูมิคุ้มกันโรค ปี 2568 (ตารางที่ 4)'
const BOTH = `${EPI_2564}; ${EPI_2568}`

export const VACCINES: Vaccine[] = [
  // ---- แรกเกิด ----
  {
    id: 'bcg',
    name: 'BCG',
    nameTh: 'วัณโรค (บีซีจี)',
    ageMonths: 0,
    note: 'ฉีดก่อนออกจากโรงพยาบาล ภายใน 7 วันหลังคลอด',
    source: BOTH,
    verified: true,
  },
  {
    id: 'hb1',
    name: 'HB1',
    nameTh: 'ตับอักเสบบี เข็มที่ 1',
    ageMonths: 0,
    note: 'ควรได้รับเร็วที่สุดภายใน 24 ชั่วโมงหลังคลอด',
    source: BOTH,
    verified: true,
  },
  // ---- 1 เดือน ----
  {
    id: 'hb2',
    name: 'HB2',
    nameTh: 'ตับอักเสบบี เข็มที่ 2',
    ageMonths: 1,
    note: 'เฉพาะลูกที่คลอดจากแม่ที่เป็นพาหะไวรัสตับอักเสบบี',
    source: BOTH,
    verified: true,
    optional: true,
  },
  // ---- 2 เดือน ----
  {
    id: 'dtphbhib1',
    name: 'DTP-HB-Hib1',
    nameTh: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี-ฮิบ เข็มที่ 1',
    ageMonths: 2,
    note: 'วัคซีนรวม 5 โรค',
    source: BOTH,
    verified: true,
  },
  {
    id: 'ipv1',
    name: 'IPV1',
    nameTh: 'โปลิโอชนิดฉีด เข็มที่ 1',
    ageMonths: 2,
    note: 'ตามมาตรฐานปี 2568 ฉีด IPV ที่ 2 และ 4 เดือน (ตารางปี 2564 ให้โปลิโอชนิดหยอด OPV ที่ 2 เดือนแทน) — ตรวจกับสถานพยาบาลว่าใช้ตารางใด',
    source: EPI_2568,
    verified: false,
  },
  {
    id: 'rota1',
    name: 'Rota1',
    nameTh: 'โรต้า ครั้งที่ 1 (หยอด)',
    ageMonths: 2,
    note: 'ห้ามให้ครั้งแรกในเด็กอายุมากกว่า 15 สัปดาห์',
    source: BOTH,
    verified: true,
  },
  // ---- 4 เดือน ----
  {
    id: 'dtphbhib2',
    name: 'DTP-HB-Hib2',
    nameTh: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี-ฮิบ เข็มที่ 2',
    ageMonths: 4,
    note: '',
    source: BOTH,
    verified: true,
  },
  {
    id: 'ipv2',
    name: 'IPV2',
    nameTh: 'โปลิโอชนิดฉีด เข็มที่ 2',
    ageMonths: 4,
    note: 'ตามมาตรฐานปี 2568 (ตารางปี 2564 ให้ IPV 1 เข็มคู่กับ OPV ที่ 4 เดือน)',
    source: EPI_2568,
    verified: false,
  },
  {
    id: 'rota2',
    name: 'Rota2',
    nameTh: 'โรต้า ครั้งที่ 2 (หยอด)',
    ageMonths: 4,
    note: 'ห่างจากครั้งแรกไม่น้อยกว่า 4 สัปดาห์',
    source: BOTH,
    verified: true,
  },
  // ---- 6 เดือน ----
  {
    id: 'dtphbhib3',
    name: 'DTP-HB-Hib3',
    nameTh: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี-ฮิบ เข็มที่ 3',
    ageMonths: 6,
    note: '',
    source: BOTH,
    verified: true,
  },
  {
    id: 'opv-6m',
    name: 'OPV',
    nameTh: 'โปลิโอชนิดหยอด (อายุ 6 เดือน)',
    ageMonths: 6,
    note: 'ปี 2568 เริ่มหยอด OPV ที่ 6 เดือน (ตารางปี 2564 นับเป็น OPV3 ต่อจาก 2 และ 4 เดือน)',
    source: EPI_2568,
    verified: false,
  },
  {
    id: 'rota3',
    name: 'Rota3',
    nameTh: 'โรต้า ครั้งที่ 3 (หยอด)',
    ageMonths: 6,
    note: 'ขึ้นกับชนิดวัคซีน — ถ้าได้ชนิดที่หยอด 2 ครั้งครบแล้วไม่ต้องให้ครั้งที่ 3 ห้ามให้ครั้งสุดท้ายหลังอายุ 32 สัปดาห์',
    source: BOTH,
    verified: true,
    optional: true,
  },
  {
    id: 'flu',
    name: 'Influenza',
    nameTh: 'ไข้หวัดใหญ่ตามฤดูกาล',
    ageMonths: 6,
    note: 'เด็ก 6 เดือน – 2 ปี เป็นกลุ่มเป้าหมายรับวัคซีนตามฤดูกาล ปีแรกฉีด 2 ครั้งห่างกัน 4 สัปดาห์ จากนั้นปีละครั้ง',
    source: `${EPI_2568}; กรมควบคุมโรค: แนวทางให้บริการวัคซีนไข้หวัดใหญ่ตามฤดูกาล ปี 2568`,
    verified: false,
    optional: true,
  },
  // ---- 9 เดือน ----
  {
    id: 'mmr1',
    name: 'MMR1',
    nameTh: 'หัด-คางทูม-หัดเยอรมัน เข็มที่ 1',
    ageMonths: 9,
    note: 'ถ้าไม่ได้ฉีดตอน 9 เดือน ให้รีบตามฉีดโดยเร็วที่สุด',
    source: BOTH,
    verified: true,
  },
  // ---- 1 ปี ----
  {
    id: 'laje1',
    name: 'LAJE1',
    nameTh: 'ไข้สมองอักเสบเจอี เข็มที่ 1',
    ageMonths: 12,
    note: 'ชนิดเชื้อเป็นอ่อนฤทธิ์',
    source: BOTH,
    verified: true,
  },
  // ---- 1 ปี 6 เดือน ----
  {
    id: 'dtp4',
    name: 'DTP4',
    nameTh: 'คอตีบ-บาดทะยัก-ไอกรน กระตุ้นครั้งที่ 1',
    ageMonths: 18,
    note: '',
    source: BOTH,
    verified: true,
  },
  {
    id: 'opv-18m',
    name: 'OPV',
    nameTh: 'โปลิโอชนิดหยอด (อายุ 1 ปี 6 เดือน)',
    ageMonths: 18,
    note: 'ตารางปี 2564 เรียกว่า OPV4',
    source: BOTH,
    verified: true,
  },
  {
    id: 'mmr2',
    name: 'MMR2',
    nameTh: 'หัด-คางทูม-หัดเยอรมัน เข็มที่ 2',
    ageMonths: 18,
    note: 'ปรับจาก 2 ปี 6 เดือน เป็น 1 ปี 6 เดือน ตั้งแต่ 1 ม.ค. 2564',
    source: BOTH,
    verified: true,
  },
  // ---- 2 ปี 6 เดือน ----
  {
    id: 'laje2',
    name: 'LAJE2',
    nameTh: 'ไข้สมองอักเสบเจอี เข็มที่ 2',
    ageMonths: 30,
    note: '',
    source: BOTH,
    verified: true,
  },
  // ---- 4 ปี ----
  {
    id: 'dtp5',
    name: 'DTP5',
    nameTh: 'คอตีบ-บาดทะยัก-ไอกรน กระตุ้นครั้งที่ 2',
    ageMonths: 48,
    note: 'มาตรฐานปี 2568 ระบุช่วงอายุ 4–6 ปี',
    source: BOTH,
    verified: true,
  },
  {
    id: 'opv-4y',
    name: 'OPV',
    nameTh: 'โปลิโอชนิดหยอด (อายุ 4 ปี)',
    ageMonths: 48,
    note: 'ตารางปี 2564 เรียกว่า OPV5 / มาตรฐานปี 2568 ระบุ 4–6 ปี',
    source: BOTH,
    verified: true,
  },
]
