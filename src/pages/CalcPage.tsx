/**
 * ลูกคนนี้ใช้เงินเท่าไหร่ (เดิม: เครื่องคิดเลขแม่ลูกอ่อน) 3 แท็บ: ปริมาณนม / ค่าใช้จ่ายต่อเดือน / บันทึกการให้นมและการนอน
 * ค่าที่กรอกในแท็บ 1–2 จำไว้ใน store ของลูกแต่ละคน (calcSettings)
 * ตรรกะอยู่ใน src/lib/babyCalc.ts และ src/lib/careLog.ts
 */
import { DropIcon, MoonIcon, PlusIcon, TrashIcon, WarningIcon } from '../components/icons'
import { differenceInMinutes, format, isSameDay, parseISO } from 'date-fns'
import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BackToTools } from '../components/ToolSafety'
import { Button, Card, Field, PageHeader, Segmented, inputClass } from '../components/ui'
import { describeBabyAge, getBabyAge } from '../lib/age'
import {
  DEFAULT_CALC_SETTINGS,
  FEEDING_LABELS,
  GRAMS_PER_SCOOP,
  MAX_ML_PER_DAY,
  MILK_RULE_MAX_AGE_MONTHS,
  ML_PER_KG_PER_DAY,
  ML_PER_SCOOP,
  buildMonthlyExpenses,
  calcFormulaUsage,
  calcMilkPlan,
  compareScenarios,
  entryAmount,
  expenseNameKey,
  extraAmount,
  getDiapersPerDay,
  parseAmount,
  type ExpenseCategory,
  type ExpenseLine,
  type MilkPlan,
} from '../lib/babyCalc'
import { NEWBORN_MAX_FEED_GAP_MINUTES, formatDuration, summarizeCare } from '../lib/careLog'
import { formatThaiDate } from '../lib/format'
import { createId, useAppStore } from '../store/useAppStore'
import type { CalcSettings, CareEvent, CareType, Child, ExpenseEntry, ExtraExpense, FeedingType } from '../types'

type Tab = 'milk' | 'cost' | 'log'
const TABS: { id: Tab; label: string }[] = [
  { id: 'milk', label: 'ปริมาณนม' },
  { id: 'cost', label: 'ค่าใช้จ่าย' },
  { id: 'log', label: 'บันทึกนม/นอน' },
]

/** เวลาปัจจุบันที่อัปเดตทุก intervalMs — ใช้กับตัวจับเวลาและสรุปวันนี้ */
function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

const baht = (n: number) => `${Math.round(n).toLocaleString('th-TH')} บาท`

type UpdateSettings = (patch: Partial<CalcSettings>) => void

export default function CalcPage() {
  const { activeChild, updateCalcSettings } = useAppStore()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'milk') as Tab

  const settings = activeChild?.calcSettings ?? DEFAULT_CALC_SETTINGS
  const update: UpdateSettings = (patch) => {
    if (activeChild) updateCalcSettings(activeChild.id, patch)
  }

  // ค่าที่ใช้ร่วมกันระหว่างแท็บ 1 และ 2
  const latestWeight = [...(activeChild?.growthLog ?? [])]
    .filter((g) => g.weightKg !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  const born = activeChild?.mode === 'born' && activeChild.birthDate ? activeChild : null
  const ageMonths = born ? getBabyAge(born.birthDate!, now).months : 0
  const weight = settings.weightKg ? Number(settings.weightKg) : latestWeight?.weightKg
  const feeds = Number(settings.feedsPerDay)
  const weightValid = weight !== undefined && weight >= 1.5 && weight <= 20
  const feedsValid = Number.isInteger(feeds) && feeds >= 1 && feeds <= 16
  const plan = weightValid && feedsValid ? calcMilkPlan(weight!, feeds) : null

  function selectTab(id: Tab) {
    setParams(id === 'milk' ? {} : { tab: id }, { replace: true })
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = TABS[(index + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    selectTab(next.id)
    document.getElementById(`calc-tab-${next.id}`)?.focus()
  }

  return (
    <>
      <BackToTools />
      <PageHeader
        title="ลูกคนนี้ใช้เงินเท่าไหร่"
        subtitle={born ? `${born.name} อายุ ${describeBabyAge(getBabyAge(born.birthDate!, now))}` : 'กรอกน้ำหนักเพื่อคำนวณ'}
      />

      <div role="tablist" aria-label="เครื่องคิดเลข" className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-surface-muted p-1">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            id={`calc-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`calc-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => selectTab(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
            className={`min-h-11 cursor-pointer rounded-xl px-2 text-sm font-semibold transition-colors duration-150 ${
              tab === t.id ? 'bg-surface text-primary-strong shadow-[var(--shadow-card)]' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`calc-panel-${tab}`} aria-labelledby={`calc-tab-${tab}`}>
        {tab === 'milk' && (
          <MilkTab
            ageMonths={born ? ageMonths : null}
            latestWeight={latestWeight}
            settings={settings}
            update={update}
            weightError={settings.weightKg && !weightValid ? 'กรอกน้ำหนักระหว่าง 1.5–20 กก.' : null}
            feedsError={!feedsValid ? 'จำนวนมื้อต้องเป็นจำนวนเต็ม 1–16' : null}
            plan={plan}
          />
        )}
        {tab === 'cost' && <CostTab plan={plan} ageMonths={ageMonths} settings={settings} update={update} onGoMilk={() => selectTab('milk')} />}
        {tab === 'log' && (born ? <LogTab child={born} ageMonths={ageMonths} now={now} /> : <NotBornCard />)}
      </div>
    </>
  )
}

function NotBornCard() {
  return (
    <Card>
      <p>บันทึกการให้นมและการนอนใช้ได้หลังคลอด เมื่อเปลี่ยนเป็นโหมด “คลอดแล้ว” ในหน้าตั้งค่า</p>
    </Card>
  )
}

// ---------------- แท็บ 1: ปริมาณนม ----------------

function MilkTab(props: {
  ageMonths: number | null
  latestWeight?: { weightKg?: number; date: string }
  settings: CalcSettings
  update: UpdateSettings
  weightError: string | null
  feedsError: string | null
  plan: MilkPlan | null
}) {
  const { ageMonths, latestWeight, plan, settings, update } = props
  return (
    <div className="space-y-4">
      {ageMonths !== null && ageMonths >= MILK_RULE_MAX_AGE_MONTHS && (
        <p className="rounded-2xl bg-warning-soft p-4 text-sm text-ink">
          เกณฑ์ {ML_PER_KG_PER_DAY} มล./กก./วัน ใช้กับทารกอายุต่ำกว่า {MILK_RULE_MAX_AGE_MONTHS} เดือน หลังจากนั้นลูกเริ่มกินอาหารตามวัย
          ปริมาณนมจะลดลง ตัวเลขด้านล่างจึงสูงกว่าความต้องการจริง
        </p>
      )}
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="calc-weight"
            label="น้ำหนักลูก (กก.)"
            error={props.weightError}
            hint={latestWeight ? `ล่าสุด ${latestWeight.weightKg} กก. (${formatThaiDate(latestWeight.date, true)})` : 'ยังไม่มีน้ำหนักในแอป — กรอกเองตรงนี้ หรือบันทึกที่หน้าการเติบโต'}
          >
            <input
              id="calc-weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={settings.weightKg}
              onChange={(e) => update({ weightKg: e.target.value })}
              placeholder={latestWeight ? String(latestWeight.weightKg) : 'เช่น 5.2'}
              aria-invalid={props.weightError ? true : undefined}
              aria-describedby={props.weightError ? 'calc-weight-error' : 'calc-weight-hint'}
              className={inputClass}
            />
          </Field>
          <Field id="calc-feeds" label="จำนวนมื้อต่อวัน" error={props.feedsError} hint="ทารกแรกเกิดมัก 8–12 มื้อ">
            <input
              id="calc-feeds"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              max="16"
              value={settings.feedsPerDay}
              onChange={(e) => update({ feedsPerDay: e.target.value })}
              aria-invalid={props.feedsError ? true : undefined}
              aria-describedby={props.feedsError ? 'calc-feeds-error' : 'calc-feeds-hint'}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {plan && (
        <section aria-live="polite" className="rounded-[var(--radius-card)] border-2 border-primary/40 bg-primary-soft p-5">
          <p className="text-sm font-medium text-primary-strong">ประมาณต่อมื้อ</p>
          <p className="text-4xl font-bold tabular-nums">
            {plan.perFeedMl} <span className="text-xl">มล.</span>
          </p>
          <p className="text-ink">
            รวมวันละประมาณ <strong className="tabular-nums">{plan.dailyMl.toLocaleString('th-TH')} มล.</strong> (≈{' '}
            {(plan.dailyMl / 29.57).toFixed(1)} ออนซ์)
          </p>
          {plan.capped && <p className="mt-1 text-sm text-ink">จำกัดไว้ที่ {MAX_ML_PER_DAY.toLocaleString('th-TH')} มล./วัน ตามที่ใช้กันทั่วไป</p>}
          <p className="mt-3 text-xs text-ink-muted">
            สูตร: {ML_PER_KG_PER_DAY} มล. × น้ำหนัก (กก.) ÷ จำนวนมื้อ — <strong>เป็นค่าประมาณ</strong> ลูกแต่ละคนกินไม่เท่ากัน
            ให้สังเกตสัญญาณหิว/อิ่ม น้ำหนักขึ้นดี และปัสสาวะวันละ 6 ครั้งขึ้นไป ทารกที่กินนมแม่ไม่ต้องตวงปริมาณ
          </p>
        </section>
      )}
    </div>
  )
}

// ---------------- แท็บ 2: ค่าใช้จ่าย ----------------

const CATEGORY_META: Record<ExpenseCategory, { label: string; color: string }> = {
  diapers: { label: 'ผ้าอ้อม', color: 'var(--color-chart-1)' },
  formula: { label: 'นมผง', color: 'var(--color-chart-2)' },
  other: { label: 'ค่าใช้จ่ายอื่น', color: 'var(--color-chart-3)' },
}

/** ปุ่มเพิ่มแบบเร็ว — ถ้ามีรายการชื่อนี้อยู่แล้ว จะเพิ่มเป็นยอดใหม่ใต้รายการเดิม */
const EXTRA_SUGGESTIONS: { name: string; unit: string }[] = [
  { name: 'วัคซีนเสริม', unit: 'เข็ม' },
  { name: 'เสื้อผ้า', unit: 'ชุด' },
  { name: 'ทิชชูเปียก', unit: 'ห่อ' },
  { name: 'อาหารเสริม', unit: 'กระปุก' },
]

function CostTab({
  plan,
  ageMonths,
  settings,
  update,
  onGoMilk,
}: {
  plan: MilkPlan | null
  ageMonths: number
  settings: CalcSettings
  update: UpdateSettings
  onGoMilk: () => void
}) {
  const uid = useId()
  const diapersPerDay = getDiapersPerDay(ageMonths)
  const usesFormula = settings.feedingType !== 'breast'
  const expenses = buildMonthlyExpenses({ settings, dailyMl: plan?.dailyMl ?? null, ageMonths })

  const price = parseAmount(settings.pricePerCan)
  const grams = parseAmount(settings.gramsPerCan)
  const otherMonthly = expenses.lines.filter((l) => l.category === 'other').reduce((s, l) => s + l.amount, 0)
  const canCompare = plan !== null && price !== null && !!grams
  const scenarios = canCompare
    ? compareScenarios({
        dailyMl: plan.dailyMl,
        ageMonths,
        pricePerCan: price,
        gramsPerCan: grams,
        diaperPrice: parseAmount(settings.diaperPrice) ?? 0,
        diapersPerDay: parseAmount(settings.diapersPerDay),
        otherMonthly,
      })
    : []

  const setExtras = (extras: ExtraExpense[]) => update({ extras })
  const newEntry = (unit = 'ชิ้น'): ExpenseEntry => ({ id: createId(), price: '', quantity: '1', unit })
  /** เพิ่มรายการใหม่ — ถ้าชื่อซ้ำกับรายการเดิม ให้เพิ่มเป็นยอดใหม่ใต้รายการนั้นแทน */
  const addExtra = (name = '', unit = 'ชิ้น') => {
    const existing = name ? settings.extras.find((e) => expenseNameKey(e.name) === expenseNameKey(name)) : undefined
    if (existing) setExtras(settings.extras.map((e) => (e.id === existing.id ? { ...e, entries: [...e.entries, newEntry(unit)] } : e)))
    else setExtras([...settings.extras, { id: createId(), name, entries: [newEntry(unit)] }])
  }
  const patchExtra = (id: string, patch: Partial<ExtraExpense>) => setExtras(settings.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  const removeExtra = (id: string) => setExtras(settings.extras.filter((e) => e.id !== id))

  return (
    <div className="space-y-4">
      <Card>
        <Segmented<FeedingType>
          name={`${uid}-feeding`}
          legend="ลูกกินนมแบบไหน"
          value={settings.feedingType}
          onChange={(feedingType) => update({ feedingType })}
          options={(['breast', 'mixed', 'formula'] as const).map((v) => ({ value: v, label: FEEDING_LABELS[v] }))}
        />
        {!usesFormula && <p className="mt-3 text-sm text-ink-muted">นมแม่ล้วนไม่มีค่านมผง — กรอกค่าผ้าอ้อมและค่าใช้จ่ายอื่นได้เลย</p>}

        {usesFormula && (
          <>
            <h2 className="mb-3 mt-5 font-semibold">นมผง</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field id={`${uid}-price`} label="ราคาต่อกระป๋อง (บาท)">
                <input
                  id={`${uid}-price`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={settings.pricePerCan}
                  onChange={(e) => update({ pricePerCan: e.target.value })}
                  placeholder="เช่น 650"
                  className={inputClass}
                />
              </Field>
              <Field id={`${uid}-grams`} label="น้ำหนักต่อกระป๋อง (กรัม)">
                <input
                  id={`${uid}-grams`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={settings.gramsPerCan}
                  onChange={(e) => update({ gramsPerCan: e.target.value })}
                  placeholder="เช่น 600"
                  className={inputClass}
                />
              </Field>
            </div>
            {plan ? (
              <FormulaUsageNote plan={plan} grams={grams} share={settings.feedingType === 'mixed' ? 0.5 : 1} />
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                ต้องรู้ปริมาณนมก่อน —{' '}
                <button type="button" onClick={onGoMilk} className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary-strong underline">
                  กรอกน้ำหนักลูกในแท็บปริมาณนม
                </button>
              </p>
            )}
          </>
        )}

        <h2 className="mb-3 mt-5 font-semibold">ผ้าอ้อม</h2>
<div className="grid grid-cols-2 gap-3">
          <Field id={`${uid}-diaper`} label="ราคาต่อชิ้น (บาท)">
            <input
              id={`${uid}-diaper`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={settings.diaperPrice}
              onChange={(e) => update({ diaperPrice: e.target.value })}
              placeholder="เช่น 6"
              aria-describedby={`${uid}-diaper-note`}
              className={inputClass}
            />
          </Field>
          <Field id={`${uid}-diaper-count`} label="จำนวนชิ้นต่อวัน">
            <input
              id={`${uid}-diaper-count`}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={settings.diapersPerDay}
              onChange={(e) => update({ diapersPerDay: e.target.value })}
              placeholder={`ค่ากลาง ${(diapersPerDay.min + diapersPerDay.max) / 2}`}
              aria-describedby={`${uid}-diaper-note`}
              className={inputClass}
            />
          </Field>
        </div>
        <p id={`${uid}-diaper-note`} className="mt-2 text-sm text-ink-muted">
          ช่วงอายุ {diapersPerDay.label} ใช้ประมาณ {diapersPerDay.min}–{diapersPerDay.max} ชิ้น/วัน · ไม่กรอกจำนวน แอปใช้ค่ากลาง · เว้นราคาว่างถ้าไม่ต้องการนับ
        </p>
      </Card>

      <ExtrasCard extras={settings.extras} onAdd={addExtra} onPatch={patchExtra} onRemove={removeExtra} newEntry={newEntry} />

      <ExpenseChart
        title="ค่าใช้จ่ายต่อเดือนของเรา"
        badge={FEEDING_LABELS[settings.feedingType]}
        lines={expenses.lines}
        total={expenses.total}
        missing={expenses.missing}
        emptyText="ยังไม่มีรายการ กรอกราคาผ้าอ้อม หรือกด “เพิ่มค่าใช้จ่าย” เพื่อดูกราฟ"
      />


      {canCompare ? (
        <CompareChart scenarios={scenarios} />
      ) : (
        <p className="text-sm text-ink-muted">อยากเปรียบเทียบนมแม่ล้วน / ผสม / นมผงล้วน? เลือก “นมผสม” หรือ “นมผงล้วน” แล้วกรอกราคานมผงและน้ำหนักลูก</p>
      )}

      <p className="text-xs text-ink-muted">
        สมมติฐาน: 1 ช้อนตวง ≈ {GRAMS_PER_SCOOP} กรัม ต่อน้ำ {ML_PER_SCOOP} มล. (ตรวจกับฉลากนมที่ใช้จริง) · 1 เดือน = 30 วัน · นมผสม = นมผงครึ่งหนึ่ง ·
        ค่าผ้าอ้อม = ราคาต่อชิ้น × จำนวนต่อวัน (ไม่กรอกใช้ค่ากลางตามอายุ) × 30 วัน · ค่าใช้จ่ายอื่น = ผลรวมของ (ราคาต่อหน่วย × จำนวนต่อเดือน) ทุกยอด รายการชื่อซ้ำรวมเป็นแท่งเดียว · ค่าที่กรอกจำไว้ในเครื่องนี้
      </p>
    </div>
  )
}

function FormulaUsageNote({ plan, grams, share }: { plan: MilkPlan; grams: number | null; share: number }) {
  const ml = plan.dailyMl * share
  const usage = calcFormulaUsage(ml, 0, grams ?? 0)
  return (
    <p className="mt-3 text-sm text-ink-muted">
      นมผง {Math.round(ml)} มล./วัน = {usage.scoopsPerDay.toFixed(1)} ช้อน ≈ {usage.gramsPerDay.toFixed(0)} กรัม/วัน
      {grams ? ` ≈ ${usage.cansPerMonth.toFixed(1)} กระป๋อง/เดือน` : ''}
    </p>
  )
}

function ExtrasCard({
  extras,
  onAdd,
  onPatch,
  onRemove,
  newEntry,
}: {
  extras: ExtraExpense[]
  onAdd: (name?: string, unit?: string) => void
  onPatch: (id: string, patch: Partial<ExtraExpense>) => void
  onRemove: (id: string) => void
  newEntry: (unit?: string) => ExpenseEntry
}) {
  const nameCounts = new Map<string, number>()
  extras.forEach((e) => {
    const key = expenseNameKey(e.name)
    if (key) nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1)
  })

  return (
    <Card>
      <h2 className="font-semibold">ค่าใช้จ่ายอื่น ๆ ต่อเดือน</h2>
      <p className="mt-1 text-sm text-ink-muted">
        เช่น วัคซีนเสริม เสื้อผ้า ของใช้ — ซื้อหลายครั้งให้กด “เพิ่มยอด” ใต้รายการเดิม ยอดทั้งหมดจะรวมเป็นแท่งเดียวในกราฟ
      </p>

      {extras.length > 0 && (
        <ul className="mt-4 space-y-3">
          {extras.map((e, i) => (
            <ExtraItem
              key={e.id}
              index={i}
              extra={e}
              duplicate={(nameCounts.get(expenseNameKey(e.name)) ?? 0) > 1}
              onPatch={(p) => onPatch(e.id, p)}
              onRemove={() => onRemove(e.id)}
              newEntry={newEntry}
            />
          ))}
        </ul>
      )}

      <datalist id="extra-units">
        {['ชิ้น', 'ครั้ง', 'เข็ม', 'ชุด', 'แพ็ค', 'ห่อ', 'ขวด', 'กล่อง'].map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <Button variant="secondary" className="mt-4 w-full" onClick={() => onAdd()}>
        <PlusIcon size={20} aria-hidden="true" />
        เพิ่มรายการใหม่
      </Button>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="เพิ่มแบบเร็ว">
        {EXTRA_SUGGESTIONS.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => onAdd(s.name, s.unit)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-3 text-sm text-ink hover:bg-surface-muted"
          >
            <PlusIcon size={14} aria-hidden="true" />
            {s.name}
          </button>
        ))}
      </div>
    </Card>
  )
}

function ExtraItem({
  index,
  extra,
  duplicate,
  onPatch,
  onRemove,
  newEntry,
}: {
  index: number
  extra: ExtraExpense
  duplicate: boolean
  onPatch: (patch: Partial<ExtraExpense>) => void
  onRemove: () => void
  newEntry: (unit?: string) => ExpenseEntry
}) {
  const total = extraAmount(extra)
  const id = `extra-${extra.id}`
  const label = extra.name.trim() || `รายการที่ ${index + 1}`
  const setEntries = (entries: ExpenseEntry[]) => onPatch({ entries })
  const lastUnit = extra.entries[extra.entries.length - 1]?.unit

  return (
    <li className="rounded-2xl border border-line bg-surface-muted/60 p-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-name`} className="mb-1 block text-sm font-medium">
            ชื่อรายการ
          </label>
          <input
            id={`${id}-name`}
            type="text"
            value={extra.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            placeholder="เช่น เสื้อผ้า"
            maxLength={40}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`ลบรายการ ${label} ทั้งหมด`}
          className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-danger-soft hover:text-danger"
        >
          <TrashIcon size={20} aria-hidden="true" />
        </button>
      </div>
      {duplicate && <p className="mt-1 text-xs text-ink-muted">มีรายการชื่อเดียวกันอีก — กราฟจะรวมเป็นยอดเดียว</p>}

      <ol className="mt-3 space-y-2" aria-label={`ยอดของ ${label}`}>
        {extra.entries.map((entry, i) => (
          <EntryRow
            key={entry.id}
            idPrefix={`${id}-${entry.id}`}
            number={i + 1}
            itemLabel={label}
            entry={entry}
            canRemove={extra.entries.length > 1}
            onChange={(patch) => setEntries(extra.entries.map((e) => (e.id === entry.id ? { ...e, ...patch } : e)))}
            onRemove={() => setEntries(extra.entries.filter((e) => e.id !== entry.id))}
          />
        ))}
      </ol>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setEntries([...extra.entries, newEntry(lastUnit)])}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full px-2 text-sm font-semibold text-primary-strong hover:bg-primary-soft"
        >
          <PlusIcon size={16} aria-hidden="true" />
          เพิ่มยอด
        </button>
        <p className="text-sm tabular-nums text-ink">
          {total === null ? <span className="text-ink-muted">กรอกราคาให้ครบเพื่อนับในกราฟ</span> : <>รวม <strong>{baht(total)}</strong>/เดือน</>}
        </p>
      </div>
    </li>
  )
}

function EntryRow({
  idPrefix,
  number,
  itemLabel,
  entry,
  canRemove,
  onChange,
  onRemove,
}: {
  idPrefix: string
  number: number
  itemLabel: string
  entry: ExpenseEntry
  canRemove: boolean
  onChange: (patch: Partial<ExpenseEntry>) => void
  onRemove: () => void
}) {
  const amount = entryAmount(entry)
  return (
    <li className="rounded-xl bg-surface p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">ยอดที่ {number}</span>
        <span className="text-xs tabular-nums text-ink-muted">{amount === null ? '' : `= ${baht(amount)}`}</span>
      </div>
      <div className="flex items-end gap-2">
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
          <div>
            <label htmlFor={`${idPrefix}-price`} className="mb-1 block text-xs font-medium">
              ราคา/หน่วย
            </label>
            <input
              id={`${idPrefix}-price`}
              type="number"
              inputMode="decimal"
              min="0"
              value={entry.price}
              onChange={(e) => onChange({ price: e.target.value })}
              placeholder="บาท"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-qty`} className="mb-1 block text-xs font-medium">
              จำนวน/เดือน
            </label>
            <input
              id={`${idPrefix}-qty`}
              type="number"
              inputMode="decimal"
              min="0"
              value={entry.quantity}
              onChange={(e) => onChange({ quantity: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-unit`} className="mb-1 block text-xs font-medium">
              หน่วย
            </label>
            <input
              id={`${idPrefix}-unit`}
              type="text"
              list="extra-units"
              value={entry.unit}
              onChange={(e) => onChange({ unit: e.target.value })}
              maxLength={12}
              className={inputClass}
            />
          </div>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`ลบยอดที่ ${number} ของ ${itemLabel}`}
            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-danger-soft hover:text-danger"
          >
            <TrashIcon size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  )
}

/** กราฟแท่งแนวนอน: ค่าใช้จ่ายต่อเดือนทุกรายการ (ชื่อซ้ำรวมเป็นแท่งเดียว) */
function ExpenseChart({
  title,
  badge,
  lines,
  total,
  missing,
  emptyText,
}: {
  title: string
  badge: string
  lines: ExpenseLine[]
  total: number
  missing: string[]
  emptyText: string
}) {
  const data = lines.map((l) => ({ ...l, value: Math.round(l.amount) }))
  const categories = (['diapers', 'formula', 'other'] as const).filter((c) => lines.some((l) => l.category === c))

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-ink-muted">{badge}</span>
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums">{baht(total)}</p>

      {missing.length > 0 && <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 text-sm">ยังไม่รวมค่านมผง — กรอก{missing.join(' และ ')}</p>}

      {lines.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{emptyText}</p>
      ) : (
        <figure className="mt-3">
          <figcaption className="sr-only">
            กราฟ{title}: {lines.map((l) => `${l.label} ${baht(l.amount)}`).join(', ')} รวม {baht(total)}
          </figcaption>
          <div className="w-full" style={{ height: lines.length * 44 + 16 }} aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }} barCategoryGap="22%">
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis type="category" dataKey="label" width={96} tick={{ fontSize: 13, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [baht(Number(v)), 'ต่อเดือน']} cursor={{ fill: 'var(--color-surface-muted)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {data.map((d) => (
                    <Cell key={d.id} fill={CATEGORY_META[d.category].color} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v) => Number(v).toLocaleString('th-TH')}
                    style={{ fontSize: 12, fill: 'var(--color-ink)', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <CategoryLegend categories={categories} />
        </figure>
      )}

      {lines.length > 0 && (
        <ul className="mt-3 divide-y divide-line text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex items-baseline justify-between gap-3 py-1.5">
              <span className="min-w-0">
                <span className="font-medium">{l.label}</span> <span className="text-xs text-ink-muted">{l.detail}</span>
              </span>
              <span className="shrink-0 tabular-nums">{baht(l.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function CategoryLegend({ categories }: { categories: ExpenseCategory[] }) {
  return (
    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      {categories.map((c) => (
        <span key={c} className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: CATEGORY_META[c].color }} aria-hidden="true" />
          {CATEGORY_META[c].label}
        </span>
      ))}
    </p>
  )
}

/** กราฟแท่งซ้อน: เปรียบเทียบนมแม่ล้วน / ผสม / นมผงล้วน (รวมค่าผ้าอ้อมและค่าใช้จ่ายอื่นทุกแบบ) */
function CompareChart({ scenarios }: { scenarios: ReturnType<typeof compareScenarios> }) {
  const data = scenarios.map((s) => ({ ...s, diapersR: Math.round(s.diapers), formulaR: Math.round(s.formula), otherR: Math.round(s.other) }))
  const series = (
    [
      { key: 'diapersR', category: 'diapers' },
      { key: 'formulaR', category: 'formula' },
      { key: 'otherR', category: 'other' },
    ] as const
  ).filter((s) => data.some((d) => d[s.key] > 0))
  const names: Record<string, string> = { diapersR: 'ผ้าอ้อม', formulaR: 'นมผง', otherR: 'ค่าใช้จ่ายอื่น' }

  return (
    <Card>
      <h2 className="font-semibold">เปรียบเทียบตามแบบการให้นม</h2>
      <figure className="mt-3">
        <figcaption className="sr-only">กราฟเปรียบเทียบค่าใช้จ่ายต่อเดือน: {scenarios.map((s) => `${s.label} ${baht(s.total)}`).join(', ')}</figcaption>
        <div className="h-64 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
              <CartesianGrid stroke="var(--color-line)" strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 13, fill: 'var(--color-ink)' }} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => v.toLocaleString('th-TH')} />
              <Tooltip formatter={(value, name) => [baht(Number(value)), names[String(name)]]} cursor={{ fill: 'var(--color-surface-muted)' }} />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="cost"
                  fill={CATEGORY_META[s.category].color}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                  radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined}
                  isAnimationActive={false}
                >
                  {i === series.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v) => Math.round(Number(v)).toLocaleString('th-TH')}
                      style={{ fontSize: 12, fill: 'var(--color-ink)', fontWeight: 600 }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <CategoryLegend categories={series.map((s) => s.category)} />
      </figure>

      <table className="mt-3 w-full text-left text-sm">
        <caption className="sr-only">ตารางเปรียบเทียบค่าใช้จ่ายต่อเดือน</caption>
        <thead className="text-xs text-ink-muted">
          <tr>
            <th scope="col" className="py-1 font-medium">แบบ</th>
            <th scope="col" className="py-1 text-right font-medium">นมผง</th>
            <th scope="col" className="py-1 text-right font-medium">ผ้าอ้อม+อื่น</th>
            <th scope="col" className="py-1 text-right font-medium">รวม</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line tabular-nums">
          {scenarios.map((s) => (
            <tr key={s.scenario}>
              <th scope="row" className="py-1.5 font-medium">{s.label}</th>
              <td className="py-1.5 text-right">{Math.round(s.formula).toLocaleString('th-TH')}</td>
              <td className="py-1.5 text-right">{Math.round(s.diapers + s.other).toLocaleString('th-TH')}</td>
              <td className="py-1.5 text-right font-semibold">{baht(s.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-muted">นมแม่ล้วนประหยัดค่านมผงได้ {baht(scenarios[2].formula)}/เดือน เมื่อเทียบกับนมผงล้วน</p>
    </Card>
  )
}

// ---------------- แท็บ 3: บันทึกการให้นมและการนอน ----------------

function LogTab({ child, ageMonths, now }: { child: Child; ageMonths: number; now: Date }) {
  const { toggleCare, removeCareEvent } = useAppStore()
  const summary = summarizeCare(child.careLog, now, ageMonths)
  const todayEvents = [...child.careLog].filter((e) => isSameDay(parseISO(e.start), now) || !e.end).sort((a, b) => b.start.localeCompare(a.start))

  return (
    <div className="space-y-4">
      {summary.feedGapWarning && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-warning-line bg-warning-soft p-4">
          <WarningIcon size={24} weight="fill" className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-sm text-ink">
            <strong>ห่างจากมื้อล่าสุด {formatDuration(summary.minutesSinceLastFeed!)} แล้ว</strong> — ทารกอายุต่ำกว่า 1 เดือนไม่ควรห่างเกิน{' '}
            {NEWBORN_MAX_FEED_GAP_MINUTES / 60} ชั่วโมง ลองปลุกให้กินนม ถ้าปลุกยากหรือไม่ยอมกิน ให้ปรึกษาแพทย์
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <ToggleButton type="feed" active={summary.activeFeed} now={now} onToggle={() => toggleCare(child.id, 'feed')} />
        <ToggleButton type="sleep" active={summary.activeSleep} now={now} onToggle={() => toggleCare(child.id, 'sleep')} />
      </div>

      <section aria-labelledby="today-summary" className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 id="today-summary" className="font-semibold">
          สรุปวันนี้
        </h2>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="มื้อนม" value={`${summary.feedsToday}`} />
          <Stat label="นอนรวม" value={formatDuration(summary.sleepMinutesToday)} />
          <Stat
            label="ห่างจากมื้อล่าสุด"
            value={summary.activeFeed ? 'กำลังกิน' : summary.minutesSinceLastFeed === null ? '–' : formatDuration(summary.minutesSinceLastFeed)}
            warn={summary.feedGapWarning}
          />
        </dl>
      </section>

      <section aria-labelledby="today-log">
        <h2 id="today-log" className="mb-2 font-semibold">
          รายการวันนี้ ({todayEvents.length})
        </h2>
        {todayEvents.length === 0 ? (
          <p className="text-sm text-ink-muted">ยังไม่มีบันทึก กดปุ่มด้านบนเมื่อเริ่มให้นมหรือลูกเริ่มนอน แล้วกดอีกครั้งเมื่อจบ</p>
        ) : (
          <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
            {todayEvents.map((e) => (
              <LogRow key={e.id} event={e} now={now} onRemove={() => removeCareEvent(child.id, e.id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

const CARE_META: Record<CareType, { label: string; startLabel: string; stopLabel: string; icon: typeof DropIcon }> = {
  feed: { label: 'ให้นม', startLabel: 'เริ่มให้นม', stopLabel: 'หยุดให้นม', icon: DropIcon },
  sleep: { label: 'นอน', startLabel: 'เริ่มนอน', stopLabel: 'ตื่นแล้ว', icon: MoonIcon },
}

function ToggleButton({ type, active, now, onToggle }: { type: CareType; active?: CareEvent; now: Date; onToggle: () => void }) {
  const meta = CARE_META[type]
  const CareIcon = meta.icon
  const elapsed = active ? Math.max(0, differenceInMinutes(now, parseISO(active.start))) : 0
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!!active}
      className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border-2 p-4 text-center transition-colors duration-150 active:scale-[0.98] ${
        active ? 'border-primary-strong bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:border-primary/40'
      }`}
    >
      <CareIcon size={32} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
      <span className="text-lg font-bold">{active ? meta.stopLabel : meta.startLabel}</span>
      <span className={`text-sm ${active ? 'text-on-primary/90' : 'text-ink-muted'}`}>
        {active ? `เริ่ม ${format(parseISO(active.start), 'HH:mm')} · ${formatDuration(elapsed)}` : 'แตะเพื่อเริ่มจับเวลา'}
      </span>
    </button>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-3 ${warn ? 'bg-warning-soft' : 'bg-surface-muted'}`}>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={`mt-0.5 font-bold tabular-nums leading-tight ${warn ? 'text-warning' : 'text-ink'}`}>{value}</dd>
    </div>
  )
}

function LogRow({ event, now, onRemove }: { event: CareEvent; now: Date; onRemove: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const meta = CARE_META[event.type]
  const CareIcon = meta.icon
  const start = parseISO(event.start)
  const end = event.end ? parseISO(event.end) : now
  return (
    <li className="flex items-center gap-3 px-4 py-2">
      <CareIcon size={20} className="shrink-0 text-primary-strong" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-sm">
        <span className="font-medium">{meta.label}</span>{' '}
        <span className="tabular-nums text-ink-muted">
          {format(start, 'HH:mm')}–{event.end ? format(end, 'HH:mm') : 'ตอนนี้'} · {formatDuration(Math.max(0, differenceInMinutes(end, start)))}
        </span>
      </span>
      {confirm ? (
        <button type="button" onClick={onRemove} className="min-h-11 cursor-pointer rounded-full bg-danger px-3 text-xs font-semibold text-on-danger">
          ยืนยันลบ
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          aria-label={`ลบรายการ${meta.label} ${format(start, 'HH:mm')}`}
          className="grid size-11 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-danger-soft hover:text-danger"
        >
          <TrashIcon size={18} aria-hidden="true" />
        </button>
      )}
    </li>
  )
}
