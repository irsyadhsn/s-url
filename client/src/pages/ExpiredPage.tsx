import { Link, useSearchParams } from "react-router-dom";

export function ExpiredPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 ring-1 ring-amber-200">
        <svg
          className="size-7 text-amber-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        This link is no longer available
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        {code ? (
          <>
            The short link{" "}
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-sm font-medium text-slate-900">
              /{code}
            </code>{" "}
            has passed its expiry date, so it stopped redirecting.
          </>
        ) : (
          <>This short link has passed its expiry date, so it stopped redirecting.</>
        )}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition-colors hover:bg-slate-800"
        >
          Back to home
        </Link>
        <Link
          to="/register"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          Create your own links
        </Link>
      </div>
    </div>
  );
}
