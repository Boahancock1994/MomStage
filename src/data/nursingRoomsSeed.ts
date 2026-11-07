/**
 * จุดเริ่มต้นของแผนที่ห้องให้นม — ห้างและโรงพยาบาลใหญ่ในกรุงเทพฯ และสนามบิน
 *
 * ที่มาของข้อมูล:
 * - ชื่อสถานที่และพิกัด: พิกัดระดับอาคาร (ทางเข้าหลัก/กึ่งกลางอาคาร) อ้างอิงตำแหน่งบน OpenStreetMap
 *   คลาดเคลื่อนได้ราว 100–200 เมตร — ใช้เพื่อนำทางไปถึงอาคาร แล้วถามจุดประชาสัมพันธ์
 * - ชั้นของห้องให้นม: ใส่เฉพาะที่มีแหล่งระบุ (รีวิว/บทความผู้ใช้ ไม่ใช่ประกาศทางการของห้าง)
 *     CentralWorld ชั้น 6 Family Lounge — khajochi.com (2015), tofuvtravels.com
 *     Siam Paragon ชั้น 3 Baby Care Lounge — parentsone.com
 *     ICONSIAM ชั้น 4 (Takashimaya) — โพสต์ผู้ใช้ TikTok
 *     EmQuartier ชั้น 2–3 (แหล่งข้อมูลขัดแย้ง)
 *   ที่ไม่มีแหล่งระบุ ใส่ floor ว่าง ให้ผู้ใช้ช่วยเติม
 * - จุดตั้งต้นนับเป็น "ยืนยันโดยแอป" ณ วันที่โหลดครั้งแรก (ดู seedPlaces ใน src/lib/places.ts) → แสดงเป็นสีเขียว
 *   ถ้าไม่มีผู้ใช้กด "ยังมีอยู่" ต่อภายใน 90 วัน จะกลายเป็นสีเทา
 */
import type { Amenity } from '../lib/places'

export interface PlaceSeed {
  id: string
  name: string
  kind: 'mall' | 'hospital' | 'airport'
  floor: string
  lat: number
  lng: number
  amenities: Amenity[]
}

export const NURSING_ROOM_SEED: PlaceSeed[] = [
  // ---- ห้างสรรพสินค้า ----
  { id: 'seed-centralworld', name: 'เซ็นทรัลเวิลด์ (Family Lounge)', kind: 'mall', floor: 'ชั้น 6', lat: 13.7466, lng: 100.5393, amenities: ['sink', 'chair', 'changing', 'aircon'] },
  { id: 'seed-paragon', name: 'สยามพารากอน (Baby Care Lounge)', kind: 'mall', floor: 'ชั้น 3', lat: 13.7462, lng: 100.5347, amenities: ['sink', 'chair', 'changing', 'aircon'] },
  { id: 'seed-iconsiam', name: 'ไอคอนสยาม', kind: 'mall', floor: 'ชั้น 4 (ฝั่งสยามทาคาชิมายะ)', lat: 13.7267, lng: 100.5106, amenities: ['chair', 'changing', 'aircon'] },
  { id: 'seed-emquartier', name: 'ดิ เอ็มควอเทียร์', kind: 'mall', floor: 'ชั้น 2–3 (สอบถามประชาสัมพันธ์)', lat: 13.7310, lng: 100.5697, amenities: ['changing', 'aircon'] },
  { id: 'seed-emporium', name: 'ดิ เอ็มโพเรียม', kind: 'mall', floor: '', lat: 13.7302, lng: 100.5694, amenities: ['changing', 'aircon'] },
  { id: 'seed-terminal21', name: 'เทอร์มินอล 21 อโศก', kind: 'mall', floor: '', lat: 13.7376, lng: 100.5603, amenities: ['changing', 'aircon'] },
  { id: 'seed-central-rama9', name: 'เซ็นทรัล พระราม 9', kind: 'mall', floor: '', lat: 13.7587, lng: 100.5655, amenities: ['changing', 'aircon'] },
  { id: 'seed-central-ladprao', name: 'เซ็นทรัล ลาดพร้าว', kind: 'mall', floor: '', lat: 13.8167, lng: 100.5603, amenities: ['changing', 'aircon'] },
  { id: 'seed-mall-bangkapi', name: 'เดอะมอลล์ บางกะปิ', kind: 'mall', floor: '', lat: 13.7666, lng: 100.6431, amenities: ['changing', 'aircon'] },
  { id: 'seed-fashion-island', name: 'แฟชั่นไอส์แลนด์', kind: 'mall', floor: '', lat: 13.8251, lng: 100.6788, amenities: ['changing', 'aircon'] },
  { id: 'seed-seacon', name: 'ซีคอนสแควร์ ศรีนครินทร์', kind: 'mall', floor: '', lat: 13.6940, lng: 100.6475, amenities: ['changing', 'aircon'] },
  { id: 'seed-mega-bangna', name: 'เมกาบางนา', kind: 'mall', floor: '', lat: 13.6467, lng: 100.6800, amenities: ['changing', 'aircon'] },
  { id: 'seed-central-pinklao', name: 'เซ็นทรัล ปิ่นเกล้า', kind: 'mall', floor: '', lat: 13.7780, lng: 100.4762, amenities: ['changing', 'aircon'] },
  // ---- โรงพยาบาล (มีคลินิก/มุมนมแม่) ----
  { id: 'seed-qsnich', name: 'สถาบันสุขภาพเด็กแห่งชาติมหาราชินี (รพ.เด็ก)', kind: 'hospital', floor: '', lat: 13.7663, lng: 100.5345, amenities: ['sink', 'chair', 'changing'] },
  { id: 'seed-siriraj', name: 'โรงพยาบาลศิริราช', kind: 'hospital', floor: '', lat: 13.7589, lng: 100.4851, amenities: ['sink', 'chair'] },
  { id: 'seed-chula', name: 'โรงพยาบาลจุฬาลงกรณ์', kind: 'hospital', floor: '', lat: 13.7326, lng: 100.5359, amenities: ['sink', 'chair'] },
  { id: 'seed-rama', name: 'โรงพยาบาลรามาธิบดี', kind: 'hospital', floor: '', lat: 13.7656, lng: 100.5267, amenities: ['sink', 'chair'] },
  // ---- สนามบิน ----
  { id: 'seed-suvarnabhumi', name: 'ท่าอากาศยานสุวรรณภูมิ', kind: 'airport', floor: 'หลายจุดในอาคารผู้โดยสาร', lat: 13.6900, lng: 100.7501, amenities: ['sink', 'chair', 'changing', 'aircon'] },
  { id: 'seed-donmueang', name: 'ท่าอากาศยานดอนเมือง', kind: 'airport', floor: '', lat: 13.9126, lng: 100.6067, amenities: ['chair', 'changing', 'aircon'] },
]
