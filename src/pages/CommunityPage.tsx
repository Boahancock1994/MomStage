/**
 * ชุมชนแบ่งตามช่วงวัย — ฟีดเรียงช่วงเดียวกับผู้ใช้ก่อน แล้วตามด้วยช่วงถัดไป
 * ตรรกะและที่เก็บข้อมูลอยู่ใน src/lib/posts.ts (สลับไป Firestore ได้ที่ไฟล์นั้นไฟล์เดียว)
 */
import { ChatCircleTextIcon, ImageSquareIcon, PencilSimpleLineIcon, TagIcon, ThumbsUpIcon, XIcon } from '../components/icons'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { Badge, Button, Card, Field, PageHeader, inputClass } from '../components/ui'
import { formatAgeMonths } from '../lib/format'
import { resizeImageToDataUrl } from '../lib/image'
import {
  BODY_MAX,
  CATEGORIES,
  TITLE_MAX,
  categoryLabel,
  getChildStage,
  postRepository,
  sortFeed,
  stageLabel,
  validatePost,
  type FeedGroup,
  type NewPostInput,
  type Post,
  type PostCategory,
} from '../lib/posts'
import { useToday } from '../lib/useToday'
import { useAppStore } from '../store/useAppStore'
import type { Child } from '../types'

const AUTHOR_KEY = 'momstage:posts:author'

function readSavedAuthor(): string | null {
  try {
    return localStorage.getItem(AUTHOR_KEY)
  } catch {
    return null
  }
}

/** โหลดโพสต์และรายการที่เคยกด "มีประโยชน์" จาก repository */
function usePosts() {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [helpful, setHelpful] = useState<Set<string>>(new Set())
  const refresh = useCallback(async () => {
    const [list, ids] = await Promise.all([postRepository.list(), postRepository.helpfulIds()])
    setPosts(list)
    setHelpful(ids)
  }, [])
  // โหลดครั้งแรก (repository เป็น async เพื่อให้สลับไป Firestore ได้)
  useEffect(() => {
    let cancelled = false
    Promise.all([postRepository.list(), postRepository.helpfulIds()]).then(([list, ids]) => {
      if (cancelled) return
      setPosts(list)
      setHelpful(ids)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return { posts, helpful, refresh }
}

const GROUP_TITLE: Record<FeedGroup, string> = {
  same: 'ช่วงเดียวกับคุณ',
  next: 'ช่วงถัดไป — เตรียมตัวล่วงหน้า',
  other: 'ช่วงอื่น ๆ',
}

export default function CommunityPage() {
  const { activeChild } = useAppStore()
  const today = useToday()
  const { posts, helpful, refresh } = usePosts()
  const [filter, setFilter] = useState<PostCategory | 'all'>('all')
  const [composing, setComposing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const userStage = activeChild ? getChildStage(activeChild, today) : null
  const filtered = (posts ?? []).filter((p) => filter === 'all' || p.category === filter)
  const feed = sortFeed(filtered, userStage?.stage ?? null)

  async function onHelpful(id: string) {
    await postRepository.toggleHelpful(id)
    await refresh()
  }

  return (
    <>
      <PageHeader
        title="Community คุณแม่"
        subtitle={userStage ? `ช่วงของคุณ: ${stageLabel(userStage.stage)} · แสดงโพสต์ช่วงเดียวกันก่อน` : 'แชร์ประสบการณ์กับคุณแม่ช่วงวัยเดียวกัน'}
      />

      <p className="mb-4 rounded-2xl bg-surface-muted px-4 py-3 text-sm text-ink-muted" role="note">
        เป็นประสบการณ์ส่วนตัวของคุณแม่แต่ละคน ไม่ใช่คำแนะนำทางการแพทย์ · ห้ามโพสต์ลิงก์หรือช่องทางซื้อขาย
      </p>

      {composing && activeChild ? (
        <Composer
          child={activeChild}
          today={today}
          onCancel={() => setComposing(false)}
          onPosted={async () => {
            setComposing(false)
            setFilter('all')
            setNotice('โพสต์แล้ว')
            await refresh()
          }}
        />
      ) : (
        <Button className="w-full" onClick={() => (setComposing(true), setNotice(null))} disabled={!userStage}>
          <PencilSimpleLineIcon size={20} aria-hidden="true" />
          เขียนโพสต์
        </Button>
      )}
      <p className="mt-2 min-h-5 text-sm text-primary-strong" aria-live="polite">
        {notice}
      </p>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="กรองตามหมวด">
        {[{ id: 'all' as const, label: 'ทั้งหมด' }, ...CATEGORIES].map((c) => {
          const count = c.id === 'all' ? (posts?.length ?? 0) : (posts ?? []).filter((p) => p.category === c.id).length
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full border px-3 text-sm font-medium transition-colors duration-150 ${
                filter === c.id ? 'border-primary-strong bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:bg-surface-muted'
              }`}
            >
              {c.label}
              <span className={filter === c.id ? 'text-on-primary/80' : 'text-ink-muted'}>{count}</span>
            </button>
          )
        })}
      </div>

      {posts === null ? (
        <p className="mt-6 text-ink-muted">กำลังโหลดโพสต์…</p>
      ) : feed.length === 0 ? (
        <Card className="mt-6 text-center">
          <ChatCircleTextIcon size={32} className="mx-auto text-ink-muted" aria-hidden="true" />
          <p className="mt-2">ยังไม่มีโพสต์ในหมวดนี้ — เป็นคนแรกที่แชร์ได้เลย</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {(['same', 'next', 'other'] as const).map((group) => {
            const items = feed.filter((f) => f.group === group)
            if (items.length === 0) return null
            return (
              <section key={group} aria-labelledby={`feed-${group}`}>
                <h2 id={`feed-${group}`} className="mb-2 text-lg font-semibold">
                  {GROUP_TITLE[group]}
                </h2>
                <ul className="space-y-3">
                  {items.map(({ post }) => (
                    <PostCard key={post.id} post={post} marked={helpful.has(post.id)} onHelpful={() => onHelpful(post.id)} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}

function PostCard({ post, marked, onHelpful }: { post: Post; marked: boolean; onHelpful: () => void }) {
  const ageText =
    post.childAgeMonthsAtPost === null
      ? `ตั้งครรภ์ ${post.pregnancyWeekAtPost ?? '-'} สัปดาห์`
      : `ลูก${post.childAgeMonthsAtPost === 0 ? 'แรกเกิด' : ` ${formatAgeMonths(post.childAgeMonthsAtPost)}`}`
  return (
    <li>
      <article className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">{stageLabel(post.stageTag)}</Badge>
          <Badge tone="neutral">{categoryLabel(post.category)}</Badge>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug">{post.title}</h3>
        <p className="text-xs text-ink-muted">
          {post.authorName} · {ageText} ตอนโพสต์ · {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true, locale: th })}
        </p>

        {post.productName && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-2 py-1 text-sm font-medium text-ink">
            <TagIcon size={16} className="text-accent-strong" aria-hidden="true" />
            {post.productName}
          </p>
        )}
        {post.imageDataUrl && (
          <img src={post.imageDataUrl} alt={`รูปสินค้า ${post.productName ?? ''}`} loading="lazy" className="mt-3 max-h-72 w-full rounded-2xl object-cover" />
        )}
        <p className="mt-2 whitespace-pre-line text-ink [overflow-wrap:anywhere]">{post.body}</p>

        <button
          type="button"
          onClick={onHelpful}
          aria-pressed={marked}
          title={marked ? 'กดอีกครั้งเพื่อยกเลิก' : undefined}
          className={`mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ${
            marked ? 'border-primary-strong bg-primary-soft text-primary-strong hover:bg-primary-soft/70' : 'border-line bg-surface text-ink hover:bg-surface-muted'
          }`}
        >
          <ThumbsUpIcon size={18} weight={marked ? 'fill' : 'regular'} aria-hidden="true" />
          มีประโยชน์
          <span className="tabular-nums text-ink-muted">{post.helpfulCount}</span>
        </button>
      </article>
    </li>
  )
}

function Composer({ child, today, onCancel, onPosted }: { child: Child; today: Date; onCancel: () => void; onPosted: () => void }) {
  const uid = useId()
  const [input, setInput] = useState<NewPostInput>(() => ({
    authorName: readSavedAuthor() ?? `แม่${child.name}`,
    category: 'mom-health',
    title: '',
    body: '',
    productName: '',
  }))
  const [errors, setErrors] = useState<ReturnType<typeof validatePost>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const stage = getChildStage(child, today)!
  const isReview = input.category === 'review'
  const set = (patch: Partial<NewPostInput>) => setInput((s) => ({ ...s, ...patch }))

  async function onImage(file: File | undefined) {
    if (!file) return
    try {
      set({ imageDataUrl: await resizeImageToDataUrl(file) })
      setFormError(null)
    } catch (e) {
      setFormError((e as Error).message)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found = validatePost(input)
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`${uid}-${first}`)?.focus()
      return
    }
    setBusy(true)
    try {
      await postRepository.create(input, child, new Date())
      try {
        localStorage.setItem(AUTHOR_KEY, input.authorName.trim())
      } catch {
        // จำชื่อไม่ได้ก็ไม่เป็นไร
      }
      onPosted()
    } catch (err) {
      const msg = (err as Error).name === 'QuotaExceededError' ? 'พื้นที่เก็บข้อมูลในเครื่องเต็ม ลองลบรูปหรือย่อข้อความ' : (err as Error).message
      setFormError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">เขียนโพสต์</h2>
            <p className="text-sm text-ink-muted">
              จะอยู่ในช่วง <strong className="text-ink">{stageLabel(stage.stage)}</strong> (คำนวณจากอายุ{child.name}วันนี้)
            </p>
          </div>
          <button type="button" onClick={onCancel} aria-label="ปิดฟอร์ม" className="grid size-11 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-surface-muted">
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>

        <Field id={`${uid}-category`} label="หมวด">
          <select
            id={`${uid}-category`}
            value={input.category}
            onChange={(e) => set({ category: e.target.value as PostCategory })}
            className={`${inputClass} cursor-pointer`}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-authorName`} label="ชื่อที่แสดง" required error={errors.authorName}>
          <input
            id={`${uid}-authorName`}
            value={input.authorName}
            onChange={(e) => set({ authorName: e.target.value })}
            maxLength={30}
            aria-invalid={errors.authorName ? true : undefined}
            aria-describedby={errors.authorName ? `${uid}-authorName-error` : undefined}
            className={inputClass}
          />
        </Field>

        {isReview && (
          <Field id={`${uid}-productName`} label="ชื่อสินค้า" required error={errors.productName} hint="ใส่ชื่อสินค้าได้ แต่ห้ามใส่ลิงก์หรือช่องทางซื้อ">
            <input
              id={`${uid}-productName`}
              value={input.productName}
              onChange={(e) => set({ productName: e.target.value })}
              maxLength={60}
              aria-invalid={errors.productName ? true : undefined}
              aria-describedby={errors.productName ? `${uid}-productName-error` : `${uid}-productName-hint`}
              className={inputClass}
              placeholder="เช่น เป้อุ้มเด็กแบบนั่ง"
            />
          </Field>
        )}

        <Field id={`${uid}-title`} label="หัวข้อ" required error={errors.title}>
          <input
            id={`${uid}-title`}
            value={input.title}
            onChange={(e) => set({ title: e.target.value })}
            maxLength={TITLE_MAX}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? `${uid}-title-error` : undefined}
            className={inputClass}
          />
        </Field>

        <Field id={`${uid}-body`} label="เล่าประสบการณ์" required error={errors.body} hint={`${input.body.length}/${BODY_MAX} ตัวอักษร`}>
          <textarea
            id={`${uid}-body`}
            value={input.body}
            onChange={(e) => set({ body: e.target.value })}
            maxLength={BODY_MAX}
            rows={6}
            aria-invalid={errors.body ? true : undefined}
            aria-describedby={errors.body ? `${uid}-body-error` : `${uid}-body-hint`}
            className={`${inputClass} py-3 leading-relaxed`}
          />
        </Field>

        {isReview && (
          <div>
            <p className="mb-1 font-medium">รูปสินค้า (ไม่บังคับ)</p>
            {input.imageDataUrl ? (
              <div className="relative">
                <img src={input.imageDataUrl} alt="ตัวอย่างรูปที่จะโพสต์" className="max-h-60 w-full rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => set({ imageDataUrl: undefined })}
                  className="absolute right-2 top-2 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full bg-surface/95 px-3 text-sm font-medium shadow"
                >
                  <XIcon size={16} aria-hidden="true" />
                  ลบรูป
                </button>
              </div>
            ) : (
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-surface-muted/60 text-sm text-ink-muted hover:border-primary/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-strong">
                <ImageSquareIcon size={28} aria-hidden="true" />
                เลือกรูปจากเครื่อง
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onImage(e.target.files?.[0])} />
              </label>
            )}
          </div>
        )}

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'กำลังโพสต์…' : 'โพสต์'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
