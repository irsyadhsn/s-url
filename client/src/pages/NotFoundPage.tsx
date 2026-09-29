import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogoMark } from "../components/ui/Logo";

export function NotFoundPage() {
  const { status } = useAuth();
  const authed = status === "authenticated";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
      <LogoMark size="lg" />
      <p className="mt-6 text-sm font-semibold tracking-widest text-indigo-600 uppercase">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
        >
          Back to home
        </Link>
        <Link
          to={authed ? "/dashboard" : "/register"}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          {authed ? "Dashboard" : "Get started"}
        </Link>
      </div>
    </div>
  );
}
