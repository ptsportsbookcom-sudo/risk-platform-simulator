import type { ReactNode } from "react";

type BadgeProps = {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
  children: ReactNode;
};

export function Badge({ variant = "default", children }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

  const styles =
    variant === "success"
      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
      : variant === "warning"
        ? "bg-amber-500/10 text-amber-300 border border-amber-500/40"
        : variant === "danger"
          ? "bg-red-500/10 text-red-300 border border-red-500/40"
          : variant === "outline"
            ? "border border-slate-500/50 text-slate-200"
            : "bg-slate-800 text-slate-100";

  return <span className={`${base} ${styles}`}>{children}</span>;
}

