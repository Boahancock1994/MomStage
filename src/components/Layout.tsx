/**
 * โครงหลักของแอป: แถบหัว (โลโก้ + ลูกที่กำลังดู + อายุที่คำนวณได้) / เนื้อหา / bottom navigation
 * ถ้ายังไม่มีข้อมูลลูก จะพาไปหน้า onboarding อัตโนมัติ
 */
import {
  ChartLineIcon,
  GearIcon,
  HouseIcon,
  PuzzlePieceIcon,
  SyringeIcon,
  ToolboxIcon,
  UsersThreeIcon,
  type Icon,
} from './icons'
import { useEffect, useRef } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { getChildStatus } from '../lib/childStatus'
import { useAppStore } from '../store/useAppStore'

/** เมนูหลัก 6 รายการ — ชื่อสั้นเพื่อให้แต่ละปุ่มกว้างพอแตะ (≥ 60px บนจอ 360px) */
const NAV_ITEMS: { to: string; label: string; icon: Icon }[] = [
  { to: '/', label: 'หน้าหลัก', icon: HouseIcon },
  { to: '/vaccine', label: 'วัคซีน', icon: SyringeIcon },
  { to: '/milestones', label: 'พัฒนาการ', icon: PuzzlePieceIcon },
  { to: '/growth', label: 'เติบโต', icon: ChartLineIcon },
  { to: '/community', label: 'community', icon: UsersThreeIcon },
  { to: '/tools', label: 'ผู้ช่วย', icon: ToolboxIcon },
]

export function Layout() {
  const { children, activeChild, setActiveChild } = useAppStore()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  // เปลี่ยนหน้าแล้วเลื่อนขึ้นบนสุด และย้าย focus ไปที่เนื้อหาสำหรับผู้ใช้ screen reader
  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  if (!activeChild) return <Navigate to="/onboarding" replace />

  const status = getChildStatus(activeChild)

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2"
      >
        ข้ามไปยังเนื้อหา
      </a>

      <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2" aria-label="MomStage หน้าแรก">
            <Logo />
          </Link>

          <div className="min-w-0 flex-1">
            {children.length > 1 ? (
              <>
                <label htmlFor="active-child" className="sr-only">
                  เลือกลูกที่ต้องการดู
                </label>
                <select
                  id="active-child"
                  value={activeChild.id}
                  onChange={(e) => setActiveChild(e.target.value)}
                  className="-ml-1 max-w-full cursor-pointer truncate rounded-lg bg-transparent px-1 text-base font-semibold text-ink"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p className="truncate font-semibold text-ink">{activeChild.name}</p>
            )}
            {status && <p className="truncate text-sm text-ink-muted">{status.label}</p>}
          </div>

          <NavLink
            to="/settings"
            aria-label="ตั้งค่า"
            className={({ isActive }) =>
              `grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-150 ${
                isActive ? 'bg-primary-soft text-primary-strong' : 'text-ink-muted hover:bg-surface-muted'
              }`
            }
          >
            <GearIcon size={24} aria-hidden="true" />
          </NavLink>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 px-4 pb-28 pt-5 outline-none">
        <Outlet />
      </main>

      <nav
        aria-label="เมนูหลัก"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-md grid-cols-6">
          {NAV_ITEMS.map(({ to, label, icon: NavIcon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-0.5 whitespace-nowrap text-xs font-medium transition-colors duration-150 ${
                    isActive ? 'text-primary-strong' : 'text-ink-muted hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-8 w-12 place-items-center rounded-full transition-colors duration-150 ${
                        isActive ? 'bg-primary-soft' : ''
                      }`}
                    >
                      <NavIcon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
