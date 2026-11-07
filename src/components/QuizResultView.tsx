/** แสดงผลควิซพัฒนาการ 5 ด้าน — ใช้ทั้งหลังทำควิซและในหน้าประวัติ */
import { CheckCircleIcon, EyeIcon, FirstAidKitIcon, PlantIcon } from './icons'
import { DOMAIN_LABELS } from '../data/dspm'
import { formatThaiDate } from '../lib/format'
import type { DomainResult, QuizScore } from '../lib/quiz'
import { Badge } from './ui'

export function DisclaimerNote() {
  return (
    <p className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-ink-muted" role="note">
      <strong className="text-ink">เป็นการเฝ้าระวังเบื้องต้น ไม่ใช่การวินิจฉัย</strong> — อิงคู่มือ DSPM ของกรมอนามัย
      ถ้ากังวลเรื่องพัฒนาการ ปรึกษาเจ้าหน้าที่คลินิกเด็กดีได้ทุกเมื่อ
    </p>
  )
}

export function QuizResultView({ score }: { score: QuizScore }) {
  const promoteCount = score.domains.filter((d) => d.status === 'promote').length

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm text-ink-muted">ทำได้</p>
        <p className="text-4xl font-bold tabular-nums text-ink">
          {score.score}
          <span className="text-xl text-ink-muted">/{score.total} ข้อ</span>
        </p>
        <p className="mt-1 font-semibold">
          {score.allOnTrack
            ? 'สมวัยทุกด้าน'
            : promoteCount > 0
              ? `ควรส่งเสริม ${promoteCount} ด้าน`
              : 'มีข้อที่ยังไม่แน่ใจ ลองสังเกตอีกครั้ง'}
        </p>
        {score.retestDate && !score.referral && (
          <p className="mt-2 text-sm text-ink-muted">
            ฝึกตามกิจกรรมด้านล่างทุกวัน แล้วกลับมาทำซ้ำวันที่ <strong className="text-ink">{formatThaiDate(score.retestDate)}</strong>
          </p>
        )}
      </div>

      {score.referral && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4">
          <FirstAidKitIcon size={24} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="font-semibold text-danger">ทำซ้ำแล้วยังทำไม่ได้ — แนะนำให้ปรึกษาเจ้าหน้าที่ที่คลินิกเด็กดี</p>
            <p className="mt-1 text-sm text-ink">
              ข้อที่ยังทำไม่ได้: {score.referralItems.map((i) => `ข้อ ${i.no} ${i.skill}`).join(', ')} — ตามกระบวนการ DSPM
              เด็กที่ฝึกครบ 1 เดือนแล้วยังไม่ผ่าน ควรได้รับการประเมินเพิ่มเติมโดยเจ้าหน้าที่
            </p>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {score.domains.map((d) => (
          <DomainCard key={d.domain} result={d} />
        ))}
      </ul>

      <DisclaimerNote />
    </div>
  )
}

const STATUS_META = {
  onTrack: { label: 'สมวัย', tone: 'success' as const, icon: CheckCircleIcon, card: 'border-success/30 bg-success-soft/60' },
  promote: { label: 'ควรส่งเสริม', tone: 'warning' as const, icon: PlantIcon, card: 'border-warning-line bg-warning-soft' },
  unsure: { label: 'ลองสังเกตอีกครั้ง', tone: 'warning' as const, icon: EyeIcon, card: 'border-warning-line/60 bg-warning-soft/50' },
}

function DomainCard({ result }: { result: DomainResult }) {
  const meta = STATUS_META[result.status]
  const StatusIcon = meta.icon
  return (
    <li className={`rounded-2xl border p-4 ${meta.card}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">
          {DOMAIN_LABELS[result.domain].th}
          <span className="ml-1 text-xs font-normal text-ink-muted">({result.domain})</span>
        </h3>
        <Badge tone={meta.tone} icon={<StatusIcon size={14} weight="bold" aria-hidden="true" />}>
          {meta.label}
        </Badge>
      </div>

      {result.status === 'onTrack' && (
        <p className="mt-1 text-sm text-ink-muted">{result.items.map((r) => r.item.skill).join(' · ')}</p>
      )}

      {result.toPromote.map((item) => (
        <div key={item.id} className="mt-3 rounded-xl bg-surface p-3">
          <p className="text-sm font-semibold">
            ข้อ {item.no}: {item.skill}
          </p>
          <p className="mt-1 text-sm text-ink">
            <span className="font-medium text-warning">กิจกรรมส่งเสริม: </span>
            {item.activityIfNot}
          </p>
        </div>
      ))}

      {result.unsure.map((item) => (
        <div key={item.id} className="mt-3 rounded-xl bg-surface p-3">
          <p className="text-sm font-semibold">
            ข้อ {item.no}: {item.skill}
          </p>
          <p className="mt-1 text-sm text-ink">
            <span className="font-medium text-warning">ลองทดสอบแบบนี้: </span>
            {item.howToTest}
          </p>
        </div>
      ))}
    </li>
  )
}
