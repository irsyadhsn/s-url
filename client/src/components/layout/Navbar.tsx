import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Logo } from "../ui/Logo";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "px-2.5 py-1.5 text-sm font-medium transition-colors",
    isActive ? "text-indigo-700" : "text-slate-500 hover:text-slate-900",
  ].join(" ");
}

/** First letter of the local part — keeps the account chip tiny. */
function initials(email: string): string {
  return email.charAt(0).toUpperCase();
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
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
 * One link group on the left of the account chip — nothing else. The
 * account chip is the single entry point to /account (plan, profile,
 * log out); admins never see Pricing since they can't buy a plan.
 */
export function Navbar() {
  const { status, user } = useAuth();
  const authenticated = status === "authenticated" && user;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          to={authenticated ? "/dashboard" : "/"}
          className="transition-opacity hover:opacity-80"
          aria-label="Surlvibe home"
        >
          <Logo />
        </Link>

        <nav className="flex items-center gap-1">
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

              <Link
                to="/account"
                className="ml-2 flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:pr-3"
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
            </>
          ) : (
            <>
              <NavLink to="/pricing" className={navLinkClass}>
                Pricing
              </NavLink>
              <NavLink to="/login" className={navLinkClass}>
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className="ml-2 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
