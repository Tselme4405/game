"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

type IconName =
  | "user"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "plus"
  | "minus"
  | "check"
  | "x"
  | "bag"
  | "qr"
  | "clock"
  | "calendar"
  | "sparkle"
  | "arrow-right"
  | "settings"
  | "truck"
  | "flame";

export function Icon({ name, size = 20, stroke = 2 }: { name: IconName; size?: number; stroke?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "user":
      return (
        <svg {...common}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...common}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "minus":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "qr":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h3v3h-3zM20 14v7M14 20h3" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-5-2 2-3 4-3 7a6 6 0 0 0 12 0c0-5-6-10-6-10Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function Eyebrow({ children, color = "var(--accent)" }: { children: ReactNode; color?: string }) {
  return (
    <p
      style={{
        margin: 0,
        color,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

type StatusTone = "pending" | "approved" | "rejected" | "neutral";

export function StatusDot({ tone = "neutral", label }: { tone?: StatusTone; label: ReactNode }) {
  const tones: Record<StatusTone, { bg: string; fg: string; dot: string }> = {
    pending: { bg: "#FFF3D1", fg: "#8A6200", dot: "#E8A00B" },
    approved: { bg: "#D9F3DF", fg: "#0E5132", dot: "#1C9A50" },
    rejected: { bg: "#FBDBD3", fg: "#8A2E1E", dot: "#D94A2B" },
    neutral: { bg: "var(--surface-2)", fg: "var(--muted)", dot: "var(--muted)" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dot }} />
      {label}
    </span>
  );
}

export function FoodImage({
  src,
  alt,
  tone = "warm",
  aspect = "square",
  className,
}: {
  src?: string;
  alt?: string;
  tone?: "warm" | "mint" | "berry" | "neutral";
  aspect?: "square" | "wide" | "tall";
  className?: string;
}) {
  const tones: Record<string, { bg: string; stripe: string }> = {
    warm: { bg: "#f3e3c8", stripe: "#e6ceaa" },
    mint: { bg: "#d7ece0", stripe: "#c1ddd0" },
    berry: { bg: "#f1dce7", stripe: "#e6c8d6" },
    neutral: { bg: "#e9e4dc", stripe: "#d5cec3" },
  };
  const t = tones[tone] ?? tones.warm;
  const ratio = aspect === "wide" ? "16 / 9" : aspect === "tall" ? "3 / 4" : "1 / 1";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: ratio,
        overflow: "hidden",
        borderRadius: "inherit",
        background: src
          ? "#000"
          : `repeating-linear-gradient(135deg, ${t.bg} 0 12px, ${t.stripe} 12px 24px)`,
      }}
    >
      {src && (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
      )}
    </div>
  );
}

export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  if (value === 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        style={{
          background: "var(--text)",
          color: "var(--bg)",
          border: "none",
          borderRadius: 999,
          height: 36,
          padding: "0 16px",
          fontSize: 13,
          fontWeight: 800,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
        }}
      >
        <Icon name="plus" size={14} /> Нэмэх
      </button>
    );
  }
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "var(--surface-2)",
        padding: 4,
        borderRadius: 999,
        border: "1px solid var(--border)",
      }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          border: "none",
          background: "var(--surface)",
          color: "var(--text)",
          cursor: value > min ? "pointer" : "not-allowed",
          display: "grid",
          placeItems: "center",
        }}
        aria-label="Багасгах"
      >
        <Icon name="minus" size={14} />
      </button>
      <span
        style={{
          minWidth: 24,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          border: "none",
          background: "var(--accent)",
          color: "var(--on-accent)",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
        }}
        aria-label="Нэмэх"
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}

export function Card({
  children,
  padding = 20,
  radius = 24,
  style,
  accent,
}: {
  children: ReactNode;
  padding?: number;
  radius?: number;
  style?: CSSProperties;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${accent ? "var(--accent)" : "var(--border)"}`,
        borderRadius: radius,
        padding,
        boxShadow: "0 2px 0 rgba(0,0,0,0.02), 0 12px 32px rgba(40,28,12,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function formatMoney(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)}₮`;
}

export function getDeliveryInfo() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(13, 0, 0, 0);
  const tomorrow = now >= cutoff;
  return {
    tomorrow,
    when: tomorrow ? "Маргааш" : "Өнөөдөр",
    timeLabel: "13:15",
  };
}
