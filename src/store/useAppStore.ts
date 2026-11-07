/**
 * useAppStore — จุดเดียวที่อ่าน/เขียนข้อมูลผู้ใช้ทั้งหมด
 *
 * ตอนนี้เก็บใน localStorage ของเบราว์เซอร์ ถ้าต้องการย้ายไป Firebase ภายหลัง
 * ให้แก้แค่ฟังก์ชัน loadState / persist ในไฟล์นี้ หน้าอื่น ๆ ไม่ต้องแตะเลย
 * เพราะทุกหน้าเรียกข้อมูลผ่าน hook นี้เท่านั้น
 *
 * ใช้ useSyncExternalStore เพื่อให้ทุก component ที่เรียก hook เห็นข้อมูลชุดเดียวกัน
 * และอัปเดตพร้อมกันทันทีเมื่อมีการเปลี่ยนแปลง (รวมถึงเมื่อแก้ข้อมูลจากอีกแท็บ)
 */
import { useSyncExternalStore } from 'react'
import { createDemoChildren } from '../data/demo'
import { DEFAULT_CALC_SETTINGS } from '../lib/babyCalc'
import type { AppState, CalcSettings, CareType, Child, ExpenseEntry, ExtraExpense, GrowthEntry, QuizResult } from '../types'

const STORAGE_KEY = 'momstage:v1'

const EMPTY_STATE: AppState = { version: 1, children: [], activeChildId: null }

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (!Array.isArray(parsed.children)) return EMPTY_STATE
    const children = parsed.children.map(normalizeChild)
    const activeChildId = children.some((c) => c.id === parsed.activeChildId)
      ? (parsed.activeChildId as string)
      : (children[0]?.id ?? null)
    return { version: 1, children, activeChildId }
  } catch {
    // localStorage ใช้ไม่ได้ (เช่น โหมดไม่ระบุตัวตนบางเบราว์เซอร์) หรือข้อมูลเสีย — เริ่มใหม่
    return EMPTY_STATE
  }
}

/** เติมฟิลด์ที่อาจขาดไปจากข้อมูลเก่า เพื่อไม่ให้หน้าอื่นพังเมื่อเพิ่มฟิลด์ใหม่ */
function normalizeChild(c: Partial<Child>): Child {
  return {
    id: c.id ?? createId(),
    name: c.name ?? '',
    mode: c.mode === 'born' ? 'born' : 'pregnant',
    dueDate: c.dueDate,
    birthDate: c.birthDate,
    sex: c.sex,
    vaccineLog: c.vaccineLog ?? {},
    // ข้อมูลรุ่นแรกไม่มี id — เติมให้เพื่อให้ลบรายการได้
    growthLog: (c.growthLog ?? []).map((g) => ({ ...g, id: g.id ?? createId() })),
    quizResults: c.quizResults ?? [],
    checklist: c.checklist ?? {},
    careLog: c.careLog ?? [],
    birthTime: c.birthTime,
    favoriteNames: c.favoriteNames ?? [],
    calcSettings: {
      ...DEFAULT_CALC_SETTINGS,
      ...c.calcSettings,
      extras: (c.calcSettings?.extras ?? []).map(normalizeExtra),
    },
  }
}

/** ข้อมูลรุ่นก่อนเก็บราคา/จำนวนไว้ที่ตัวรายการโดยตรง — ย้ายเข้าเป็นยอดแรกของรายการ */
function normalizeExtra(e: Partial<ExtraExpense> & Partial<Omit<ExpenseEntry, 'id'>>): ExtraExpense {
  const entries =
    e.entries ?? [{ id: createId(), price: e.price ?? '', quantity: e.quantity ?? '1', unit: e.unit ?? 'ชิ้น' }]
  return { id: e.id ?? createId(), name: e.name ?? '', entries }
}

function persist(next: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // พื้นที่เต็มหรือถูกบล็อก — ข้อมูลยังอยู่ในหน่วยความจำจนกว่าจะปิดแท็บ
  }
}

export function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ---- store กลาง (อยู่นอก React) ----

let state: AppState = loadState()
const listeners = new Set<() => void>()

function setState(updater: (prev: AppState) => AppState) {
  state = updater(state)
  persist(state)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // ซิงก์เมื่อผู้ใช้แก้ข้อมูลในอีกแท็บ
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = loadState()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = () => state

// ---- actions ----

export type NewChild = Pick<Child, 'name' | 'mode' | 'dueDate' | 'birthDate' | 'sex'>

const actions = {
  /** เพิ่มลูกใหม่และตั้งเป็นคนที่กำลังดูอยู่ คืนค่า id */
  addChild(input: NewChild): string {
    const child = normalizeChild({ ...input, id: createId() })
    setState((s) => ({ ...s, children: [...s.children, child], activeChildId: child.id }))
    return child.id
  },

  updateChild(id: string, patch: Partial<Omit<Child, 'id'>>) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  },

  removeChild(id: string) {
    setState((s) => {
      const children = s.children.filter((c) => c.id !== id)
      const activeChildId = s.activeChildId === id ? (children[0]?.id ?? null) : s.activeChildId
      return { ...s, children, activeChildId }
    })
  },

  setActiveChild(id: string) {
    setState((s) => (s.children.some((c) => c.id === id) ? { ...s, activeChildId: id } : s))
  },

  /** บันทึกวันที่ฉีดวัคซีนจริง (date = null เพื่อลบ) */
  setVaccineDate(childId: string, vaccineId: string, date: string | null) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) => {
        if (c.id !== childId) return c
        const vaccineLog = { ...c.vaccineLog }
        if (date) vaccineLog[vaccineId] = date
        else delete vaccineLog[vaccineId]
        return { ...c, vaccineLog }
      }),
    }))
  },

  toggleChecklistItem(childId: string, itemId: string) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) =>
        c.id === childId ? { ...c, checklist: { ...c.checklist, [itemId]: !c.checklist[itemId] } } : c,
      ),
    }))
  },

  addGrowthEntry(childId: string, entry: Omit<GrowthEntry, 'id'>) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) =>
        c.id === childId
          ? { ...c, growthLog: [...c.growthLog, { ...entry, id: createId() }].sort((a, b) => a.date.localeCompare(b.date)) }
          : c,
      ),
    }))
  },

  removeGrowthEntry(childId: string, entryId: string) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) =>
        c.id === childId ? { ...c, growthLog: c.growthLog.filter((g) => g.id !== entryId) } : c,
      ),
    }))
  },

  addQuizResult(childId: string, result: Omit<QuizResult, 'id'>): string {
    const id = createId()
    setState((s) => ({
      ...s,
      children: s.children.map((c) =>
        c.id === childId ? { ...c, quizResults: [...c.quizResults, { ...result, id }] } : c,
      ),
    }))
    return id
  },

  toggleFavoriteName(childId: string, name: string) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) =>
        c.id === childId
          ? { ...c, favoriteNames: c.favoriteNames.includes(name) ? c.favoriteNames.filter((n) => n !== name) : [...c.favoriteNames, name] }
          : c,
      ),
    }))
  },

  updateCalcSettings(childId: string, patch: Partial<CalcSettings>) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) => (c.id === childId ? { ...c, calcSettings: { ...c.calcSettings, ...patch } } : c)),
    }))
  },

  /** ปุ่มเดียวเริ่ม/หยุด: ถ้ามีรายการประเภทนี้ที่ยังไม่จบ → จบ, ไม่มี → เริ่มใหม่ */
  toggleCare(childId: string, type: CareType, at: Date = new Date()) {
    const iso = at.toISOString()
    setState((s) => ({
      ...s,
      children: s.children.map((c) => {
        if (c.id !== childId) return c
        const active = c.careLog.find((e) => e.type === type && !e.end)
        const careLog = active
          ? c.careLog.map((e) => (e.id === active.id ? { ...e, end: iso } : e))
          : [...c.careLog, { id: createId(), type, start: iso }]
        return { ...c, careLog }
      }),
    }))
  },

  removeCareEvent(childId: string, eventId: string) {
    setState((s) => ({
      ...s,
      children: s.children.map((c) => (c.id === childId ? { ...c, careLog: c.careLog.filter((e) => e.id !== eventId) } : c)),
    }))
  },

  /** เพิ่มข้อมูลตัวอย่าง 2 คน (ใช้ตอน onboarding ปุ่ม "ลองดูตัวอย่าง") */
  loadDemo(today: Date = new Date()) {
    const demo = createDemoChildren(today).map((c) => normalizeChild({ ...c, id: createId() }))
    setState((s) => ({ ...s, children: [...s.children, ...demo], activeChildId: demo[0].id }))
  },

  /** ล้างข้อมูลทั้งหมดของแอป */
  clearAll() {
    setState(() => EMPTY_STATE)
  },
}

export function useAppStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const activeChild = snapshot.children.find((c) => c.id === snapshot.activeChildId) ?? null
  return { ...snapshot, activeChild, ...actions }
}
