/**
 * กราฟการเจริญเติบโต — เทียบน้ำหนัก/ส่วนสูงกับเกณฑ์ WHO 0–36 เดือน
 * ตรรกะ z-score / เปอร์เซ็นไทล์ / การเตือนอยู่ใน src/lib/growth.ts
 */
import { RulerIcon, ScalesIcon, TrashIcon, WarningIcon } from '../components/icons'
import { useId, useState, type FormEvent } from 'react'
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, Card, Field, PageHeader, Segmented, inputClass } from '../components/ui'
import type { GrowthIndicator, GrowthSex } from '../data/whoGrowth'
import { describeBabyAge, getAgeInMonthsExact, getBabyAge, toISODate } from '../lib/age'
import { formatThaiDate } from '../lib/format'
import {
  CROSSING_ALERT_MIN_LINES,
  MAX_GROWTH_MONTHS,
  assessGrowth,
  formatPercentile,
  getPercentileCurves,
  type AssessedEntry,
  type MeasurementAssessment,
} from '../lib/growth'
import { useToday } from '../lib/useToday'
import { useAppStore } from '../store/useAppStore'
import type { Child } from '../types'

const INDICATOR_META: Record<GrowthIndicator, { label: string; unit: string; field: 'weightKg' | 'heightCm' }> = {
  weight: { label: 'น้ำหนัก', unit: 'กก.', field: 'weightKg' },
  height: { label: 'ส่วนสูง', unit: 'ซม.', field: 'heightCm' },
}

export default function GrowthPage() {
  const { activeChild, updateChild } = useAppStore()
  const today = useToday()
  if (!activeChild) return null

  if (activeChild.mode !== 'born' || !activeChild.birthDate) {
    return (
      <>
        <PageHeader title="การเติบโต" subtitle="กราฟน้ำหนักและส่วนสูงเทียบเกณฑ์ WHO" />
        <Card>
          <p>บันทึกน้ำหนักและส่วนสูงได้หลังคลอด แอปจะเทียบกับเกณฑ์ WHO ให้อัตโนมัติ</p>
        </Card>
      </>
    )
  }

  if (!activeChild.sex) {
    return (
      <>
        <PageHeader title="การเติบโต" subtitle="กราฟน้ำหนักและส่วนสูงเทียบเกณฑ์ WHO" />
        <Card>
          <p className="mb-4">เกณฑ์ WHO แยกตามเพศ กรุณาเลือกเพศของ {activeChild.name} ก่อน</p>
          <Segmented<GrowthSex>
            name="growth-sex"
            legend="เพศของลูก"
            value={undefined}
            onChange={(sex) => updateChild(activeChild.id, { sex })}
            options={[
              { value: 'girl', label: 'หญิง' },
              { value: 'boy', label: 'ชาย' },
            ]}
          />
        </Card>
      </>
    )
  }

  return <GrowthContent child={activeChild} sex={activeChild.sex} today={today} />
}

function GrowthContent({ child, sex, today }: { child: Child; sex: GrowthSex; today: Date }) {
  const [indicator, setIndicator] = useState<GrowthIndicator>('weight')
  const assessed = assessGrowth(child.growthLog, child.birthDate!, sex)
  const latest = assessed[assessed.length - 1]

  return (
    <>
      <PageHeader title="การเติบโต" subtitle={`${child.name} · เทียบเกณฑ์ WHO ${sex === 'girl' ? 'เด็กหญิง' : 'เด็กชาย'} 0–3 ปี`} />

      {latest && <LatestSummary entry={latest} />}

      <Card className="mt-4">
        <Segmented<GrowthIndicator>
          name="growth-indicator"
          legend="แสดงกราฟ"
          value={indicator}
          onChange={setIndicator}
          options={[
            { value: 'weight', label: 'น้ำหนัก', icon: <ScalesIcon size={20} aria-hidden="true" /> },
            { value: 'height', label: 'ส่วนสูง', icon: <RulerIcon size={20} aria-hidden="true" /> },
          ]}
        />
        <GrowthChart child={child} sex={sex} indicator={indicator} assessed={assessed} />
      </Card>

      <AddMeasurementForm child={child} today={today} />

      <HistoryTable child={child} assessed={assessed} />

      <p className="mt-6 text-xs text-ink-muted">
        อ้างอิง: WHO Child Growth Standards (2006) ค่า LMS รายเดือน · เปอร์เซ็นไทล์คำนวณด้วยสูตร LMS · เตือนเมื่อเปอร์เซ็นไทล์ตกข้ามเส้นหลัก
        (P3, P15, P50, P85, P97) ตั้งแต่ {CROSSING_ALERT_MIN_LINES} เส้นขึ้นไประหว่างการชั่ง 2 ครั้งติดกัน — ผลนี้ใช้เฝ้าระวังเบื้องต้น ไม่ใช่การวินิจฉัย
      </p>
    </>
  )
}

function LatestSummary({ entry }: { entry: AssessedEntry }) {
  const alerts = (['weight', 'height'] as const).filter((k) => entry[k]?.crossingAlert)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {(['weight', 'height'] as const).map((k) => (
          <SummaryTile key={k} indicator={k} m={entry[k]} />
        ))}
      </div>
      <p className="text-xs text-ink-muted">ล่าสุด {formatThaiDate(entry.entry.date)}</p>
      {alerts.map((k) => (
        <div key={k} role="alert" className="flex gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4">
          <WarningIcon size={22} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <p className="text-sm text-ink">
            <strong className="text-danger">{INDICATOR_META[k].label}ลดลงข้ามเส้นเปอร์เซ็นไทล์หลัก {entry[k]!.linesCrossedDown} เส้น</strong>{' '}
            จากการชั่งครั้งก่อน ควรปรึกษาเจ้าหน้าที่คลินิกเด็กดีหรือแพทย์
          </p>
        </div>
      ))}
    </div>
  )
}

function SummaryTile({ indicator, m }: { indicator: GrowthIndicator; m?: MeasurementAssessment }) {
  const meta = INDICATOR_META[indicator]
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm text-ink-muted">{meta.label}</p>
      {m ? (
        <>
          <p className="text-2xl font-bold tabular-nums">
            {m.value} <span className="text-base font-medium text-ink-muted">{meta.unit}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-sm">
            <span className="font-semibold tabular-nums">{formatPercentile(m.percentile)}</span>
            <Badge tone={m.level === 'normal' ? 'success' : m.level === 'low' ? 'danger' : 'warning'}>{m.text}</Badge>
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-ink-muted">ยังไม่ได้บันทึก</p>
      )}
    </div>
  )
}

/** ข้อมูลรวม: แถวรายเดือนของเส้น WHO + แถวของจุดที่ชั่งจริง (เรียงตามอายุ) */
interface ChartRow {
  month: number
  p3?: number
  p15?: number
  p50?: number
  p85?: number
  p97?: number
  child?: number
  childPercentile?: number
  date?: string
}

const CURVE_KEYS = ['p3', 'p15', 'p50', 'p85', 'p97'] as const

function GrowthChart({
  child,
  sex,
  indicator,
  assessed,
}: {
  child: Child
  sex: GrowthSex
  indicator: GrowthIndicator
  assessed: AssessedEntry[]
}) {
  const meta = INDICATOR_META[indicator]
  const points = assessed.filter((a) => a[indicator])
  const maxAge = points.length ? points[points.length - 1].ageMonths : 0
  // แสดงอย่างน้อย 12 เดือน และเผื่อข้างหน้า 3 เดือนจากจุดล่าสุด
  const xMax = Math.min(MAX_GROWTH_MONTHS, Math.max(12, Math.ceil(maxAge) + 3))

  const rows: ChartRow[] = [
    ...getPercentileCurves(indicator, sex, xMax),
    ...points.map((a) => ({
      month: a.ageMonths,
      child: a[indicator]!.value,
      childPercentile: a[indicator]!.percentile,
      date: a.entry.date,
    })),
  ].sort((a, b) => a.month - b.month)

  const lastIndex = rows.length - 1
  const ticks = Array.from({ length: Math.floor(xMax / 3) + 1 }, (_, i) => i * 3)

  const summary = points.length
    ? `กราฟ${meta.label}ของ${child.name} ${points.length} ครั้ง ล่าสุด ${points[points.length - 1][indicator]!.value} ${meta.unit} อยู่ที่ ${formatPercentile(points[points.length - 1][indicator]!.percentile)}`
    : `กราฟเส้นเปอร์เซ็นไทล์${meta.label}ตามเกณฑ์ WHO ยังไม่มีข้อมูลของลูก`

  return (
    <figure className="mt-4">
      <figcaption className="sr-only">{summary}</figcaption>
      <div className="h-80 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 34, bottom: 18, left: -8 }}>
            <CartesianGrid stroke="var(--color-line)" strokeOpacity={0.6} vertical={false} />
            <XAxis
              type="number"
              dataKey="month"
              domain={[0, xMax]}
              ticks={ticks}
              tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
              label={{ value: 'อายุ (เดือน)', position: 'insideBottom', offset: -10, fontSize: 12, fill: 'var(--color-ink-muted)' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }}
              tickLine={false}
              axisLine={false}
              width={44}
              unit=""
            />
            {CURVE_KEYS.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                connectNulls
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                stroke="var(--color-ink-muted)"
                strokeOpacity={key === 'p50' ? 0.55 : 0.3}
                strokeWidth={key === 'p50' ? 2 : 1.5}
                strokeDasharray={key === 'p3' || key === 'p97' ? '5 4' : undefined}
                label={({ x, y, index }: { x?: number | string; y?: number | string; index?: number }) =>
                  index === lastIndex ? (
                    <text x={Number(x) + 4} y={Number(y) + 4} fontSize={11} fill="var(--color-ink-muted)">
                      {key.toUpperCase()}
                    </text>
                  ) : null
                }
              />
            ))}
            <Line
              dataKey="child"
              type="linear"
              connectNulls
              isAnimationActive={false}
              stroke="var(--color-accent-strong)"
              strokeWidth={2.5}
              dot={{ r: 4.5, fill: 'var(--color-accent-strong)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: 'var(--color-surface)', strokeWidth: 2 }}
            />
            <Tooltip content={({ active, payload }) => <ChartTooltip active={active} payload={payload} unit={meta.unit} />} cursor={{ stroke: 'var(--color-line)' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-accent-strong" aria-hidden="true" />
          {child.name} ({meta.unit})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-ink-muted/50" aria-hidden="true" />
          เส้นเปอร์เซ็นไทล์ WHO (P3–P97 = ช่วงปกติ)
        </span>
      </p>
      {points.length === 0 && <p className="mt-2 text-sm text-ink-muted">ยังไม่มีข้อมูล{meta.label} — บันทึกด้านล่างเพื่อดูจุดของลูกบนกราฟ</p>}
    </figure>
  )
}

function ChartTooltip({ active, payload, unit }: { active?: boolean; payload?: readonly { payload?: unknown }[]; unit: string }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as ChartRow
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-ink">อายุ {row.month.toFixed(1)} เดือน</p>
      {row.child !== undefined ? (
        <>
          <p className="text-ink">
            {row.child} {unit} · {formatPercentile(row.childPercentile!)}
          </p>
          {row.date && <p className="text-ink-muted">{formatThaiDate(row.date, true)}</p>}
        </>
      ) : (
        row.p50 !== undefined && (
          <p className="text-ink-muted">
            เกณฑ์ปกติ {row.p3!.toFixed(1)}–{row.p97!.toFixed(1)} {unit} (P50 {row.p50.toFixed(1)})
          </p>
        )
      )}
    </div>
  )
}

function AddMeasurementForm({ child, today }: { child: Child; today: Date }) {
  const { addGrowthEntry } = useAppStore()
  const uid = useId()
  const [date, setDate] = useState(toISODate(today))
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    const w = weight ? Number(weight) : undefined
    const h = height ? Number(height) : undefined
    const age = date ? getAgeInMonthsExact(child.birthDate!, date) : -1

    let msg: string | null = null
    if (!date) msg = 'กรุณาเลือกวันที่ชั่ง/วัด'
    else if (date < child.birthDate! || date > toISODate(today)) msg = 'วันที่ต้องอยู่ระหว่างวันเกิดถึงวันนี้'
    else if (age > MAX_GROWTH_MONTHS) msg = 'เกณฑ์ในแอปครอบคลุมถึงอายุ 3 ขวบ'
    else if (w === undefined && h === undefined) msg = 'กรอกน้ำหนักหรือส่วนสูงอย่างน้อยหนึ่งค่า'
    else if (w !== undefined && (Number.isNaN(w) || w < 0.5 || w > 30)) msg = 'น้ำหนักควรอยู่ระหว่าง 0.5–30 กก. ตรวจทศนิยมอีกครั้ง'
    else if (h !== undefined && (Number.isNaN(h) || h < 30 || h > 130)) msg = 'ส่วนสูงควรอยู่ระหว่าง 30–130 ซม.'
    setError(msg)
    if (msg) return

    addGrowthEntry(child.id, { date, weightKg: w, heightCm: h })
    setWeight('')
    setHeight('')
    setSaved(true)
  }

  return (
    <Card className="mt-4">
      <h2 className="mb-3 text-lg font-semibold">บันทึกน้ำหนัก / ส่วนสูง</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field id={`${uid}-date`} label="วันที่ชั่ง/วัด" required>
          <input
            id={`${uid}-date`}
            type="date"
            value={date}
            min={child.birthDate}
            max={toISODate(today)}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id={`${uid}-w`} label="น้ำหนัก (กก.)">
            <input
              id={`${uid}-w`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.5"
              max="30"
              placeholder="เช่น 6.2"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field id={`${uid}-h`} label="ส่วนสูง (ซม.)">
            <input
              id={`${uid}-h`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="30"
              max="130"
              placeholder="เช่น 62"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="min-h-5 text-sm" aria-live="polite">
          {error && (
            <span role="alert" className="text-danger">
              {error}
            </span>
          )}
          {saved && !error && <span className="text-success">บันทึกแล้ว กราฟอัปเดตเรียบร้อย</span>}
        </p>
        <Button type="submit" className="w-full">
          บันทึก
        </Button>
      </form>
    </Card>
  )
}

function HistoryTable({ child, assessed }: { child: Child; assessed: AssessedEntry[] }) {
  const { removeGrowthEntry } = useAppStore()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  if (assessed.length === 0) return null

  const cell = (m?: MeasurementAssessment) =>
    m ? (
      <>
        <span className="block tabular-nums">{m.value}</span>
        <span className={`block text-xs ${m.level === 'normal' ? 'text-ink-muted' : 'font-semibold text-danger'}`}>
          {formatPercentile(m.percentile)}
          {m.crossingAlert && ' ↓'}
        </span>
      </>
    ) : (
      <span className="text-ink-muted">–</span>
    )

  return (
    <section className="mt-6" aria-labelledby="growth-history">
      <h2 id="growth-history" className="mb-2 text-lg font-semibold">
        ประวัติการชั่ง/วัด ({assessed.length} ครั้ง)
      </h2>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs text-ink-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                วันที่ / อายุ
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                น้ำหนัก (กก.)
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                ส่วนสูง (ซม.)
              </th>
              <th scope="col" className="w-12 px-2 py-2">
                <span className="sr-only">ลบ</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...assessed].reverse().map((a) => (
              <tr key={a.entry.id} className="align-top">
                <td className="px-3 py-2">
                  <span className="block">{formatThaiDate(a.entry.date, true)}</span>
                  <span className="block text-xs text-ink-muted">{describeBabyAge(getBabyAge(child.birthDate!, a.entry.date))}</span>
                </td>
                <td className="px-2 py-2">{cell(a.weight)}</td>
                <td className="px-2 py-2">{cell(a.height)}</td>
                <td className="px-1 py-1 text-right">
                  {pendingDelete === a.entry.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        removeGrowthEntry(child.id, a.entry.id)
                        setPendingDelete(null)
                      }}
                      className="min-h-11 cursor-pointer rounded-full bg-danger px-2 text-xs font-semibold text-on-danger"
                    >
                      ยืนยันลบ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(a.entry.id)}
                      aria-label={`ลบรายการวันที่ ${formatThaiDate(a.entry.date)}`}
                      className="grid size-11 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <TrashIcon size={18} aria-hidden="true" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-muted">↓ = เปอร์เซ็นไทล์ตกข้ามเส้นหลักถึงเกณฑ์เตือน · ตัวแดง = นอกช่วง P3–P97</p>
    </section>
  )
}
