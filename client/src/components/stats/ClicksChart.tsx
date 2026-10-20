import { formatDayLabel } from "../../lib/datetime";
import type { DayBucket } from "../../services/types";

interface ClicksChartProps {
  series: DayBucket[];
  /** Plot height in px (bars scale inside). */
  height?: number;
  /** Caption shown top-right, e.g. "Last 14 days". */
  caption?: string;
}

/** Compact label for tight columns: 999 → "999", 1200 → "1.2k". */
function formatBarValue(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/**
 * Dependency-free daily clicks bar chart.
 * One flex bar per day with its exact count printed above it;
 * title attr gives a native hover tooltip.
 * Zero days render as a faint stub so the baseline stays readable.
 */
export function ClicksChart({ series, height = 132, caption }: ClicksChartProps) {
  const total = series.reduce((sum, b) => sum + b.clicks, 0);
  const max = series.reduce((m, b) => Math.max(m, b.clicks), 0);

  if (series.length === 0 || total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center"
        style={{ height }}
      >
        <p className="text-sm font-medium text-slate-600">No clicks yet</p>
        <p className="mt-0.5 text-xs text-slate-400">
          Share your short link to start collecting clicks.
        </p>
      </div>
    );
  }

  const n = series.length;
  const labelIndexes =
    n <= 2
      ? series.map((_, i) => i)
      : [...new Set([0, Math.floor((n - 1) / 2), n - 1])];

  return (
    <figure aria-label={`Clicks per day, last ${n} days`} className="flex flex-col gap-1.5">
      {caption ? (
        <figcaption className="flex items-baseline justify-between text-[11px] text-slate-400">
          <span>Peak {max.toLocaleString()} / day</span>
          <span>{caption}</span>
        </figcaption>
      ) : null}

      {/* Value labels — one per bar, aligned to the columns below. Zeros omitted. */}
      <div className="flex gap-[3px]" aria-hidden="true">
        {series.map((bucket) => (
          <span
            key={bucket.day}
            className="flex-1 truncate text-center text-[9px] leading-none font-medium text-slate-500 tabular-nums"
            title={`${formatDayLabel(bucket.day)}: ${bucket.clicks.toLocaleString()} clicks`}
          >
            {bucket.clicks > 0 ? formatBarValue(bucket.clicks) : ""}
          </span>
        ))}
      </div>

      <div className="flex items-end gap-[3px]" style={{ height }}>
        {series.map((bucket) => {
          const pct =
            bucket.clicks > 0 ? Math.max((bucket.clicks / max) * 100, 5) : 0;
          return (
            <div
              key={bucket.day}
              className="group flex h-full flex-1 flex-col justify-end"
              title={`${formatDayLabel(bucket.day)}: ${bucket.clicks.toLocaleString()} click${bucket.clicks === 1 ? "" : "s"}`}
            >
              <div
                className={
                  bucket.clicks > 0
                    ? "w-full rounded-t-sm bg-indigo-500 transition-colors group-hover:bg-indigo-700"
                    : "h-[2px] w-full rounded-full bg-slate-200"
                }
                style={bucket.clicks > 0 ? { height: `${pct}%` } : undefined}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-[3px] text-[10px] text-slate-400">
        {series.map((bucket, i) => (
          <span key={bucket.day} className="flex-1 text-center">
            {labelIndexes.includes(i) ? formatDayLabel(bucket.day) : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}
