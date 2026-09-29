interface SpinnerProps {
  /** Accessible label announced while spinning. */
  label?: string;
  size?: "sm" | "md";
}

export function Spinner({ label = "Loading", size = "md" }: SpinnerProps) {
  const dimension = size === "sm" ? "size-4" : "size-8";
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block ${dimension} animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600`}
    />
  );
}

export function FullScreenSpinner({ label }: SpinnerProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50"
      aria-busy="true"
    >
      <Spinner label={label} />
    </div>
  );
}
