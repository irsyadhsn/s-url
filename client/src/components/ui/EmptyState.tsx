import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Extra content (CTA button, hint) below the description. */
  children?: ReactNode;
  icon?: ReactNode;
  /** Tighter padding for in-card usage (charts, panels). */
  compact?: boolean;
  className?: string;
}

const DEFAULT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757M9.75 9.75 4.5 15m5.25-5.25 1.757-1.757M14.25 9.75 19.5 4.5M9.75 9.75v5.25m4.5-4.5H9.75"
  />
);

/** Shared dashed placeholder for "nothing here yet" states. */
export function EmptyState({
  title,
  description,
  children,
  icon,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-300 bg-white text-center ${
        compact ? "px-4 py-8" : "px-6 py-14"
      } ${className}`}
    >
      <span
        className={`mx-auto grid place-items-center rounded-2xl bg-slate-100 text-slate-400 ${
          compact ? "size-9" : "size-12"
        }`}
      >
        <svg
          className={compact ? "size-4.5" : "size-6"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          {icon ?? DEFAULT_ICON}
        </svg>
      </span>
      <h3
        className={`mt-4 font-semibold text-slate-900 ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={`mx-auto mt-1.5 max-w-sm text-slate-500 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
