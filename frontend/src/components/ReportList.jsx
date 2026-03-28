import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, Eye, AlertTriangle, CheckCircle, AlertCircle, Loader2, X, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from './ui/ConfirmModal'
import { SkeletonTable } from './ui/SkeletonLoader'
import api from '../api'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

function ReportList() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null })

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await api.getReports()
      setReports(response.data.reports)
      setError(null)
    } catch (err) {
      setError('Failed to load reports')
    } finally { setLoading(false) }
  }

  const viewReport = async (reportId) => {
    try {
      setDetailsLoading(true)
      const response = await api.getReport(reportId)
      setSelectedReport(response.data)
      setShowDetails(true)
    } catch (err) {
      console.error(err)
    } finally { setDetailsLoading(false) }
  }

  const deleteReport = async () => {
    const reportId = deleteModal.id
    if (!reportId) return
    try {
      await api.deleteReport(reportId)
      setReports(reports.filter(r => r.id !== reportId))
      if (selectedReport?.id === reportId) {
        setShowDetails(false)
        setSelectedReport(null)
      }
    } catch (err) {
      console.error(err)
    }
    setDeleteModal({ open: false, id: null })
  }

  const getStatusPill = (status) => {
    const config = {
      healthy: { cls: 'status-healthy', label: 'Healthy', icon: CheckCircle },
      minor_damage: { cls: 'status-warning', label: 'Warning', icon: AlertTriangle },
      severe_damage: { cls: 'status-critical', label: 'Critical', icon: AlertCircle },
    }
    const c = config[status] || { cls: 'bg-white/5 text-gray-500 border border-white/10', label: status || 'Unknown', icon: FileText }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${c.cls}`}>
        <c.icon className="h-3 w-3" />
        {c.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="skeleton h-8 w-48 mb-2" /><div className="skeleton h-4 w-64" /></div>
        <SkeletonTable rows={6} />
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Inspection Reports</h2>
          <p className="text-gray-500 mt-1 text-sm">Manage and track structural health assessments</p>
        </div>
        <Link to="/new-report" className="btn-gradient px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Create Report
        </Link>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-coral-500/10 border border-coral-500/20 text-coral-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            {reports.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/5 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-700" />
                </div>
                <p className="text-gray-500">No reports yet</p>
                <Link to="/new-report" className="text-accent-400 hover:text-accent-300 transition-colors text-sm mt-2 inline-flex items-center gap-1">
                  Create your first report <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.05em]">Building</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.05em]">Location</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.05em]">Status</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.05em] hidden md:table-cell">Inspector</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.05em] hidden sm:table-cell">Date</th>
                      <th className="px-5 py-3.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-[0.05em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, idx) => (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group ghost-border hover:bg-accent-500/[0.03] transition-colors cursor-pointer"
                        onClick={() => viewReport(report.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-sm text-gray-200">{report.building_name}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{report.location}</td>
                        <td className="px-5 py-3.5">{getStatusPill(report.overall_status)}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">{report.inspector_name}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 font-mono hidden sm:table-cell">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); viewReport(report.id) }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-accent-500/10 transition-all" title="View">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, id: report.id }) }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-coral-400 hover:bg-coral-500/10 transition-all" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Detail Panel */}
        <motion.div variants={itemVariants} className="xl:col-span-1">
          <div className="glass-card rounded-2xl p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Report Details</h3>

            {detailsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
              </div>
            ) : !showDetails || !selectedReport ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-accent-500/5 flex items-center justify-center mx-auto mb-3">
                  <Eye className="h-7 w-7 text-gray-700" />
                </div>
                <p className="text-gray-600 text-sm">Select a report to view</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Building</p>
                  <p className="font-semibold text-white mt-0.5">{selectedReport.building_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Location</p>
                    <p className="text-sm text-gray-300 mt-0.5">{selectedReport.location}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Inspector</p>
                    <p className="text-sm text-gray-300 mt-0.5">{selectedReport.inspector_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Status</p>
                  {getStatusPill(selectedReport.overall_status)}
                </div>

                {selectedReport.description && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Description</p>
                    <p className="text-sm text-gray-400 mt-0.5">{selectedReport.description}</p>
                  </div>
                )}

                {selectedReport.sensor_prediction && (
                  <div className="p-4 rounded-xl bg-accent-500/5 border border-accent-500/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-accent-400">Sensor Analysis</p>
                      {getStatusPill(selectedReport.sensor_prediction.damage_level)}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Accel X', value: selectedReport.sensor_prediction.accel_x?.toFixed(3) },
                        { label: 'Accel Y', value: selectedReport.sensor_prediction.accel_y?.toFixed(3) },
                        { label: 'Accel Z', value: selectedReport.sensor_prediction.accel_z?.toFixed(3) },
                      ].map(item => (
                        <div key={item.label} className="bg-midnight-900/60 rounded-lg p-2">
                          <p className="text-[9px] text-gray-600 uppercase">{item.label}</p>
                          <p className="text-xs font-mono font-semibold text-gray-300">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-midnight-900/60 rounded-lg p-2">
                        <p className="text-[9px] text-gray-600 uppercase">Strain (με)</p>
                        <p className="text-xs font-mono font-semibold text-gray-300">{selectedReport.sensor_prediction.strain?.toFixed(1)}</p>
                      </div>
                      <div className="bg-midnight-900/60 rounded-lg p-2">
                        <p className="text-[9px] text-gray-600 uppercase">Temp (°C)</p>
                        <p className="text-xs font-mono font-semibold text-gray-300">{selectedReport.sensor_prediction.temperature?.toFixed(1)}</p>
                      </div>
                    </div>
                    {/* Confidence */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] text-gray-600 uppercase">Confidence</p>
                        <p className="text-xs font-mono font-semibold text-gray-300">{(selectedReport.sensor_prediction.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-emerald-400"
                          style={{ width: `${selectedReport.sensor_prediction.confidence * 100}%` }} />
                      </div>
                    </div>
                    {selectedReport.sensor_prediction.recommendations?.length > 0 && (
                      <div>
                        <p className="text-[9px] text-gray-600 uppercase mb-1.5">Recommendations</p>
                        <ul className="space-y-1">
                          {selectedReport.sensor_prediction.recommendations.map((rec, i) => (
                            <li key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                              <span className="text-accent-400 mt-0.5">•</span> {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {selectedReport.image_analysis && (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <p className="text-xs font-semibold text-purple-400">Linked Image Analysis</p>
                    <p className="text-[11px] text-purple-300/60 mt-0.5">
                      #{selectedReport.image_analysis.id} — {selectedReport.image_analysis.damage_type || 'No damage'}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 text-[10px] text-gray-600 font-mono space-y-0.5">
                  <p>Created: {new Date(selectedReport.created_at).toLocaleString()}</p>
                  <p>Updated: {new Date(selectedReport.updated_at).toLocaleString()}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={deleteReport}
        title="Delete Report"
        message="This action cannot be undone. The report and all associated data will be permanently removed."
      />
    </motion.div>
  )
}

export default ReportList
