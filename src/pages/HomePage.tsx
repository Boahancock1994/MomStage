/**
 * หน้าหลัก — dashboard สรุปภาพรวมของช่วงวัยนี้ด้วยตัวเลข วงแหวน และกราฟจิ๋ว
 * แตะการ์ดเพื่อดูรายละเอียดในหน้านั้น ๆ
 * ทุกตัวเลขมาจาก src/lib/* (หน้านี้ไม่คำนวณเอง)
 */
import {
  CalendarCheckIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ChartLineIcon,
  ClockIcon,
  InfoIcon,
  ListChecksIcon,
  PuzzlePieceIcon,
  QuestionIcon,
  StethoscopeIcon,
  SyringeIcon,
  TestTubeIcon,
  WarningCircleIcon,
} from '../components/icons'
import { Link } from 'react-router-dom'
import { Ring, Sparkline, StatRow, Tile } from '../components/DashboardWidgets'
import { FULL_TERM_DAYS, MAX_CHILD_AGE_MONTHS } from '../data/constants'
import { DOMAIN_ORDER } from '../data/dspm'
import { getRelevantStages } from '../lib/checklist'
import { getChildStatus, type ChildStatus } from '../lib/childStatus'
import { formatRelativeDays } from '../lib/format'
import { assessGrowth, formatPercentile } from '../lib/growth'
import { getNextVisit, getPregnancyMilestones } from '../lib/pregnancy'
import { getQuizForGroup, getQuizStatus, scoreQuiz } from '../lib/quiz'
import { toDay } from '../lib/age'
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
    <div className="space-y-3">
      <h1 className="sr-only">หน้าหลัก</h1>
      <StatusNotice status={status} />
      <AgeCard child={activeChild} status={status} />
      {status.mode === 'born' ? (
        <>
          <VaccineTile child={activeChild} today={today} />
          <div className="grid grid-cols-2 gap-3">
            <GrowthTile child={activeChild} />
            <ChecklistTile child={activeChild} today={today} />
          </div>
          <DevelopmentTile child={activeChild} today={today} />
        </>
      ) : (
        <>
          <AntenatalTile dueDate={activeChild.dueDate!} today={today} />
          <div className="grid grid-cols-2 gap-3">
            <ChecksNowTile dueDate={activeChild.dueDate!} today={today} />
            <ChecklistTile child={activeChild} today={today} />
          </div>
        </>
      )}
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
              className="h-full rounded-full bg-accent-strong"
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
    </Link>
  )
}

/** วัคซีน: วงแหวนเข็มที่ฉีดแล้ว + จำนวนตามสถานะ + เข็มที่ต้องทำต่อ */
function VaccineTile({ child, today }: { child: Child; today: Date }) {
  const schedule = getVaccineSchedule(child, today)
  if (!schedule) return null
  // เข็มเฉพาะกรณีไม่นับ เพื่อให้ตัวเลขตรงกับตารางพื้นฐานในสมุดสีชมพู
  const required = schedule.items.filter((v) => !v.optional)
  const count = (s: string) => required.filter((v) => v.status === s).length
  const done = count('done')
  const actionable = getActionableVaccines(schedule)
  const next = getNextUpcomingVaccine(schedule)

  return (
    <Tile to="/vaccine" title="วัคซีน" icon={SyringeIcon}>
      <div className="flex items-center gap-4">
        <Ring value={done} max={required.length}>
          <span>
            <span className="block text-xl font-bold tabular-nums text-ink">
              {done}/{required.length}
            </span>
            <span className="block text-xs text-ink-muted">เข็ม</span>
          </span>
        </Ring>
        <ul className="min-w-0 flex-1 space-y-1.5">
          <StatRow icon={WarningCircleIcon} iconClass="text-danger" label="เลยกำหนด" value={count('overdue')} />
          <StatRow icon={CalendarCheckIcon} iconClass="text-warning" label="ถึงกำหนด" value={count('due')} />
          <StatRow icon={CheckCircleIcon} iconClass="text-success" label="ฉีดแล้ว" value={done} />
        </ul>
      </div>
      <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-sm">
        {actionable.length > 0 ? (
          <>
            <span className="text-ink-muted">ถึงคิว: </span>
            <span className="font-medium">{actionable[0].nameTh}</span>
            {actionable.length > 1 && <span className="text-ink-muted"> และอีก {actionable.length - 1} เข็ม</span>}
          </>
        ) : next ? (
          <>
            <span className="text-ink-muted">เข็มถัดไป </span>
            <span className="font-medium">{formatRelativeDays(-next.daysFromDue)}</span>
          </>
        ) : (
          <span className="font-medium">ครบทุกเข็มพื้นฐานแล้ว</span>
        )}
      </p>
    </Tile>
  )
}

/** การเติบโต: น้ำหนักล่าสุด + เปอร์เซ็นไทล์ + กราฟเส้นจิ๋ว */
function GrowthTile({ child }: { child: Child }) {
  const weights = [...child.growthLog]
    .filter((g) => g.weightKg !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
  const latest = weights[weights.length - 1]
  const assessed = child.sex && child.birthDate ? assessGrowth(child.growthLog, child.birthDate, child.sex) : []
  const latestWeight = [...assessed].reverse().find((a) => a.weight)?.weight

  return (
    <Tile to="/growth" title="น้ำหนัก" icon={ChartLineIcon}>
      {latest ? (
        <>
          <p className="text-2xl font-bold tabular-nums text-ink">
            {latest.weightKg} <span className="text-base font-semibold">กก.</span>
          </p>
          {latestWeight && (
            <p className="text-xs text-ink-muted">
              {formatPercentile(latestWeight.percentile)} ·{' '}
              <span className={latestWeight.level === 'normal' ? 'text-success' : 'text-warning'}>
                {latestWeight.level === 'normal' ? 'อยู่ในเกณฑ์' : latestWeight.level === 'low' ? 'น้อยกว่าเกณฑ์' : 'มากกว่าเกณฑ์'}
              </span>
            </p>
          )}
          <div className="mt-auto pt-2">
            <Sparkline values={weights.map((w) => w.weightKg!)} />
          </div>
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-ink-muted">–</p>
          <p className="mt-1 text-xs text-ink-muted">ยังไม่มีข้อมูล แตะเพื่อบันทึกน้ำหนัก</p>
        </>
      )}
    </Tile>
  )
}

/** ของที่ต้องเตรียม: วงแหวน % ของช่วงนี้ */
function ChecklistTile({ child, today }: { child: Child; today: Date }) {
  const { current, next } = getRelevantStages(child, today)
  if (!current) return null
  // ช่วงนี้ครบแล้ว → ชวนเตรียมช่วงถัดไป
  const focus = current.percent === 100 && next ? next : current

  return (
    <Tile to="/checklist" title="เตรียมของ" icon={ListChecksIcon}>
      <div className="flex flex-1 flex-col items-center text-center">
        <Ring value={focus.percent} max={100} size={76} tone="primary">
          <span className="text-lg font-bold tabular-nums text-ink">{focus.percent}%</span>
        </Ring>
        <p className="mt-2 text-xs text-ink-muted">
          {focus === current ? 'ช่วงนี้' : 'ช่วงถัดไป'} · {focus.doneCount}/{focus.items.length} รายการ
        </p>
      </div>
    </Tile>
  )
}

/** พัฒนาการ: วงแหวนจำนวนด้านที่สมวัย (5 ด้านตาม DSPM) */
function DevelopmentTile({ child, today }: { child: Child; today: Date }) {
  const quiz = getQuizStatus(child, today)
  if (!quiz) return null
  const score = quiz.last
    ? scoreQuiz(quiz.last.answers, { items: getQuizForGroup(quiz.last.ageGroupId).items, date: toDay(quiz.last.date) })
    : null
  const count = (s: string) => score?.domains.filter((d) => d.status === s).length ?? 0
  const onTrack = count('onTrack')

  return (
    <Tile to="/milestones" title={`พัฒนาการ ช่วง ${quiz.group.label}`} icon={PuzzlePieceIcon}>
      <div className="flex items-center gap-4">
        <Ring value={onTrack} max={DOMAIN_ORDER.length}>
          <span>
            <span className="block text-xl font-bold tabular-nums text-ink">
              {score ? onTrack : '–'}/{DOMAIN_ORDER.length}
            </span>
            <span className="block text-xs text-ink-muted">{score ? 'ด้านสมวัย' : 'ด้าน'}</span>
          </span>
        </Ring>
        {score ? (
          <ul className="min-w-0 flex-1 space-y-1.5">
            <StatRow icon={CheckCircleIcon} iconClass="text-success" label="สมวัย" value={onTrack} />
            <StatRow icon={WarningCircleIcon} iconClass="text-warning" label="ควรส่งเสริม" value={count('promote')} />
            <StatRow icon={QuestionIcon} iconClass="text-ink-muted" label="ยังไม่แน่ใจ" value={count('unsure')} />
          </ul>
        ) : (
          <p className="min-w-0 flex-1 text-sm text-ink-muted">ยังไม่ได้ประเมินช่วงนี้ ใช้เวลาประมาณ 3 นาที</p>
        )}
      </div>
      {quiz.due && (
        <span className="mt-3 flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors duration-150 group-hover:bg-primary-hover">
          {quiz.reason === 'retest' ? 'ถึงวันทำซ้ำ — ทำควิซ' : 'ทำควิซช่วงนี้'}
        </span>
      )}
    </Tile>
  )
}

/** นัดฝากครรภ์: วงแหวนนัดที่ผ่านมาแล้ว + นับถอยหลังนัดถัดไป */
function AntenatalTile({ dueDate, today }: { dueDate: string; today: Date }) {
  const m = getPregnancyMilestones(dueDate, today)
  const visits = m.items.filter((i) => i.kind === 'visit')
  const past = visits.filter((v) => v.status === 'past').length
  const next = getNextVisit(m)
  const daysToNext = next ? Math.round((toDay(next.startDate).getTime() - toDay(today).getTime()) / 86_400_000) : null

  return (
    <Tile to="/antenatal" title="นัดฝากครรภ์" icon={StethoscopeIcon}>
      <div className="flex items-center gap-4">
        <Ring value={past} max={visits.length}>
          <span>
            <span className="block text-xl font-bold tabular-nums text-ink">
              {past}/{visits.length}
            </span>
            <span className="block text-xs text-ink-muted">นัด</span>
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          {next ? (
            <>
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                <ClockIcon size={14} aria-hidden="true" />
                {daysToNext !== null && daysToNext > 0 ? 'นัดถัดไปอีก' : 'นัดถัดไป'}
              </p>
              <p className="text-2xl font-bold tabular-nums text-ink">
                {daysToNext !== null && daysToNext > 0 ? (
                  <>
                    {daysToNext} <span className="text-base font-semibold">วัน</span>
                  </>
                ) : (
                  'ถึงช่วงนัดแล้ว'
                )}
              </p>
              <p className="text-sm leading-snug text-ink-muted">{next.title}</p>
            </>
          ) : (
            <p className="text-sm font-medium">ครบทุกนัดแล้ว</p>
          )}
        </div>
      </div>
    </Tile>
  )
}

/** ตรวจ/วัคซีนที่ควรทำในช่วงอายุครรภ์นี้ — ตัวเลขเดียว */
function ChecksNowTile({ dueDate, today }: { dueDate: string; today: Date }) {
  const m = getPregnancyMilestones(dueDate, today)
  const now = m.items.filter((i) => i.status === 'current' && (i.kind === 'test' || i.kind === 'vaccine'))

  return (
    <Tile to="/antenatal" title="ตรวจช่วงนี้" icon={TestTubeIcon}>
      <p className="text-3xl font-bold tabular-nums text-ink">
        {now.length} <span className="text-base font-semibold">รายการ</span>
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink-muted">
        {now.length > 0 ? now[0].title : 'ช่วงนี้ไม่มีการตรวจเฉพาะ'}
      </p>
      {now.length > 1 && <p className="text-xs text-ink-muted">และอีก {now.length - 1} รายการ</p>}
    </Tile>
  )
}
