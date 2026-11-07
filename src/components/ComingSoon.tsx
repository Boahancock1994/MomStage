/** หน้าโครงเปล่าสำหรับฟีเจอร์ที่จะทำในขั้นถัดไป */
import { HourglassIcon } from './icons'
import { Card, PageHeader } from './ui'

export function ComingSoon({ title, subtitle, plan }: { title: string; subtitle: string; plan: string[] }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent-strong">
          <HourglassIcon size={28} aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-lg font-semibold">กำลังพัฒนา</h2>
        <p className="mt-1 text-ink-muted">หน้านี้จะเปิดใช้ในขั้นถัดไป</p>
        <ul className="mt-4 space-y-2 text-left text-sm text-ink-muted">
          {plan.map((item) => (
            <li key={item} className="rounded-xl bg-surface-muted px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
