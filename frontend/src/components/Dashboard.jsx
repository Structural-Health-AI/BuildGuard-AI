import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Camera, FileText, AlertTriangle, CheckCircle, AlertCircle, ArrowUpRight, Zap, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { SkeletonCard, SkeletonChart } from './ui/SkeletonLoader'
import api from '../api'

// Animated counter hook
function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
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

const CHART_COLORS = ['#34d399', '#fbbf24', '#f87171']

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
      // Use mock data for demo
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
    { name: 'Healthy', value: stats?.healthy_count || 0, color: '#34d399' },
    { name: 'Warning', value: stats?.minor_damage_count || 0, color: '#fbbf24' },
    { name: 'Critical', value: stats?.severe_damage_count || 0, color: '#f87171' },
  ]
  const totalPie = pieData.reduce((a, b) => a + b.value, 0)
  const healthyPercent = totalPie > 0 ? Math.round((pieData[0].value / totalPie) * 100) : 0

  const statCards = [
    { label: 'Total Analyses', value: totalAnalyses, icon: Zap, variant: 'stat-card-violet', textColor: 'text-accent-400', iconBg: 'bg-accent-500/15' },
    { label: 'Healthy', value: healthyCount, icon: CheckCircle, variant: 'stat-card-emerald', textColor: 'text-emerald-400', iconBg: 'bg-emerald-500/15' },
    { label: 'Warnings', value: warningCount, icon: AlertTriangle, variant: 'stat-card-amber', textColor: 'text-amber-400', iconBg: 'bg-amber-500/15' },
    { label: 'Critical Alerts', value: criticalCount, icon: AlertCircle, variant: 'stat-card-coral', textColor: 'text-coral-400', iconBg: 'bg-coral-500/15' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Structural Health Overview</h2>
        <p className="text-gray-500 mt-1 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div key={card.label} variants={itemVariants} className={`${card.variant} rounded-2xl p-5 glass-card-hover cursor-default`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className={`text-3xl font-bold font-mono mt-2 ${card.textColor}`}>{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Health Distribution</h3>
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-bold text-white font-mono">{healthyPercent}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Healthy</p>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-500">{item.name}</span>
                <span className="text-xs font-mono text-gray-400">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Area Chart */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradientHealthy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientWarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.4)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="healthy" stroke="#34d399" strokeWidth={2} fill="url(#gradientHealthy)" />
                <Area type="monotone" dataKey="warning" stroke="#fbbf24" strokeWidth={2} fill="url(#gradientWarning)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        <Link to="/sensor-analysis" className="btn-gradient px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
          <Activity className="h-4 w-4" /> New Sensor Analysis
        </Link>
        <Link to="/image-analysis" className="btn-gradient px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
          <Camera className="h-4 w-4" /> New Image Analysis
        </Link>
        <Link to="/new-report" className="px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all">
          <FileText className="h-4 w-4" /> Create Report
        </Link>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Assessments</h3>
          <Link to="/reports" className="text-xs text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {stats?.recent_analyses?.length > 0 ? (
          <div className="space-y-1">
            {stats.recent_analyses.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'sensor' ? 'bg-accent-500/10' : 'bg-purple-500/10'
                  }`}>
                    {activity.type === 'sensor' ? (
                      <Activity className="h-4 w-4 text-accent-400" />
                    ) : (
                      <Camera className="h-4 w-4 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-300">{activity.building_name || `${activity.type} Analysis`}</span>
                    <p className="text-xs text-gray-600 capitalize">{activity.type} analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={activity.status} />
                  <span className="text-xs text-gray-600 tabular-nums font-mono">
                    {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No recent activity</p>
            <p className="text-gray-700 text-xs mt-1">Start by running a sensor or image analysis</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function StatusPill({ status }) {
  const config = {
    healthy: { className: 'status-healthy', label: 'Healthy', icon: CheckCircle },
    minor_damage: { className: 'status-warning', label: 'Warning', icon: AlertTriangle },
    severe_damage: { className: 'status-critical', label: 'Critical', icon: AlertCircle },
    no_damage: { className: 'status-healthy', label: 'Healthy', icon: CheckCircle },
    damage_detected: { className: 'status-critical', label: 'Damage', icon: AlertCircle },
  }
  const c = config[status] || config.healthy
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${c.className}`}>
      <c.icon className="h-3 w-3" />
      {c.label}
    </span>
  )
}

export default Dashboard
