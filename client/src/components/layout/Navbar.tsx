import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Logo } from "../ui/Logo";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

/** Ghost pill nav item — transparent at rest, soft tint when active (Dub). */
function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${FOCUS}`,
    isActive
      ? "bg-indigo-100 text-slate-900"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

/** Outlined nav button (Dub) — the quiet "I'm here" variant. */
const outlinedBtn = `rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 ${FOCUS}`;

/** Filled dark CTA (Dub) — the committed action, once per surface. */
const filledBtn = `rounded-lg bg-slate-950 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 ${FOCUS}`;

/** First letter of the local part — keeps the account chip tiny. */
function initials(email: string): string {
  return email.charAt(0).toUpperCase();
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
      <svg
        className="size-2.5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M11.48 3.5a.6.6 0 0 1 1.04 0l2.3 4.06 4.53.56a.6.6 0 0 1 .34 1.02l-3.35 3.08.9 4.5a.6.6 0 0 1-.87.64L12 15.35l-4.07 2.01a.6.6 0 0 1-.87-.64l.9-4.5-3.35-3.08a.6.6 0 0 1 .34-1.02l4.53-.56 2.3-4.06Z" />
      </svg>
      PRO
    </span>
  );
}

/**
 * Three zones per DESIGN.md: logo left, nav center (sm+), action cluster
 * right. On small screens the nav flows right via ml-auto — two links don't
 * justify a hamburger. Admins never see Pricing (they can't buy a plan).
 */
export function Navbar() {
  const { status, user } = useAuth();
  const authenticated = status === "authenticated" && user;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to={authenticated ? "/dashboard" : "/"}
          className={`transition-opacity hover:opacity-80 ${FOCUS}`}
          aria-label="Surlvibe home"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Main"
          className="ml-auto flex items-center gap-1 sm:absolute sm:left-1/2 sm:ml-0 sm:-translate-x-1/2"
        >
          {authenticated ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              {user.role !== "admin" ? (
                <NavLink to="/pricing" className={navLinkClass}>
                  Pricing
                </NavLink>
              ) : null}
              {user.role === "admin" ? (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              ) : null}
            </>
          ) : (
            <NavLink to="/pricing" className={navLinkClass}>
              Pricing
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {authenticated ? (
            <Link
              to="/account"
              className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:pr-3 ${FOCUS}`}
              title={`${user.email} — profile, plan & log out`}
            >
              <span className="grid size-6 place-items-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                {initials(user.email)}
              </span>
              <span className="hidden max-w-40 truncate text-xs font-medium text-slate-700 sm:block">
                {user.email}
              </span>
              {user.plan === "premium" ? <ProBadge /> : null}
            </Link>
          ) : (
            <>
              <NavLink to="/login" className={outlinedBtn}>
                Log in
              </NavLink>
              <NavLink to="/register" className={filledBtn}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
