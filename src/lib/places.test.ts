import { describe, expect, it } from 'vitest'
import {
  createLocalPlaceRepository,
  formatDistance,
  getPlaceStatus,
  googleMapsDirectionsUrl,
  haversineKm,
  seedPlaces,
  sortByDistance,
  validatePlace,
  type Place,
} from './places'

const memoryStorage = () => {
  const m = new Map<string, string>()
  return { get: (k: string) => m.get(k) ?? null, set: (k: string, v: string) => void m.set(k, v) }
}

describe('haversineKm', () => {
  it('จุดเดียวกัน = 0 และสลับต้นทางปลายทางได้ค่าเท่ากัน', () => {
    const a = { lat: 13.7466, lng: 100.5393 }
    const b = { lat: 13.7462, lng: 100.5347 }
    expect(haversineKm(a, a)).toBe(0)
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10)
  })

  it('เซ็นทรัลเวิลด์ → สยามพารากอน ≈ 0.5 กม. · กรุงเทพฯ → เชียงใหม่ ≈ 585 กม. (เส้นตรง)', () => {
    expect(haversineKm({ lat: 13.7466, lng: 100.5393 }, { lat: 13.7462, lng: 100.5347 })).toBeCloseTo(0.5, 1)
    expect(haversineKm({ lat: 13.7563, lng: 100.5018 }, { lat: 18.7883, lng: 98.9853 })).toBeGreaterThan(570)
    expect(haversineKm({ lat: 13.7563, lng: 100.5018 }, { lat: 18.7883, lng: 98.9853 })).toBeLessThan(600)
  })

  it('formatDistance', () => {
    expect(formatDistance(0.348)).toBe('350 ม.')
    expect(formatDistance(2.43)).toBe('2.4 กม.')
    expect(formatDistance(18.6)).toBe('19 กม.')
  })
})

describe('สถานะจุด', () => {
  const base: Place = { id: 'p', name: 'x', floor: '', lat: 0, lng: 0, amenities: [], source: 'user', confirmCount: 1, closedCount: 0, createdAt: '' }
  const now = new Date(2026, 10, 7)

  it('ยืนยันภายใน 90 วัน = fresh · เกิน 90 วันหรือไม่เคยยืนยัน = stale (สีเทา)', () => {
    expect(getPlaceStatus({ ...base, lastConfirmed: new Date(2026, 7, 9).toISOString() }, now)).toBe('fresh') // 90 วัน
    expect(getPlaceStatus({ ...base, lastConfirmed: new Date(2026, 7, 8).toISOString() }, now)).toBe('stale') // 91 วัน
    expect(getPlaceStatus({ ...base, lastConfirmed: undefined }, now)).toBe('stale')
  })

  it('รายงานปิดใหม่กว่าการยืนยัน = closed', () => {
    const p = { ...base, lastConfirmed: new Date(2026, 10, 1).toISOString(), lastReportedClosed: new Date(2026, 10, 5).toISOString() }
    expect(getPlaceStatus(p, now)).toBe('closed')
    expect(getPlaceStatus({ ...p, lastConfirmed: new Date(2026, 10, 6).toISOString() }, now)).toBe('fresh')
  })
})

describe('เรียงตามระยะ / ลิงก์นำทาง / ตรวจข้อมูล', () => {
  it('ใกล้ก่อน และไม่รู้ตำแหน่งผู้ใช้ใช้ใจกลางกรุงเทพฯ', () => {
    const places = [
      { id: 'far', lat: 13.69, lng: 100.75 },
      { id: 'near', lat: 13.7462, lng: 100.5347 },
    ]
    expect(sortByDistance(places, { lat: 13.7466, lng: 100.5393 }).map((p) => p.id)).toEqual(['near', 'far'])
    expect(sortByDistance(places, null)[0].id).toBe('near')
  })

  it('ลิงก์ Google Maps ตามรูปแบบที่กำหนด', () => {
    expect(googleMapsDirectionsUrl({ lat: 13.7466, lng: 100.5393 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=13.746600,100.539300',
    )
  })

  it('validatePlace ต้องมีชื่อและตำแหน่ง', () => {
    expect(validatePlace({ name: '', floor: '', amenities: [], lat: 13, lng: 100 }).name).toBeDefined()
    expect(validatePlace({ name: 'ห้าง', floor: '', amenities: [], lat: NaN, lng: 100 }).position).toBeDefined()
    expect(validatePlace({ name: 'ห้าง', floor: '', amenities: [], lat: 13, lng: 100 })).toEqual({})
  })
})

describe('placeRepository (localStorage)', () => {
  it('จุดตั้งต้นครบ 90 วันโดยไม่มีคนยืนยัน → สีเทา · ข้อมูลรุ่นก่อนที่ไม่มี lastConfirmed ถูกเติมให้', async () => {
    const seeded = seedPlaces(new Date(2026, 0, 1))
    expect(getPlaceStatus(seeded[0], new Date(2026, 3, 2))).toBe('stale') // 91 วัน
    const storage = memoryStorage()
    storage.set('momstage:places:v1', JSON.stringify(seeded.map(({ lastConfirmed: _l, ...p }) => p)))
    const list = await createLocalPlaceRepository(storage).list()
    expect(list[0].lastConfirmed).toBe(seeded[0].createdAt)
  })

  it('seed อย่างน้อย 15 จุด อยู่ในกรุงเทพฯ และปริมณฑล แสดงเป็นสีเขียวตั้งแต่โหลดครั้งแรก', async () => {
    const list = await createLocalPlaceRepository(memoryStorage()).list()
    expect(list.length).toBeGreaterThanOrEqual(15)
    expect(list.every((p) => p.lat > 13.5 && p.lat < 14.1 && p.lng > 100.3 && p.lng < 100.9)).toBe(true)
    expect(list.every((p) => getPlaceStatus(p) === 'fresh' && p.confirmCount === 0)).toBe(true)
    expect(new Set(seedPlaces().map((p) => p.id)).size).toBe(list.length)
  })

  it('เพิ่มจุดใหม่ = ยืนยันครั้งแรกโดยคนเพิ่ม (สด)', async () => {
    const repo = createLocalPlaceRepository(memoryStorage())
    const now = new Date(2026, 10, 7)
    const p = await repo.add({ name: 'ห้องให้นม ห้างใกล้บ้าน', floor: 'ชั้น 2', amenities: ['sink', 'outlet'], lat: 13.8, lng: 100.6 }, now)
    expect(p).toMatchObject({ source: 'user', confirmCount: 1, lastConfirmed: now.toISOString() })
    expect(getPlaceStatus(p, now)).toBe('fresh')
    expect((await repo.list()).some((x) => x.id === p.id)).toBe(true)
    expect((await repo.myVotes())[p.id]).toBe('open')
  })

  it('ยังมีอยู่ / ปิดแล้ว: 1 เสียงต่อเครื่อง เปลี่ยนใจได้ และอัปเดต lastConfirmed', async () => {
    const repo = createLocalPlaceRepository(memoryStorage())
    const seedConfirmed = (await repo.list()).find((p) => p.id === 'seed-paragon')!.lastConfirmed
    // จุดตั้งต้นถูกยืนยัน ณ เวลาที่รันเทสต์ จึงใช้วันที่ในอนาคตเพื่อให้การกดใหม่กว่าเสมอ
    const t1 = new Date(2099, 0, 1)
    const t2 = new Date(2099, 0, 5)
    let p = (await repo.vote('seed-paragon', 'open', t1))!
    expect(p).toMatchObject({ confirmCount: 1, lastConfirmed: t1.toISOString() })
    p = (await repo.vote('seed-paragon', 'closed', t2))! // เปลี่ยนใจ: ถอน "ยังมีอยู่" แล้วนับ "ปิดแล้ว"
    expect(p).toMatchObject({ confirmCount: 0, closedCount: 1, lastConfirmed: seedConfirmed, lastReportedClosed: t2.toISOString() })
    expect(getPlaceStatus(p, t2)).toBe('closed')
  })

  it('กดปุ่มเดิมซ้ำ = ยกเลิก คืนค่าเดิมทั้งจำนวนและวันที่', async () => {
    const repo = createLocalPlaceRepository(memoryStorage())
    const before = (await repo.list()).find((p) => p.id === 'seed-paragon')!
    await repo.vote('seed-paragon', 'open', new Date(2026, 10, 1))
    const undone = (await repo.vote('seed-paragon', 'open', new Date(2026, 10, 2)))!
    expect(undone).toMatchObject({ confirmCount: before.confirmCount, lastConfirmed: before.lastConfirmed })
    expect((await repo.myVotes())['seed-paragon']).toBeUndefined()

    await repo.vote('seed-paragon', 'closed', new Date(2026, 10, 3))
    const reopened = (await repo.vote('seed-paragon', 'closed', new Date(2026, 10, 4)))!
    expect(reopened).toMatchObject({ closedCount: 0, lastReportedClosed: undefined })
    expect(getPlaceStatus(reopened, new Date(2026, 10, 4))).not.toBe('closed')
  })

  it('อ่านเสียงรูปแบบเก่า (เก็บแค่ open/closed) ได้', async () => {
    const storage = memoryStorage()
    storage.set('momstage:places:votes:v1', JSON.stringify({ 'seed-paragon': 'open' }))
    expect(await createLocalPlaceRepository(storage).myVotes()).toEqual({ 'seed-paragon': 'open' })
  })
})
