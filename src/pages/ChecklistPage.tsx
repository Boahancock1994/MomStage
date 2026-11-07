/**
 * ของที่ต้องเตรียม — แสดงช่วงปัจจุบันและช่วงถัดไปก่อน ติ๊กได้ และแสดง % ที่เตรียมแล้ว
 * ตรรกะเลือกช่วงอยู่ใน src/lib/checklist.ts
 */
import { CheckIcon } from '../components/icons'
import { Badge, PageHeader, ProgressBar } from '../components/ui'
import { CHECKLIST_STAGES } from '../data/checklist'
import { getRelevantStages, getStageProgress, type StageProgress } from '../lib/checklist'
import { useToday } from '../lib/useToday'
import { useAppStore } from '../store/useAppStore'

export default function ChecklistPage() {
  const { activeChild, toggleChecklistItem } = useAppStore()
  const today = useToday()
  if (!activeChild) return null

  const { current, next } = getRelevantStages(activeChild, today)
  const shownIds = new Set([current?.stage.id, next?.stage.id])
  const others = CHECKLIST_STAGES.filter((s) => !shownIds.has(s.id)).map((s) => getStageProgress(s, activeChild.checklist))
  const toggle = (itemId: string) => toggleChecklistItem(activeChild.id, itemId)

  return (
    <>
      <PageHeader title="ของที่ต้องเตรียม" subtitle={`ปรับตามช่วงวัยของ ${activeChild.name} อัตโนมัติ`} />

      {current && <StageSection progress={current} label="ช่วงนี้" onToggle={toggle} checked={activeChild.checklist} />}
      {next && <StageSection progress={next} label="ช่วงถัดไป" onToggle={toggle} checked={activeChild.checklist} />}

      <details className="mt-8">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-strong">
          ดูช่วงอื่นทั้งหมด ({others.length} ช่วง)
        </summary>
        <div className="mt-2">
          {others.map((p) => (
            <StageSection key={p.stage.id} progress={p} onToggle={toggle} checked={activeChild.checklist} />
          ))}
        </div>
      </details>
    </>
  )
}

function StageSection({
  progress,
  label,
  checked,
  onToggle,
}: {
  progress: StageProgress
  label?: string
  checked: Record<string, boolean>
  onToggle: (itemId: string) => void
}) {
  const { stage, items, doneCount, percent } = progress
  const headingId = `stage-${stage.id}`

  // จัดกลุ่มย่อย (เช่น กระเป๋าคลอด: เอกสาร / ของใช้แม่ / ของใช้ลูก)
  const groups = new Map<string, typeof items>()
  items.forEach((i) => groups.set(i.group ?? '', [...(groups.get(i.group ?? '') ?? []), i]))

  return (
    <section aria-labelledby={headingId} className="mb-6 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {label && <Badge tone={label === 'ช่วงนี้' ? 'warning' : 'neutral'}>{label}</Badge>}
          <h2 id={headingId} className="mt-1 text-lg font-semibold leading-snug">
            {stage.title}
          </h2>
          <p className="text-sm text-ink-muted">{stage.subtitle}</p>
        </div>
        <p className="text-right">
          <span className="text-2xl font-bold tabular-nums text-primary-strong">{percent}%</span>
          <span className="block text-xs text-ink-muted">
            {doneCount}/{items.length} รายการ
          </span>
        </p>
      </div>
      <div className="mt-3">
        <ProgressBar value={percent} label={`เตรียมของช่วง ${stage.title} แล้ว ${percent}%`} />
      </div>

      {[...groups.entries()].map(([group, groupItems]) => (
        <div key={group} className="mt-4">
          {group && <h3 className="mb-1 text-sm font-semibold text-accent-strong">{group}</h3>}
          <ul className="divide-y divide-line">
            {groupItems.map((item) => {
              const isChecked = !!checked[item.id]
              return (
                <li key={item.id}>
                  <label className="flex min-h-14 cursor-pointer items-start gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle(item.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-strong ${
                        isChecked ? 'border-primary-strong bg-primary text-on-primary' : 'border-ink-muted/50 bg-surface'
                      }`}
                      aria-hidden="true"
                    >
                      {isChecked && <CheckIcon size={16} weight="bold" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-medium leading-snug ${isChecked ? 'text-ink-muted line-through' : ''}`}>
                        {item.item}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-muted">ทำไม: {item.why}</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}
