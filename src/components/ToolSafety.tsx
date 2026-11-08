/** ส่วนประกอบด้านความปลอดภัยที่ทุกหน้าในเครื่องมือสุขภาพต้องมี */
import { ArrowLeftIcon, InfoIcon, PhoneIcon } from './icons'
import { Link } from 'react-router-dom'

export function NotDiagnosisNote() {
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-surface-muted p-4" role="note">
      <InfoIcon size={22} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
      <p className="text-sm text-ink">
        <strong>เครื่องมือนี้ไม่ใช่การวินิจฉัยโรค</strong> ใช้ช่วยตัดสินใจเบื้องต้นเท่านั้น ถ้าไม่แน่ใจหรือลูกดูอาการแย่ลง
        ให้พบแพทย์ได้ทันทีโดยไม่ต้องรอผลจากแอป กรณีฉุกเฉินโทร 1669
      </p>
    </div>
  )
}

export function Call1669Button({ className = '' }: { className?: string }) {
  return (
    <a
      href="tel:1669"
      className={`flex min-h-14 items-center justify-center gap-2 rounded-full bg-danger px-5 text-lg font-bold text-on-danger transition-colors duration-150 hover:bg-danger/90 ${className}`}
    >
      <PhoneIcon size={24} weight="fill" aria-hidden="true" />
      โทร 1669 (เจ็บป่วยฉุกเฉิน)
    </a>
  )
}

export function BackToTools() {
  return (
    <Link
      to="/tools"
      className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-medium text-primary-strong hover:bg-primary-soft"
    >
      <ArrowLeftIcon size={20} aria-hidden="true" />
      ผู้ช่วยทั้งหมด
    </Link>
  )
}
