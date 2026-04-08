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
    <main className="relative min-h-screen overflow-x-hidden bg-[#040505] text-[#f4efe8]">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover brightness-[0.38] saturate-[1.08] contrast-110"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="https://images.pexels.com/videos/3129957/free-video-3129957.jpg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1920"
      >
        <source
          src="https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4"
          type="video/mp4"
        />
      </video>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(67,240,193,0.14),transparent_28%),radial-gradient(circle_at_88%_82%,rgba(67,240,193,0.1),transparent_30%),linear-gradient(to_bottom,rgba(4,5,5,0.2),rgba(4,5,5,0.72))]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-black/35 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:rounded-full">
          <div className="inline-flex min-w-0 items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#43f0c1] shadow-[0_0_18px_rgba(67,240,193,0.8)]" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#43f0c1] sm:text-[11px] sm:tracking-[0.3em]">
                Pinecone Delivery
              </p>
              <p className="text-[11px] text-[#f4efe8]/68 sm:text-xs">Сурагчийн захиалга ба төлбөрийн урсгал</p>
            </div>
          </div>

          <div className="self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f4efe8]/72 sm:self-auto sm:text-[11px] sm:tracking-[0.24em]">
            Live Flow
          </div>
        </div>

        {(title || subtitle || rightSlot) && (
          <header className="mb-6 rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#43f0c1]">
                  Order Flow
                </p>
                {title && <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#f4efe8] sm:text-3xl">{title}</h1>}
                {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f4efe8]/72">{subtitle}</p>}
              </div>
              {rightSlot}
            </div>
          </header>
        )}

        <section className={cn("space-y-6", className)}>{children}</section>
      </div>
    </main>
  );
}
