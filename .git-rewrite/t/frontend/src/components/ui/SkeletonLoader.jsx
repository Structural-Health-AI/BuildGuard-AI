const T = {
  white: '#FFFFFF', offWhite: '#F8F7F5', border: '#E5E5E5', borderLight: '#F0F0F0',
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-xl p-6 ${className}`} style={{ background: T.white, border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg animate-pulse" style={{ background: T.offWhite }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded animate-pulse" style={{ background: T.offWhite }} />
          <div className="h-6 w-16 rounded animate-pulse" style={{ background: T.offWhite }} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`rounded-xl p-6 ${className}`} style={{ background: T.white, border: `1px solid ${T.border}` }}>
      <div className="h-4 w-40 mb-6 rounded animate-pulse" style={{ background: T.offWhite }} />
      <div className="h-48 w-full rounded-lg animate-pulse" style={{ background: T.offWhite }} />
    </div>
  )
}

export function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ background: T.white, border: `1px solid ${T.border}` }}>
      <div className="p-4 space-y-3">
        <div className="h-4 w-32 mb-4 rounded animate-pulse" style={{ background: T.offWhite }} />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="h-4 w-4 rounded animate-pulse" style={{ background: T.offWhite }} />
            <div className="h-4 flex-1 rounded animate-pulse" style={{ background: T.offWhite }} />
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: T.offWhite }} />
            <div className="h-6 w-16 rounded-full animate-pulse" style={{ background: T.offWhite }} />
            <div className="h-4 w-24 rounded animate-pulse" style={{ background: T.offWhite }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return <div className={`${width} ${height} rounded animate-pulse`} style={{ background: '#F0F0F0' }} />
}
