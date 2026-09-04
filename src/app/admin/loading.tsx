export default function AdminLoading() {
  return (
    <div className="w-full relative">
      {/* Top subtle indeterminate progress bar */}
      <div className="sticky top-0 left-0 right-0 h-1 w-full bg-primary/10 overflow-hidden z-50">
        <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent w-1/2 animate-top-progress" />
      </div>

      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded-xl" />
            <div className="h-4 w-96 bg-muted/60 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 bg-muted rounded-xl" />
            <div className="h-9 w-28 bg-muted rounded-xl" />
          </div>
        </div>

        {/* 4 Metric Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-8 w-8 rounded-xl bg-muted" />
              </div>
              <div className="h-7 w-28 bg-muted rounded-lg" />
              <div className="h-3 w-36 bg-muted/60 rounded" />
            </div>
          ))}
        </div>

        {/* Content Box / Table Skeleton */}
        <div className="bg-card border border-border/70 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="h-5 w-48 bg-muted rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-40 bg-muted rounded-xl" />
              <div className="h-9 w-24 bg-muted rounded-xl" />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-14 w-full bg-muted/40 rounded-xl border border-border/40 flex items-center px-4 justify-between"
              >
                <div className="flex items-center gap-3 w-1/3">
                  <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
                  <div className="space-y-1 w-full">
                    <div className="h-3 w-3/4 bg-muted rounded" />
                    <div className="h-2.5 w-1/2 bg-muted/60 rounded" />
                  </div>
                </div>
                <div className="h-4 w-24 bg-muted/60 rounded hidden md:block" />
                <div className="h-4 w-20 bg-muted/60 rounded hidden sm:block" />
                <div className="h-6 w-16 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
