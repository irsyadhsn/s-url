import type { ReactNode } from "react";

type Variant = "error" | "success" | "info";

const VARIANTS: Record<
  Variant,
  { wrap: string; icon: string; path: ReactNode }
> = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-700",
    icon: "text-red-500",
    path: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        />
      </>
    ),
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "text-emerald-500",
    path: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  info: {
    wrap: "border-indigo-200 bg-indigo-50 text-indigo-700",
    icon: "text-indigo-500",
    path: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25 9 11.25V15m0-6.75h.008M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
};

interface BannerProps {
  message: string;
  variant?: Variant;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** Unified inline message: one style for every error/notice in the app. */
export function Banner({
  message,
  variant = "error",
  onRetry,
  retryLabel = "Retry",
  className = "",
}: BannerProps) {
  const v = VARIANTS[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${v.wrap} ${className}`}
    >
      <svg
        className={`mt-0.5 size-4 shrink-0 ${v.icon}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        {v.path}
      </svg>
      <p className="min-w-0 flex-1 break-words">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
