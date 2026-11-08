/**
 * หน้าแรกสำหรับผู้ใช้ใหม่: กรอกข้อมูลลูกครั้งเดียว แล้วแอปคำนวณทุกอย่างให้
 * ใช้ซ้ำสำหรับ "เพิ่มลูกคนถัดไป" ผ่าน /onboarding?add=1
 */
import { ArrowLeftIcon } from '../components/icons'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ChildForm } from '../components/ChildForm'
import { Logo } from '../components/Logo'
import { Card } from '../components/ui'
import { useAppStore } from '../store/useAppStore'

export default function OnboardingPage() {
  const { children, addChild } = useAppStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isAdding = params.get('add') === '1'

  // มีข้อมูลแล้วและไม่ได้ตั้งใจเพิ่มลูก → กลับหน้าหลัก
  if (children.length > 0 && !isAdding) return <Navigate to="/" replace />

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      {isAdding && children.length > 0 && (
        <Link
          to="/settings"
          className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-medium text-primary-strong hover:bg-primary-soft"
        >
          <ArrowLeftIcon size={20} aria-hidden="true" />
          กลับไปหน้าตั้งค่า
        </Link>
      )}

      <header className="mb-6 text-center">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="mt-4 text-lg font-bold tracking-wide text-primary-strong">MomStage</p>
        <h1 className="mt-1 text-[1.75rem] font-bold leading-tight text-ink">
          {isAdding ? 'เพิ่มลูกอีกคน' : 'ลูกฉันอายุเท่านี้ ต้องทำอะไร'}
        </h1>
      </header>

      <Card>
        <ChildForm
          submitLabel={isAdding ? 'เพิ่มลูก' : 'เริ่มใช้งาน'}
          onSubmit={(child) => {
            addChild(child)
            navigate('/', { replace: true })
          }}
        />
      </Card>


      <p className="mt-5 text-center text-xs text-ink-muted">
        ข้อมูลทั้งหมดเก็บไว้ในเครื่องของคุณเท่านั้น ไม่มีการส่งขึ้นเซิร์ฟเวอร์
      </p>
    </div>
  )
}
