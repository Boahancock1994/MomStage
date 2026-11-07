/**
 * แผนที่ห้องให้นมและมุมเปลี่ยนผ้าอ้อม — ตรรกะ + ที่เก็บข้อมูล
 *
 * ส่วนบน: ฟังก์ชันล้วน (ระยะทาง haversine, ความสดของข้อมูล, เรียงตามระยะ, ลิงก์นำทาง)
 * ส่วนล่าง: placeRepository เก็บใน localStorage ทุก method คืน Promise
 *   ข้อมูลนี้ควรแชร์กันทุกคน → ย้ายไป Firebase Firestore โดยเขียน repository ใหม่ที่มี method เดียวกัน
 *   (เช่น collection "places" + subcollection "votes") แล้วเปลี่ยนบรรทัด `export const placeRepository` ท้ายไฟล์บรรทัดเดียว
 */
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { NURSING_ROOM_SEED } from '../data/nursingRoomsSeed'

export type Amenity = 'sink' | 'outlet' | 'chair' | 'changing' | 'aircon'

export const AMENITIES: { id: Amenity; label: string }[] = [
  { id: 'sink', label: 'อ่างล้างมือ' },
  { id: 'outlet', label: 'ปลั๊กไฟ' },
  { id: 'chair', label: 'เก้าอี้' },
  { id: 'changing', label: 'โต๊ะเปลี่ยนผ้าอ้อม' },
  { id: 'aircon', label: 'เครื่องปรับอากาศ' },
]

export const amenityLabel = (a: Amenity) => AMENITIES.find((x) => x.id === a)!.label

export interface LatLng {
  lat: number
  lng: number
}

export interface Place extends LatLng {
  id: string
  name: string
  floor: string
  amenities: Amenity[]
  source: 'seed' | 'user'
  /** ISO datetime ที่มีคนกด "ยังมีอยู่" ล่าสุด */
  lastConfirmed?: string
  /** ISO datetime ที่มีคนกด "ปิดแล้ว" ล่าสุด */
  lastReportedClosed?: string
  confirmCount: number
  closedCount: number
  createdAt: string
}

/** ไม่มีคนยืนยันเกินกี่วันถือว่าข้อมูลเก่า (แสดงเป็นสีเทา) */
export const STALE_AFTER_DAYS = 90

/** ศูนย์กลางเริ่มต้น: กรุงเทพฯ */
export const BANGKOK_CENTER: LatLng = { lat: 13.7466, lng: 100.5393 }

const EARTH_RADIUS_KM = 6371

/** ระยะทางบนผิวโลกระหว่างสองจุด (กม.) ด้วยสูตร haversine */
export function haversineKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000 / 10) * 10} ม.`
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} กม.`
}

export type PlaceStatus = 'fresh' | 'stale' | 'closed'

/**
 * สถานะของจุด
 * - closed: รายงานว่าปิดแล้ว ใหม่กว่า (หรือพร้อมกับ) การยืนยันว่ายังมีอยู่
 * - stale: ไม่มีคนยืนยันเกิน 90 วัน (หรือไม่เคยมีใครยืนยัน)
 * - fresh: ยืนยันภายใน 90 วัน
 */
export function getPlaceStatus(p: Place, now: Date = new Date()): PlaceStatus {
  if (p.lastReportedClosed && (!p.lastConfirmed || p.lastReportedClosed >= p.lastConfirmed)) return 'closed'
  if (!p.lastConfirmed) return 'stale'
  return differenceInCalendarDays(now, parseISO(p.lastConfirmed)) > STALE_AFTER_DAYS ? 'stale' : 'fresh'
}

/** เรียงตามระยะทางจากผู้ใช้ (ใกล้ก่อน) — ไม่รู้ตำแหน่งผู้ใช้ใช้ใจกลางกรุงเทพฯ แทน */
export function sortByDistance<T extends LatLng>(places: T[], origin: LatLng | null): (T & { distanceKm: number })[] {
  const from = origin ?? BANGKOK_CENTER
  return places.map((p) => ({ ...p, distanceKm: haversineKm(from, p) })).sort((a, b) => a.distanceKm - b.distanceKm)
}

/** ลิงก์เปิดนำทางใน Google Maps */
export function googleMapsDirectionsUrl(p: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`
}

export interface NewPlaceInput extends LatLng {
  name: string
  floor: string
  amenities: Amenity[]
}

export function validatePlace(input: NewPlaceInput): Partial<Record<'name' | 'position', string>> {
  const errors: Partial<Record<'name' | 'position', string>> = {}
  if (!input.name.trim()) errors.name = 'กรุณาใส่ชื่อสถานที่'
  else if (input.name.length > 80) errors.name = 'ชื่อยาวได้ไม่เกิน 80 ตัวอักษร'
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng) || Math.abs(input.lat) > 90 || Math.abs(input.lng) > 180) {
    errors.position = 'ยังไม่ได้เลือกตำแหน่ง — แตะบนแผนที่หรือใช้ตำแหน่งปัจจุบัน'
  }
  return errors
}

/**
 * จุดตั้งต้นนับว่า "ยืนยันโดยแอป" ณ วันที่โหลดครั้งแรก → แสดงเป็นสีเขียว
 * ถ้าไม่มีผู้ใช้กด "ยังมีอยู่" ต่อภายใน 90 วัน จะกลายเป็นสีเทาตามกฎปกติ
 */
export function seedPlaces(now: Date = new Date()): Place[] {
  const iso = now.toISOString()
  return NURSING_ROOM_SEED.map(({ kind: _kind, ...p }) => ({
    ...p,
    source: 'seed' as const,
    lastConfirmed: iso,
    confirmCount: 0,
    closedCount: 0,
    createdAt: iso,
  }))
}

// ---------------- ที่เก็บข้อมูล (localStorage) ----------------

export type Vote = 'open' | 'closed'

export interface PlaceRepository {
  list(): Promise<Place[]>
  add(input: NewPlaceInput, now?: Date): Promise<Place>
  /**
   * ปุ่ม "ยังมีอยู่ / ปิดแล้ว" — 1 เสียงต่อจุดต่อเครื่อง
   * กดอีกปุ่มเพื่อเปลี่ยนใจ · กดปุ่มเดิมซ้ำเพื่อยกเลิก (เผื่อกดผิด) ค่า lastConfirmed / lastReportedClosed กลับเป็นค่าก่อนกด
   */
  vote(placeId: string, vote: Vote, now?: Date): Promise<Place | undefined>
  myVotes(): Promise<Record<string, Vote>>
}

/** เสียงของเครื่องนี้ต่อหนึ่งจุด พร้อมค่าก่อนกด เพื่อคืนค่าเมื่อยกเลิก */
interface VoteRecord {
  vote: Vote
  prevLastConfirmed?: string
  prevLastReportedClosed?: string
}

const PLACES_KEY = 'momstage:places:v1'
const VOTES_KEY = 'momstage:places:votes:v1'

type Storage = { get(key: string): string | null; set(key: string, value: string): void }

function createStorage(): Storage {
  const memory = new Map<string, string>()
  const ls = (() => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null
    } catch {
      return null
    }
  })()
  return {
    get: (key) => {
      try {
        return ls ? ls.getItem(key) : (memory.get(key) ?? null)
      } catch {
        return memory.get(key) ?? null
      }
    },
    set: (key, value) => (ls ? ls.setItem(key, value) : void memory.set(key, value)),
  }
}

export function createLocalPlaceRepository(storage: Storage = createStorage()): PlaceRepository {
  const readPlaces = (): Place[] => {
    const raw = storage.get(PLACES_KEY)
    if (raw) {
      try {
        // ข้อมูลรุ่นก่อน: จุดตั้งต้นยังไม่มี lastConfirmed → ใช้วันที่โหลดครั้งแรกแทน ให้เป็นสีเขียวเหมือนจุดตั้งต้นใหม่
        return (JSON.parse(raw) as Place[]).map((p) =>
          p.source === 'seed' && !p.lastConfirmed ? { ...p, lastConfirmed: p.createdAt } : p,
        )
      } catch {
        // ข้อมูลเสีย — เริ่มจาก seed ใหม่
      }
    }
    const seeded = seedPlaces()
    storage.set(PLACES_KEY, JSON.stringify(seeded))
    return seeded
  }
  const readVotes = (): Record<string, VoteRecord> => {
    try {
      const raw = JSON.parse(storage.get(VOTES_KEY) ?? '{}') as Record<string, VoteRecord | Vote>
      // ข้อมูลรุ่นก่อนเก็บแค่ 'open' | 'closed'
      return Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, typeof v === 'string' ? { vote: v } : v]))
    } catch {
      return {}
    }
  }
  const save = (places: Place[]) => storage.set(PLACES_KEY, JSON.stringify(places))

  return {
    async list() {
      return readPlaces()
    },

    async add(input, now = new Date()) {
      const errors = validatePlace(input)
      if (Object.keys(errors).length > 0) throw new Error(Object.values(errors)[0])
      const iso = now.toISOString()
      const place: Place = {
        id: `place-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: input.name.trim(),
        floor: input.floor.trim(),
        lat: input.lat,
        lng: input.lng,
        amenities: input.amenities,
        source: 'user',
        // คนที่เพิ่มเพิ่งเห็นกับตา จึงนับเป็นการยืนยันครั้งแรก
        lastConfirmed: iso,
        confirmCount: 1,
        closedCount: 0,
        createdAt: iso,
      }
      save([...readPlaces(), place])
      storage.set(VOTES_KEY, JSON.stringify({ ...readVotes(), [place.id]: { vote: 'open' } satisfies VoteRecord }))
      return place
    },

    async vote(placeId, vote, now = new Date()) {
      const votes = readVotes()
      const places = readPlaces()
      const target = places.find((p) => p.id === placeId)
      if (!target) return undefined
      const previous = votes[placeId]
      const updated: Place = { ...target }

      // 1) ถอนเสียงเดิมของเครื่องนี้ และคืนค่าวันที่ก่อนกด
      if (previous?.vote === 'open') {
        updated.confirmCount = Math.max(0, updated.confirmCount - 1)
        updated.lastConfirmed = previous.prevLastConfirmed
      } else if (previous?.vote === 'closed') {
        updated.closedCount = Math.max(0, updated.closedCount - 1)
        updated.lastReportedClosed = previous.prevLastReportedClosed
      }

      const next = { ...votes }
      if (previous?.vote === vote) {
        // 2a) กดปุ่มเดิมซ้ำ = ยกเลิก
        delete next[placeId]
      } else {
        // 2b) นับเสียงใหม่ จำค่าก่อนกดไว้คืนตอนยกเลิก
        next[placeId] = { vote, prevLastConfirmed: updated.lastConfirmed, prevLastReportedClosed: updated.lastReportedClosed }
        const iso = now.toISOString()
        if (vote === 'open') {
          updated.confirmCount += 1
          updated.lastConfirmed = iso
        } else {
          updated.closedCount += 1
          updated.lastReportedClosed = iso
        }
      }

      save(places.map((p) => (p.id === placeId ? updated : p)))
      storage.set(VOTES_KEY, JSON.stringify(next))
      return updated
    },

    async myVotes() {
      return Object.fromEntries(Object.entries(readVotes()).map(([id, r]) => [id, r.vote]))
    },
  }
}

/** ที่เก็บที่แอปใช้อยู่ — เปลี่ยนเป็น Firestore ได้ที่บรรทัดนี้บรรทัดเดียว */
export const placeRepository: PlaceRepository = createLocalPlaceRepository()
