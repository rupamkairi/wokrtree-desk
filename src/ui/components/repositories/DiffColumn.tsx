import { FileDiff } from "lucide-react";

import { WipBadge } from "../WipBadge";

export function DiffColumn() {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-surface-container-high">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="text-ui-reg font-medium text-muted-foreground">Diff</span>
        <WipBadge />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface-container">
          <FileDiff className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="max-w-sm space-y-1">
          <div className="flex items-center justify-center gap-2 text-ui-bold font-semibold text-foreground">
            Diff viewer
            <WipBadge />
          </div>
          <p className="text-ui-sm leading-5 text-muted-foreground">
            Per-commit file diffs with line-level changes are under development.
            Commit selection is disabled until this lands.
          </p>
        </div>
      </div>
    </div>
  );
}
