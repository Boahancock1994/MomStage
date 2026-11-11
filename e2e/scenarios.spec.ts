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
  '/tools/mom-food',
  '/tools/mom-mind',
  '/tools/avoid',
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

test('แบบประเมินสุขภาพใจ: ตอบครบ 10 ข้อได้ผล และข้อ 10 แสดงสายด่วน', async ({ page }) => {
  await seedDemo(page)
  await page.goto('/tools/mom-mind')
  await page.getByRole('button', { name: 'เริ่มทำแบบประเมิน' }).click()
  // ตอบตัวเลือกสุดท้ายทุกข้อ: ข้อ 1, 2, 4 ได้ 3 คะแนน ข้ออื่นได้ 0 → 9 คะแนน ข้อ 10 = "ไม่เคยเลย"
  for (let i = 0; i < 10; i++) await page.locator('fieldset label').last().click()
  await expect(page.getByText('ความเสี่ยงต่ำ', { exact: true })).toBeVisible()
  await expect(page.locator('main')).toContainText('9 / 30 คะแนน')
  await expect(page.getByRole('alert')).toHaveCount(0)

  await page.getByRole('button', { name: 'ทำแบบประเมินอีกครั้ง' }).click()
  await page.getByRole('button', { name: 'เริ่มทำแบบประเมิน' }).click()
  for (let i = 0; i < 9; i++) await page.locator('fieldset label').last().click()
  await page.getByText('บางครั้ง', { exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('1323')
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
