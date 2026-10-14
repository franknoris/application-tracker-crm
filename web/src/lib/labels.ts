import type { Channel, Stage } from "@/types";

export const STAGE_COLORS: Record<Stage, string> = {
  researching: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  contacted: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  applying: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  submitted: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  interview: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  offer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  withdrawn: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export const STAGE_LABELS: Record<Stage, string> = {
  researching: "Researching",
  contacted: "Contacted",
  applying: "Applying",
  submitted: "Submitted",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STAGE_HEX: Record<Stage, string> = {
  researching: "#64748b",
  contacted: "#0ea5e9",
  applying: "#f59e0b",
  submitted: "#6366f1",
  interview: "#06b6d4",
  offer: "#22c55e",
  rejected: "#f43f5e",
  withdrawn: "#94a3b8",
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  none: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export const CHANNEL_COLORS: Record<Channel, string> = {
  email: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  portal: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  whatsapp: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  call: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  meeting: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  other: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export const ORG_TYPES = ["company", "institute", "university", "other"] as const;

export const TIMEZONES = [
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;
