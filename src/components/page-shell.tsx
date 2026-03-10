import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({
  title,
  subtitle,
  rightSlot,
  children,
  className,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {(title || subtitle || rightSlot) && (
          <header className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
              </div>
              {rightSlot}
            </div>
          </header>
        )}

        <section className={cn("space-y-4", className)}>{children}</section>
      </div>
    </main>
  );
}
