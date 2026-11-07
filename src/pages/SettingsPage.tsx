/** ตั้งค่า: แก้ไขโปรไฟล์ลูก / สลับลูก / เพิ่มลูกคนถัดไป / ลบ / ล้างข้อมูลทั้งหมด / เกี่ยวกับแอป */
import { BabyCarriageIcon, BabyIcon, CheckIcon, InfoIcon, PencilSimpleIcon, PlusIcon, TrashIcon, WarningIcon } from '../components/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChildForm } from '../components/ChildForm'
import { Button, Card, PageHeader } from '../components/ui'
import { getChildStatus } from '../lib/childStatus'
import { formatThaiDate } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { Child } from '../types'

/** แหล่งอ้างอิงทั้งหมดที่แอปใช้ — แสดงในหัวข้อ "เกี่ยวกับแอป" */
const REFERENCES: { topic: string; source: string; url?: string }[] = [
  {
    topic: 'ตารางวัคซีน (EPI)',
    source: 'กรมควบคุมโรค — กำหนดการให้วัคซีนตามแผนงานสร้างเสริมภูมิคุ้มกันโรค ปี 2564 และมาตรฐานการดำเนินงานฯ ปี 2568',
    url: 'https://ddc.moph.go.th/uploads/publish/1660220250103030656.pdf',
  },
  {
    topic: 'พัฒนาการตามวัย (DSPM)',
    source: 'กรมอนามัย — คู่มือเฝ้าระวังและส่งเสริมพัฒนาการเด็กปฐมวัย (DSPM) ฉบับปรับปรุง 2566',
    url: 'https://multimedia.anamai.moph.go.th/oawoocha/2023/06/%E0%B8%84%E0%B8%B9%E0%B9%88%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B9%80%E0%B8%9D%E0%B9%89%E0%B8%B2%E0%B8%A3%E0%B8%B0%E0%B8%A7%E0%B8%B1%E0%B8%87%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%AA%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%AA%E0%B8%A3%E0%B8%B4%E0%B8%A1%E0%B8%9E%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%80%E0%B8%94%E0%B9%87%E0%B8%81%E0%B8%9B%E0%B8%90%E0%B8%A1%E0%B8%A7%E0%B8%B1%E0%B8%A2-DSPM.pdf',
  },
  {
    topic: 'กราฟการเจริญเติบโต (WHO)',
    source: 'WHO Child Growth Standards (2006) — ค่า LMS น้ำหนัก/ส่วนสูงตามอายุ 0–36 เดือน',
    url: 'https://github.com/WorldHealthOrganization/anthro',
  },
  {
    topic: 'นัดฝากครรภ์',
    source: 'กรมอนามัย — คู่มือการฝากครรภ์ สำหรับบุคลากรสาธารณสุข (2565) แนวทางฝากครรภ์คุณภาพ 8 ครั้ง',
  },
  {
    topic: 'ตัวช่วยตัดสินใจเมื่อลูกป่วย / ยาลดไข้',
    source: 'NICE NG143 Fever in under 5s, NICE CG84, WHO IMCI Chart Booklet (2014), BNF for Children',
  },
  {
    topic: 'แผนที่',
    source: '© ผู้ร่วมพัฒนา OpenStreetMap (Leaflet)',
    url: 'https://www.openstreetmap.org/copyright',
  },
]

export default function SettingsPage() {
  const { children, activeChildId, clearAll } = useAppStore()
  const navigate = useNavigate()
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <>
      <PageHeader title="ตั้งค่า" subtitle="จัดการข้อมูลลูกและข้อมูลในแอป" />

      <section aria-labelledby="children-heading" className="space-y-3">
        <h2 id="children-heading" className="text-lg font-semibold">
          ลูกของฉัน ({children.length})
        </h2>
        {children.map((child) => (
          <ChildCard
            key={child.id}
            child={child}
            isActive={child.id === activeChildId}
            isLast={children.length === 1}
            onRemovedLast={() => navigate('/onboarding', { replace: true })}
          />
        ))}
        <Button variant="secondary" className="w-full" onClick={() => navigate('/onboarding?add=1')}>
          <PlusIcon size={20} aria-hidden="true" />
          เพิ่มลูกคนถัดไป
        </Button>
      </section>

      <section aria-labelledby="data-heading" className="mt-8">
        <h2 id="data-heading" className="mb-3 text-lg font-semibold">
          ข้อมูลในเครื่อง
        </h2>
        <Card>
          <p className="text-sm text-ink-muted">
            ข้อมูลทั้งหมด (โปรไฟล์ ประวัติวัคซีน น้ำหนัก ผลควิซ) เก็บไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น
            ถ้าล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนเครื่อง ข้อมูลจะหายไป
          </p>
          {confirmClear ? (
            <div role="alertdialog" aria-labelledby="clear-title" className="mt-4 rounded-2xl bg-danger-soft p-4">
              <p id="clear-title" className="flex items-start gap-2 font-semibold text-danger">
                <WarningIcon size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
                ลบข้อมูลลูกทุกคนและประวัติทั้งหมด? ย้อนกลับไม่ได้
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setConfirmClear(false)} autoFocus>
                  ยกเลิก
                </Button>
                <Button
                  className="!bg-danger !text-on-danger hover:!bg-danger/90"
                  onClick={() => {
                    clearAll()
                    navigate('/onboarding', { replace: true })
                  }}
                >
                  ล้างข้อมูล
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" className="mt-4 w-full" onClick={() => setConfirmClear(true)}>
              <TrashIcon size={20} aria-hidden="true" />
              ล้างข้อมูลทั้งหมด
            </Button>
          )}
        </Card>
      </section>

      <section aria-labelledby="about-heading" className="mt-8">
        <h2 id="about-heading" className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <InfoIcon size={22} className="text-primary-strong" aria-hidden="true" />
          เกี่ยวกับแอป
        </h2>
        <Card>
          <p className="font-semibold">MomStage — ลูกฉันอายุเท่านี้ ต้องทำอะไร</p>
          <p className="mt-1 text-sm text-ink-muted">
            กรอกวันเดียว (วันกำหนดคลอดหรือวันเกิด) แอปคำนวณอายุ แล้วเทียบกับตารางมาตรฐานของหน่วยงานรัฐและองค์กรสุขภาพ
            เพื่อบอกสิ่งที่ควรทำในช่วงนี้
          </p>

          <div role="note" className="mt-4 rounded-2xl border border-warning-line bg-warning-soft p-4 text-sm text-ink">
            <strong>ข้อมูลในแอปไม่ใช่คำแนะนำทางการแพทย์</strong> ใช้เพื่อช่วยจำและเฝ้าระวังเบื้องต้นเท่านั้น
            ไม่สามารถใช้แทนการตรวจและคำแนะนำของแพทย์หรือเจ้าหน้าที่สาธารณสุข หากมีข้อสงสัยหรือลูกมีอาการผิดปกติ
            ให้ปรึกษาแพทย์ทันที กรณีฉุกเฉินโทร 1669
          </div>

          <h3 className="mt-5 font-semibold">แหล่งอ้างอิง</h3>
          <ul className="mt-2 space-y-3 text-sm">
            {REFERENCES.map((r) => (
              <li key={r.topic}>
                <p className="font-medium text-ink">{r.topic}</p>
                <p className="text-ink-muted [overflow-wrap:anywhere]">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary-strong underline">
                      {r.source}
                    </a>
                  ) : (
                    r.source
                  )}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  )
}

function ChildCard({
  child,
  isActive,
  isLast,
  onRemovedLast,
}: {
  child: Child
  isActive: boolean
  isLast: boolean
  onRemovedLast: () => void
}) {
  const { updateChild, removeChild, setActiveChild } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const status = getChildStatus(child)
  const ModeIcon = child.mode === 'pregnant' ? BabyCarriageIcon : BabyIcon

  if (editing) {
    return (
      <Card>
        <h3 className="mb-4 font-semibold">แก้ไขข้อมูล {child.name}</h3>
        <ChildForm
          initial={child}
          submitLabel="บันทึก"
          onCancel={() => setEditing(false)}
          onSubmit={(data) => {
            updateChild(child.id, data)
            setEditing(false)
          }}
        />
      </Card>
    )
  }

  const overdue = status?.mode === 'pregnant' && status.pregnancy.daysUntilDue < 0

  return (
    <Card className={isActive ? 'border-primary-strong/30' : ''}>
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-strong">
          <ModeIcon size={26} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{child.name}</h3>
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-strong">
                <CheckIcon size={12} weight="bold" aria-hidden="true" />
                กำลังดูอยู่
              </span>
            )}
          </div>
          {status && <p className="text-ink">{status.label}</p>}
          <p className="text-sm text-ink-muted">
            {child.mode === 'pregnant' && child.dueDate && `กำหนดคลอด ${formatThaiDate(child.dueDate)}`}
            {child.mode === 'born' && child.birthDate && `เกิด ${formatThaiDate(child.birthDate)}`}
            {child.sex && ` · ${child.sex === 'girl' ? 'ลูกสาว' : 'ลูกชาย'}`}
          </p>
        </div>
      </div>

      {status?.mode === 'pregnant' && status.pregnancy.weeks >= 37 && (
        <div className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-sm text-ink">
          <p>{overdue ? 'เลยกำหนดคลอดแล้ว — ลูกคลอดแล้วหรือยัง?' : 'ใกล้กำหนดคลอดแล้ว คลอดแล้วหรือยัง?'}</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1 inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary-strong underline"
          >
            บันทึกว่าคลอดแล้ว
          </button>
        </div>
      )}

      {confirmDelete ? (
        <div role="alertdialog" aria-labelledby={`del-${child.id}`} className="mt-4 rounded-2xl bg-danger-soft p-3">
          <p id={`del-${child.id}`} className="text-sm font-semibold text-danger">
            ลบข้อมูลของ {child.name} ทั้งหมด?
          </p>
          {isLast && <p className="mt-1 text-sm text-ink">นี่คือลูกคนสุดท้ายในแอป หลังลบจะกลับไปหน้าเริ่มต้นเพื่อกรอกข้อมูลใหม่</p>}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} autoFocus>
              ยกเลิก
            </Button>
            <Button
              className="!bg-danger !text-on-danger hover:!bg-danger/90"
              onClick={() => {
                removeChild(child.id)
                if (isLast) onRemovedLast()
              }}
            >
              ลบ
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {!isActive && (
            <Button className="flex-1" onClick={() => setActiveChild(child.id)}>
              ดูข้อมูลคนนี้
            </Button>
          )}
          <Button variant="secondary" className="flex-1" onClick={() => setEditing(true)}>
            <PencilSimpleIcon size={18} aria-hidden="true" />
            แก้ไข
          </Button>
          <Button variant="ghost" className="!text-danger hover:!bg-danger-soft" onClick={() => setConfirmDelete(true)} aria-label={`ลบ ${child.name}`}>
            <TrashIcon size={18} aria-hidden="true" />
          </Button>
        </div>
      )}
    </Card>
  )
}
