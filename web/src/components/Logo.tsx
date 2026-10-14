import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg className={cn("text-foreground", className ?? "h-6 w-6")} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="3" fill="currentColor" />
    </svg>
  );
}
