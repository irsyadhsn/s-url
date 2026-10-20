import type { ReactNode } from "react";
import { Logo } from "../ui/Logo";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="flex">
        <Logo size="lg" />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-6 text-left">{children}</div>
      </div>
      {footer ? (
        <p className="mt-5 text-sm text-slate-600">{footer}</p>
      ) : null}
    </div>
  );
}
