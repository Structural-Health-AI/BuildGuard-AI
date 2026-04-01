import { useState } from 'react'
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Camera, Activity, FileText, LayoutDashboard, Menu, X, Shield, Plus, LogOut } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import Dashboard from './components/Dashboard'
import ImageUpload from './components/ImageUpload'
import SensorInput from './components/SensorInput'
import ReportForm from './components/ReportForm'
import ReportList from './components/ReportList'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

/* ═══════════════════════════════════════════
   DESIGN TOKENS — Monochromatic + Terracotta
   ═══════════════════════════════════════════ */
const T = {
  white: '#FFFFFF',
  offWhite: '#F8F7F5',
  charcoal: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  terra: '#C2644A',
  terraHover: '#A84E36',
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/sensor-analysis', icon: Activity, label: 'Sensor Analysis' },
  { path: '/image-analysis', icon: Camera, label: 'Image Analysis' },
  { path: '/reports', icon: FileText, label: 'Reports' },
]

/* ── App shell with sidebar (editorial white theme) ── */
function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="landing-page min-h-screen" style={{ background: T.offWhite, color: T.charcoal }}>
      {/* === DESKTOP SIDEBAR === */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out hidden lg:flex flex-col ${
          sidebarCollapsed ? 'w-[64px]' : 'w-[220px]'
        }`}
        style={{
          background: T.white,
          borderRight: `1px solid ${T.border}`,
        }}
      >
        {/* Logo area */}
        <div
          className={`flex items-center gap-2.5 px-4 h-16 ${sidebarCollapsed ? 'justify-center' : ''}`}
          style={{ borderBottom: `1px solid ${T.borderLight}` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: T.charcoal }}
          >
            <Shield className="h-4 w-4" style={{ color: T.white }} />
          </div>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="text-sm font-bold tracking-tight" style={{ color: T.charcoal }}>
                BuildGuard<span style={{ color: T.terra }}>AI</span>
              </span>
            </motion.div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? ''
                    : ''
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? T.terraLight || 'rgba(194, 100, 74, 0.08)' : 'transparent',
                color: isActive ? T.terra : T.textMuted,
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: T.terra }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* New Report Quick Action */}
        <div className={`px-3 pb-3 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <NavLink
            to="/new-report"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={({ isActive }) => ({
              background: isActive ? T.terra : 'rgba(194, 100, 74, 0.08)',
              color: isActive ? T.white : T.terra,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            })}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>New Report</span>}
          </NavLink>
        </div>

        {/* User Menu */}
        {user && (
          <div className="px-3 pb-4 pt-3" style={{ borderTop: `1px solid ${T.borderLight}` }}>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 transition-all"
              style={{ background: 'rgba(220, 38, 38, 0.08)' }}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="px-3 pb-4 pt-3" style={{ borderTop: `1px solid ${T.borderLight}` }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all"
            style={{ color: T.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.borderLight)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sidebarCollapsed ? (
                <><polyline points="9 18 15 12 9 6" /></>
              ) : (
                <><polyline points="15 18 9 12 15 6" /></>
              )}
            </svg>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* === MOBILE HEADER === */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${T.borderLight}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.charcoal }}>
            <Shield className="h-4 w-4" style={{ color: T.white }} />
          </div>
          <span className="text-sm font-bold" style={{ color: T.charcoal }}>
            BuildGuard<span style={{ color: T.terra }}>AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'rgba(194, 100, 74, 0.08)', color: T.terra }}
            >
              {user.email?.split('@')[0]}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: T.charcoal }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(26, 26, 46, 0.3)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-[240px] h-full p-4"
              style={{ background: T.white, borderRight: `1px solid ${T.border}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="space-y-1 mt-14">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all"
                    style={({ isActive }) => ({
                      background: isActive ? 'rgba(194, 100, 74, 0.08)' : 'transparent',
                      color: isActive ? T.terra : T.textMuted,
                    })}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
                <NavLink
                  to="/new-report"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mt-4"
                  style={{ background: 'rgba(194, 100, 74, 0.08)', color: T.terra }}
                >
                  <Plus className="h-5 w-5" />
                  New Report
                </NavLink>
                {user && (
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                      navigate('/')
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mt-4 text-red-600"
                    style={{ background: 'rgba(220, 38, 38, 0.08)' }}
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MOBILE BOTTOM NAV === */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all"
              style={({ isActive }) => ({
                color: isActive ? T.terra : T.textMuted,
              })}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* === MAIN CONTENT === */}
      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? 'lg:pl-[64px]' : 'lg:pl-[220px]'
        } pt-14 lg:pt-0 pb-20 lg:pb-0`}
      >
        <div className="p-4 lg:p-6 xl:p-8 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Routes location={location}>
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/image-analysis" element={<ProtectedRoute><ImageUpload /></ProtectedRoute>} />
                <Route path="/sensor-analysis" element={<ProtectedRoute><SensorInput /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportList /></ProtectedRoute>} />
                <Route path="/new-report" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

/* ── Root App: Landing page at "/", app shell for everything else ── */
function App() {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const isAuthPage = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'].includes(location.pathname)

  if (isLanding) {
    return <LandingPage />
  }

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    )
  }

  return <AppShell />
}

export default App
