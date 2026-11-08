/**
 * ตัวช่วยตัดสินใจเมื่อลูกป่วย — ถามทีละข้อ (decision tree) แล้วบอกระดับ เขียว / เหลือง / แดง
 * ตรรกะอยู่ใน src/lib/sick.ts และกฎทั้งหมดอยู่ใน src/data/sickRules.ts
 */
import { ArrowCounterClockwiseIcon, ArrowLeftIcon, CheckCircleIcon, HospitalIcon, WarningIcon, WarningOctagonIcon } from '../components/icons'
import { useState } from 'react'
import { BackToTools, Call1669Button, NotDiagnosisNote } from '../components/ToolSafety'
import { Button, Card, PageHeader, ProgressBar, inputClass } from '../components/ui'
import { MAIN_SYMPTOMS, type MainSymptom, type SickAnswers, type SickQuestion, type TriageLevel } from '../data/sickRules'
import { describeBabyAge, getBabyAge } from '../lib/age'
import { TRIAGE_META, getApplicableQuestions, getNextQuestion, getSickContext, triage } from '../lib/sick'
import { useToday } from '../lib/useToday'
import { useAppStore } from '../store/useAppStore'

export default function SickPage() {
  const { activeChild } = useAppStore()
  const today = useToday()
  const ctx = getSickContext(activeChild, today)

  const [answers, setAnswers] = useState<SickAnswers>({ symptoms: [] })
  const [started, setStarted] = useState(false)
  const [history, setHistory] = useState<SickAnswers[]>([])

  const next = started ? getNextQuestion(answers, ctx) : undefined
  const result = started ? triage(answers, ctx) : null
  // เจอสัญญาณสีแดงเมื่อไร แสดงผลทันที ไม่ต้องถามต่อ
  const showResult = started && (result!.level === 'red' || !next)

  function update(patch: Partial<SickAnswers>) {
    setHistory((h) => [...h, answers])
    setAnswers((a) => ({ ...a, ...patch }))
    window.scrollTo(0, 0)
  }

  /** ย้อนกลับหนึ่งข้อ — ถ้าอยู่ข้อแรกให้กลับไปหน้าเลือกอาการ */
  function back() {
    const prev = history[history.length - 1]
    if (!prev) {
      setStarted(false)
      return
    }
    setHistory((h) => h.slice(0, -1))
    setAnswers(prev)
  }

  function restart() {
    setAnswers({ symptoms: [] })
    setHistory([])
    setStarted(false)
  }

  const ageText =
    activeChild?.mode === 'born' && activeChild.birthDate
      ? `${activeChild.name} อายุ ${describeBabyAge(getBabyAge(activeChild.birthDate, today))}`
      : 'ไม่ทราบอายุลูก (ยังไม่ได้บันทึกวันเกิด)'

  return (
    <>
      <BackToTools />
      <PageHeader title="ลูกป่วย ควรไปหาหมอไหม" subtitle={ageText} />

      {!started && (
        <SymptomStep
          selected={answers.symptoms}
          onChange={(symptoms) => setAnswers({ symptoms })}
          onNext={() => {
            setHistory([])
            setStarted(true)
          }}
        />
      )}

      {started && !showResult && next && (
        <QuestionStep
          key={next.id}
          question={next}
          step={getApplicableQuestions(answers, ctx).indexOf(next) + 1}
          total={getApplicableQuestions(answers, ctx).length}
          onAnswer={(value) => update({ [next.id]: value } as Partial<SickAnswers>)}
          onBack={back}
        />
      )}

      {showResult && result && (
        <ResultView
          level={result.level}
          reasons={result.matched.map((m) => ({ level: m.level, text: m.reason }))}
          homeCare={result.homeCare}
          onRestart={restart}
        />
      )}

      <div className="mt-6">
        <NotDiagnosisNote />
      </div>
    </>
  )
}

function SymptomStep({
  selected,
  onChange,
  onNext,
}: {
  selected: MainSymptom[]
  onChange: (s: MainSymptom[]) => void
  onNext: () => void
}) {
  const toggle = (id: MainSymptom) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  return (
    <Card>
      <fieldset>
        <legend className="text-xl font-bold">ลูกมีอาการอะไร</legend>
        <p className="mt-1 text-sm text-ink-muted">เลือกได้มากกว่า 1 อาการ แอปจะถามต่อเฉพาะเรื่องที่เกี่ยวข้อง</p>
        <div className="mt-4 grid gap-2">
          {MAIN_SYMPTOMS.map((s) => (
            <CheckRow key={s.id} label={s.label} checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
          ))}
        </div>
      </fieldset>
      <Button className="mt-4 w-full" disabled={selected.length === 0} onClick={onNext}>
        ถัดไป
      </Button>
    </Card>
  )
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-strong ${
        checked ? 'border-primary-strong bg-primary-soft' : 'border-line bg-surface hover:bg-surface-muted'
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="size-5 shrink-0 accent-[var(--color-primary-strong)]" />
      <span>{label}</span>
    </label>
  )
}

function QuestionStep({
  question,
  step,
  total,
  onAnswer,
  onBack,
}: {
  question: SickQuestion
  step: number
  total: number
  onAnswer: (value: unknown) => void
  onBack: () => void
}) {
  const [multi, setMulti] = useState<string[]>([])
  const [temp, setTemp] = useState('')
  const [tempError, setTempError] = useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mb-2 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full px-2 font-medium text-primary-strong hover:bg-primary-soft"
      >
        <ArrowLeftIcon size={20} aria-hidden="true" />
        ย้อนกลับ
      </button>
      <p className="mb-1 text-sm text-ink-muted" aria-live="polite">
        คำถามที่ {step} จาก {total}
      </p>
      <ProgressBar value={((step - 1) / total) * 100} label={`ตอบไปแล้ว ${step - 1} จาก ${total} ข้อ`} />

      <Card className="mt-4">
        <h2 className="text-xl font-bold leading-snug">{question.title}</h2>
        {question.help && <p className="mt-1 text-sm text-ink-muted">{question.help}</p>}

        {question.kind === 'multi' && (
          <div className="mt-4 grid gap-2">
            {question.options!.map((o) => (
              <CheckRow
                key={o.value}
                label={o.label}
                checked={multi.includes(o.value)}
                onChange={() => setMulti((m) => (m.includes(o.value) ? m.filter((v) => v !== o.value) : [...m, o.value]))}
              />
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => onAnswer([])}>
                ไม่มีเลย
              </Button>
              <Button disabled={multi.length === 0} onClick={() => onAnswer(multi)}>
                ถัดไป
              </Button>
            </div>
          </div>
        )}

        {question.kind === 'choice' && (
          <div className="mt-4 grid gap-2">
            {question.options!.map((o) => (
              <Button key={o.value} variant="secondary" className="!justify-start !rounded-2xl text-left" onClick={() => onAnswer(o.value)}>
                {o.label}
              </Button>
            ))}
          </div>
        )}

        {question.kind === 'yesno' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => onAnswer(true)}>
              มี
            </Button>
            <Button variant="secondary" onClick={() => onAnswer(false)}>
              ไม่มี
            </Button>
          </div>
        )}

        {question.kind === 'temperature' && (
          <form
            className="mt-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              const t = Number(temp)
              if (!temp || Number.isNaN(t) || t < 34 || t > 43) {
                setTempError('กรอกอุณหภูมิระหว่าง 34–43 °C เช่น 38.5')
                return
              }
              onAnswer(t)
            }}
          >
            <label htmlFor="sick-temp" className="mb-1 block font-medium">
              อุณหภูมิ (°C)
            </label>
            <input
              id="sick-temp"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="34"
              max="43"
              placeholder="เช่น 38.5"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              aria-invalid={tempError ? true : undefined}
              aria-describedby={tempError ? 'sick-temp-error' : undefined}
              className={inputClass}
            />
            {tempError && (
              <p id="sick-temp-error" role="alert" className="mt-2 text-sm text-danger">
                {tempError}
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => onAnswer(null)}>
                ไม่ได้วัด
              </Button>
              <Button type="submit">ถัดไป</Button>
            </div>
          </form>
        )}
      </Card>
    </>
  )
}

const LEVEL_STYLE: Record<TriageLevel, { card: string; icon: typeof CheckCircleIcon; iconClass: string }> = {
  green: { card: 'border-success/40 bg-success-soft', icon: CheckCircleIcon, iconClass: 'text-success' },
  yellow: { card: 'border-warning-line bg-warning-soft', icon: WarningIcon, iconClass: 'text-warning' },
  red: { card: 'border-danger/40 bg-danger-soft', icon: WarningOctagonIcon, iconClass: 'text-danger' },
}

function ResultView({
  level,
  reasons,
  homeCare,
  onRestart,
}: {
  level: TriageLevel
  reasons: { level: TriageLevel; text: string }[]
  homeCare: string[]
  onRestart: () => void
}) {
  const style = LEVEL_STYLE[level]
  const meta = TRIAGE_META[level]
  const LevelIcon = style.icon

  return (
    <div className="space-y-4">
      <section role={level === 'red' ? 'alert' : 'status'} className={`rounded-[var(--radius-card)] border-2 p-5 ${style.card}`}>
        <div className="flex items-start gap-3">
          <LevelIcon size={36} weight="fill" className={`shrink-0 ${style.iconClass}`} aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-ink-muted">ผลการประเมินเบื้องต้น</p>
            <h2 className="text-2xl font-bold leading-tight text-ink">{meta.title}</h2>
            <p className="mt-1 text-ink">{meta.summary}</p>
          </div>
        </div>

        {level === 'red' && (
          <div className="mt-4 space-y-2">
            <Call1669Button />
            <p className="flex items-center justify-center gap-1.5 text-sm text-ink">
              <HospitalIcon size={18} aria-hidden="true" />
              หรือพาไปห้องฉุกเฉินโรงพยาบาลที่ใกล้ที่สุด
            </p>
          </div>
        )}

        {reasons.length > 0 && (
          <div className="mt-4 rounded-2xl bg-surface p-4">
            <h3 className="text-sm font-semibold">เหตุผลที่แอปประเมินแบบนี้</h3>
            <ul className="mt-2 space-y-1.5">
              {reasons.map((r) => (
                <li key={r.text} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-1.5 text-xs font-bold ${
                      r.level === 'red' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'
                    }`}
                  >
                    {r.level === 'red' ? 'แดง' : 'เหลือง'}
                  </span>
                  {r.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {homeCare.length > 0 && (
        <Card>
          <h3 className="font-semibold">{level === 'yellow' ? 'ระหว่างรอพบแพทย์' : 'ดูแลที่บ้าน'}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {homeCare.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-medium text-danger">
            ไปโรงพยาบาลทันทีถ้ามีอาการชัก ซึมลง หายใจหอบ ปากเขียว ไม่ยอมดื่มน้ำ หรือมีผื่นจุดเลือดออก
          </p>
        </Card>
      )}

      {level !== 'red' && (
        <div className="rounded-2xl bg-surface-muted p-4 text-sm">
          <p>ถ้าอาการแย่ลงหรือกังวล โทรปรึกษาได้</p>
          <a href="tel:1669" className="mt-1 inline-flex min-h-11 items-center font-semibold text-danger underline">
            โทร 1669 (เจ็บป่วยฉุกเฉิน)
          </a>
        </div>
      )}

      <Button variant="secondary" className="w-full" onClick={onRestart}>
        <ArrowCounterClockwiseIcon size={20} aria-hidden="true" />
        ประเมินใหม่
      </Button>
    </div>
  )
}
