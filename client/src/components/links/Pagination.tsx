import { Button } from "../ui/Button";

/** Page sizes offered in the per-page selector (server caps at 100). */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  disabled?: boolean;
  /** Noun used in the summary text (defaults to "links"). */
  noun?: string;
  /** Current rows-per-page; omit together with `onPageSizeChange` to hide the selector. */
  pageSize?: number;
  onPageChange(page: number): void;
  /** Called with the new size — callers should reset to page 1. */
  onPageSizeChange?(size: number): void;
}

type PageToken = number | "gap";

/**
 * Numbered page list with ellipses: always shows first, last, and a
 * window of three around the current page.
 *
 *   1 … 4 5 6 … 20
 */
function pageTokens(page: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const window = [page - 1, page, page + 1].filter(
    (p) => p >= 2 && p <= totalPages - 1,
  );
  const tokens: PageToken[] = [1];
  if (window[0]! > 2) tokens.push("gap");
  tokens.push(...window);
  if (window[window.length - 1]! < totalPages - 1) tokens.push("gap");
  tokens.push(totalPages);
  return tokens;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  hasNext,
  disabled = false,
  noun = "links",
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const canResize =
    typeof onPageSizeChange === "function" &&
    typeof pageSize === "number" &&
    totalItems > PAGE_SIZE_OPTIONS[0]!;

  const summary =
    totalPages <= 1
      ? `${totalItems} ${totalItems === 1 ? noun.replace(/s$/, "") : noun}`
      : `Page ${page} of ${totalPages} · ${totalItems} ${noun}`;

  const sizeSelect = canResize ? (
    <label className="flex items-center gap-1.5 text-sm text-slate-500">
      Show
      <select
        value={pageSize}
        disabled={disabled}
        onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
        aria-label="Rows per page"
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 shadow-sm transition-colors focus:border-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:opacity-50"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      per page
    </label>
  ) : null;

  if (totalPages <= 1 && !sizeSelect) {
    return <p className="text-sm text-slate-500">{summary}</p>;
  }

  const tokens = pageTokens(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-4"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm text-slate-500">{summary}</p>
        {sizeSelect}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="secondary"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>

          {tokens.map((token, i) =>
            token === "gap" ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                className="px-1.5 text-sm text-slate-400"
              >
                …
              </span>
            ) : (
              <button
                key={token}
                type="button"
                disabled={disabled || token === page}
                aria-current={token === page ? "page" : undefined}
                aria-label={`Page ${token}`}
                onClick={() => onPageChange(token)}
                className={[
                  "min-w-9 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                  token === page
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  disabled && token !== page
                    ? "pointer-events-none opacity-50"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {token}
              </button>
            ),
          )}

          <Button
            variant="secondary"
            disabled={disabled || !hasNext}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </nav>
  );
}
