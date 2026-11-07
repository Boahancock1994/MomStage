/**
 * ชุมชนแบ่งตามช่วงวัย — ตรรกะโพสต์ + ที่เก็บข้อมูล
 *
 * ส่วนบน: ฟังก์ชันล้วน (ช่วงวัยของโพสต์ การเรียงฟีด ตรวจลิงก์) — ทดสอบได้ ไม่ขึ้นกับที่เก็บ
 * ส่วนล่าง: postRepository เก็บใน localStorage ทุกฟังก์ชันคืน Promise
 *   → ย้ายไป Firestore ได้โดยเขียน repository ใหม่ที่มี method เดียวกัน แล้วเปลี่ยนบรรทัด `export const postRepository`
 */
import { subDays } from 'date-fns'
import { COMMUNITY_SEED } from '../data/communitySeed'
import type { Child } from '../types'
import { getBabyAge, getPregnancyWeek } from './age'

// ---------------- ช่วงวัยและหมวด ----------------

export type StageTag = 'preg-t1' | 'preg-t2' | 'preg-t3' | 'm0-3' | 'm4-6' | 'm7-12' | 'y1-2' | 'y2-3'

/** เรียงตามลำดับเวลา — ใช้หา "ช่วงถัดไป" */
export const STAGES: { id: StageTag; label: string }[] = [
  { id: 'preg-t1', label: 'ตั้งครรภ์ไตรมาส 1' },
  { id: 'preg-t2', label: 'ตั้งครรภ์ไตรมาส 2' },
  { id: 'preg-t3', label: 'ตั้งครรภ์ไตรมาส 3' },
  { id: 'm0-3', label: '0–3 เดือน' },
  { id: 'm4-6', label: '4–6 เดือน' },
  { id: 'm7-12', label: '7–12 เดือน' },
  { id: 'y1-2', label: '1–2 ปี' },
  { id: 'y2-3', label: '2–3 ปี' },
]

export const stageLabel = (tag: StageTag) => STAGES.find((s) => s.id === tag)!.label

export type PostCategory = 'mom-health' | 'breastfeeding' | 'sleep' | 'solids' | 'review'

export const CATEGORIES: { id: PostCategory; label: string }[] = [
  { id: 'mom-health', label: 'สุขภาพแม่' },
  { id: 'breastfeeding', label: 'นมแม่' },
  { id: 'sleep', label: 'การนอน' },
  { id: 'solids', label: 'อาหารเสริม' },
  { id: 'review', label: 'ของใช้ที่รีวิว' },
]

export const categoryLabel = (c: PostCategory) => CATEGORIES.find((x) => x.id === c)!.label

export interface Post {
  id: string
  authorName: string
  /** อายุลูก (เดือนเต็ม) ณ วันโพสต์ — null ถ้ายังตั้งครรภ์ */
  childAgeMonthsAtPost: number | null
  /** อายุครรภ์ (สัปดาห์) ณ วันโพสต์ — มีเมื่อยังตั้งครรภ์ */
  pregnancyWeekAtPost?: number
  /** คำนวณอัตโนมัติจากอายุลูกของคนโพสต์ ณ วันโพสต์ */
  stageTag: StageTag
  category: PostCategory
  title: string
  body: string
  /** ISO datetime */
  createdAt: string
  helpfulCount: number
  /** เฉพาะรีวิวของใช้ */
  productName?: string
  /** เฉพาะรีวิวของใช้ — รูปย่อขนาดแล้ว (data URL) */
  imageDataUrl?: string
}

/** ช่วงวัยจากอายุครรภ์หรืออายุลูก */
export function stageFromAge(input: { pregnancyWeek?: number; ageMonths?: number | null }): StageTag {
  if (input.ageMonths === null || input.ageMonths === undefined) {
    const w = input.pregnancyWeek ?? 0
    if (w >= 28) return 'preg-t3'
    if (w >= 14) return 'preg-t2'
    return 'preg-t1'
  }
  const m = input.ageMonths
  if (m < 4) return 'm0-3'
  if (m < 7) return 'm4-6'
  if (m < 12) return 'm7-12'
  if (m < 24) return 'y1-2'
  return 'y2-3'
}

/** ช่วงวัยของลูก ณ วันที่กำหนด (null ถ้ายังไม่มีวันที่) */
export function getChildStage(child: Child, at: Date = new Date()): { stage: StageTag; ageMonths: number | null; pregnancyWeek?: number } | null {
  if (child.mode === 'pregnant' && child.dueDate) {
    const week = Math.max(0, getPregnancyWeek(child.dueDate, at).weeks)
    return { stage: stageFromAge({ pregnancyWeek: week }), ageMonths: null, pregnancyWeek: week }
  }
  if (child.mode === 'born' && child.birthDate) {
    const months = getBabyAge(child.birthDate, at).months
    return { stage: stageFromAge({ ageMonths: months }), ageMonths: months }
  }
  return null
}

export type FeedGroup = 'same' | 'next' | 'other'

/**
 * เรียงฟีด: ช่วงเดียวกับผู้ใช้ก่อน → ช่วงถัด ๆ ไปตามลำดับ (แม่อยากรู้ล่วงหน้า) → ช่วงที่ผ่านมาแล้ว
 * ภายในช่วงเดียวกันเรียงโพสต์ใหม่ก่อน · ถ้าไม่ทราบช่วงของผู้ใช้ เรียงใหม่ก่อนทั้งหมด
 */
export function sortFeed(posts: Post[], userStage: StageTag | null): { post: Post; group: FeedGroup }[] {
  const order = STAGES.map((s) => s.id)
  const u = userStage ? order.indexOf(userStage) : -1
  const rank = (p: Post) => {
    if (u < 0) return 0
    const d = order.indexOf(p.stageTag) - u
    return d >= 0 ? d : order.length - d // ช่วงที่ผ่านมาแล้วไปท้ายสุด ใกล้ก่อนไกล
  }
  return [...posts]
    .sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt))
    .map((post) => {
      const r = rank(post)
      const group: FeedGroup = u < 0 ? 'other' : r === 0 ? 'same' : r < order.length ? 'next' : 'other'
      return { post, group }
    })
}

/** ตรวจว่ามีลิงก์หรือช่องทางซื้อขายไหม (ห้ามมีในโพสต์) */
export function containsLink(text: string): boolean {
  return /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|net|org|shop|store|link|ly|me|th|io|app)\b|line\.me|@[a-z0-9_.]{3,}|shopee|lazada|tiktok\s*shop)/i.test(text)
}

export interface NewPostInput {
  authorName: string
  category: PostCategory
  title: string
  body: string
  productName?: string
  imageDataUrl?: string
}

export const TITLE_MAX = 80
export const BODY_MAX = 1500

/** ตรวจข้อมูลก่อนโพสต์ — คืนข้อความผิดพลาดรายช่อง */
export function validatePost(input: NewPostInput): Partial<Record<keyof NewPostInput, string>> {
  const errors: Partial<Record<keyof NewPostInput, string>> = {}
  if (!input.authorName.trim()) errors.authorName = 'กรุณาใส่ชื่อที่ใช้แสดง'
  if (!input.title.trim()) errors.title = 'กรุณาใส่หัวข้อ'
  else if (input.title.length > TITLE_MAX) errors.title = `หัวข้อยาวได้ไม่เกิน ${TITLE_MAX} ตัวอักษร`
  if (input.body.trim().length < 10) errors.body = 'เล่าอย่างน้อย 10 ตัวอักษร'
  else if (input.body.length > BODY_MAX) errors.body = `ยาวได้ไม่เกิน ${BODY_MAX} ตัวอักษร`
  if (input.category === 'review' && !input.productName?.trim()) errors.productName = 'รีวิวต้องใส่ชื่อสินค้า'
  for (const key of ['title', 'body', 'productName', 'authorName'] as const) {
    if (!errors[key] && input[key] && containsLink(input[key]!)) errors[key] = 'ห้ามใส่ลิงก์ ไอดีร้านค้า หรือช่องทางซื้อขาย'
  }
  return errors
}

export function seedPosts(now: Date = new Date()): Post[] {
  return COMMUNITY_SEED.map(({ daysAgo, ...p }) => ({ ...p, createdAt: subDays(now, daysAgo).toISOString() }))
}

// ---------------- ที่เก็บข้อมูล (localStorage) ----------------

export interface PostRepository {
  list(): Promise<Post[]>
  create(input: NewPostInput, author: Child, now?: Date): Promise<Post>
  /** กด/ยกเลิก "มีประโยชน์" — นับได้ 1 ครั้งต่อโพสต์ต่อเครื่อง กดอีกครั้งเพื่อยกเลิก คืนโพสต์ที่อัปเดต */
  toggleHelpful(postId: string): Promise<Post | undefined>
  helpfulIds(): Promise<Set<string>>
}

const POSTS_KEY = 'momstage:posts:v1'
const HELPFUL_KEY = 'momstage:posts:helpful:v1'

/** localStorage ถ้าใช้ได้ ไม่งั้นใช้หน่วยความจำ (เช่น ตอนรันเทสต์ หรือโหมดส่วนตัวบางเบราว์เซอร์) */
function createStorage() {
  const memory = new Map<string, string>()
  const ls = (() => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null
    } catch {
      return null
    }
  })()
  return {
    get(key: string): string | null {
      try {
        return ls ? ls.getItem(key) : (memory.get(key) ?? null)
      } catch {
        return memory.get(key) ?? null
      }
    },
    set(key: string, value: string) {
      if (ls) ls.setItem(key, value) // ปล่อยให้ error พื้นที่เต็มเด้งไปให้หน้าแสดงข้อความ
      else memory.set(key, value)
    },
  }
}

export function createLocalPostRepository(storage = createStorage()): PostRepository {
  const readPosts = (): Post[] => {
    const raw = storage.get(POSTS_KEY)
    if (!raw) {
      const seeded = seedPosts()
      storage.set(POSTS_KEY, JSON.stringify(seeded))
      return seeded
    }
    try {
      return JSON.parse(raw) as Post[]
    } catch {
      return seedPosts()
    }
  }
  const readHelpful = (): string[] => {
    try {
      return JSON.parse(storage.get(HELPFUL_KEY) ?? '[]') as string[]
    } catch {
      return []
    }
  }

  return {
    async list() {
      return readPosts()
    },

    async create(input, author, now = new Date()) {
      const errors = validatePost(input)
      if (Object.keys(errors).length > 0) throw new Error(Object.values(errors)[0])
      const stage = getChildStage(author, now)
      if (!stage) throw new Error('ต้องมีวันกำหนดคลอดหรือวันเกิดของลูกก่อนโพสต์')
      const isReview = input.category === 'review'
      const post: Post = {
        id: `post-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        authorName: input.authorName.trim(),
        childAgeMonthsAtPost: stage.ageMonths,
        pregnancyWeekAtPost: stage.pregnancyWeek,
        stageTag: stage.stage,
        category: input.category,
        title: input.title.trim(),
        body: input.body.trim(),
        createdAt: now.toISOString(),
        helpfulCount: 0,
        productName: isReview ? input.productName?.trim() : undefined,
        imageDataUrl: isReview ? input.imageDataUrl : undefined,
      }
      storage.set(POSTS_KEY, JSON.stringify([post, ...readPosts()]))
      return post
    },

    async toggleHelpful(postId) {
      const helpful = readHelpful()
      const posts = readPosts()
      const target = posts.find((p) => p.id === postId)
      if (!target) return undefined
      const marked = helpful.includes(postId)
      const updated = { ...target, helpfulCount: Math.max(0, target.helpfulCount + (marked ? -1 : 1)) }
      storage.set(POSTS_KEY, JSON.stringify(posts.map((p) => (p.id === postId ? updated : p))))
      storage.set(HELPFUL_KEY, JSON.stringify(marked ? helpful.filter((id) => id !== postId) : [...helpful, postId]))
      return updated
    },

    async helpfulIds() {
      return new Set(readHelpful())
    },
  }
}

/** ที่เก็บที่แอปใช้อยู่ — เปลี่ยนเป็น Firestore ได้ที่บรรทัดนี้บรรทัดเดียว */
export const postRepository: PostRepository = createLocalPostRepository()
