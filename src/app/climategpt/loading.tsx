export default function ClimateGptLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading ClimateGPT">
      <div className="h-8 w-48 animate-pulse rounded-md bg-surface-muted" />
      <div className="h-[400px] w-full animate-pulse rounded-xl bg-surface-muted" />
    </div>
  );
}
