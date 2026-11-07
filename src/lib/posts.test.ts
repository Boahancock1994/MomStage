import { describe, expect, it } from 'vitest'
import type { Child } from '../types'
import { DEFAULT_CALC_SETTINGS } from './babyCalc'
import { STAGES, containsLink, createLocalPostRepository, getChildStage, seedPosts, sortFeed, stageFromAge, validatePost, type Post } from './posts'

const memoryStorage = () => {
  const m = new Map<string, string>()
  return { get: (k: string) => m.get(k) ?? null, set: (k: string, v: string) => void m.set(k, v) }
}

const child = (patch: Partial<Child>): Child => ({
  id: 'c',
  name: 'น้องทดสอบ',
  mode: 'born',
  vaccineLog: {},
  growthLog: [],
  quizResults: [],
  checklist: {},
  careLog: [],
  calcSettings: DEFAULT_CALC_SETTINGS,
  favoriteNames: [],
  ...patch,
})

describe('stageTag', () => {
  it('ไตรมาสจากอายุครรภ์ และช่วงจากอายุลูก (ขอบเขตแต่ละช่วง)', () => {
    expect(stageFromAge({ pregnancyWeek: 13 })).toBe('preg-t1')
    expect(stageFromAge({ pregnancyWeek: 14 })).toBe('preg-t2')
    expect(stageFromAge({ pregnancyWeek: 28 })).toBe('preg-t3')
    expect(stageFromAge({ ageMonths: 0 })).toBe('m0-3')
    expect(stageFromAge({ ageMonths: 3 })).toBe('m0-3')
    expect(stageFromAge({ ageMonths: 4 })).toBe('m4-6')
    expect(stageFromAge({ ageMonths: 7 })).toBe('m7-12')
    expect(stageFromAge({ ageMonths: 12 })).toBe('y1-2')
    expect(stageFromAge({ ageMonths: 24 })).toBe('y2-3')
    expect(stageFromAge({ ageMonths: 40 })).toBe('y2-3')
  })

  it('getChildStage อ่านจากวันเกิด/วันกำหนดคลอด ณ วันโพสต์', () => {
    const at = new Date(2026, 10, 7)
    expect(getChildStage(child({ birthDate: '2026-06-01' }), at)).toMatchObject({ stage: 'm4-6', ageMonths: 5 })
    expect(getChildStage(child({ mode: 'pregnant', dueDate: '2027-02-14' }), at)).toMatchObject({ stage: 'preg-t2', ageMonths: null })
  })
})

describe('sortFeed', () => {
  const mk = (id: string, stageTag: Post['stageTag'], createdAt: string): Post => ({
    id,
    stageTag,
    createdAt,
    authorName: 'a',
    childAgeMonthsAtPost: 1,
    category: 'sleep',
    title: 't',
    body: 'b',
    helpfulCount: 0,
  })
  const posts = [
    mk('old-same', 'm4-6', '2026-11-01'),
    mk('past', 'm0-3', '2026-11-06'),
    mk('next2', 'y1-2', '2026-11-05'),
    mk('new-same', 'm4-6', '2026-11-05'),
    mk('next1', 'm7-12', '2026-10-01'),
    mk('preg', 'preg-t3', '2026-11-07'),
  ]

  it('ช่วงเดียวกันก่อน (ใหม่ก่อน) → ช่วงถัดไปตามลำดับ → ช่วงที่ผ่านมาแล้ว (ใกล้ก่อน)', () => {
    const r = sortFeed(posts, 'm4-6')
    expect(r.map((x) => x.post.id)).toEqual(['new-same', 'old-same', 'next1', 'next2', 'past', 'preg'])
    expect(r.map((x) => x.group)).toEqual(['same', 'same', 'next', 'next', 'other', 'other'])
  })

  it('ไม่ทราบช่วงของผู้ใช้ → เรียงใหม่ก่อน', () => {
    expect(sortFeed(posts, null)[0].post.id).toBe('preg')
  })
})

describe('ห้ามลิงก์ซื้อ', () => {
  it.each(['ดูที่ https://shop.example', 'www.example.com', 'สั่งได้ที่ example.co', 'แอดไลน์ @babyshop', 'มีขายใน Shopee', 'line.me/ti/p/abc'])(
    'ตรวจพบ: %s',
    (t) => expect(containsLink(t)).toBe(true),
  )
  it('ข้อความปกติไม่ถูกจับ (รวมตัวเลขทศนิยม)', () => {
    expect(containsLink('ลูกหนัก 6.5 กก. ใช้ขวดนม 4 oz. สบายดีค่ะ')).toBe(false)
  })

  it('validatePost: รีวิวต้องมีชื่อสินค้า และห้ามลิงก์ในชื่อสินค้า', () => {
    const base = { authorName: 'แม่', category: 'review' as const, title: 'รีวิวเป้อุ้ม', body: 'ใช้ดีมาก ลูกหลับสบาย' }
    expect(validatePost(base).productName).toBeDefined()
    expect(validatePost({ ...base, productName: 'เป้อุ้ม www.shop.com' }).productName).toMatch(/ลิงก์/)
    expect(validatePost({ ...base, productName: 'เป้อุ้มเด็กแบบนั่ง' })).toEqual({})
  })
})

describe('postRepository (localStorage)', () => {
  it('seed 12 โพสต์ ครบทุกช่วงวัย', async () => {
    const repo = createLocalPostRepository(memoryStorage())
    const list = await repo.list()
    expect(list).toHaveLength(12)
    expect(new Set(list.map((p) => p.stageTag))).toEqual(new Set(STAGES.map((s) => s.id)))
    expect(seedPosts().every((p) => !containsLink(`${p.title} ${p.body} ${p.productName ?? ''}`))).toBe(true)
  })

  it('สร้างโพสต์: stageTag คำนวณจากอายุลูก ณ วันโพสต์ และอยู่บนสุด', async () => {
    const repo = createLocalPostRepository(memoryStorage())
    const now = new Date(2026, 10, 7)
    const p = await repo.create(
      { authorName: 'แม่น้องทดสอบ', category: 'sleep', title: 'ลูกนอนดึก', body: 'มีใครเจอแบบนี้บ้างคะ ช่วยแนะนำหน่อย' },
      child({ birthDate: '2026-02-01' }),
      now,
    )
    expect(p).toMatchObject({ stageTag: 'm7-12', childAgeMonthsAtPost: 9, helpfulCount: 0 })
    expect((await repo.list())[0].id).toBe(p.id)
  })

  it('ไม่ใช่รีวิว → ไม่เก็บชื่อสินค้าและรูป · มีลิงก์ → โพสต์ไม่ได้', async () => {
    const repo = createLocalPostRepository(memoryStorage())
    const p = await repo.create(
      { authorName: 'แม่', category: 'sleep', title: 'หัวข้อ', body: 'เนื้อหายาวพอสมควร', productName: 'x', imageDataUrl: 'data:image/png;base64,AAA' },
      child({ birthDate: '2026-06-01' }),
    )
    expect(p.productName).toBeUndefined()
    expect(p.imageDataUrl).toBeUndefined()
    await expect(
      repo.create({ authorName: 'แม่', category: 'sleep', title: 'หัวข้อ', body: 'ซื้อได้ที่ www.shop.com นะคะ' }, child({ birthDate: '2026-06-01' })),
    ).rejects.toThrow(/ลิงก์/)
  })

  it('กด "มีประโยชน์" นับ 1 ครั้งต่อโพสต์ และกดอีกครั้งเพื่อยกเลิก', async () => {
    const repo = createLocalPostRepository(memoryStorage())
    const before = (await repo.list()).find((p) => p.id === 'seed-05')!.helpfulCount
    expect((await repo.toggleHelpful('seed-05'))!.helpfulCount).toBe(before + 1)
    expect((await repo.helpfulIds()).has('seed-05')).toBe(true)
    expect((await repo.toggleHelpful('seed-05'))!.helpfulCount).toBe(before)
    expect((await repo.helpfulIds()).has('seed-05')).toBe(false)
    expect((await repo.list()).find((p) => p.id === 'seed-05')!.helpfulCount).toBe(before)
  })
})
