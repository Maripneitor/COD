export default function SkeletonLoader({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'row' | 'tree' }) {
  if (type === 'tree') {
    return (
      <div className="space-y-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded skeleton-shimmer shrink-0" />
            <div className="h-4 rounded skeleton-shimmer w-32" />
            <div className="h-3 rounded skeleton-shimmer w-16 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'row') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
              <div className="space-y-1.5">
                <div className="h-4 rounded skeleton-shimmer w-28" />
                <div className="h-3 rounded skeleton-shimmer w-16" />
              </div>
            </div>
            <div className="w-20 h-6 rounded-lg skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 rounded skeleton-shimmer w-36" />
            <div className="w-16 h-5 rounded-full skeleton-shimmer" />
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-16 rounded-xl skeleton-shimmer w-full" />
            <div className="h-16 rounded-xl skeleton-shimmer w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
