/**
 * อาหารแม่ — สิ่งที่ควรกินช่วงตั้งครรภ์และหลังคลอด/ให้นม พร้อมประโยชน์ ปริมาณ อาหารเสริม และสิ่งที่ควรเลี่ยง
 * ข้อมูลอยู่ใน src/data/nutrition.ts
 */
import {
  AppleIcon,
  CarrotIcon,
  DrumstickIcon,
  GlassWaterIcon,
  InfoIcon,
  MilkIcon,
  PillIcon,
  ProhibitIcon,
  WarningIcon,
  WheatIcon,
  type Icon,
} from '../components/icons'
import { useId, useState } from 'react'
import { BackToTools } from '../components/ToolSafety'
import { Card, PageHeader, Segmented } from '../components/ui'
import {
  DAILY_SERVINGS,
  EXTRA_ENERGY,
  FOOD_GROUP_LABEL,
  FOOD_GROUP_ORDER,
  avoidFor,
  foodsFor,
  supplementsFor,
  type DailyServing,
  type MomPhase,
} from '../data/nutrition'
import { useAppStore } from '../store/useAppStore'

const GROUP_ICON: Record<DailyServing['group'], Icon> = {
  carb: WheatIcon,
  veg: CarrotIcon,
  fruit: AppleIcon,
  protein: DrumstickIcon,
  dairy: MilkIcon,
  water: GlassWaterIcon,
}

export default function MomFoodPage() {
  const uid = useId()
  const { activeChild } = useAppStore()
  const [phase, setPhase] = useState<MomPhase>(activeChild?.mode === 'born' ? 'postpartum' : 'pregnant')
  const foods = foodsFor(phase)

  return (
    <>
      <BackToTools />
      <PageHeader title="อาหารแม่" subtitle="กินอะไรดี กินเท่าไร ช่วงตั้งครรภ์และหลังคลอด" />

      <Segmented<MomPhase>
        name={`${uid}-phase`}
        legend="ช่วงของคุณแม่"
        value={phase}
        onChange={setPhase}
        options={[
          { value: 'pregnant', label: 'ตั้งครรภ์' },
          { value: 'postpartum', label: 'หลังคลอด/ให้นม' },
        ]}
      />

      <section aria-labelledby={`${uid}-daily`} className="mt-5">
        <h2 id={`${uid}-daily`} className="text-lg font-semibold">
          ควรกินต่อวัน
        </h2>
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {DAILY_SERVINGS.map((s) => {
            const GroupIcon = GROUP_ICON[s.group]
            return (
              <li key={s.group} className="rounded-2xl border border-line bg-surface p-3 text-center shadow-[var(--shadow-card)]">
                <GroupIcon size={22} className="mx-auto text-primary-strong" aria-hidden="true" />
                <p className="mt-1 text-xs text-ink-muted">{s.label}</p>
                <p className="text-xl font-bold tabular-nums text-ink">{s.amount[phase]}</p>
                <p className="text-xs text-ink-muted">{s.unit}</p>
              </li>
            )
          })}
        </ul>
        <div className="mt-3 flex gap-3 rounded-2xl bg-primary-soft p-4 text-sm text-ink">
          <InfoIcon size={20} className="mt-0.5 shrink-0 text-primary-strong" aria-hidden="true" />
          <div className="space-y-1">
            <p>{EXTRA_ENERGY[phase]}</p>
            <p className="text-ink-muted">
              วิธีนับ: {DAILY_SERVINGS.filter((s) => s.group !== 'water').map((s) => s.example).join(' · ')}
            </p>
          </div>
        </div>
      </section>

      {FOOD_GROUP_ORDER.map((group) => {
        const items = foods.filter((f) => f.group === group)
        if (items.length === 0) return null
        const GroupIcon = GROUP_ICON[group]
        return (
          <section key={group} aria-labelledby={`${uid}-${group}`} className="mt-6">
            <h2 id={`${uid}-${group}`} className="flex items-center gap-2 text-lg font-semibold">
              <GroupIcon size={22} className="text-primary-strong" aria-hidden="true" />
              {FOOD_GROUP_LABEL[group]}
            </h2>
            <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
              {items.map((f) => (
                <li key={f.name} className="p-4">
                  <p className="font-semibold">{f.name}</p>
                  <p className="mt-1 text-sm text-ink">{f.benefit}</p>
                  <p className="mt-2 inline-block rounded-xl bg-accent-soft px-3 py-1 text-sm font-medium text-accent-strong">{f.amount}</p>
                  {f.caution && (
                    <p className="mt-2 flex gap-1.5 text-sm text-ink-muted">
                      <WarningIcon size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
                      {f.caution}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <section aria-labelledby={`${uid}-supp`} className="mt-6">
        <h2 id={`${uid}-supp`} className="flex items-center gap-2 text-lg font-semibold">
          <PillIcon size={22} className="text-primary-strong" aria-hidden="true" />
          อาหารเสริมและวิตามิน
        </h2>
        <ul className="mt-3 space-y-3">
          {supplementsFor(phase).map((s) => (
            <li key={s.name}>
              <Card>
                <p className="font-semibold">{s.name}</p>
                <p className="mt-1 text-sm text-ink">{s.benefit}</p>
                <p className="mt-2 text-sm">
                  <span className="text-ink-muted">ขนาด: </span>
                  <span className="font-medium">{s.dose}</span>
                </p>
                {s.note && <p className="mt-1 text-sm text-ink-muted">{s.note}</p>}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${uid}-avoid`} className="mt-6">
        <h2 id={`${uid}-avoid`} className="flex items-center gap-2 text-lg font-semibold">
          <ProhibitIcon size={22} className="text-danger" aria-hidden="true" />
          ควรเลี่ยง
        </h2>
        <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft/40">
          {avoidFor(phase).map((a) => (
            <li key={a.name} className="p-4">
              <p className="font-semibold">{a.name}</p>
              <p className="mt-1 text-sm text-ink-muted">{a.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex gap-3 rounded-2xl border border-line bg-surface-muted p-4" role="note">
        <InfoIcon size={22} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <p className="text-sm text-ink">
          ข้อมูลนี้เป็นคำแนะนำทั่วไปตามแนวทางของกรมอนามัย <strong>ไม่ใช่คำแนะนำเฉพาะบุคคล</strong> ถ้ามีโรคประจำตัว เบาหวานขณะตั้งครรภ์
          ความดันสูง หรือแพ้อาหาร ให้ทำตามที่แพทย์หรือนักโภชนาการแนะนำ และแจ้งแพทย์ก่อนเริ่มอาหารเสริมทุกชนิด
        </p>
      </div>
    </>
  )
}
