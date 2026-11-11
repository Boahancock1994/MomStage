import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it } from 'vitest'
import { Layout } from '../components/Layout'
import AntenatalPage from './AntenatalPage'
import ChecklistPage from './ChecklistPage'
import CalcPage from './CalcPage'
import AvoidProductsPage from './AvoidProductsPage'
import MomFoodPage from './MomFoodPage'
import MomMindPage from './MomMindPage'
import GrowthPage from './GrowthPage'
import SickPage from './SickPage'
import ToolsPage from './ToolsPage'
import HomePage from './HomePage'
import NamePage from './NamePage'
import MilestonesHistoryPage from './MilestonesHistoryPage'
import MilestonesPage from './MilestonesPage'
import VaccinePage from './VaccinePage'
import { createDemoChildren } from '../data/demo'
import { useAppStore } from '../store/useAppStore'

function Dump({ path }: { path: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="vaccine" element={<VaccinePage />} />
          <Route path="antenatal" element={<AntenatalPage />} />
          <Route path="checklist" element={<ChecklistPage />} />
          <Route path="milestones" element={<MilestonesPage />} />
          <Route path="milestones/history" element={<MilestonesHistoryPage />} />
          <Route path="growth" element={<GrowthPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="tools/sick" element={<SickPage />} />
          <Route path="tools/mom-food" element={<MomFoodPage />} />
          <Route path="tools/mom-mind" element={<MomMindPage />} />
          <Route path="tools/avoid" element={<AvoidProductsPage />} />
          <Route path="tools/calc" element={<CalcPage />} />
          <Route path="tools/name" element={<NamePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

it('หน้าหลักทุกหน้า render ได้โดยไม่ error กับข้อมูลตัวอย่างทั้ง 2 คน', () => {
  // อ่าน store ผ่าน component ชั่วคราว (hook ต้องเรียกใน component)
  const grab = () => {
    const box: { store?: ReturnType<typeof useAppStore> } = {}
    function Grab() {
      Object.assign(box, { store: useAppStore() })
      return null
    }
    renderToString(<Grab />)
    return box.store!
  }
  for (const demo of createDemoChildren(new Date())) {
    const s = grab()
    s.updateChild(s.addChild(demo), demo)
  }
  const store = grab()
  for (const child of store.children) {
    store.setActiveChild(child.id)
    for (const p of ['/', '/vaccine', '/antenatal', '/checklist', '/milestones', '/milestones/history', '/growth', '/tools', '/tools/sick', '/tools/mom-food', '/tools/mom-mind', '/tools/avoid', '/tools/calc', '/tools/calc?tab=cost', '/tools/calc?tab=log', '/tools/name']) {
      const html = renderToString(<Dump path={p} />)
      expect(html.length).toBeGreaterThan(500)
    }
  }
})
