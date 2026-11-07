// สร้างไอคอน PWA (PNG) จาก SVG ด้วย Playwright — รัน: node scripts/gen-icons.mjs
import { chromium } from '@playwright/test'

const leaf = (s) => `
  <path d="M32 50V26" stroke="#3D3A3A" stroke-width="4" stroke-linecap="round"/>
  <path d="M32 30c0-8 6-14 14-14 0 8-6 14-14 14Z" fill="#4E6E47"/>
  <path d="M32 38c0-7-5-12-12-12 0 7 5 12 12 12Z" fill="#A8C5A0"/>`.replace(/^/, `<g transform="translate(32 32) scale(${s}) translate(-32 -33)">`) + '</g>'

const svg = ({ rounded, scale }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
    <rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="#F8B4A8"/>${leaf(scale)}</svg>`

const targets = [
  { file: 'icon-192.png', size: 192, rounded: true, scale: 1 },
  { file: 'icon-512.png', size: 512, rounded: true, scale: 1 },
  // maskable: เต็มกรอบ ไม่มีมุมโค้ง และย่อสัญลักษณ์ให้อยู่ใน safe zone 80%
  { file: 'icon-maskable-512.png', size: 512, rounded: false, scale: 0.75 },
  // iOS ใส่มุมโค้งให้เอง
  { file: 'apple-touch-icon.png', size: 180, rounded: false, scale: 0.9 },
]

const browser = await chromium.launch()
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } })
  await page.setContent(`<body style="margin:0;background:transparent">${svg(t)}</body>`)
  await page.screenshot({ path: `public/icons/${t.file}`, omitBackground: true })
  await page.close()
}
await browser.close()
console.log('icons written to public/icons/')
