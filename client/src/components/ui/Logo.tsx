interface LogoMarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const MARK_SIZES: Record<NonNullable<LogoMarkProps["size"]>, string> = {
  sm: "size-6 rounded-md",
  md: "size-7 rounded-lg",
  lg: "size-10 rounded-xl",
};

const GLYPH_SIZES: Record<NonNullable<LogoMarkProps["size"]>, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
};

/** Gradient tile + link glyph — the app icon in component form. */
export function LogoMark({ size = "md", className = "" }: LogoMarkProps) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm ${MARK_SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      <svg
        className={GLYPH_SIZES[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </span>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  /** Hide the wordmark (mark only). */
  markOnly?: boolean;
  className?: string;
}

const WORD_SIZES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-[15px]",
  lg: "text-xl",
};

/** Brand lockup: mark + two-tone wordmark. Wrap in a router Link if clickable. */
export function Logo({
  size = "md",
  markOnly = false,
  className = "",
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {markOnly ? null : (
        <span
          className={`font-bold tracking-tight text-slate-900 ${WORD_SIZES[size]}`}
        >
          s-<span className="text-indigo-600">url</span>
        </span>
      )}
    </span>
  );
}
