import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { formatDateTime } from "../../lib/datetime";
import { parseError } from "../../lib/errors";
import { adminService } from "../../services/admin.service";
import type { AdminUser, ListMeta } from "../../services/types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Banner } from "../ui/Banner";
import { Pagination } from "../links/Pagination";

const PAGE_SIZE = 20;

interface UsersPanelProps {
  currentUserId: string;
  /** Bump when users change so the overview tab refetches too. */
  onChanged(): void;
}

type FetchStatus = "loading" | "success" | "error";

function RoleBadge({ role }: { role: AdminUser["role"] }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        role === "admin"
          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      ].join(" ")}
    >
      {role}
    </span>
  );
}

function PlanBadge({ plan }: { plan: AdminUser["plan"] }) {
  if (plan === "premium") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-0.5 text-xs font-semibold text-white">
        <svg
          className="size-3"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M11.48 3.5a.6.6 0 0 1 1.04 0l2.3 4.06 4.53.56a.6.6 0 0 1 .34 1.02l-3.35 3.08.9 4.5a.6.6 0 0 1-.87.64L12 15.35l-4.07 2.01a.6.6 0 0 1-.87-.64l.9-4.5-3.35-3.08a.6.6 0 0 1 .34-1.02l4.53-.56 2.3-4.06Z" />
        </svg>
        Premium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
      Free
    </span>
  );
}

export function UsersPanel({ currentUserId, onChanged }: UsersPanelProps) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    adminService
      .listUsers(
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
        setError(parseError(err).message ?? "Failed to load users");
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

  async function toggleRole(user: AdminUser) {
    if (busyUserId) return;
    const nextRole = user.role === "admin" ? "user" : "admin";
    setBusyUserId(user.id);
    try {
      await adminService.updateUserRole(user.id, nextRole);
      toast.success(
        nextRole === "admin"
          ? `${user.email} is now an admin`
          : `${user.email} is now a regular user`,
      );
      reload();
      onChanged();
    } catch (err) {
      toast.error(parseError(err).message ?? "Could not update role");
    } finally {
      setBusyUserId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      await adminService.removeUser(deleting.id);
      toast.success(`Deleted ${deleting.email}`);
      const remaining = items.length - 1;
      if (remaining === 0 && page > 1) {
        setPage(page - 1);
      } else {
        reload();
      }
      onChanged();
      setDeleting(null);
    } catch (err) {
      toast.error(parseError(err).message ?? "Could not delete user");
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <section aria-label="Users" className="flex flex-col gap-4">
      <form onSubmit={applySearch} className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email…"
          aria-label="Search users by email"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {status === "error" && items.length === 0 ? (
        <Banner
          message={error ?? "Failed to load users"}
          onRetry={reload}
          retryLabel="Try again"
        />
      ) : status === "loading" && items.length === 0 ? (
        <div
          aria-busy="true"
          aria-label="Loading users"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
        >
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="h-3 w-48 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Role</th>
                  <th scope="col" className="px-4 py-3">Plan</th>
                  <th scope="col" className="px-4 py-3 text-right">Links</th>
                  <th scope="col" className="px-4 py-3">Joined</th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  items.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const busy = busyUserId === user.id;
                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="max-w-64 truncate px-4 py-3 font-medium text-slate-900">
                          {user.email}
                          {isSelf ? (
                            <span className="ml-2 text-xs font-normal text-slate-400">
                              (you)
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3">
                          <PlanBadge plan={user.plan} />
                          {user.plan === "premium" &&
                          user.planExpiresAt ? (
                            <span className="mt-0.5 block text-xs text-slate-500">
                              until{" "}
                              {new Date(
                                user.planExpiresAt,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {user.linkCount}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              disabled={isSelf || busy}
                              onClick={() => toggleRole(user)}
                            >
                              {user.role === "admin"
                                ? "Demote"
                                : "Make admin"}
                            </Button>
                            <Button
                              variant="danger"
                              disabled={isSelf || busy}
                              onClick={() => setDeleting(user)}
                            >
                              Delete
                            </Button>
                          </div>
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
              noun="users"
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : null}
        </>
      )}

      {deleting ? (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete user?"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeleting(null)}
                disabled={deletingBusy}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                loading={deletingBusy}
              >
                Delete
              </Button>
            </>
          }
        >
          <div className="text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-900">
                {deleting.email}
              </span>{" "}
              and all of their links will be permanently removed. This cannot
              be undone.
            </p>
            <p className="mt-2 text-slate-500">
              {deleting.linkCount}{" "}
              {deleting.linkCount === 1 ? "link" : "links"} will stop
              redirecting immediately.
            </p>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
