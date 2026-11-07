/** ประวัติการทำควิซพัฒนาการ — ดูผลย้อนหลังทุกครั้ง */
import { ArrowLeftIcon, CaretDownIcon } from '../components/icons'
import { Link } from 'react-router-dom'
import { QuizResultView } from '../components/QuizResultView'
import { Badge, Card, PageHeader } from '../components/ui'
import { formatAgeMonths, formatThaiDate } from '../lib/format'
import { findPreviousForRetest, getQuizForGroup, scoreQuiz } from '../lib/quiz'
import { toDay } from '../lib/age'
import { useAppStore } from '../store/useAppStore'
import type { QuizResult } from '../types'

export default function MilestonesHistoryPage() {
  const { activeChild } = useAppStore()
  if (!activeChild) return null
  const results = [...activeChild.quizResults].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <Link
        to="/milestones"
        className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-medium text-primary-strong hover:bg-primary-soft"
      >
        <ArrowLeftIcon size={20} aria-hidden="true" />
        กลับไปหน้าควิซ
      </Link>
      <PageHeader title="ประวัติการทำควิซ" subtitle={`${activeChild.name} · ${results.length} ครั้ง`} />

      {results.length === 0 ? (
        <Card>
          <p className="text-ink-muted">ยังไม่มีประวัติ ลองทำควิซช่วงอายุปัจจุบันดูก่อน</p>
          <Link to="/milestones" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-strong hover:underline">
            ไปทำควิซ
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {results.map((r) => (
            <HistoryRow key={r.id} result={r} all={activeChild.quizResults} />
          ))}
        </ul>
      )}
    </>
  )
}

function HistoryRow({ result, all }: { result: QuizResult; all: QuizResult[] }) {
  const { group, items } = getQuizForGroup(result.ageGroupId)
  // คำนวณผลรายด้านใหม่จากคำตอบที่บันทึกไว้ โดยใช้ผลก่อนหน้าของช่วงเดียวกันเป็นฐานการทำซ้ำ
  // quizResults ถูกต่อท้ายตามลำดับที่ทำ จึงใช้ตำแหน่งในอาร์เรย์แยก "ก่อนหน้า" ได้แม้ทำหลายครั้งในวันเดียว
  const earlier = all.slice(0, all.indexOf(result))
  const previous = findPreviousForRetest(earlier, result.ageGroupId, toDay(result.date))
  const score = scoreQuiz(result.answers, { items, date: toDay(result.date), previous })
  const promote = score.domains.filter((d) => d.status === 'promote').length

  return (
    <li>
      <details className="group rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-4">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{formatThaiDate(result.date)}</span>
            <span className="block text-sm text-ink-muted">
              ช่วง {group.label}
              {result.ageMonths !== null && ` · อายุ ${formatAgeMonths(result.ageMonths)}`}
              {result.isRetest && ' · ทำซ้ำ'}
            </span>
          </span>
          <span className="flex flex-col items-end gap-1">
            <span className="text-sm font-semibold tabular-nums">
              {result.score}/{result.total}
            </span>
            {result.referral ? (
              <Badge tone="danger">แนะนำปรึกษา</Badge>
            ) : promote > 0 ? (
              <Badge tone="warning">ส่งเสริม {promote} ด้าน</Badge>
            ) : score.allOnTrack ? (
              <Badge tone="success">สมวัย</Badge>
            ) : (
              <Badge tone="neutral">ไม่แน่ใจบางข้อ</Badge>
            )}
          </span>
          <CaretDownIcon size={18} className="shrink-0 text-ink-muted transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-line p-4">
          <QuizResultView score={score} />
        </div>
      </details>
    </li>
  )
}
