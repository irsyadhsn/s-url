import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FullScreenSpinner } from "../ui/Spinner";
import { useAuth } from "../../hooks/useAuth";

/**
 * Wraps authenticated routes. While the session is restoring we show a
 * loading screen (no flash of the login page). Anonymous users are sent
 * to /login with the attempted location in router state so we can
 * redirect back after login.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullScreenSpinner label="Restoring session" />;
  }

  if (status === "anonymous") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}

/**
 * Inverse guard for /login and /register: authenticated users are bounced
 * to their intended destination (or the dashboard).
 */
export function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (status === "loading") {
    return <FullScreenSpinner label="Restoring session" />;
  }

  if (status === "authenticated") {
    return <Navigate to={from ?? "/dashboard"} replace />;
  }

  return <Outlet />;
}

/**
 * Admin-only guard: anonymous users go to /login (with return path),
 * authenticated non-admins are sent back to the dashboard.
 */
export function AdminRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullScreenSpinner label="Restoring session" />;
  }

  if (status === "anonymous") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
