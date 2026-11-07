import { useState } from 'react'

/** วันนี้ ณ ตอนเปิดหน้า — ค่าคงที่ตลอดการ render เพื่อให้ทุกการคำนวณในหน้าใช้วันเดียวกัน */
export function useToday(): Date {
  const [today] = useState(() => new Date())
  return today
}
