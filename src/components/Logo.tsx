/**
 * กรอบโลโก้ — วางไฟล์รูปโลโก้ไว้ที่ public/logo.png แล้วรูปจะขึ้นในกรอบนี้อัตโนมัติ
 * (ใช้ .svg / .jpg / .webp ก็ได้ แค่แก้ LOGO_SRC ให้ตรงชื่อไฟล์)
 * ถ้ายังไม่มีไฟล์ จะแสดงกรอบเส้นประว่าง ๆ ไว้ให้รู้ว่าตรงนี้ใส่โลโก้ได้
 */
import { ImageIcon } from './icons'
import { useState } from 'react'

const LOGO_SRC = '/logo.png'

const SIZES = {
  sm: { box: 'size-9 rounded-xl', icon: 18 },
  lg: { box: 'size-20 rounded-2xl', icon: 30 },
}

export function Logo({ size = 'sm' }: { size?: keyof typeof SIZES }) {
  const [missing, setMissing] = useState(false)
  const s = SIZES[size]

  if (missing) {
    return (
      <span
        className={`${s.box} grid shrink-0 place-items-center border-2 border-dashed border-primary/40 bg-primary-soft/60 text-primary-strong/70`}
        title="วางไฟล์โลโก้ที่ public/logo.png"
      >
        <span className="flex flex-col items-center">
          <ImageIcon size={s.icon} aria-hidden="true" />
          {size === 'lg' && <span className="mt-0.5 text-[11px] font-medium leading-none">โลโก้</span>}
        </span>
      </span>
    )
  }

  return (
    <img
      src={LOGO_SRC}
      alt="โลโก้ MomStage"
      onError={() => setMissing(true)}
      className={`${s.box} shrink-0 bg-surface object-contain`}
    />
  )
}
