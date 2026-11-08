import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import AntenatalPage from './pages/AntenatalPage'
import ChecklistPage from './pages/ChecklistPage'
import MomFoodPage from './pages/MomFoodPage'
import NamePage from './pages/NamePage'
import SickPage from './pages/SickPage'
import CommunityPage from './pages/CommunityPage'
import HomePage from './pages/HomePage'
import MilestonesHistoryPage from './pages/MilestonesHistoryPage'
import MilestonesPage from './pages/MilestonesPage'
import OnboardingPage from './pages/OnboardingPage'
import SettingsPage from './pages/SettingsPage'
import ToolsPage from './pages/ToolsPage'
import VaccinePage from './pages/VaccinePage'

// หน้ากราฟใช้ recharts ซึ่งมีขนาดใหญ่ — โหลดเมื่อเปิดหน้านี้เท่านั้น
const GrowthPage = lazy(() => import('./pages/GrowthPage'))
const CalcPage = lazy(() => import('./pages/CalcPage'))
const NursingMapPage = lazy(() => import('./pages/NursingMapPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="vaccine" element={<VaccinePage />} />
          <Route path="antenatal" element={<AntenatalPage />} />
          <Route path="milestones" element={<MilestonesPage />} />
          <Route path="milestones/history" element={<MilestonesHistoryPage />} />
          <Route
            path="growth"
            element={
              <Suspense fallback={<p className="text-ink-muted">กำลังโหลดกราฟ…</p>}>
                <GrowthPage />
              </Suspense>
            }
          />
          <Route path="checklist" element={<ChecklistPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="tools/sick" element={<SickPage />} />
          <Route path="tools/mom-food" element={<MomFoodPage />} />
          <Route path="tools/name" element={<NamePage />} />
          <Route
            path="tools/nursing-map"
            element={
              <Suspense fallback={<p className="text-ink-muted">กำลังโหลดแผนที่…</p>}>
                <NursingMapPage />
              </Suspense>
            }
          />
          <Route
            path="tools/calc"
            element={
              <Suspense fallback={<p className="text-ink-muted">กำลังโหลด…</p>}>
                <CalcPage />
              </Suspense>
            }
          />
          <Route path="community" element={<CommunityPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
