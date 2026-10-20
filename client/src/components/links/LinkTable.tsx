import { shortLinkFor } from "../../config/env";
import { formatDateTime, isExpired } from "../../lib/datetime";
import type { Link } from "../../services/types";
import { Banner } from "../ui/Banner";
import { EmptyState } from "../ui/EmptyState";
import { CopyButton } from "./CopyButton";

interface LinkTableProps {
  links: Link[];
  onEdit(link: Link): void;
  onDelete(link: Link): void;
  onStats(link: Link): void;
}

function RowActions({
  link,
  onEdit,
  onDelete,
  onStats,
}: {
  link: Link;
  onEdit(link: Link): void;
  onDelete(link: Link): void;
  onStats(link: Link): void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onStats(link)}
        aria-label={`Stats for /${link.shortCode}`}
        title="Stats"
        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
      >
        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M3 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7ZM8.5 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V4ZM14 7a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V7Z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onEdit(link)}
        aria-label={`Edit /${link.shortCode}`}
        title="Edit"
        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
      >
        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onDelete(link)}
        aria-label={`Delete /${link.shortCode}`}
        title="Delete"
        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 0 0 6 3.75V4H3.75a.75.75 0 0 0 0 1.5h.614l.72 10.578A2.75 2.75 0 0 0 7.822 17h4.356a2.75 2.75 0 0 0 2.738-2.422l.72-10.578h.614a.75.75 0 0 0 0-1.5H14v-.25A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 4v-.25c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25V4h-5Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

export function LinkTable({ links, onEdit, onDelete, onStats }: LinkTableProps) {
  return (
    <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Short link</th>
            <th scope="col" className="px-4 py-3">Original URL</th>
            <th scope="col" className="px-4 py-3 text-right">Clicks</th>
            <th scope="col" className="px-4 py-3">Expires</th>
            <th scope="col" className="px-4 py-3">Created</th>
            <th scope="col" className="px-4 py-3 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {links.map((link) => {
            const expired = isExpired(link.expiresAt);
            return (
              <tr
                key={link.id}
                className={`transition-colors hover:bg-slate-50/80 ${
                  expired ? "opacity-60" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <a
                      href={shortLinkFor(link.shortCode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={shortLinkFor(link.shortCode)}
                      className="max-w-40 truncate font-mono text-xs font-semibold text-indigo-700 underline-offset-2 hover:text-indigo-900 hover:underline"
                    >
                      {link.shortCode}
                    </a>
                    <CopyButton text={shortLinkFor(link.shortCode)} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={link.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.originalUrl}
                    className="block max-w-72 truncate font-mono text-[13px] text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                  >
                    {link.originalUrl}
                  </a>
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                  {link.clicks}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {link.expiresAt ? (
                    <span className={expired ? "font-medium text-red-600" : undefined}>
                      {expired ? "Expired " : ""}
                      {formatDateTime(link.expiresAt)}
                    </span>
                  ) : (
                    <span className="text-slate-400">Never</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateTime(link.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    link={link}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStats={onStats}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LinkTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading links"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LinkTableEmpty() {
  return (
    <EmptyState
      title="No links yet"
      description="Paste a long URL into the form above to create your first short link."
    />
  );
}

export function LinkTableError({
  message,
  onRetry,
}: {
  message: string;
  onRetry(): void;
}) {
  return <Banner message={message} onRetry={onRetry} retryLabel="Try again" />;
}
