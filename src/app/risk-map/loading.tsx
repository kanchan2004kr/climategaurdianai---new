export default function RiskMapLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading climate risk map">
      <div className="h-8 w-56 animate-pulse rounded-md bg-surface-muted" />
      <div className="h-[480px] w-full animate-pulse rounded-xl bg-surface-muted" />
    </div>
  );
}
