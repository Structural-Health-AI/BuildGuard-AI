import { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Building2, Camera, Activity, FileText, LayoutDashboard, ChevronLeft, ChevronRight, Menu, X, Shield, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import Dashboard from './components/Dashboard'
import ImageUpload from './components/ImageUpload'
import SensorInput from './components/SensorInput'
import ReportForm from './components/ReportForm'
import ReportList from './components/ReportList'
import LandingPage from './pages/LandingPage'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/sensor-analysis', icon: Activity, label: 'Sensor Analysis' },
  { path: '/image-analysis', icon: Camera, label: 'Image Analysis' },
  { path: '/reports', icon: FileText, label: 'Reports' },
]

/* ── App shell with sidebar (used for all authenticated routes) ── */
function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-midnight-900 text-gray-200">
      {/* === DESKTOP SIDEBAR === */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 glass-sidebar transition-all duration-300 ease-in-out hidden lg:flex flex-col ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {/* Logo area */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center flex-shrink-0 shadow-glow-violet">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-sm font-bold text-white tracking-tight">BuildGuard AI</h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">Structural Health</p>
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
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-accent-500/10 text-accent-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent-500 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-accent-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
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
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                sidebarCollapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'btn-gradient'
                  : 'bg-accent-500/10 text-accent-400 hover:bg-accent-500/20'
              }`
            }
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>New Report</span>}
          </NavLink>
        </div>

        {/* Collapse toggle */}
        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] transition-all"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* === MOBILE HEADER === */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 glass-sidebar flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-glow-violet">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">BuildGuard AI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-[240px] h-full glass-sidebar p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="space-y-1 mt-14">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-accent-500/10 text-accent-400'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
                <NavLink
                  to="/new-report"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 transition-all mt-4"
                >
                  <Plus className="h-5 w-5" />
                  New Report
                </NavLink>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MOBILE BOTTOM NAV === */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-sidebar border-t border-white/5">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                  isActive ? 'text-accent-400' : 'text-gray-500'
                }`
              }
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
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]'
        } pt-14 lg:pt-0 pb-20 lg:pb-0`}
      >
        <div className="p-4 lg:p-6 xl:p-8 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Routes location={location}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/image-analysis" element={<ImageUpload />} />
                <Route path="/sensor-analysis" element={<SensorInput />} />
                <Route path="/reports" element={<ReportList />} />
                <Route path="/new-report" element={<ReportForm />} />
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

  if (isLanding) {
    return <LandingPage />
  }

  return <AppShell />
}

export default App
