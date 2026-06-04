import type { ProjectDetails, ProjectSummary, WorktreeSnapshot } from "./types";

function requiresAttention(worktree: WorktreeSnapshot): boolean {
  return Boolean(
    worktree.lockedReason ||
      worktree.prunableReason ||
      worktree.status.conflictCount > 0 ||
      worktree.status.untrackedCount > 0,
  );
}

export function toProjectSummary(project: ProjectDetails): ProjectSummary {
  return {
    id: project.id,
    displayName: project.displayName,
    primaryPath: project.primaryPath,
    worktreeCount: project.worktrees.length,
    modifiedWorktreeCount: project.worktrees.filter(
      (worktree) => !worktree.status.clean,
    ).length,
    attentionCount: project.worktrees.filter(requiresAttention).length,
    defaults: project.defaults,
  };
}
