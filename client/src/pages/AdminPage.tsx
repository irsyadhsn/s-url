import { useState } from "react";
import { LinksPanel } from "../components/admin/LinksPanel";
import { OverviewPanel } from "../components/admin/OverviewPanel";
import { UsersPanel } from "../components/admin/UsersPanel";
import { useAuth } from "../hooks/useAuth";

type AdminTab = "overview" | "users" | "links";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "links", label: "Links" },
];

export function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  // Bumped on user/link mutations so the overview refetches when revisited.
  const [refreshToken, setRefreshToken] = useState(0);

  function handleChanged() {
    setRefreshToken((v) => v + 1);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage users, moderate links, and monitor system-wide activity.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Admin sections"
        className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <OverviewPanel refreshToken={refreshToken} />
      ) : tab === "users" ? (
        <UsersPanel
          currentUserId={user?.id ?? ""}
          onChanged={handleChanged}
        />
      ) : (
        <LinksPanel onChanged={handleChanged} />
      )}
    </div>
  );
}
