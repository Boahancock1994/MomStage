/**
 * หน้า "ตอนนี้" — dashboard รวมทุกอย่างที่ต้องรู้ในช่วงวัยนี้
 * ลำดับ: อายุ → สิ่งที่ต้องทำเร็วๆ นี้ → พัฒนาการ → checklist
 * ทุกตัวเลขมาจาก src/lib/* (หน้านี้ไม่คำนวณเอง)
 */
import {
  CaretRightIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  ListChecksIcon,
  PuzzlePieceIcon,
  StethoscopeIcon,
  SyringeIcon,
  InfoIcon,
  UsersThreeIcon,
} from '../components/icons'
import { Link } from 'react-router-dom'
import { DashboardCard } from '../components/DashboardCard'
import { ProgressBar } from '../components/ui'
import { VaccineStatusBadge } from '../components/VaccineStatusBadge'
import { FULL_TERM_DAYS, MAX_CHILD_AGE_MONTHS } from '../data/constants'
import { getRelevantStages } from '../lib/checklist'
import { getChildStatus, type ChildStatus } from '../lib/childStatus'
import { formatAgeMonths, formatRelativeDays, formatThaiDate } from '../lib/format'
import { getPregnancyMilestones } from '../lib/pregnancy'
import { getQuizForGroup, getQuizStatus } from '../lib/quiz'
import { DSPM_AGE_GROUPS } from '../data/dspm'
import { useToday } from '../lib/useToday'
import { getActionableVaccines, getNextUpcomingVaccine, getVaccineSchedule } from '../lib/vaccine'
import { useAppStore } from '../store/useAppStore'
import type { Child } from '../types'

export default function HomePage() {
  const { activeChild } = useAppStore()
  const today = useToday()
  if (!activeChild) return null
  const status = getChildStatus(activeChild, today)
  if (!status) return null

  return (
    <div className="space-y-4">
      <h1 className="sr-only">ตอนนี้ต้องทำอะไร</h1>
      <StatusNotice status={status} />
      <AgeCard child={activeChild} status={status} />
      {status.mode === 'born' ? (
        <BornTodoCard child={activeChild} today={today} />
      ) : (
        <PregnancyTodoCard dueDate={activeChild.dueDate!} today={today} />
      )}
      <DevelopmentCard child={activeChild} status={status} today={today} />
      <ChecklistCard child={activeChild} today={today} />

      <Link
        to="/community"
        className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-4 font-medium transition-colors duration-150 hover:bg-surface-muted"
      >
        <UsersThreeIcon size={22} className="text-primary-strong" aria-hidden="true" />
        <span className="flex-1">ชุมชนคุณแม่ช่วงวัยเดียวกัน</span>
        <CaretRightIcon size={18} className="text-ink-muted" aria-hidden="true" />
      </Link>
    </div>
  )
}

/** แจ้งเมื่อข้อมูลหลุดช่วงที่แอปรองรับ: เลยกำหนดคลอด หรือลูกอายุเกิน 3 ขวบ */
function StatusNotice({ status }: { status: ChildStatus }) {
  const overdue = status.mode === 'pregnant' && status.pregnancy.daysUntilDue < 0
  const tooOld = status.mode === 'born' && status.age.months > MAX_CHILD_AGE_MONTHS
  if (!overdue && !tooOld) return null
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl border border-warning-line bg-warning-soft p-4 text-sm text-ink">
      <InfoIcon size={22} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{overdue ? 'เลยวันกำหนดคลอดแล้ว — ลูกคลอดแล้วหรือยัง?' : 'ลูกอายุเกินช่วงที่แอปรองรับ'}</p>
        <p className="mt-1">
          {overdue
            ? 'ถ้าคลอดแล้ว บันทึกวันเกิดเพื่อให้แอปเริ่มนับอายุและตารางวัคซีนของลูก'
            : `แม่สเตจออกแบบสำหรับลูกอายุไม่เกิน ${MAX_CHILD_AGE_MONTHS / 12} ขวบ ข้อมูลบางส่วนอาจไม่ครอบคลุม ดูสมุดสุขภาพเด็ก (สมุดสีชมพู) ประกอบ`}
        </p>
        {overdue && (
          <Link to="/settings" className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-primary-strong hover:underline">
            บันทึกว่าคลอดแล้ว
            <CaretRightIcon size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  )
}

function AgeCard({ child, status }: { child: Child; status: ChildStatus }) {
  const to = status.mode === 'pregnant' ? '/antenatal' : '/growth'
  return (
    <Link
      to={to}
      className="group block overflow-hidden rounded-[var(--radius-card)] bg-primary p-5 text-on-primary shadow-[var(--shadow-card)] transition-colors duration-150 hover:bg-primary-hover active:scale-[0.99]"
    >
      <p className="text-sm font-medium text-on-primary/85">{child.name}</p>
      {status.mode === 'pregnant' ? (
        <>
          <p className="mt-1 text-[1.75rem] font-bold leading-tight">
            ตั้งครรภ์สัปดาห์ที่ {status.pregnancy.weeks}
            {status.pregnancy.days > 0 && <span className="text-lg font-semibold"> +{status.pregnancy.days} วัน</span>}
          </p>
          <p className="mt-1 text-on-primary/90">
            ไตรมาส {status.pregnancy.trimester} ·{' '}
            {status.pregnancy.daysUntilDue >= 0
              ? `อีก ${status.pregnancy.daysUntilDue} วันคลอด`
              : `เลยกำหนดคลอด ${-status.pregnancy.daysUntilDue} วัน`}
          </p>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-on-primary/25"
            role="progressbar"
            aria-label="ความคืบหน้าของการตั้งครรภ์"
            aria-valuenow={Math.round((status.pregnancy.totalDays / FULL_TERM_DAYS) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, (status.pregnancy.totalDays / FULL_TERM_DAYS) * 100)}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-[1.75rem] font-bold leading-tight">อายุ {status.label}</p>
          <p className="mt-1 text-on-primary/90">
            วันที่ {(status.age.totalDays + 1).toLocaleString('th-TH')} ของชีวิต · {status.age.totalWeeks} สัปดาห์
          </p>
        </>
      )}
      <p className="mt-3 flex items-center gap-1 text-sm font-semibold">
        {status.mode === 'pregnant' ? 'ดูนัดฝากครรภ์ทั้งหมด' : 'ดูการเติบโต'}
        <CaretRightIcon size={16} className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
      </p>
    </Link>
  )
}

function BornTodoCard({ child, today }: { child: Child; today: Date }) {
  const schedule = getVaccineSchedule(child, today)
  if (!schedule) return null
  const actionable = getActionableVaccines(schedule)
  const next = getNextUpcomingVaccine(schedule)
  const shown = actionable.slice(0, 4)

  return (
    <DashboardCard to="/vaccine" title="สิ่งที่ต้องทำเร็วๆ นี้" icon={SyringeIcon} linkLabel="วัคซีน">
      {shown.length > 0 ? (
        <ul className="space-y-2">
          {shown.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug">{v.nameTh}</span>
                <span className="block text-xs text-ink-muted">
                  นัด {formatThaiDate(v.dueDate, true)} · {formatRelativeDays(-v.daysFromDue)}
                </span>
              </span>
              <VaccineStatusBadge status={v.status} />
            </li>
          ))}
          {actionable.length > shown.length && (
            <li className="text-sm text-ink-muted">และอีก {actionable.length - shown.length} รายการ</li>
          )}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-ink">
          <CheckCircleIcon size={20} className="text-success" aria-hidden="true" />
          ไม่มีวัคซีนค้างในช่วงนี้
        </p>
      )}
      {next && (
        <p className="mt-3 text-sm text-ink-muted">
          เข็มถัดไป: {next.nameTh} ตอนอายุ {formatAgeMonths(next.ageMonths)} ({formatThaiDate(next.dueDate, true)},{' '}
          {formatRelativeDays(-next.daysFromDue)})
        </p>
      )}
    </DashboardCard>
  )
}

function PregnancyTodoCard({ dueDate, today }: { dueDate: string; today: Date }) {
  const m = getPregnancyMilestones(dueDate, today)
  // ช่วงนี้: นัด/ตรวจ/วัคซีนก่อน รายการดูแลตัวเองที่ยาวตลอดครรภ์ไว้ท้าย
  const current = m.items
    .filter((i) => i.status === 'current')
    .sort((a, b) => Number(a.kind === 'self-care') - Number(b.kind === 'self-care'))
  const nextUpcoming = m.items.find((i) => i.status === 'upcoming' && i.kind !== 'self-care')

  return (
    <DashboardCard to="/antenatal" title="สิ่งที่ต้องทำเร็วๆ นี้" icon={StethoscopeIcon} linkLabel="นัดฝากครรภ์">
      <ul className="space-y-2">
        {current.slice(0, 4).map((i) => (
          <li key={i.id} className="rounded-xl bg-surface-muted px-3 py-2">
            <span className="block text-sm font-medium leading-snug">{i.title}</span>
            <span className="block text-xs text-ink-muted">
              สัปดาห์ที่ {i.weekFrom}–{i.weekTo} · ถึง {formatThaiDate(i.endDate, true)}
            </span>
          </li>
        ))}
      </ul>
      {nextUpcoming && (
        <p className="mt-3 text-sm text-ink-muted">
          ถัดไป: {nextUpcoming.title} (เริ่ม {formatThaiDate(nextUpcoming.startDate, true)})
        </p>
      )}
    </DashboardCard>
  )
}

function DevelopmentCard({ child, status, today }: { child: Child; status: ChildStatus; today: Date }) {
  const quiz = getQuizStatus(child, today)
  // ยังไม่คลอด: แสดงทักษะช่วงแรกเกิดไว้ล่วงหน้า
  const group = quiz?.group ?? DSPM_AGE_GROUPS[0]
  const { items } = getQuizForGroup(group.id)

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <PuzzlePieceIcon size={22} className="text-primary-strong" aria-hidden="true" />
        <h2 className="flex-1 text-lg font-semibold">พัฒนาการช่วงนี้</h2>
        <Link to="/milestones" className="flex min-h-11 items-center gap-0.5 text-sm font-medium text-primary-strong hover:underline">
          ดูเพิ่ม
          <CaretRightIcon size={16} aria-hidden="true" />
        </Link>
      </div>

      <p className="font-medium">
        {status.mode === 'pregnant' ? `หลังคลอด ช่วง${group.label} จะเช็ก` : `ช่วง ${group.label} ควรเช็ก`}
      </p>
      <ul className="mt-2 space-y-1">
        {items.slice(0, 3).map((i) => (
          <li key={i.id} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 shrink-0 rounded-md bg-surface-muted px-1.5 text-xs font-semibold text-ink-muted">{i.domain}</span>
            {i.skill}
          </li>
        ))}
        {items.length > 3 && <li className="pl-9 text-sm text-ink-muted">และอีก {items.length - 3} ข้อ</li>}
      </ul>

      {quiz && (
        <div className="mt-4">
          {quiz.last && (
            <p className="mb-2 text-sm text-ink-muted">
              ครั้งล่าสุด {formatThaiDate(quiz.last.date, true)} ทำได้ {quiz.last.score}/{quiz.last.total} ข้อ
              {quiz.reason === 'waiting' && quiz.last.retestDate && ` · ทำซ้ำ ${formatThaiDate(quiz.last.retestDate, true)}`}
              {quiz.last.referral && ' · แนะนำปรึกษาคลินิกเด็กดี'}
            </p>
          )}
          {quiz.due ? (
            <Link
              to="/milestones"
              className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
            >
              {quiz.reason === 'retest' ? 'ถึงวันทำซ้ำ — ทำควิซช่วงนี้' : 'ทำควิซช่วงนี้'}
            </Link>
          ) : (
            quiz.reason === 'done' && (
              <p className="flex items-center gap-2 text-sm text-ink">
                <CheckCircleIcon size={18} className="text-success" aria-hidden="true" />
                สมวัยทุกด้านในช่วงนี้
              </p>
            )
          )}
        </div>
      )}
    </section>
  )
}

function ChecklistCard({ child, today }: { child: Child; today: Date }) {
  const { current, next } = getRelevantStages(child, today)
  if (!current) return null
  // ช่วงนี้ครบแล้ว → ชวนเตรียมช่วงถัดไป
  const focus = current.percent === 100 && next ? next : current
  const remaining = focus.items.filter((i) => !child.checklist[i.id])

  return (
    <DashboardCard to="/checklist" title="ของที่ต้องเตรียม" icon={ListChecksIcon} linkLabel="ทั้งหมด">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-medium">
          {focus === current ? 'ช่วงนี้' : 'ช่วงถัดไป'}: {focus.stage.title}
        </p>
        <p className="text-sm font-semibold tabular-nums text-primary-strong">{focus.percent}%</p>
      </div>
      <div className="mt-2">
        <ProgressBar value={focus.percent} label={`เตรียมของช่วง ${focus.stage.title} แล้ว ${focus.percent}%`} />
      </div>
      {remaining.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {remaining.slice(0, 3).map((i) => (
            <li key={i.id} className="flex items-start gap-2 text-sm">
              <ClipboardTextIcon size={16} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
              {i.item}
            </li>
          ))}
          {remaining.length > 3 && <li className="pl-6 text-sm text-ink-muted">และอีก {remaining.length - 3} รายการ</li>}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">เตรียมครบทุกรายการแล้ว</p>
      )}
    </DashboardCard>
  )
}
