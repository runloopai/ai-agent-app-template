"use client";

import type { SessionStatus } from "@/types/session";

interface SessionStatusProps {
  status: SessionStatus;
}

const STATUS_STYLES: Record<
  SessionStatus,
  { label: string; color: string; bg: string }
> = {
  provisioning: {
    label: "Provisioning",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  running: {
    label: "Running",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
  },
  shutdown: {
    label: "Shutdown",
    color: "text-neutral-700",
    bg: "bg-neutral-100",
  },
  error: {
    label: "Error",
    color: "text-red-700",
    bg: "bg-red-100",
  },
};

export function SessionStatus({ status }: SessionStatusProps) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.color}`}
    >
      <span className="h-2 w-2 rounded-full border border-white/70 bg-current shadow-sm" />
      {style.label}
    </span>
  );
}
