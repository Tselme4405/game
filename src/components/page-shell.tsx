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
        {(title || subtitle || rightSlot) && (
          <header className="mb-6 rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold tracking-tight text-[#f4efe8] sm:text-3xl">{title}</h1>}
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
