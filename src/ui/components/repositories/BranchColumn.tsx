import { Check, ChevronDown, GitBranch, Plus, Search } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  groupBranches,
  type BranchAccent,
  type DecoratedBranch,
} from "../../lib/branchGroups";
import { formatRelativeTime } from "../../lib/time";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { WipBadge } from "../WipBadge";

const ACCENT_DOT: Record<BranchAccent, string> = {
  active: "text-primary",
  worktree: "text-success-bright",
  none: "text-muted-foreground",
};

function BranchRow({
  branch,
  isSelected,
  onSelect,
}: {
  branch: DecoratedBranch;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
        isSelected ? "bg-accent" : "hover:bg-accent/50",
      )}
    >
      {isSelected ? (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-primary" />
      ) : null}

      {branch.checkedOut ? (
        <Check className={cn("h-3.5 w-3.5 shrink-0", ACCENT_DOT[branch.accent])} />
      ) : (
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}

      <div className="min-w-0 flex-1">
        <div
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
        </div>
        {branch.worktreeName ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "mt-0.5 inline-flex max-w-full items-center gap-1 truncate rounded-sm border px-1 py-px font-mono text-[10px]",
                  branch.accent === "active"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-success-bright/30 bg-success-bright/10 text-success-bright",
                )}
              >
                {branch.worktreeName}
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-[11px]">
              {branch.checkedOutPath}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {branch.committerDate ? (
        <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
          {formatRelativeTime(branch.committerDate)}
        </span>
      ) : null}
    </button>
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

  const activeBranch = branches.find(
    (branch) => branch.checkedOut && branch.checkedOutPath === project?.primaryPath,
  );
  const groups = groupBranches(branches, project, branchFilter);

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-surface-container-low">
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
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setBranchTab("branches")}
          className={cn(
            "relative flex-1 px-3 py-2.5 text-ui-reg font-medium transition-colors",
            branchTab === "branches"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Branches
          {branchTab === "branches" ? (
            <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />
          ) : null}
        </button>
        <button
          type="button"
          disabled
          className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 px-3 py-2.5 text-ui-reg font-medium text-muted-foreground opacity-60"
        >
          Pull Requests
          <WipBadge />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            placeholder="Filter"
            className="h-8 w-full rounded-sm border border-input bg-background pl-7 pr-2 text-ui-reg text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          disabled
          title="Work in progress"
          className="flex h-8 cursor-not-allowed items-center gap-1.5 rounded-sm border border-border px-2 text-ui-sm text-muted-foreground opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          New
          <span aria-hidden>🚧</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {groups.length === 0 ? (
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
                  onSelect={() => void selectBranch(branch.name)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
