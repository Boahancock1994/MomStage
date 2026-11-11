/**
 * เครื่องสำอางและยาที่ควรเลี่ยง ช่วงตั้งครรภ์ / หลังคลอดระหว่างให้นม
 * ข้อมูลอยู่ใน src/data/avoidProducts.ts
 */
import { CheckCircleIcon, InfoIcon, PillIcon, ProhibitIcon, SparkleIcon, WarningIcon, type Icon } from '../components/icons'
import { useId, useState } from 'react'
import { BackToTools } from '../components/ToolSafety'
import { Badge, PageHeader, Segmented } from '../components/ui'
import { SAFER_CHOICES, productsFor, type Phase, type ProductKind } from '../data/avoidProducts'
import { useAppStore } from '../store/useAppStore'

const SECTIONS: { kind: ProductKind; title: string; icon: Icon }[] = [
  { kind: 'cosmetic', title: 'เครื่องสำอางและสกินแคร์', icon: SparkleIcon },
  { kind: 'medicine', title: 'ยา', icon: PillIcon },
]

export default function AvoidProductsPage() {
  const uid = useId()
  const { activeChild } = useAppStore()
  const [phase, setPhase] = useState<Phase>(activeChild?.mode === 'born' ? 'postpartum' : 'pregnant')

  return (
    <>
      <BackToTools />
      <PageHeader title="เครื่องสำอางและยาที่ควรเลี่ยง" subtitle="ดูฉลากก่อนใช้ ช่วงตั้งครรภ์และให้นมลูก" />

      <Segmented<Phase>
        name={`${uid}-phase`}
        legend="ช่วงของคุณแม่"
        value={phase}
        onChange={setPhase}
        options={[
          { value: 'pregnant', label: 'ตั้งครรภ์' },
          { value: 'postpartum', label: 'ให้นมลูก' },
        ]}
      />

      <div className="mt-4 flex gap-3 rounded-2xl border border-warning-line bg-warning-soft p-4 text-sm text-ink" role="note">
        <WarningIcon size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
        <p>
          <strong>อย่าหยุดยาที่แพทย์สั่งเอง</strong> ถ้ากำลังใช้ยาในรายการ ให้ปรึกษาแพทย์หรือเภสัชกรก่อน และบอกทุกครั้งว่า
          {phase === 'pregnant' ? 'กำลังตั้งครรภ์' : 'กำลังให้นมลูก'}
        </p>
      </div>

      {SECTIONS.map(({ kind, title, icon: SectionIcon }) => (
        <section key={kind} aria-labelledby={`${uid}-${kind}`} className="mt-6">
          <h2 id={`${uid}-${kind}`} className="flex items-center gap-2 text-lg font-semibold">
            <SectionIcon size={22} className="text-primary-strong" aria-hidden="true" />
            {title}
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
            {productsFor(phase, kind).map((p) => {
              const avoid = p.level[phase] === 'avoid'
              return (
                <li key={p.name} className="p-4">
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 font-semibold">{p.name}</p>
                    {avoid ? (
                      <Badge tone="danger" icon={<ProhibitIcon size={14} aria-hidden="true" />}>
                        ควรเลี่ยง
                      </Badge>
                    ) : (
                      <Badge tone="warning" icon={<WarningIcon size={14} aria-hidden="true" />}>
                        ปรึกษาก่อนใช้
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink">{p.why[phase]}</p>
                  <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2 text-sm">
                    <span className="text-ink-muted">ดูบนฉลาก: </span>
                    {p.lookFor}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <section aria-labelledby={`${uid}-safe`} className="mt-6">
        <h2 id={`${uid}-safe`} className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircleIcon size={22} className="text-success" aria-hidden="true" />
          ใช้แทนได้
        </h2>
        <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-success/30 bg-success-soft/40">
          {SAFER_CHOICES[phase].map((c) => (
            <li key={c.name} className="p-4">
              <p className="font-semibold">{c.name}</p>
              <p className="mt-1 text-sm text-ink-muted">{c.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex gap-3 rounded-2xl border border-line bg-surface-muted p-4" role="note">
        <InfoIcon size={22} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <p className="text-sm text-ink">
          รายการนี้เป็นตัวอย่างที่พบบ่อย <strong>ไม่ครอบคลุมยาทุกตัว</strong> สรุปจากคำแนะนำของ ACOG, US FDA, NHS และฐานข้อมูล LactMed
          ตรวจเลขทะเบียนผลิตภัณฑ์ได้ที่ อย. (สายด่วน 1556)
        </p>
      </div>
    </>
  )
}
