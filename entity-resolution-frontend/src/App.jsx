import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import clsx from 'clsx'
import Navbar from './components/common/Navbar'
import Sidebar from './components/common/Sidebar'
import AuthModal from './components/common/AuthModal'
import UploadPage  from './pages/Upload'
import ResultsPage from './pages/Results'
import ReviewPage  from './pages/Review'
import AuditPage   from './pages/Audit'
import useStore from './store/useStore'

function Layout() {
  const { sidebarOpen, setUser } = useStore()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('ere_user')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed) setUser(parsed)
    } catch {
      // Ignore invalid persisted user payloads.
    }
  }, [setUser])

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0EA]">
      <Sidebar />
      <div className={clsx('transition-all duration-300', sidebarOpen ? 'md:ml-64' : 'md:ml-14')}>
        <Navbar />
        <main className="min-h-[calc(100vh-56px)]">
          <Routes>
            <Route path="/"        element={<Navigate to="/upload" replace />} />
            <Route path="/upload"  element={<UploadPage  />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/review"  element={<ReviewPage  />} />
            <Route path="/audit"   element={<AuditPage   />} />
          </Routes>
        </main>
      </div>
      <AuthModal />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
