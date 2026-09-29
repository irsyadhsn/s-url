interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

/** Compact KPI tile: small uppercase label, big tabular number, optional hint. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-card">
      <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-slate-200 bg-white px-4 py-4"
    >
      <div className="h-2.5 w-16 rounded bg-slate-200" />
      <div className="mt-2.5 h-7 w-14 rounded bg-slate-200" />
    </div>
  );
}
