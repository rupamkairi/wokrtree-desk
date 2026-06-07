import { cn } from "@/lib/utils";

/**
 * Renders +additions / -deletions in green/red. Hidden entirely when both
 * counts are unknown. Binary files show a "bin" marker instead.
 */
export function ChangeStat({
  additions,
  deletions,
  binary,
  className,
}: {
  additions?: number;
  deletions?: number;
  binary?: boolean;
  className?: string;
}) {
  if (binary) {
    return <span className={cn("font-mono text-[11px] text-muted-foreground", className)}>bin</span>;
  }
  if (additions === undefined && deletions === undefined) {
    return null;
  }
  return (
    <span className={cn("flex items-center gap-1.5 font-mono text-[11px]", className)}>
      <span className="text-success-bright">+{additions ?? 0}</span>
      <span className="text-destructive">−{deletions ?? 0}</span>
    </span>
  );
}
