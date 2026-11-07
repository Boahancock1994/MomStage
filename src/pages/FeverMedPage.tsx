/**
 * คำนวณขนาดยาพาราเซตามอลน้ำเชื่อม — ใช้น้ำหนักล่าสุดจาก growthLog
 * ตรรกะอยู่ใน src/lib/paracetamol.ts
 */
import { PillIcon, ScalesIcon, WarningOctagonIcon } from '../components/icons'
import { differenceInCalendarDays } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BackToTools, Call1669Button, NotDiagnosisNote } from '../components/ToolSafety'
import { Card, Field, PageHeader, Segmented, inputClass } from '../components/ui'
import { describeBabyAge, getBabyAge, toDay } from '../lib/age'
import { formatThaiDate } from '../lib/format'
import {
  CONCENTRATIONS,
  MAX_DOSES_PER_DAY,
  MG_PER_KG_MAX,
  MG_PER_KG_MIN,
  MIN_AGE_MONTHS,
  MIN_INTERVAL_HOURS,
  calcParacetamolDose,
  isParacetamolAllowed,
  type Concentration,
} from '../lib/paracetamol'
import { useToday } from '../lib/useToday'
import { useAppStore } from '../store/useAppStore'

/** น้ำหนักที่ชั่งเก่ากว่านี้ (วัน) จะเตือนให้ชั่งใหม่ */
const STALE_WEIGHT_DAYS = 30

export default function FeverMedPage() {
  const { activeChild } = useAppStore()
  const today = useToday()
  const [concentration, setConcentration] = useState<Concentration>(120)
  const [manualWeight, setManualWeight] = useState('')

  const born = activeChild?.mode === 'born' && activeChild.birthDate
  const ageMonths = born ? getBabyAge(activeChild.birthDate!, today).months : null
  const allowed = isParacetamolAllowed(ageMonths)

  const latest = [...(activeChild?.growthLog ?? [])].filter((g) => g.weightKg !== undefined).sort((a, b) => b.date.localeCompare(a.date))[0]
  const staleDays = latest ? differenceInCalendarDays(toDay(today), toDay(latest.date)) : 0

  const manual = manualWeight ? Number(manualWeight) : undefined
  const manualInvalid = manual !== undefined && (Number.isNaN(manual) || manual < 2 || manual > 40)
  const weight = manual !== undefined && !manualInvalid ? manual : latest?.weightKg
  const dose = allowed && weight ? calcParacetamolDose(weight, concentration) : null

  return (
    <>
      <BackToTools />
      <PageHeader
        title="คำนวณยาลดไข้"
        subtitle={born ? `${activeChild!.name} อายุ ${describeBabyAge(getBabyAge(activeChild!.birthDate!, today))}` : 'พาราเซตามอลชนิดน้ำเชื่อมสำหรับเด็ก'}
      />

      {!allowed ? (
        <section role="alert" className="rounded-[var(--radius-card)] border-2 border-danger/40 bg-danger-soft p-5">
          <div className="flex items-start gap-3">
            <WarningOctagonIcon size={32} weight="fill" className="shrink-0 text-danger" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-bold">{ageMonths === null ? 'ยังคำนวณให้ไม่ได้' : 'ลูกอายุน้อยกว่า 3 เดือน — ไม่ควรให้ยาเอง'}</h2>
              <p className="mt-1 text-ink">
                {ageMonths === null
                  ? 'แอปต้องรู้วันเกิดของลูกก่อน เพราะเด็กอายุต่ำกว่า 3 เดือนห้ามให้ยาลดไข้เองโดยไม่ปรึกษาแพทย์'
                  : `ทารกอายุต่ำกว่า ${MIN_AGE_MONTHS} เดือนที่มีไข้ตั้งแต่ 38 °C ต้องพบแพทย์ทันที อย่าให้ยาลดไข้เองเพราะอาจกลบอาการติดเชื้อรุนแรง`}
              </p>
            </div>
          </div>
          {ageMonths !== null && <Call1669Button className="mt-4" />}
        </section>
      ) : (
        <>
          <Card>
            <h2 className="flex items-center gap-2 font-semibold">
              <ScalesIcon size={20} className="text-primary-strong" aria-hidden="true" />
              น้ำหนักที่ใช้คำนวณ
            </h2>
            {latest ? (
              <p className="mt-1 text-sm text-ink-muted">
                น้ำหนักล่าสุดจากหน้าการเติบโต: <strong className="text-ink">{latest.weightKg} กก.</strong> (ชั่งเมื่อ{' '}
                {formatThaiDate(latest.date, true)})
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">
                ยังไม่มีน้ำหนักในแอป กรอกด้านล่าง หรือ <Link to="/growth" className="font-medium text-primary-strong underline">บันทึกที่หน้าการเติบโต</Link>
              </p>
            )}
            {latest && staleDays > STALE_WEIGHT_DAYS && !manual && (
              <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-ink">
                น้ำหนักนี้ชั่งไว้ {staleDays} วันแล้ว ลูกอาจหนักขึ้น ควรชั่งใหม่หรือกรอกน้ำหนักปัจจุบันด้านล่าง
              </p>
            )}
            <div className="mt-3">
              <Field
                id="med-weight"
                label="ใช้น้ำหนักอื่น (กก.)"
                error={manualInvalid ? 'กรอกน้ำหนักระหว่าง 2–40 กก.' : null}
                hint="เว้นว่างไว้เพื่อใช้น้ำหนักล่าสุด"
              >
                <input
                  id="med-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="2"
                  max="40"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                  aria-invalid={manualInvalid ? true : undefined}
                  aria-describedby={manualInvalid ? 'med-weight-error' : 'med-weight-hint'}
                  className={inputClass}
                  placeholder={latest ? String(latest.weightKg) : 'เช่น 8.5'}
                />
              </Field>
            </div>
          </Card>

          <Card className="mt-4">
            <Segmented<string>
              name="med-conc"
              legend="ความเข้มข้นของยา (ดูที่ฉลากขวด)"
              value={String(concentration)}
              onChange={(v) => setConcentration(Number(v) as Concentration)}
              options={CONCENTRATIONS.map((c) => ({ value: String(c), label: `${c} มก./5 มล.` }))}
            />
          </Card>

          {dose && weight && (
            <section aria-live="polite" className="mt-4 rounded-[var(--radius-card)] border-2 border-primary/40 bg-primary-soft p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-primary-strong">
                <PillIcon size={18} aria-hidden="true" />
                ขนาดยาต่อครั้ง
              </p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-ink">
                {dose.suggestedMl} <span className="text-xl">มล.</span>
              </p>
              <p className="text-sm text-ink">
                = พาราเซตามอล {dose.suggestedMg} มก. (ช่วงที่ปลอดภัย {dose.minMl}–{dose.maxMl} มล.)
              </p>
              <ul className="mt-3 space-y-1 text-sm text-ink">
                <li>ให้เมื่อมีไข้ ทุก 4–6 ชั่วโมง ห่างกันอย่างน้อย {MIN_INTERVAL_HOURS} ชั่วโมง</li>
                <li>ไม่เกิน {MAX_DOSES_PER_DAY} ครั้งใน 24 ชั่วโมง</li>
                <li>ใช้ไซริงค์หรือถ้วยตวงที่มากับยา ไม่ใช้ช้อนกินข้าว</li>
              </ul>
              <p className="mt-3 text-xs text-ink-muted">
                สูตร: {MG_PER_KG_MIN}–{MG_PER_KG_MAX} มก./กก. × {weight} กก. = {dose.minMg}–{dose.maxMg} มก. · ยา {concentration} มก./5 มล. ={' '}
                {concentration / 5} มก./มล. · ปริมาณแนะนำปัดลงทีละ 0.5 มล. เพื่อไม่ให้เกินขนาดสูงสุด
              </p>
            </section>
          )}

          <div className="mt-4 rounded-2xl bg-warning-soft p-4 text-sm text-ink">
            <p className="font-semibold">ก่อนให้ยา</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>อ่านฉลากยาทุกครั้ง ตรวจความเข้มข้นให้ตรงกับที่เลือก</li>
              <li>ห้ามให้ยาลดไข้ที่มีพาราเซตามอลซ้ำกันหลายชนิด</li>
              <li>ไข้ไม่ลงภายใน 3 วัน หรือมีอาการอันตราย ให้พบแพทย์ —{' '}
                <Link to="/tools/sick" className="font-medium text-primary-strong underline">
                  ลองใช้ตัวช่วยตัดสินใจ
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}

      <div className="mt-6">
        <NotDiagnosisNote />
      </div>
    </>
  )
}
