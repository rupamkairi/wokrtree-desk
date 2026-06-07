import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Home,
  Lock,
  Network,
  Plus,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { WorktreeSnapshot } from "../../../core/domain/types";
import {
  groupBranches,
  type BranchAccent,
  type DecoratedBranch,
} from "../../lib/branchGroups";
import { formatRelativeTime } from "../../lib/time";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { PathContextMenu } from "../PathContextMenu";
import { AddWorktreeModal } from "./AddWorktreeModal";
import { CreateBranchModal } from "./CreateBranchModal";

const ACCENT_DOT: Record<BranchAccent, string> = {
  active: "text-primary",
  worktree: "text-success-bright",
  none: "text-muted-foreground",
};

function leafName(path: string): string {
  return path.replace(/\/+$/u, "").split("/").pop() ?? path;
}

function BranchRow({
  branch,
  isSelected,
  expanded,
  onSelect,
  onToggle,
}: {
  branch: DecoratedBranch;
  isSelected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <PathContextMenu path={branch.checkedOut ? branch.checkedOutPath ?? null : null}>
    <div className={cn("relative", isSelected && "bg-accent")}>
      {isSelected ? (
        <span className="absolute left-0 top-3 h-6 w-0.5 bg-primary" />
      ) : null}
      <div
        className={cn(
          "flex w-full items-center gap-1 px-2 py-2 transition-colors",
          !isSelected && "hover:bg-accent/50",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {branch.checkedOut ? (
            <Check className={cn("h-3.5 w-3.5 shrink-0", ACCENT_DOT[branch.accent])} />
          ) : (
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span
            className={cn(
              "truncate text-ui-reg",
              branch.accent === "active"
                ? "font-medium text-primary"
                : branch.accent === "worktree"
                  ? "font-medium text-success-bright"
                  : "text-foreground",
            )}
          >
            {branch.name}
          </span>
          {branch.committerDate ? (
            <span className="ml-auto shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
              {formatRelativeTime(branch.committerDate)}
            </span>
          ) : null}
        </button>
      </div>

      {expanded ? (
        <div className="space-y-1 px-3 pb-2 pl-8 text-[11px] text-muted-foreground">
          <div className="flex gap-1.5">
            <span className="text-foreground/60">commit</span>
            <span className="font-mono">{branch.sha.slice(0, 10)}</span>
          </div>
          {branch.worktreeName ? (
            <div className="flex gap-1.5">
              <span className="text-foreground/60">worktree</span>
              <span className="truncate font-mono" title={branch.checkedOutPath}>
                {branch.worktreeName}
              </span>
            </div>
          ) : null}
          {branch.isDefault ? (
            <div className="text-link">Default branch</div>
          ) : null}
        </div>
      ) : null}
    </div>
    </PathContextMenu>
  );
}

/** Number of changed files git could see in the worktree (0 when unreadable). */
function changedFileCount(status: WorktreeSnapshot["status"]): number {
  return status.changedCount + status.untrackedCount + status.conflictCount;
}

/** A worktree is dirty when its status is readable and reports changes. */
function isDirty(status: WorktreeSnapshot["status"]): boolean {
  return changedFileCount(status) > 0;
}

function WorktreeBranchSelect({ worktree }: { worktree: WorktreeSnapshot }) {
  const branches = useRepositoryStore((state) => state.branches);
  const switchWorktreeBranch = useRepositoryStore((state) => state.switchWorktreeBranch);
  const detached = worktree.detached || worktree.displayBranch === "detached";
  // A bare/prunable/missing worktree has no working tree to switch — render
  // nothing here (the Prunable/Locked label below is the only status shown).
  const unusable = Boolean(worktree.prunableReason) || worktree.bare;

  if (unusable) {
    return null;
  }

  return (
    <label className="flex items-center gap-1.5">
      <span className="text-foreground/60">branch</span>
      <select
        value={detached ? "" : worktree.displayBranch}
        onChange={(event) => {
          const next = event.target.value;
          if (next && next !== worktree.displayBranch) {
            void switchWorktreeBranch(worktree.path, next);
          }
        }}
        className="min-w-0 flex-1 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground outline-none focus:border-ring"
        onClick={(event) => event.stopPropagation()}
      >
        {detached ? (
          <option value="" disabled>
            detached — pick a branch
          </option>
        ) : null}
        {branches.map((branch) => {
          // git refuses a branch already checked out in another worktree.
          const inUseElsewhere =
            branch.checkedOut && branch.checkedOutPath !== worktree.path;
          return (
            <option key={branch.fullRef} value={branch.name} disabled={inUseElsewhere}>
              {branch.name}
              {inUseElsewhere ? " (in use)" : ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function WorktreeItem({
  worktree,
  isMain,
  expanded,
  onToggle,
}: {
  worktree: WorktreeSnapshot;
  isMain: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const focusedWorktree = useRepositoryStore((state) => state.focusedWorktree);
  const focusWorktree = useRepositoryStore((state) => state.focusWorktree);
  const getWorktreeChangeStats = useRepositoryStore(
    (state) => state.getWorktreeChangeStats,
  );

  const dirty = isDirty(worktree.status);
  const focused = focusedWorktree === worktree.path;

  // File count is known synchronously; +/- line totals are fetched lazily the
  // first time the dot is hovered, then folded into the tooltip text.
  const [statLine, setStatLine] = useState<string | null>(null);
  const fileCount = changedFileCount(worktree.status);
  const baseTitle = `${fileCount} file${fileCount === 1 ? "" : "s"} changed`;

  async function loadStats() {
    if (statLine !== null) {
      return;
    }
    const stats = await getWorktreeChangeStats(worktree.path);
    if (stats) {
      setStatLine(
        `${stats.files} file${stats.files === 1 ? "" : "s"} changed · +${stats.additions} −${stats.deletions}`,
      );
    }
  }

  return (
    <PathContextMenu path={worktree.path}>
    <div className={cn("relative", focused && "bg-accent")}>
      {focused ? <span className="absolute left-0 top-2 h-7 w-0.5 bg-primary" /> : null}
      <div className="flex w-full items-center gap-1 px-2 py-2 hover:bg-accent/50">
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => void focusWorktree(worktree)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {isMain ? (
            <Home className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Network className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-ui-reg font-medium text-foreground">
              {leafName(worktree.path)}
              {isMain ? <span className="ml-1 text-muted-foreground">(Main)</span> : null}
            </div>
            <div className="truncate font-mono text-[11px] text-link">
              {worktree.displayBranch}
            </div>
          </div>
        </button>
        {dirty ? (
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-warning-bright"
            title={statLine ?? baseTitle}
            onMouseEnter={() => void loadStats()}
            aria-label={baseTitle}
          />
        ) : null}
      </div>

      {expanded ? (
        <div className="space-y-1.5 px-3 pb-2 pl-8 text-[11px] text-muted-foreground">
          <div className="break-all font-mono">{worktree.path}</div>
          <WorktreeBranchSelect worktree={worktree} />
          {worktree.lockedReason || worktree.prunableReason ? (
            <div className="flex flex-wrap items-center gap-2">
              {worktree.lockedReason ? (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              ) : null}
              {worktree.prunableReason ? (
                <span className="flex items-center gap-1 text-warning-bright">
                  <AlertTriangle className="h-3 w-3" /> Prunable
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
    </PathContextMenu>
  );
}

export function BranchColumn() {
  const project = useRepositoryStore((state) => state.selectedProject);
  const branches = useRepositoryStore((state) => state.branches);
  const branchFilter = useRepositoryStore((state) => state.branchFilter);
  const setBranchFilter = useRepositoryStore((state) => state.setBranchFilter);
  const selectedBranch = useRepositoryStore((state) => state.selectedBranch);
  const selectBranch = useRepositoryStore((state) => state.selectBranch);
  const branchTab = useRepositoryStore((state) => state.branchTab);
  const setBranchTab = useRepositoryStore((state) => state.setBranchTab);

  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [expandedWorktrees, setExpandedWorktrees] = useState<Set<string>>(new Set());
  const [createBranchOpen, setCreateBranchOpen] = useState(false);
  const [addWorktreeOpen, setAddWorktreeOpen] = useState(false);

  const activeBranch = branches.find(
    (branch) => branch.checkedOut && branch.checkedOutPath === project?.primaryPath,
  );
  const groups = groupBranches(branches, project, branchFilter);

  const normalizedFilter = branchFilter.trim().toLowerCase();
  const worktrees = [...(project?.worktrees ?? [])]
    .filter((worktree) =>
      normalizedFilter
        ? leafName(worktree.path).toLowerCase().includes(normalizedFilter) ||
          worktree.displayBranch.toLowerCase().includes(normalizedFilter)
        : true,
    )
    .sort((left, right) => {
      const leftMain = left.path === project?.primaryPath ? -1 : 0;
      const rightMain = right.path === project?.primaryPath ? -1 : 0;
      return leftMain - rightMain;
    });

  function toggle(set: Set<string>, key: string): Set<string> {
    const next = new Set(set);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    return next;
  }

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col border-r border-border bg-surface-container-low">
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Current Branch
          </div>
          <div className="truncate text-ui-reg font-medium text-foreground">
            {activeBranch?.name ?? "—"}
          </div>
        </div>
      </div>

      <div className="flex border-b border-border">
        {(
          [
            { id: "branches", label: "Branches" },
            { id: "worktrees", label: "Worktrees" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setBranchTab(tab.id)}
            className={cn(
              "relative flex-1 px-3 py-2.5 text-ui-reg font-medium transition-colors",
              branchTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {branchTab === tab.id ? (
              <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            placeholder="Find"
            className="h-8 w-full rounded-sm border border-input bg-background pl-7 pr-2 text-ui-reg text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            branchTab === "branches"
              ? setCreateBranchOpen(true)
              : setAddWorktreeOpen(true)
          }
          className="flex h-8 items-center gap-1.5 rounded-sm border border-border px-2 text-ui-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Create
        </button>
      </div>

      <div className="wtd-scroll min-h-0 flex-1 py-1">
        {branchTab === "branches" ? (
          groups.length === 0 ? (
            <div className="px-3 py-6 text-ui-sm text-muted-foreground">
              No branches match the filter.
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.key} className="pb-1">
                <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </div>
                {group.branches.map((branch) => (
                  <BranchRow
                    key={branch.fullRef}
                    branch={branch}
                    isSelected={branch.name === selectedBranch}
                    expanded={expandedBranches.has(branch.fullRef)}
                    onSelect={() => void selectBranch(branch.name)}
                    onToggle={() =>
                      setExpandedBranches((prev) => toggle(prev, branch.fullRef))
                    }
                  />
                ))}
              </div>
            ))
          )
        ) : worktrees.length === 0 ? (
          <div className="px-3 py-6 text-ui-sm text-muted-foreground">
            No worktrees match the filter.
          </div>
        ) : (
          worktrees.map((worktree) => (
            <WorktreeItem
              key={worktree.path}
              worktree={worktree}
              isMain={worktree.path === project?.primaryPath}
              expanded={expandedWorktrees.has(worktree.path)}
              onToggle={() =>
                setExpandedWorktrees((prev) => toggle(prev, worktree.path))
              }
            />
          ))
        )}
      </div>

      <CreateBranchModal open={createBranchOpen} onOpenChange={setCreateBranchOpen} />
      <AddWorktreeModal open={addWorktreeOpen} onOpenChange={setAddWorktreeOpen} />
    </div>
  );
}
