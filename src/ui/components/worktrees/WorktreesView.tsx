import {
  AlertTriangle,
  GitBranch,
  Home,
  Lock,
  Network,
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProjectDetails, WorktreeSnapshot } from "../../../core/domain/types";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { WipBadge } from "../WipBadge";

function leafName(path: string): string {
  return path.replace(/\/+$/u, "").split("/").pop() ?? path;
}

function statusLabel(status: WorktreeSnapshot["status"]) {
  if (status.conflictCount > 0) {
    return { text: `${status.conflictCount} conflict${status.conflictCount === 1 ? "" : "s"}`, tone: "danger" as const };
  }
  if (status.clean) {
    return { text: "Clean", tone: "clean" as const };
  }
  const count = status.changedCount + status.untrackedCount;
  return { text: `${count} uncommitted change${count === 1 ? "" : "s"}`, tone: "modified" as const };
}

function WorktreeRow({
  worktree,
  isMain,
  onOpenPath,
}: {
  worktree: WorktreeSnapshot;
  isMain: boolean;
  onOpenPath: (path: string) => void;
}) {
  const status = statusLabel(worktree.status);

  return (
    <button
      type="button"
      onClick={() => onOpenPath(worktree.path)}
      className="flex w-full items-center gap-4 rounded-md border border-border bg-surface-container px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-container-high text-muted-foreground">
        {isMain ? <Home className="h-4 w-4" /> : <Network className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-ui-reg font-semibold text-foreground">
            {leafName(worktree.path)}
            {isMain ? <span className="ml-1 text-muted-foreground">(Main)</span> : null}
          </span>
          <span className="truncate rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {worktree.path}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          <GitBranch className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-link">{worktree.displayBranch}</span>
          <span aria-hidden className="text-muted-foreground">·</span>
          <span
            className={cn(
              status.tone === "clean" && "text-success-bright",
              status.tone === "modified" && "text-warning-bright",
              status.tone === "danger" && "text-destructive",
            )}
          >
            {status.text}
          </span>
          {worktree.lockedReason ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" /> Locked
            </span>
          ) : null}
          {worktree.prunableReason ? (
            <span className="flex items-center gap-1 text-warning-bright">
              <AlertTriangle className="h-3 w-3" /> Prunable
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function WorktreeBoard({ project }: { project: ProjectDetails }) {
  const openPath = useRepositoryStore((state) => state.openPath);
  const sorted = [...project.worktrees].sort((left, right) => {
    const leftMain = left.path === project.primaryPath ? -1 : 0;
    const rightMain = right.path === project.primaryPath ? -1 : 0;
    return leftMain - rightMain;
  });

  return (
    <div className="space-y-1.5">
      {sorted.map((worktree) => (
        <WorktreeRow
          key={worktree.path}
          worktree={worktree}
          isMain={worktree.path === project.primaryPath}
          onOpenPath={(path) => void openPath(path)}
        />
      ))}
    </div>
  );
}

export function WorktreesView() {
  const project = useRepositoryStore((state) => state.selectedProject);

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-border bg-surface px-8 py-6">
        <div className="max-w-2xl">
          <h1 className="text-xl font-semibold text-foreground">Worktrees</h1>
          <p className="mt-2 text-ui-sm leading-5 text-muted-foreground">
            Git worktrees check out multiple branches of one repository in separate
            directories at once. Ideal for fixing a bug on another branch without
            stashing or committing current work.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            disabled
            className="flex h-9 cursor-not-allowed items-center gap-1.5 rounded-sm border border-border px-3 text-ui-reg text-muted-foreground opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Prune Dead Trees
            <WipBadge />
          </button>
          <button
            disabled
            className="flex h-9 cursor-not-allowed items-center gap-1.5 rounded-sm bg-success/40 px-3 text-ui-reg font-medium text-success-foreground opacity-70"
          >
            <Plus className="h-4 w-4" />
            Add Worktree
            <WipBadge />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {project ? (
          <WorktreeBoard project={project} />
        ) : (
          <div className="rounded-md border border-dashed border-border px-5 py-8 text-ui-sm text-muted-foreground">
            Select a repository to view its worktrees.
          </div>
        )}
      </div>
    </section>
  );
}
