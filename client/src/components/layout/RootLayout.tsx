import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

/** Shell for every route: sticky navbar + page content. */
export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
