import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui-kit";

type PageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

export function PageShell({ title, subtitle, rightSlot, children }: PageShellProps) {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 32px) clamp(16px, 4vw, 40px) 80px",
        }}
      >
        {(title || subtitle || rightSlot) && (
          <header
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              {subtitle && <Eyebrow>{subtitle}</Eyebrow>}
              {title && (
                <h1
                  style={{
                    margin: subtitle ? "8px 0 0" : 0,
                    fontSize: "clamp(28px, 4vw, 44px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                  }}
                >
                  {title}
                </h1>
              )}
            </div>
            {rightSlot}
          </header>
        )}
        <section style={{ display: "grid", gap: 20 }}>{children}</section>
      </div>
    </main>
  );
}
