import type { BranchRef, ProjectDetails } from "../../core/domain/types";

export type BranchAccent = "active" | "worktree" | "none";

export type DecoratedBranch = BranchRef & {
  accent: BranchAccent;
  worktreeName?: string;
};

export type BranchGroup = {
  key: "default" | "recent" | "other";
  label: string;
  branches: DecoratedBranch[];
};

const RECENT_COUNT = 6;

function leafName(path: string): string {
  return path.replace(/\/+$/u, "").split("/").pop() ?? path;
}

export function decorateBranch(
  branch: BranchRef,
  project: ProjectDetails | null,
): DecoratedBranch {
  const isActive =
    branch.checkedOut && branch.checkedOutPath === project?.primaryPath;
  const accent: BranchAccent = isActive
    ? "active"
    : branch.checkedOut
      ? "worktree"
      : "none";

  return {
    ...branch,
    accent,
    worktreeName: branch.checkedOutPath ? leafName(branch.checkedOutPath) : undefined,
  };
}

export function groupBranches(
  branches: BranchRef[],
  project: ProjectDetails | null,
  filter: string,
): BranchGroup[] {
  const normalized = filter.trim().toLowerCase();
  const decorated = branches
    .filter((branch) =>
      normalized ? branch.name.toLowerCase().includes(normalized) : true,
    )
    .map((branch) => decorateBranch(branch, project));

  const defaults = decorated.filter((branch) => branch.isDefault);
  const rest = decorated.filter((branch) => !branch.isDefault);
  const recent = rest.slice(0, RECENT_COUNT);
  const other = rest.slice(RECENT_COUNT);

  const groups: BranchGroup[] = [];
  if (defaults.length > 0) {
    groups.push({ key: "default", label: "Default Branch", branches: defaults });
  }
  if (recent.length > 0) {
    groups.push({ key: "recent", label: "Recent Branches", branches: recent });
  }
  if (other.length > 0) {
    groups.push({ key: "other", label: "Other Branches", branches: other });
  }

  return groups;
}
