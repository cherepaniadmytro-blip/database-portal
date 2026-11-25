import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import { AccountPage } from './pages/AccountPage.tsx'
import { ActivityPage } from './pages/ActivityPage.tsx'
import { AdminPage } from './pages/AdminPage.tsx'
import { HelpPage } from './pages/HelpPage.tsx'
import { PipelinePage } from './pages/PipelinePage.tsx'
import { StatsPage } from './pages/StatsPage.tsx'
import { ArchivePage } from './pages/ArchivePage.tsx'
import { CatalogPage } from './pages/CatalogPage.tsx'
import { DashboardPage } from './pages/Dashboard.tsx'
import { HistoryPage } from './pages/HistoryPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { RecordPage } from './pages/RecordPage.tsx'
import { ReportsPage } from './pages/ReportsPage.tsx'
import { SearchPage } from './pages/SearchPage.tsx'
import { SectionPage } from './pages/SectionPage.tsx'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <CatalogPage /> },
        { path: 'dashboard', element: <DashboardPage /> },
        { path: 'section/:section', element: <SectionPage /> },
        { path: 'record/:id', element: <RecordPage /> },
        { path: 'search', element: <SearchPage /> },
        { path: 'reports', element: <ReportsPage /> },
        { path: 'history', element: <HistoryPage /> },
        { path: 'archive', element: <ArchivePage /> },
        { path: 'admin', element: <AdminPage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'pipeline', element: <PipelinePage /> },
        { path: 'stats', element: <StatsPage /> },
        { path: 'activity', element: <ActivityPage /> },
        { path: 'help', element: <HelpPage /> },
        { path: 'account', element: <AccountPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
)

export function App() {
  return <RouterProvider router={router} />
}
