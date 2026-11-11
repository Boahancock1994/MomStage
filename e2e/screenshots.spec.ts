/** ภาพหน้าจอทุกหน้า (ขนาดจอ 390×844 + ข้อมูลตัวอย่าง) → docs/screenshots/ — รัน: npm run screenshots */
import { test } from '@playwright/test'
import { seedDemo, setActiveChild } from './helpers'

const BORN_PAGES: [string, string][] = [
  ['02-home-born', '/'],
  ['04-vaccine', '/vaccine'],
  ['06-milestones', '/milestones'],
  ['07-milestones-history', '/milestones/history'],
  ['08-growth', '/growth'],
  ['09-checklist', '/checklist'],
  ['10-tools', '/tools'],
  ['11-sick', '/tools/sick'],
  ['13-calc-milk', '/tools/calc'],
  ['14-calc-cost', '/tools/calc?tab=cost'],
  ['15-calc-log', '/tools/calc?tab=log'],
  ['16-community', '/community'],
  ['17-nursing-map', '/tools/nursing-map'],
  ['18-name', '/tools/name'],
  ['19-settings', '/settings'],
  ['20-mom-food', '/tools/mom-food'],
  ['21-mom-mind', '/tools/mom-mind'],
  ['22-avoid', '/tools/avoid'],
]

test.describe.configure({ mode: 'serial' })

async function shoot(page: import('@playwright/test').Page, name: string) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400) // ให้กราฟ/แผนที่วาดเสร็จ
  await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: false })
}

test('onboarding', async ({ page }) => {
  await page.goto('/onboarding')
  await shoot(page, '01-onboarding')
})

test('หน้าทั้งหมด (ลูกคลอดแล้ว 4 เดือน)', async ({ page }) => {
  test.setTimeout(120_000)
  await seedDemo(page)
  for (const [name, route] of BORN_PAGES) {
    await page.goto(route)
    await shoot(page, name)
  }
})

test('หน้าช่วงตั้งครรภ์', async ({ page }) => {
  await seedDemo(page)
  await setActiveChild(page, 'เบบี๋ข้าวหอม')
  await page.goto('/')
  await shoot(page, '03-home-pregnant')
  await page.goto('/antenatal')
  await shoot(page, '05-antenatal')
})
