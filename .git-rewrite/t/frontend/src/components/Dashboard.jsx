import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Camera, FileText, AlertTriangle, CheckCircle, AlertCircle, ArrowUpRight, Zap, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { SkeletonCard, SkeletonChart } from './ui/SkeletonLoader'
import api from '../api'

/* ═══════════════════════════════════════════
   DESIGN TOKENS
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
}

/* Status colors — keeping semantic meaning */
const STATUS = {
  healthy: { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', label: 'Healthy' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: 'Warning' },
  critical: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'Critical' },
}

/* Animated counter */
function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (end === 0) { setCount(0); return }
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return count
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const CHART_COLORS = ['#059669', '#D97706', '#DC2626']

const trendData = [
  { month: 'Oct', healthy: 42, warning: 8, critical: 2 },
  { month: 'Nov', healthy: 48, warning: 12, critical: 3 },
  { month: 'Dec', healthy: 55, warning: 10, critical: 1 },
  { month: 'Jan', healthy: 50, warning: 15, critical: 4 },
  { month: 'Feb', healthy: 62, warning: 9, critical: 2 },
  { month: 'Mar', healthy: 58, warning: 11, critical: 3 },
]

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await api.getDashboardStats()
      setStats(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load dashboard statistics')
      setStats({
        total_reports: 24, total_sensor_analyses: 156, total_image_analyses: 89,
        healthy_count: 18, minor_damage_count: 4, severe_damage_count: 2,
        recent_analyses: [
          { type: 'sensor', status: 'healthy', building_name: 'Central Tower', created_at: new Date().toISOString() },
          { type: 'sensor', status: 'minor_damage', building_name: 'Bridge Alpha', created_at: new Date(Date.now()-3600000).toISOString() },
          { type: 'image', status: 'healthy', building_name: 'Parking Deck B', created_at: new Date(Date.now()-7200000).toISOString() },
          { type: 'sensor', status: 'severe_damage', building_name: 'Highway Overpass', created_at: new Date(Date.now()-10800000).toISOString() },
          { type: 'image', status: 'healthy', building_name: 'Office Complex C', created_at: new Date(Date.now()-14400000).toISOString() },
        ]
      })
    } finally { setLoading(false) }
  }

  const totalAnalyses = useCountUp(stats ? (stats.total_sensor_analyses + stats.total_image_analyses) : 0)
  const healthyCount = useCountUp(stats?.healthy_count || 0)
  const warningCount = useCountUp(stats?.minor_damage_count || 0)
  const criticalCount = useCountUp(stats?.severe_damage_count || 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="skeleton h-8 w-72 mb-2" /><div className="skeleton h-4 w-48" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart /><SkeletonChart />
        </div>
      </div>
    )
  }

  const pieData = [
    { name: 'Healthy', value: stats?.healthy_count || 0, color: '#059669' },
    { name: 'Warning', value: stats?.minor_damage_count || 0, color: '#D97706' },
    { name: 'Critical', value: stats?.severe_damage_count || 0, color: '#DC2626' },
  ]
  const totalPie = pieData.reduce((a, b) => a + b.value, 0)
  const healthyPercent = totalPie > 0 ? Math.round((pieData[0].value / totalPie) * 100) : 0

  const statCards = [
    { label: 'Total Analyses', value: totalAnalyses, icon: Zap, color: T.terra, bgColor: 'rgba(194,100,74,0.06)' },
    { label: 'Healthy', value: healthyCount, icon: CheckCircle, color: '#059669', bgColor: 'rgba(5,150,105,0.06)' },
    { label: 'Warnings', value: warningCount, icon: AlertTriangle, color: '#D97706', bgColor: 'rgba(217,119,6,0.06)' },
    { label: 'Critical Alerts', value: criticalCount, icon: AlertCircle, color: '#DC2626', bgColor: 'rgba(220,38,38,0.06)' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: T.terra }}>Overview</p>
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: T.charcoal }}>Structural Health Overview</h2>
        <p className="mt-1 text-sm" style={{ color: T.textMuted }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            variants={itemVariants}
            className="rounded-xl p-5 transition-all duration-200"
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = card.color; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.textMuted }}>{card.label}</p>
                <p className="text-3xl font-bold font-mono mt-2" style={{ color: card.color }}>{card.value}</p>
              </div>
              <div className="p-2.5 rounded-lg" style={{ background: card.bgColor }}>
                <card.icon className="h-5 w-5" style={{ color: card.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl p-6"
          style={{ background: T.white, border: `1px solid ${T.border}` }}
        >
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-6" style={{ color: T.terra }}>Health Distribution</h3>
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: T.charcoal }}
                  labelStyle={{ color: T.textSecondary }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-bold font-mono" style={{ color: T.charcoal }}>{healthyPercent}%</p>
                <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Healthy</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs" style={{ color: T.textMuted }}>{item.name}</span>
                <span className="text-xs font-mono" style={{ color: T.textSecondary }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Area Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl p-6"
          style={{ background: T.white, border: `1px solid ${T.border}` }}
        >
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-6" style={{ color: T.terra }}>Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradientHealthy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientWarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
                <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: T.charcoal }}
                  labelStyle={{ color: T.textSecondary }}
                />
                <Area type="monotone" dataKey="healthy" stroke="#059669" strokeWidth={2} fill="url(#gradientHealthy)" />
                <Area type="monotone" dataKey="warning" stroke="#D97706" strokeWidth={2} fill="url(#gradientWarning)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        <Link
          to="/sensor-analysis"
          className="px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 font-semibold transition-all duration-200 hover:shadow-lg"
          style={{ background: T.terra, color: T.white }}
        >
          <Activity className="h-4 w-4" /> New Sensor Analysis
        </Link>
        <Link
          to="/image-analysis"
          className="px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 font-semibold transition-all duration-200 hover:shadow-lg"
          style={{ background: T.charcoal, color: T.white }}
        >
          <Camera className="h-4 w-4" /> New Image Analysis
        </Link>
        <Link
          to="/new-report"
          className="px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 font-medium transition-all"
          style={{ color: T.textSecondary, border: `1px solid ${T.border}` }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.charcoal; e.currentTarget.style.color = T.charcoal }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary }}
        >
          <FileText className="h-4 w-4" /> Create Report
        </Link>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl p-6"
        style={{ background: T.white, border: `1px solid ${T.border}` }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: T.terra }}>Recent Assessments</h3>
          <Link to="/reports" className="text-xs font-medium flex items-center gap-1 transition-colors" style={{ color: T.terra }}>
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {stats?.recent_analyses?.length > 0 ? (
          <div className="space-y-0">
            {stats.recent_analyses.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="flex items-center justify-between py-3 px-3 rounded-lg transition-colors group"
                style={{ borderBottom: index < stats.recent_analyses.length - 1 ? `1px solid ${T.borderLight}` : 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{
                    background: activity.type === 'sensor' ? 'rgba(194,100,74,0.08)' : 'rgba(26,26,46,0.06)',
                  }}>
                    {activity.type === 'sensor' ? (
                      <Activity className="h-4 w-4" style={{ color: T.terra }} />
                    ) : (
                      <Camera className="h-4 w-4" style={{ color: T.charcoal }} />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: T.charcoal }}>
                      {activity.building_name || `${activity.type} Analysis`}
                    </span>
                    <p className="text-xs capitalize" style={{ color: T.textMuted }}>{activity.type} analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={activity.status} />
                  <span className="text-xs font-mono" style={{ color: T.textMuted }}>
                    {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-10 w-10 mx-auto mb-3" style={{ color: T.border }} />
            <p className="text-sm" style={{ color: T.textSecondary }}>No recent activity</p>
            <p className="text-xs mt-1" style={{ color: T.textMuted }}>Start by running a sensor or image analysis</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function StatusPill({ status }) {
  const config = {
    healthy: { ...STATUS.healthy, icon: CheckCircle },
    minor_damage: { ...STATUS.warning, icon: AlertTriangle },
    severe_damage: { ...STATUS.critical, icon: AlertCircle },
    no_damage: { ...STATUS.healthy, icon: CheckCircle },
    damage_detected: { ...STATUS.critical, icon: AlertCircle },
  }
  const c = config[status] || config.healthy
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <c.icon className="h-3 w-3" />
      {c.label}
    </span>
  )
}

export default Dashboard
