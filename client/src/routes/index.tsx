import { createBrowserRouter } from "react-router-dom";
import {
  AdminRoute,
  GuestRoute,
  ProtectedRoute,
} from "../components/auth/guards";
import { RootLayout } from "../components/layout/RootLayout";
import { AccountPage } from "../pages/AccountPage";
import { AdminPage } from "../pages/AdminPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ExpiredPage } from "../pages/ExpiredPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PricingPage } from "../pages/PricingPage";
import { RegisterPage } from "../pages/RegisterPage";

/**
 * Route map
 *
 *   /            public   landing
 *   /pricing     public   free vs premium plans
 *   /expired     public   friendly page for expired short links (302 target)
 *   /login       guest    (authed users bounce to /dashboard)
 *   /register    guest    (authed users bounce to /dashboard)
 *   /dashboard   protected
 *   /checkout    protected simulated payment for premium
 *   /account     protected plan status + payment history
 *   /admin       admin    user management, link moderation, system stats
 *   *            public   404
 *
 * GuestRoute / ProtectedRoute / AdminRoute live in components/auth/guards.tsx.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "expired", element: <ExpiredPage /> },
      {
        element: <GuestRoute />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "account", element: <AccountPage /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [{ path: "admin", element: <AdminPage /> }],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
