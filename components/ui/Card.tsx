import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  accent?: "emerald" | "amber" | "red" | "sky" | "slate";
};

export function Card({
  title,
  description,
  children,
  accent = "slate",
}: CardProps) {
  const accentClass =
    accent === "emerald"
      ? "border-emerald-500/60"
      : accent === "amber"
        ? "border-amber-500/60"
        : accent === "red"
          ? "border-red-500/60"
          : accent === "sky"
            ? "border-sky-500/60"
            : "border-slate-800/80";

  return (
    <section className={`card-surface border ${accentClass} p-4`}>
      {(title || description) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-slate-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-400">{description}</p>
            )}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}

