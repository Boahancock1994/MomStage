/**
 * ฟอร์มข้อมูลลูก — ใช้ทั้งหน้า onboarding (เพิ่มลูก) และหน้า settings (แก้ไข)
 * แสดงผลคำนวณสดทันทีที่เลือกวันที่ เพื่อให้เห็นว่าแอปคิดอะไรจากวันที่นั้น
 */
import { BabyIcon, CalculatorIcon, GenderFemaleIcon, GenderMaleIcon, QuestionIcon, BabyCarriageIcon } from './icons'
import { subMonths } from 'date-fns'
import { useId, useState, type FormEvent } from 'react'
import { FULL_TERM_DAYS, MAX_CHILD_AGE_MONTHS } from '../data/constants'
import { getBabyAge, getDueDateFromLMP, getPregnancyWeek, toISODate, describeBabyAge, describePregnancy } from '../lib/age'
import { validateChildDate } from '../lib/childStatus'
import { formatThaiDate } from '../lib/format'
import type { NewChild } from '../store/useAppStore'
import type { ChildMode, ChildSex } from '../types'
import { Button, Field, Segmented, inputClass } from './ui'

type SexChoice = ChildSex | 'unknown'

interface Props {
  initial?: Partial<NewChild>
  submitLabel: string
  onSubmit: (child: NewChild) => void
  onCancel?: () => void
}

export function ChildForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const uid = useId()
  const [today] = useState(() => new Date())
  const todayISO = toISODate(today)

  const [name, setName] = useState(initial?.name ?? '')
  const [mode, setMode] = useState<ChildMode>(initial?.mode ?? 'pregnant')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '')
  const [sex, setSex] = useState<SexChoice>(initial?.sex ?? 'unknown')
  const [showLmp, setShowLmp] = useState(false)
  const [lmp, setLmp] = useState('')
  const [touched, setTouched] = useState({ name: false, date: false })

  const date = mode === 'pregnant' ? dueDate : birthDate
  const setDate = mode === 'pregnant' ? setDueDate : setBirthDate

  const nameError = name.trim() ? null : 'กรุณาใส่ชื่อหรือชื่อเล่นของลูก'
  const dateError = validateChildDate(mode, date, today)

  function handleLmpChange(value: string) {
    setLmp(value)
    if (value) {
      setDueDate(toISODate(getDueDateFromLMP(value)))
      setTouched((t) => ({ ...t, date: true }))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ name: true, date: true })
    if (nameError || dateError) {
      document.getElementById(nameError ? `${uid}-name` : `${uid}-date`)?.focus()
      return
    }
    onSubmit({
      name: name.trim(),
      mode,
      dueDate: mode === 'pregnant' ? dueDate : undefined,
      birthDate: mode === 'born' ? birthDate : undefined,
      sex: sex === 'unknown' ? undefined : sex,
    })
  }

  const showNameError = touched.name && nameError
  const showDateError = touched.date && dateError

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Field
        id={`${uid}-name`}
        label="ชื่อเล่นลูก"
        required
        error={showNameError ? nameError : null}
        hint="ยังไม่ได้ตั้งชื่อ? ใส่ชื่อเรียกไปก่อน เช่น “เบบี๋” แก้ทีหลังได้"
      >
        <input
          id={`${uid}-name`}
          type="text"
          autoComplete="off"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          aria-invalid={showNameError ? true : undefined}
          aria-describedby={showNameError ? `${uid}-name-error` : `${uid}-name-hint`}
          className={inputClass}
          placeholder="เช่น น้องข้าวหอม"
        />
      </Field>

      <Segmented
        name={`${uid}-mode`}
        legend="ตอนนี้อยู่ช่วงไหน"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'pregnant', label: 'กำลังตั้งครรภ์', icon: <BabyCarriageIcon size={22} aria-hidden="true" /> },
          { value: 'born', label: 'คลอดแล้ว', icon: <BabyIcon size={22} aria-hidden="true" /> },
        ]}
      />

      <Field
        id={`${uid}-date`}
        label={mode === 'pregnant' ? 'วันกำหนดคลอด' : 'วันเกิดของลูก'}
        required
        error={showDateError ? dateError : null}
        hint={
          mode === 'pregnant'
            ? 'ดูได้จากสมุดฝากครรภ์ (สมุดสีชมพู) หรือใบนัดของคุณหมอ'
            : 'แอปดูแลลูกตั้งแต่แรกเกิดถึง 3 ขวบ'
        }
      >
        <input
          id={`${uid}-date`}
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setTouched((t) => ({ ...t, date: true }))
          }}
          min={mode === 'born' ? toISODate(subMonths(today, MAX_CHILD_AGE_MONTHS)) : undefined}
          max={mode === 'born' ? todayISO : undefined}
          aria-invalid={showDateError ? true : undefined}
          aria-describedby={showDateError ? `${uid}-date-error` : `${uid}-date-hint`}
          className={inputClass}
        />
      </Field>

      {/* กำหนดคลอดผ่านมาแล้ว → ชวนเปลี่ยนเป็นโหมดคลอดแล้ว (ใช้กำหนดคลอดเป็นวันเกิดตั้งต้น แก้ได้) */}
      {mode === 'pregnant' && dueDate && dueDate < todayISO && (
        <div role="status" className="-mt-3 rounded-2xl border border-accent bg-accent-soft p-4 text-sm text-ink">
          <p className="font-medium">วันกำหนดคลอดผ่านมาแล้ว — ลูกคลอดแล้วหรือยัง?</p>
          <p className="mt-1 text-ink-muted">ถ้าคลอดแล้ว เปลี่ยนเป็นโหมด “คลอดแล้ว” แอปจะเริ่มนับอายุลูกและตารางวัคซีนจากวันเกิดจริง</p>
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => {
              setMode('born')
              if (!birthDate) setBirthDate(dueDate)
              setTouched((t) => ({ ...t, date: true }))
            }}
          >
            <BabyIcon size={20} aria-hidden="true" />
            เปลี่ยนเป็นคลอดแล้ว
          </Button>
        </div>
      )}

      {mode === 'pregnant' && (
        <div className="-mt-3">
          <button
            type="button"
            onClick={() => setShowLmp((v) => !v)}
            aria-expanded={showLmp}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full text-sm font-medium text-primary-strong hover:underline"
          >
            <CalculatorIcon size={18} aria-hidden="true" />
            ไม่รู้วันกำหนดคลอด? คำนวณจากประจำเดือนครั้งสุดท้าย
          </button>
          {showLmp && (
            <div className="mt-2 rounded-2xl bg-surface-muted p-4">
              <Field
                id={`${uid}-lmp`}
                label="วันแรกของประจำเดือนครั้งสุดท้าย (LMP)"
                hint={`กำหนดคลอด = LMP + ${FULL_TERM_DAYS} วัน (กฎของ Naegele) ระบบจะเติมวันกำหนดคลอดให้อัตโนมัติ`}
              >
                <input
                  id={`${uid}-lmp`}
                  type="date"
                  value={lmp}
                  max={todayISO}
                  onChange={(e) => handleLmpChange(e.target.value)}
                  aria-describedby={`${uid}-lmp-hint`}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </div>
      )}

      <Segmented
        name={`${uid}-sex`}
        legend="เพศของลูก (ไม่บังคับ)"
        value={sex}
        onChange={setSex}
        options={[
          { value: 'girl', label: 'หญิง', icon: <GenderFemaleIcon size={20} aria-hidden="true" /> },
          { value: 'boy', label: 'ชาย', icon: <GenderMaleIcon size={20} aria-hidden="true" /> },
          { value: 'unknown', label: 'ยังไม่ทราบ', icon: <QuestionIcon size={20} aria-hidden="true" /> },
        ]}
      />

      {date && !dateError && <LivePreview mode={mode} date={date} today={today} />}

      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
      </div>
    </form>
  )
}

/** กล่องแสดงผลคำนวณพร้อมสูตร — ให้ผู้ใช้ (และอาจารย์) เห็นที่มาของตัวเลข */
function LivePreview({ mode, date, today }: { mode: ChildMode; date: string; today: Date }) {
  if (mode === 'pregnant') {
    const p = getPregnancyWeek(date, today)
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary-soft p-4" aria-live="polite">
        <p className="text-sm font-medium text-primary-strong">แม่สเตจคำนวณให้แล้ว</p>
        <p className="mt-1 text-xl font-bold text-ink">
          {describePregnancy(p)} · ไตรมาส {p.trimester}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {p.daysUntilDue >= 0
            ? `อีก ${p.daysUntilDue} วันถึงกำหนดคลอด (${formatThaiDate(date)})`
            : `เลยกำหนดคลอดมา ${-p.daysUntilDue} วัน`}
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          สูตร: {FULL_TERM_DAYS} วัน − {p.daysUntilDue} วันที่เหลือ = {p.totalDays} วัน = {p.weeks} สัปดาห์ {p.days} วัน
        </p>
      </div>
    )
  }

  const age = getBabyAge(date, today)
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary-soft p-4" aria-live="polite">
      <p className="text-sm font-medium text-primary-strong">แม่สเตจคำนวณให้แล้ว</p>
      <p className="mt-1 text-xl font-bold text-ink">ลูกอายุ {describeBabyAge(age)}</p>
      <p className="mt-1 text-sm text-ink-muted">
        รวม {age.totalDays.toLocaleString('th-TH')} วัน หรือ {age.totalWeeks} สัปดาห์ · เกิด {formatThaiDate(date)}
      </p>
    </div>
  )
}
