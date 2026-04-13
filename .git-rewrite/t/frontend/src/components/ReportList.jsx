import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, Eye, AlertTriangle, CheckCircle, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from './ui/ConfirmModal'
import { SkeletonTable } from './ui/SkeletonLoader'
import api from '../api'

const T = {
  white: '#FFFFFF', offWhite: '#F8F7F5', charcoal: '#1A1A2E',
  textSecondary: '#6B7280', textMuted: '#9CA3AF',
  border: '#E5E5E5', borderLight: '#F0F0F0',
  terra: '#C2644A',
}

const STATUS = {
  healthy: { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', label: 'Healthy', icon: CheckCircle },
  minor_damage: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: 'Warning', icon: AlertTriangle },
  severe_damage: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'Critical', icon: AlertCircle },
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

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
    try { setLoading(true); const response = await api.getReports(); setReports(response.data.reports); setError(null) }
    catch (err) { setError('Failed to load reports') }
    finally { setLoading(false) }
  }

  const viewReport = async (reportId) => {
    try { setDetailsLoading(true); const response = await api.getReport(reportId); setSelectedReport(response.data); setShowDetails(true) }
    catch (err) { console.error(err) }
    finally { setDetailsLoading(false) }
  }

  const deleteReport = async () => {
    const reportId = deleteModal.id
    if (!reportId) return
    try {
      await api.deleteReport(reportId)
      setReports(reports.filter(r => r.id !== reportId))
      if (selectedReport?.id === reportId) { setShowDetails(false); setSelectedReport(null) }
    } catch (err) { console.error(err) }
    setDeleteModal({ open: false, id: null })
  }

  const getStatusPill = (status) => {
    const c = STATUS[status] || { bg: T.offWhite, border: T.border, text: T.textMuted, label: status || 'Unknown', icon: FileText }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
        <c.icon className="h-3 w-3" />{c.label}
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: T.terra }}>Records</p>
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: T.charcoal }}>Inspection Reports</h2>
          <p className="mt-1 text-sm" style={{ color: T.textMuted }}>Manage and track structural health assessments</p>
        </div>
        <Link to="/new-report"
          className="px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 font-semibold transition-all hover:shadow-lg"
          style={{ background: T.terra, color: T.white }}>
          <Plus className="h-4 w-4" /> Create Report
        </Link>
      </motion.div>

      {error && (
        <div className="p-4 rounded-lg text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <div className="rounded-xl overflow-hidden" style={{ background: T.white, border: `1px solid ${T.border}` }}>
            {reports.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: T.offWhite }}>
                  <FileText className="h-8 w-8" style={{ color: T.border }} />
                </div>
                <p style={{ color: T.textSecondary }}>No reports yet</p>
                <Link to="/new-report" className="text-sm mt-2 inline-flex items-center gap-1 transition-colors" style={{ color: T.terra }}>
                  Create your first report <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: T.textMuted }}>Building</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: T.textMuted }}>Location</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: T.textMuted }}>Status</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] hidden md:table-cell" style={{ color: T.textMuted }}>Inspector</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] hidden sm:table-cell" style={{ color: T.textMuted }}>Date</th>
                      <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: T.textMuted }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, idx) => (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group cursor-pointer transition-colors"
                        style={{ borderBottom: `1px solid ${T.borderLight}` }}
                        onClick={() => viewReport(report.id)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-sm" style={{ color: T.charcoal }}>{report.building_name}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: T.textMuted }}>{report.location}</td>
                        <td className="px-5 py-3.5">{getStatusPill(report.overall_status)}</td>
                        <td className="px-5 py-3.5 text-sm hidden md:table-cell" style={{ color: T.textMuted }}>{report.inspector_name}</td>
                        <td className="px-5 py-3.5 text-xs font-mono hidden sm:table-cell" style={{ color: T.textMuted }}>
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); viewReport(report.id) }}
                              className="p-1.5 rounded-lg transition-all"
                              style={{ color: T.textMuted }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = T.terra; e.currentTarget.style.background = 'rgba(194,100,74,0.08)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent' }}
                              title="View">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, id: report.id }) }}
                              className="p-1.5 rounded-lg transition-all"
                              style={{ color: T.textMuted }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEF2F2' }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent' }}
                              title="Delete">
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
          <div className="rounded-xl p-6 sticky top-6" style={{ background: T.white, border: `1px solid ${T.border}` }}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-6" style={{ color: T.terra }}>Report Details</h3>

            {detailsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: T.terra }} />
              </div>
            ) : !showDetails || !selectedReport ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: T.offWhite }}>
                  <Eye className="h-7 w-7" style={{ color: T.border }} />
                </div>
                <p className="text-sm" style={{ color: T.textMuted }}>Select a report to view</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: T.textMuted }}>Building</p>
                  <p className="font-semibold mt-0.5" style={{ color: T.charcoal }}>{selectedReport.building_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: T.textMuted }}>Location</p>
                    <p className="text-sm mt-0.5" style={{ color: T.textSecondary }}>{selectedReport.location}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: T.textMuted }}>Inspector</p>
                    <p className="text-sm mt-0.5" style={{ color: T.textSecondary }}>{selectedReport.inspector_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Status</p>
                  {getStatusPill(selectedReport.overall_status)}
                </div>

                {selectedReport.description && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: T.textMuted }}>Description</p>
                    <p className="text-sm mt-0.5" style={{ color: T.textSecondary }}>{selectedReport.description}</p>
                  </div>
                )}

                {selectedReport.sensor_prediction && (
                  <div className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(194,100,74,0.04)', border: `1px solid rgba(194,100,74,0.12)` }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: T.terra }}>Sensor Analysis</p>
                      {getStatusPill(selectedReport.sensor_prediction.damage_level)}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Accel X', value: selectedReport.sensor_prediction.accel_x?.toFixed(3) },
                        { label: 'Accel Y', value: selectedReport.sensor_prediction.accel_y?.toFixed(3) },
                        { label: 'Accel Z', value: selectedReport.sensor_prediction.accel_z?.toFixed(3) },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg p-2" style={{ background: T.offWhite }}>
                          <p className="text-[9px] uppercase" style={{ color: T.textMuted }}>{item.label}</p>
                          <p className="text-xs font-mono font-semibold" style={{ color: T.charcoal }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg p-2" style={{ background: T.offWhite }}>
                        <p className="text-[9px] uppercase" style={{ color: T.textMuted }}>Strain (με)</p>
                        <p className="text-xs font-mono font-semibold" style={{ color: T.charcoal }}>{selectedReport.sensor_prediction.strain?.toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ background: T.offWhite }}>
                        <p className="text-[9px] uppercase" style={{ color: T.textMuted }}>Temp (°C)</p>
                        <p className="text-xs font-mono font-semibold" style={{ color: T.charcoal }}>{selectedReport.sensor_prediction.temperature?.toFixed(1)}</p>
                      </div>
                    </div>
                    {/* Confidence */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] uppercase" style={{ color: T.textMuted }}>Confidence</p>
                        <p className="text-xs font-mono font-semibold" style={{ color: T.charcoal }}>{(selectedReport.sensor_prediction.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.borderLight }}>
                        <div className="h-full rounded-full" style={{ width: `${selectedReport.sensor_prediction.confidence * 100}%`, background: T.terra }} />
                      </div>
                    </div>
                    {selectedReport.sensor_prediction.recommendations?.length > 0 && (
                      <div>
                        <p className="text-[9px] uppercase mb-1.5" style={{ color: T.textMuted }}>Recommendations</p>
                        <ul className="space-y-1">
                          {selectedReport.sensor_prediction.recommendations.map((rec, i) => (
                            <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: T.textSecondary }}>
                              <span style={{ color: T.terra }} className="mt-0.5">•</span> {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {selectedReport.image_analysis && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(26,26,46,0.03)', border: `1px solid rgba(26,26,46,0.08)` }}>
                    <p className="text-xs font-semibold" style={{ color: T.charcoal }}>Linked Image Analysis</p>
                    <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>
                      #{selectedReport.image_analysis.id} — {selectedReport.image_analysis.damage_type || 'No damage'}
                    </p>
                  </div>
                )}

                <div className="pt-4 text-[10px] font-mono space-y-0.5" style={{ borderTop: `1px solid ${T.borderLight}`, color: T.textMuted }}>
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
