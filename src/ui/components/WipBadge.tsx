import { cn } from "@/lib/utils";

/**
 * Marks an under-development (Work In Progress) feature.
 * 🚧 is the project-wide symbol for not-yet-functional UI.
 */
export function WipBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-warning/40 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-warning-bright",
        className,
      )}
      title="Work in progress — not yet functional"
    >
      🚧 WIP
    </span>
  );
}
