import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FullScreenSpinner } from "../ui/Spinner";
import { useAuth } from "../../hooks/useAuth";

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
