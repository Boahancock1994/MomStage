/**
 * ประเมินสุขภาพใจคุณแม่หลังคลอด — แบบคัดกรอง EPDS 10 ข้อ ทีละข้อ แล้วสรุปผล
 * ตรรกะและคำถามอยู่ใน src/lib/epds.ts · ไม่บันทึกคำตอบ (ข้อมูลอ่อนไหว)
 */
import { ArrowLeftIcon, ArrowCounterClockwiseIcon, CheckCircleIcon, HeartIcon, PhoneIcon, WarningIcon, WarningOctagonIcon } from '../components/icons'
import { useState } from 'react'
import { BackToTools } from '../components/ToolSafety'
import { Button, Card, PageHeader, ProgressBar } from '../components/ui'
import { EPDS_INSTRUCTION, EPDS_MAX, EPDS_QUESTIONS, scoreEpds, type EpdsLevel } from '../lib/epds'

const LEVEL: Record<EpdsLevel, { title: string; text: string; box: string; icon: typeof CheckCircleIcon; iconClass: string }> = {
  low: {
    title: 'ความเสี่ยงต่ำ',
    text: 'ช่วงนี้ใจของคุณแม่ยังรับมือได้ดี เหนื่อยหรือเศร้าบ้างเป็นเรื่องปกติหลังคลอด พักผ่อนเมื่อมีโอกาส และทำแบบประเมินซ้ำได้ทุก 2 สัปดาห์',
    box: 'border-success/40 bg-success-soft',
    icon: CheckCircleIcon,
    iconClass: 'text-success',
  },
  possible: {
    title: 'อาจมีภาวะซึมเศร้าหลังคลอด',
    text: 'ลองเล่าความรู้สึกให้คนใกล้ชิดฟัง ขอให้ช่วยดูลูกเพื่อได้พักบ้าง และทำแบบประเมินซ้ำใน 2 สัปดาห์ ถ้าคะแนนยังสูงหรือรู้สึกแย่ลง ปรึกษาแพทย์ พยาบาล หรือสายด่วน 1323',
    box: 'border-warning-line bg-warning-soft',
    icon: WarningIcon,
    iconClass: 'text-warning',
  },
  likely: {
    title: 'มีแนวโน้มภาวะซึมเศร้าหลังคลอด',
    text: 'ควรพบแพทย์หรือบุคลากรสุขภาพจิตเพื่อประเมินเพิ่ม ภาวะนี้พบได้บ่อยและรักษาได้ ไม่ใช่ความผิดของคุณแม่ แจ้งได้ที่คลินิกฝากครรภ์ คลินิกเด็กดีตอนพาลูกไปฉีดวัคซีน หรือโทร 1323',
    box: 'border-danger/40 bg-danger-soft',
    icon: WarningOctagonIcon,
    iconClass: 'text-danger',
  },
}

export default function MomMindPage() {
  const [step, setStep] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])

  const done = answers.length === EPDS_QUESTIONS.length && step === EPDS_QUESTIONS.length
  const restart = () => {
    setAnswers([])
    setStep(null)
  }

  return (
    <>
      <BackToTools />
      <PageHeader title="สุขภาพใจแม่หลังคลอด" subtitle="แบบประเมิน 10 ข้อ ใช้เวลาประมาณ 3 นาที" />

      {step === null && (
        <Card>
          <HeartIcon size={32} className="text-primary-strong" aria-hidden="true" />
          <p className="mt-3 text-ink">
            หลังคลอดคุณแม่หลายคนรู้สึกเศร้า เหนื่อย หรือกังวลมากกว่าปกติ แบบประเมินนี้ช่วยดูว่าความรู้สึกช่วงนี้เป็นอาการเหนื่อยทั่วไป
            หรือควรได้รับการดูแลเพิ่ม
          </p>
          <p className="mt-3 rounded-2xl bg-surface-muted p-4 text-ink">{EPDS_INSTRUCTION}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            <li>ไม่มีคำตอบถูกหรือผิด แอปไม่บันทึกคำตอบไว้</li>
            <li>ใช้ได้ทั้งช่วงตั้งครรภ์และหลังคลอดถึง 1 ปี</li>
          </ul>
          <Button className="mt-5 w-full" onClick={() => setStep(0)}>
            เริ่มทำแบบประเมิน
          </Button>
        </Card>
      )}

      {step !== null && !done && (
        <Question
          index={step}
          selected={answers[step]}
          onSelect={(idx) => {
            const next = [...answers.slice(0, step), idx]
            setAnswers(next)
            setStep(step + 1)
          }}
          onBack={() => setStep(step === 0 ? null : step - 1)}
        />
      )}

      {done && <Result answers={answers} onRestart={restart} />}

      <p className="mt-6 text-xs text-ink-muted">
        © 1987 The Royal College of Psychiatrists. Cox, J.L., Holden, J.M., & Sagovsky, R. (1987). Detection of postnatal depression.
        British Journal of Psychiatry, 150, 782–786. ข้อความภาษาไทยจากแบบฟอร์ม EPDS ฉบับภาษาไทยของ NSW Health ·
        เป็นแบบคัดกรอง ไม่ใช่การวินิจฉัย
      </p>
    </>
  )
}

function Question({ index, selected, onSelect, onBack }: { index: number; selected?: number; onSelect: (idx: number) => void; onBack: () => void }) {
  const q = EPDS_QUESTIONS[index]
  return (
    <Card>
      <p className="text-sm text-ink-muted">
        ข้อ {index + 1} จาก {EPDS_QUESTIONS.length} · ใน 7 วันที่ผ่านมา
      </p>
      <div className="mt-2">
        <ProgressBar value={(index / EPDS_QUESTIONS.length) * 100} label="ความคืบหน้าแบบประเมิน" />
      </div>
      <fieldset className="mt-4">
        <legend className="text-lg font-semibold text-ink">{q.text}</legend>
        <div className="mt-3 space-y-2">
          {q.options.map((opt, i) => (
            <label
              key={opt}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-strong ${
                selected === i ? 'border-primary-strong bg-primary-soft text-primary-strong' : 'border-line bg-surface hover:bg-surface-muted'
              }`}
            >
              <input type="radio" name={`epds-${q.id}`} checked={selected === i} onChange={() => onSelect(i)} className="sr-only" />
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${selected === i ? 'border-primary-strong' : 'border-line'}`}
                aria-hidden="true"
              >
                {selected === i && <span className="size-2.5 rounded-full bg-primary-strong" />}
              </span>
              <span className="font-medium">{opt}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        onClick={onBack}
        className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full px-2 font-medium text-primary-strong hover:bg-primary-soft"
      >
        <ArrowLeftIcon size={18} aria-hidden="true" />
        {index === 0 ? 'กลับไปหน้าแรก' : 'ข้อก่อนหน้า'}
      </button>
    </Card>
  )
}

function Result({ answers, onRestart }: { answers: number[]; onRestart: () => void }) {
  const r = scoreEpds(answers)
  const style = LEVEL[r.level]
  const LevelIcon = style.icon
  return (
    <div className="space-y-4" aria-live="polite">
      {r.selfHarm && (
        <div role="alert" className="rounded-2xl border border-danger bg-danger-soft p-4">
          <p className="flex items-center gap-2 font-bold text-danger">
            <WarningOctagonIcon size={22} aria-hidden="true" />
            ขอให้คุณแม่คุยกับใครสักคนตอนนี้
          </p>
          <p className="mt-2 text-sm text-ink">
            คุณแม่ตอบว่าเคยมีความคิดอยากทำร้ายตัวเอง ไม่ต้องรับมือคนเดียว บอกคนใกล้ชิดให้อยู่ด้วย และโทรหาผู้เชี่ยวชาญได้ตลอด 24 ชั่วโมง
          </p>
          <div className="mt-3 grid gap-2">
            <a
              href="tel:1323"
              className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-danger px-5 font-bold text-on-danger hover:bg-danger/90"
            >
              <PhoneIcon size={20} weight="fill" aria-hidden="true" />
              โทร 1323 สายด่วนสุขภาพจิต
            </a>
            <a
              href="tel:1669"
              className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-danger bg-surface px-5 font-semibold text-danger hover:bg-danger-soft"
            >
              <PhoneIcon size={20} aria-hidden="true" />
              โทร 1669 ถ้ามีอันตรายทันที
            </a>
          </div>
        </div>
      )}

      <div className={`rounded-[var(--radius-card)] border p-5 ${style.box}`}>
        <p className="flex items-center gap-2 text-lg font-bold text-ink">
          <LevelIcon size={24} className={style.iconClass} aria-hidden="true" />
          {style.title}
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-ink">
          {r.score} <span className="text-base font-semibold text-ink-muted">/ {EPDS_MAX} คะแนน</span>
        </p>
        <p className="mt-2 text-ink">{style.text}</p>
        <p className="mt-3 text-xs text-ink-muted">เกณฑ์: ต่ำกว่า 10 ความเสี่ยงต่ำ · 10–12 อาจมีภาวะซึมเศร้า · 13 ขึ้นไป มีแนวโน้มสูง</p>
      </div>

      <Card>
        <h2 className="font-semibold">ดูแลใจตัวเองระหว่างนี้</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
          <li>นอนเมื่อลูกหลับ ขอให้คนในบ้านช่วยดูลูกช่วงกลางคืนบางคืน</li>
          <li>กินอาหารให้ครบมื้อ ออกไปเดินรับแดดสั้น ๆ</li>
          <li>เล่าความรู้สึกให้คู่หรือเพื่อนฟัง ไม่ต้องเก็บไว้คนเดียว</li>
          <li>ถ้ารู้สึกเศร้าต่อเนื่องเกิน 2 สัปดาห์ ควรพบแพทย์ แม้คะแนนจะไม่สูง</li>
        </ul>
      </Card>

      <Button variant="secondary" className="w-full" onClick={onRestart}>
        <ArrowCounterClockwiseIcon size={20} aria-hidden="true" />
        ทำแบบประเมินอีกครั้ง
      </Button>
    </div>
  )
}
