export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-6 w-16" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${className}`}>
      <div className="skeleton h-4 w-40 mb-6" />
      <div className="skeleton h-48 w-full rounded-xl" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-32 mb-4" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="skeleton h-4 w-4 rounded" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return <div className={`skeleton ${width} ${height} rounded`} />
}
