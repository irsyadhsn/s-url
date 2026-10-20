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
