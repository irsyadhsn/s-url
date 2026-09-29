import { useState } from "react";
import { CreateLinkForm } from "../components/links/CreateLinkForm";
import { DeleteLinkDialog } from "../components/links/DeleteLinkDialog";
import { EditLinkModal } from "../components/links/EditLinkModal";
import {
  LinkTable,
  LinkTableEmpty,
  LinkTableError,
  LinkTableSkeleton,
} from "../components/links/LinkTable";
import { Pagination } from "../components/links/Pagination";
import { LinkStatsModal } from "../components/stats/LinkStatsModal";
import { StatsOverview } from "../components/stats/StatsOverview";
import { useLinks } from "../hooks/useLinks";
import type { Link } from "../services/types";

const PAGE_SIZE = 20;

export function DashboardPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [deletingLink, setDeletingLink] = useState<Link | null>(null);
  const [statsLink, setStatsLink] = useState<Link | null>(null);
  // Bumped on create/delete so stats (totals, chart, top list) refetch too.
  const [statsVersion, setStatsVersion] = useState(0);
  const { status, data, error, reload } = useLinks(page, pageSize);

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    // Row count changed, so the old page number may no longer exist.
    setPage(1);
  }

  function refresh() {
    setStatsVersion((v) => v + 1);
    // New links land on page 1 (list is newest-first); a shrink after
    // delete may need to step back a page instead of reloading an empty one.
    if (page !== 1) {
      setPage(1);
    } else {
      reload();
    }
  }

  function handleDeleted() {
    setStatsVersion((v) => v + 1);
    const remaining = (data?.items.length ?? 1) - 1;
    if (remaining === 0 && page > 1) {
      setPage(page - 1);
    } else {
      reload();
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Your links
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Shorten, track, and manage every link you have created.
        </p>
      </div>

      <StatsOverview
        refreshToken={statsVersion}
        onOpenLinkStats={setStatsLink}
      />

      <CreateLinkForm onCreated={refresh} />

      {status === "loading" && !data ? (
        <LinkTableSkeleton />
      ) : status === "error" ? (
        <LinkTableError message={error ?? "Failed to load links"} onRetry={reload} />
      ) : data && data.items.length === 0 && page === 1 ? (
        <LinkTableEmpty />
      ) : data ? (
        <>
          <div
            aria-busy={status === "loading" || undefined}
            className={`min-w-0 ${status === "loading" ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}`}
          >
            <LinkTable
              links={data.items}
              onEdit={setEditingLink}
              onDelete={setDeletingLink}
              onStats={setStatsLink}
            />
          </div>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            totalItems={data.meta.totalItems}
            hasNext={data.meta.hasNext}
            disabled={status === "loading"}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      ) : null}

      {editingLink ? (
        <EditLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onUpdated={reload}
        />
      ) : null}

      {deletingLink ? (
        <DeleteLinkDialog
          link={deletingLink}
          onClose={() => setDeletingLink(null)}
          onDeleted={handleDeleted}
        />
      ) : null}

      {statsLink ? (
        <LinkStatsModal
          link={statsLink}
          onClose={() => setStatsLink(null)}
        />
      ) : null}
    </div>
  );
}
