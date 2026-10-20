import { useCallback, useEffect, useState } from "react";
import { shortLinkFor } from "../../config/env";
import { useToast } from "../../hooks/useToast";
import { formatDateTime, isExpired } from "../../lib/datetime";
import { parseError } from "../../lib/errors";
import { adminService } from "../../services/admin.service";
import type { AdminLink, ListMeta } from "../../services/types";
import { Pagination } from "../links/Pagination";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

const PAGE_SIZE = 20;

type FetchStatus = "loading" | "success" | "error";

interface LinksPanelProps {
  /** Bump when a link is removed so the overview tab refetches too. */
  onChanged(): void;
}

export function LinksPanel({ onChanged }: LinksPanelProps) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminLink[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [removing, setRemoving] = useState<AdminLink | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    adminService
      .listLinks(
        { page, pageSize, search: appliedSearch || undefined },
        controller.signal,
      )
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setMeta(res.meta);
        setStatus("success");
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setError(parseError(err).message ?? "Failed to load links");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, pageSize, appliedSearch, version]);

  function applySearch(event: React.FormEvent) {
    event.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  async function confirmRemove() {
    if (!removing || removeBusy) return;
    setRemoveBusy(true);
    try {
      await adminService.removeLink(removing.id);
      toast.success(`Removed /${removing.shortCode}`);
      const remaining = items.length - 1;
      if (remaining === 0 && page > 1) {
        setPage(page - 1);
      } else {
        reload();
      }
      onChanged();
      setRemoving(null);
    } catch (err) {
      toast.error(parseError(err).message ?? "Could not remove link");
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <section aria-label="All links" className="flex flex-col gap-4">
      <form onSubmit={applySearch} className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by URL or short code…"
          aria-label="Search links"
          className="w-full max-w-sm rounded-md border border-slate-950 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-indigo-600 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {status === "error" && items.length === 0 ? (
        <Banner
          message={error ?? "Failed to load links"}
          onRetry={reload}
          retryLabel="Try again"
        />
      ) : status === "loading" && items.length === 0 ? (
        <div
          aria-busy="true"
          aria-label="Loading links"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
        >
          <div className="divide-y divide-slate-200">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
            <table className="w-full min-w-190 text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Short link
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Original URL
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Owner
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Clicks
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      No links found
                    </td>
                  </tr>
                ) : (
                  items.map((link) => {
                    const expired = isExpired(link.expiresAt);
                    return (
                      <tr
                        key={link.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          expired ? "opacity-60" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <a
                            href={shortLinkFor(link.shortCode)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={shortLinkFor(link.shortCode)}
                            className="font-mono text-xs font-semibold text-indigo-700 underline-offset-2 hover:text-indigo-900 hover:underline"
                          >
                            {link.shortCode}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={link.originalUrl}
                            className="block max-w-64 truncate text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                          >
                            {link.originalUrl}
                          </a>
                        </td>
                        <td className="max-w-40 truncate px-4 py-3 text-slate-600">
                          {link.ownerEmail ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                          {link.clicks}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDateTime(link.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="danger"
                            onClick={() => setRemoving(link)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {meta ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.totalItems}
              hasNext={meta.hasNext}
              disabled={status === "loading"}
              noun="links"
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : null}
        </>
      )}

      {removing ? (
        <Modal
          open
          onClose={() => setRemoving(null)}
          title="Remove link?"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setRemoving(null)}
                disabled={removeBusy}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmRemove}
                loading={removeBusy}
              >
                Remove
              </Button>
            </>
          }
        >
          <div className="text-sm text-slate-600">
            <p>
              <code className="font-mono text-slate-900">
                /{removing.shortCode}
              </code>{" "}
              will stop redirecting immediately. This cannot be undone.
            </p>
            <p className="mt-2 break-all text-slate-500">
              {removing.originalUrl}
            </p>
            <p className="mt-2 text-slate-500">
              Owner: {removing.ownerEmail ?? "unknown"}
            </p>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
