import { expect, type Page } from '@playwright/test'

export const STORAGE_KEY = 'momstage:v1'

export function isoDaysFromToday(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** โหลดข้อมูลตัวอย่าง 2 คนผ่านปุ่มในหน้า onboarding (น้องมะลิ 4 เดือน = active, เบบี๋ข้าวหอม ตั้งครรภ์) */
export async function seedDemo(page: Page) {
  await page.goto('/onboarding')
  await page.getByRole('button', { name: 'ลองดูตัวอย่าง' }).click()
  await expect(page).toHaveURL('/')
}

/** สลับลูกที่เลือกอยู่โดยแก้ localStorage แล้วโหลดหน้าใหม่ */
export async function setActiveChild(page: Page, name: string) {
  await page.evaluate(
    ([key, childName]) => {
      const state = JSON.parse(localStorage.getItem(key)!)
      state.activeChildId = state.children.find((c: { name: string }) => c.name === childName).id
      localStorage.setItem(key, JSON.stringify(state))
    },
    [STORAGE_KEY, name] as const,
  )
  await page.reload()
}

/** เก็บ error ของหน้า — ใช้ตรวจว่าไม่มีหน้าไหนพัง */
export function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}
