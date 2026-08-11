export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 animate-pulse rounded-md bg-surface-muted" />
        <div className="h-8 w-40 animate-pulse rounded-md bg-surface-muted" />
      </div>
      <div className="h-44 animate-pulse rounded-xl bg-surface-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}
