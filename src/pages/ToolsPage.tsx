/** ผู้ช่วย — รวมเครื่องมือช่วยคุณแม่ */
import { CalculatorIcon, CaretRightIcon, FirstAidIcon, ForkKnifeIcon, HeartIcon, ShieldWarningIcon, MapPinIcon, SignatureIcon, type Icon } from '../components/icons'
import { Link } from 'react-router-dom'
import { Badge, PageHeader } from '../components/ui'

const TOOLS: { to?: string; title: string; desc: string; icon: Icon }[] = [
  { to: '/tools/sick', title: 'ลูกป่วย ควรไปหาหมอไหม', desc: 'ตอบคำถามทีละข้อ แอปบอกระดับความเร่งด่วนตามอายุลูก', icon: FirstAidIcon },
  { to: '/tools/mom-mind', title: 'สุขภาพใจแม่หลังคลอด', desc: 'แบบประเมิน 10 ข้อ (EPDS) ดูว่าช่วงนี้เหนื่อยทั่วไป หรือควรได้รับการดูแลเพิ่ม', icon: HeartIcon },
  { to: '/tools/mom-food', title: 'กินแบบไหนลูกปลอดภัย', desc: 'กินอะไรดีช่วงตั้งครรภ์และหลังคลอด ประโยชน์ ปริมาณต่อวัน อาหารเสริม และสิ่งที่ควรเลี่ยง', icon: ForkKnifeIcon },
  { to: '/tools/avoid', title: 'เครื่องสำอางและยาที่ควรเลี่ยง', desc: 'สารในสกินแคร์และยาที่ควรเลี่ยงช่วงตั้งครรภ์และให้นม พร้อมตัวเลือกที่ใช้แทนได้', icon: ShieldWarningIcon },
  { to: '/tools/calc', title: 'ลูกคนนี้ใช้เงินเท่าไหร่', desc: 'ปริมาณนมต่อมื้อ ค่าใช้จ่ายต่อเดือน และบันทึกการให้นม/การนอน', icon: CalculatorIcon },
  { to: '/tools/name', title: 'ตั้งชื่อลูกตามวันเกิด', desc: 'หาอักษรกาลกิณีตามวันเกิด (ทักษา) กรองชื่อพร้อมความหมาย และตรวจชื่อที่คิดไว้', icon: SignatureIcon },
  { to: '/tools/nursing-map', title: 'พิกัดห้องให้นม/เปลี่ยนผ้าอ้อม', desc: 'ห้องให้นมและมุมเปลี่ยนผ้าอ้อมใกล้คุณ ช่วยกันเพิ่มและยืนยัน', icon: MapPinIcon },
]

export default function ToolsPage() {
  return (
    <>
      <PageHeader title="ผู้ช่วย" subtitle="เครื่องมือช่วยคุณแม่ในชีวิตประจำวัน" />
      <ul className="space-y-3">
        {TOOLS.map(({ to, title, desc, icon: ToolIcon }) => {
          const body = (
            <>
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${to ? 'bg-primary-soft text-primary-strong' : 'bg-surface-muted text-ink-muted'}`}>
                <ToolIcon size={26} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-ink-muted">{desc}</span>
              </span>
              {to ? <CaretRightIcon size={20} className="text-ink-muted" aria-hidden="true" /> : <Badge tone="neutral">เร็วๆ นี้</Badge>}
            </>
          )
          return (
            <li key={title}>
              {to ? (
                <Link
                  to={to}
                  className="flex min-h-20 items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-primary/40"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex min-h-20 items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 p-4" aria-disabled="true">
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
