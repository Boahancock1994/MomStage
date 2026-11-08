/** สถานการณ์ที่ต้องผ่านก่อนส่งงาน (ตรวจบน production build) */
import { expect, test } from '@playwright/test'
import { STORAGE_KEY, collectErrors, isoDaysFromToday, seedDemo } from './helpers'

const ROUTES = [
  '/',
  '/vaccine',
  '/antenatal',
  '/milestones',
  '/milestones/history',
  '/growth',
  '/checklist',
  '/tools',
  '/tools/sick',
  '/tools/fever-med',
  '/tools/mom-food',
  '/tools/name',
  '/tools/nursing-map',
  '/tools/calc',
  '/tools/calc?tab=cost',
  '/tools/calc?tab=log',
  '/community',
  '/settings',
]

async function fillChild(page: import('@playwright/test').Page, opts: { name: string; mode: 'pregnant' | 'born'; date: string }) {
  await page.getByLabel('ชื่อเล่นลูก').fill(opts.name)
  await page.getByText(opts.mode === 'born' ? 'คลอดแล้ว' : 'กำลังตั้งครรภ์', { exact: true }).click()
  const dateInput = page.getByLabel(opts.mode === 'born' ? 'วันเกิดของลูก' : 'วันกำหนดคลอด')
  await dateInput.fill(opts.date)
  await dateInput.blur()
}

test('เปิดครั้งแรก → ไปหน้า onboarding', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/onboarding')
  await expect(page.getByRole('button', { name: 'เริ่มใช้งาน' })).toBeVisible()
})

test('วันเกิดในอนาคต → แสดง error และไม่บันทึก', async ({ page }) => {
  await page.goto('/onboarding')
  await fillChild(page, { name: 'น้องทดสอบ', mode: 'born', date: isoDaysFromToday(3) })
  await expect(page.getByText('วันเกิดต้องไม่เป็นวันในอนาคต')).toBeVisible()
  await page.getByRole('button', { name: 'เริ่มใช้งาน' }).click()
  await expect(page).toHaveURL('/onboarding')
})

test('วันกำหนดคลอดผ่านไปแล้ว → แนะนำให้เปลี่ยนเป็นโหมดคลอดแล้ว', async ({ page }) => {
  await page.goto('/onboarding')
  await fillChild(page, { name: 'เบบี๋', mode: 'pregnant', date: isoDaysFromToday(-5) })
  await expect(page.getByText('วันกำหนดคลอดผ่านมาแล้ว — ลูกคลอดแล้วหรือยัง?')).toBeVisible()
  await page.getByRole('button', { name: 'เปลี่ยนเป็นคลอดแล้ว' }).click()
  await expect(page.getByLabel('วันเกิดของลูก')).toHaveValue(isoDaysFromToday(-5))
  await page.getByRole('button', { name: 'เริ่มใช้งาน' }).click()
  await expect(page).toHaveURL('/')
})

test('ลูกอายุเกิน 4 ปี → ไม่พัง และแจ้งว่าเกินช่วงที่รองรับ', async ({ page }) => {
  const errors = collectErrors(page)
  await page.addInitScript(
    ([key, birthDate]) => {
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, activeChildId: 'old', children: [{ id: 'old', name: 'พี่ต้นกล้า', mode: 'born', birthDate }] }),
      )
    },
    [STORAGE_KEY, isoDaysFromToday(-(4 * 365 + 60))] as const,
  )
  for (const route of ROUTES) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
  }
  await page.goto('/')
  await expect(page.getByText('ลูกอายุเกินช่วงที่แอปรองรับ')).toBeVisible()
  expect(errors).toEqual([])
})

test('ลบลูกคนสุดท้าย → กลับไปหน้า onboarding', async ({ page }) => {
  await page.goto('/onboarding')
  await fillChild(page, { name: 'น้องเดียว', mode: 'born', date: isoDaysFromToday(-60) })
  await page.getByRole('button', { name: 'เริ่มใช้งาน' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/settings')
  await page.getByRole('button', { name: 'ลบ น้องเดียว' }).click()
  await page.getByRole('button', { name: 'ลบ', exact: true }).click()
  await expect(page).toHaveURL('/onboarding')
  await page.reload()
  await expect(page).toHaveURL('/onboarding')
})

test('รีเฟรชแล้วข้อมูลยังอยู่', async ({ page }) => {
  await page.goto('/onboarding')
  await fillChild(page, { name: 'น้องจำได้', mode: 'born', date: isoDaysFromToday(-100) })
  await page.getByRole('button', { name: 'เริ่มใช้งาน' }).click()
  await expect(page).toHaveURL('/')
  await page.reload()
  await expect(page).toHaveURL('/')
  await expect(page.getByText('น้องจำได้').first()).toBeVisible()
})

test('ทุก route เปิดตรงได้ ไม่ 404 ไม่พัง', async ({ page }) => {
  const errors = collectErrors(page)
  await seedDemo(page)
  for (const route of ROUTES) {
    const res = await page.goto(route)
    expect(res?.status(), route).toBe(200)
    await expect(page, route).toHaveURL(route)
    await expect(page.locator('main h1, main h2').first(), route).toBeVisible()
  }
  expect(errors).toEqual([])
})
