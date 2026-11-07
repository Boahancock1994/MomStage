/**
 * ควิซพัฒนาการตามวัย (DSPM) — เลือกช่วงอายุให้อัตโนมัติ ทำทีละข้อ แล้วสรุป 5 ด้าน
 * ตรรกะทั้งหมดอยู่ใน src/lib/quiz.ts
 */
import { ArrowLeftIcon, ClockCounterClockwiseIcon, QuestionIcon, ThumbsDownIcon, ThumbsUpIcon, type Icon } from '../components/icons'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DisclaimerNote, QuizResultView } from '../components/QuizResultView'
import { Badge, Button, Card, PageHeader, ProgressBar } from '../components/ui'
import { DOMAIN_LABELS, DOMAIN_ORDER, DSPM_AGE_GROUPS } from '../data/dspm'
import { describeBabyAge, getBabyAge, toISODate } from '../lib/age'
import { formatThaiDate } from '../lib/format'
import {
  findPreviousForRetest,
  getAgeGroupForAge,
  getChildAgeMonths,
  getQuizForGroup,
  getQuizStatus,
  scoreQuiz,
  type QuizScore,
} from '../lib/quiz'
import { useToday } from '../lib/useToday'
import { useAppStore } from '../store/useAppStore'
import type { Child, QuizAnswer } from '../types'

type Stage = { name: 'intro' } | { name: 'quiz'; index: number } | { name: 'result'; score: QuizScore }

export default function MilestonesPage() {
  const { activeChild } = useAppStore()
  const today = useToday()
  if (!activeChild) return null

  const months = getChildAgeMonths(activeChild, today)
  if (months === null) {
    return (
      <>
        <PageHeader title="พัฒนาการตามวัย" subtitle="ควิซเฝ้าระวังพัฒนาการตามคู่มือ DSPM กรมอนามัย" />
        <Card>
          <p>ควิซพัฒนาการเริ่มใช้ได้หลังคลอด ตั้งแต่แรกเกิดถึง 3 ขวบ</p>
          <p className="mt-2 text-sm text-ink-muted">
            เมื่อ {activeChild.name} คลอดแล้ว ให้เปลี่ยนเป็นโหมด “คลอดแล้ว” ในหน้าตั้งค่า แอปจะเลือกข้อคำถามตามอายุให้อัตโนมัติ
          </p>
          <Link to="/settings" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-strong hover:underline">
            ไปหน้าตั้งค่า
          </Link>
        </Card>
      </>
    )
  }

  // key ทำให้ state ของควิซเริ่มใหม่เมื่อสลับลูก
  return <QuizFlow key={activeChild.id} child={activeChild} months={months} today={today} />
}

function QuizFlow({ child, months, today }: { child: Child; months: number; today: Date }) {
  const { addQuizResult } = useAppStore()
  const currentGroup = getAgeGroupForAge(months)
  const [groupId, setGroupId] = useState(currentGroup.id)
  const [stage, setStage] = useState<Stage>({ name: 'intro' })
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({})

  const { group, items } = getQuizForGroup(groupId)
  const status = getQuizStatus(child, today)
  const previous = findPreviousForRetest(child.quizResults, group.id, today)
  const age = getBabyAge(child.birthDate!, today)

  function start() {
    setAnswers({})
    setStage({ name: 'quiz', index: 0 })
  }

  function answer(value: QuizAnswer, index: number) {
    const next = { ...answers, [items[index].id]: value }
    setAnswers(next)
    if (index + 1 < items.length) {
      setStage({ name: 'quiz', index: index + 1 })
      return
    }
    const score = scoreQuiz(next, { items, date: today, previous })
    addQuizResult(child.id, {
      date: toISODate(today),
      ageGroupId: group.id,
      ageMonths: months,
      answers: next,
      score: score.score,
      total: score.total,
      retestDate: score.retestDate,
      isRetest: score.isRetest,
      referral: score.referral,
    })
    setStage({ name: 'result', score })
    window.scrollTo(0, 0)
  }

  if (stage.name === 'quiz') {
    const item = items[stage.index]
    return (
      <>
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => (stage.index === 0 ? setStage({ name: 'intro' }) : setStage({ name: 'quiz', index: stage.index - 1 }))}
            className="-ml-2 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full px-2 font-medium text-primary-strong hover:bg-primary-soft"
          >
            <ArrowLeftIcon size={20} aria-hidden="true" />
            {stage.index === 0 ? 'ยกเลิก' : 'ข้อก่อนหน้า'}
          </button>
          <span className="text-sm text-ink-muted">ช่วง {group.label}</span>
        </div>

        <p className="mb-1 text-sm font-medium text-ink-muted" aria-live="polite">
          ข้อ {stage.index + 1} จาก {items.length}
        </p>
        <ProgressBar value={(stage.index / items.length) * 100} label={`ทำควิซไปแล้ว ${stage.index} จาก ${items.length} ข้อ`} />

        <Card className="mt-4">
          <Badge tone="neutral">
            ด้าน{DOMAIN_LABELS[item.domain].th} · ข้อ {item.no}
          </Badge>
          <h1 className="mt-3 text-xl font-bold leading-snug">{item.question}</h1>
          <div className="mt-4 rounded-2xl bg-surface-muted p-4">
            <p className="text-sm font-semibold text-accent-strong">ลองทดสอบที่บ้าน</p>
            <p className="mt-1 text-sm text-ink">{item.howToTest}</p>
          </div>
          {previous?.answers[item.id] === 'no' && (
            <p className="mt-3 text-sm text-ink-muted">ครั้งก่อน ({formatThaiDate(previous.date, true)}) ข้อนี้ยังทำไม่ได้</p>
          )}
        </Card>

        <div className="mt-4 grid gap-3" role="group" aria-label="คำตอบ">
          <AnswerButton icon={ThumbsUpIcon} label="ทำได้" tone="yes" selected={answers[item.id] === 'yes'} onClick={() => answer('yes', stage.index)} />
          <AnswerButton icon={ThumbsDownIcon} label="ยังทำไม่ได้" tone="no" selected={answers[item.id] === 'no'} onClick={() => answer('no', stage.index)} />
          <AnswerButton icon={QuestionIcon} label="ไม่แน่ใจ" tone="unsure" selected={answers[item.id] === 'unsure'} onClick={() => answer('unsure', stage.index)} />
        </div>
      </>
    )
  }

  if (stage.name === 'result') {
    return (
      <>
        <PageHeader title="ผลการเฝ้าระวังพัฒนาการ" subtitle={`${child.name} · ช่วง ${group.label} · ${formatThaiDate(toISODate(today))}`} />
        <QuizResultView score={stage.score} />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setStage({ name: 'intro' })}>
            กลับ
          </Button>
          <Link
            to="/milestones/history"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover"
          >
            ดูประวัติ
          </Link>
        </div>
      </>
    )
  }

  // ---- หน้าเริ่มต้น ----
  const isCurrent = group.id === currentGroup.id
  return (
    <>
      <PageHeader title="พัฒนาการตามวัย" subtitle="ควิซเฝ้าระวังพัฒนาการตามคู่มือ DSPM กรมอนามัย" />

      <Card>
        <p className="text-sm text-ink-muted">
          {child.name} อายุ {describeBabyAge(age)}
        </p>
        <h2 className="mt-1 text-xl font-bold">
          ชุดคำถามช่วง {group.label}
          {group.screening && <span className="ml-2 align-middle text-xs font-medium text-accent-strong">ช่วงคัดกรอง</span>}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{items.length} ข้อ ครอบคลุม 5 ด้าน ใช้เวลาประมาณ 10 นาที</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {DOMAIN_ORDER.map((d) => (
            <li key={d}>
              <Badge tone="neutral">{DOMAIN_LABELS[d].short}</Badge>
            </li>
          ))}
        </ul>

        {!isCurrent && (
          <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-sm">
            ช่วงนี้ไม่ใช่ช่วงอายุปัจจุบัน (ช่วงปัจจุบันคือ {currentGroup.label}) — ผลจะบันทึกไว้แยกตามช่วง
          </p>
        )}
        {isCurrent && status && <QuizStatusNote status={status} />}
        {previous && (
          <p className="mt-3 text-sm text-ink-muted">
            ครั้งนี้นับเป็นการทำซ้ำของวันที่ {formatThaiDate(previous.date, true)} — ถ้าข้อเดิมยังทำไม่ได้ แอปจะแนะนำให้ปรึกษาคลินิกเด็กดี
          </p>
        )}

        <Button className="mt-4 w-full" onClick={start}>
          {previous ? 'เริ่มทำซ้ำ' : 'เริ่มทำควิซ'}
        </Button>

        <label htmlFor="quiz-group" className="mt-4 block text-sm font-medium">
          เลือกช่วงอายุอื่น
        </label>
        <select
          id="quiz-group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="mt-1 block min-h-12 w-full cursor-pointer rounded-2xl border border-line bg-surface px-4 text-base"
        >
          {DSPM_AGE_GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
              {g.id === currentGroup.id ? ' (ช่วงปัจจุบัน)' : ''}
            </option>
          ))}
        </select>
      </Card>

      <Link
        to="/milestones/history"
        className="mt-4 flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-4 font-medium transition-colors duration-150 hover:bg-surface-muted"
      >
        <ClockCounterClockwiseIcon size={22} className="text-primary-strong" aria-hidden="true" />
        <span className="flex-1">ประวัติการทำควิซ</span>
        <span className="text-sm text-ink-muted">{child.quizResults.length} ครั้ง</span>
      </Link>

      <div className="mt-4">
        <DisclaimerNote />
      </div>
    </>
  )
}

function QuizStatusNote({ status }: { status: NonNullable<ReturnType<typeof getQuizStatus>> }) {
  const text = {
    never: 'ยังไม่เคยทำควิซช่วงนี้',
    retest: `ถึงวันทำซ้ำแล้ว (นัดไว้ ${status.last?.retestDate ? formatThaiDate(status.last.retestDate, true) : ''})`,
    waiting: `ฝึกต่อและกลับมาทำซ้ำวันที่ ${status.last?.retestDate ? formatThaiDate(status.last.retestDate, true) : ''}`,
    done: `ทำแล้วเมื่อ ${status.last ? formatThaiDate(status.last.date, true) : ''} — สมวัยทุกด้าน`,
  }[status.reason]
  return <p className={`mt-3 text-sm ${status.due ? 'font-medium text-accent-strong' : 'text-ink-muted'}`}>{text}</p>
}

const answerTone = {
  yes: 'border-success/40 hover:bg-success-soft aria-pressed:bg-success-soft aria-pressed:border-success',
  no: 'border-warning-line hover:bg-warning-soft aria-pressed:bg-warning-soft aria-pressed:border-warning',
  unsure: 'border-line hover:bg-surface-muted aria-pressed:bg-surface-muted aria-pressed:border-ink-muted',
}

function AnswerButton({
  icon: AnswerIcon,
  label,
  tone,
  selected,
  onClick,
}: {
  icon: Icon
  label: string
  tone: keyof typeof answerTone
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-surface px-5 text-lg font-semibold transition-colors duration-150 active:scale-[0.99] ${answerTone[tone]}`}
    >
      <AnswerIcon size={26} aria-hidden="true" />
      {label}
    </button>
  )
}
