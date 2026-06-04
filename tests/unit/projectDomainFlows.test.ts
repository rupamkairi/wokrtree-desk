import { describe, expect, it } from "vitest";

import { upsertProjectInList } from "../../src/core/domain/projectRegistryState";
import { toProjectSummary } from "../../src/core/domain/projectSummary";
import type { ProjectDetails } from "../../src/core/domain/types";
import { previewCreateWorktree } from "../../src/core/git/services/gitWorktreePreviewService";

const projectDefaults = {
  worktreeRoot: "/tmp/example-worktrees",
  preferredEditor: "cursor",
  preferredTerminal: "terminal",
} as const;

const baseProject: ProjectDetails = {
  id: "gitdir-1",
  displayName: "repo",
  selectedPath: "/repo",
  primaryPath: "/repo",
  commonGitDir: "/repo/.git",
  defaults: projectDefaults,
  worktrees: [
    {
      path: "/repo",
      displayBranch: "main",
      branchRef: "refs/heads/main",
      detached: false,
      bare: false,
      status: {
        branch: "main",
        upstream: "origin/main",
        ahead: 0,
        behind: 0,
        changedCount: 0,
        untrackedCount: 0,
        conflictCount: 0,
        clean: true,
        detached: false,
      },
    },
    {
      path: "/repo-feature",
      displayBranch: "feature/existing",
      branchRef: "refs/heads/feature/existing",
      detached: false,
      bare: false,
      lockedReason: "manual lock",
      status: {
        branch: "feature/existing",
        ahead: 0,
        behind: 0,
        changedCount: 1,
        untrackedCount: 0,
        conflictCount: 0,
        clean: false,
        detached: false,
      },
    },
  ],
};

describe("project domain helpers", () => {
  it("deduplicates projects by common git dir", () => {
    const duplicateProject = {
      ...baseProject,
      selectedPath: "/repo-feature",
    };

    expect(upsertProjectInList([baseProject], duplicateProject)).toEqual([
      duplicateProject,
    ]);
  });

  it("summarizes project counts for sidebar display", () => {
    expect(toProjectSummary(baseProject)).toMatchObject({
      id: "gitdir-1",
      worktreeCount: 2,
      modifiedWorktreeCount: 1,
      attentionCount: 1,
    });
  });

  it("warns when previewing a branch already checked out by another worktree", async () => {
    const preview = await previewCreateWorktree(baseProject, {
      projectId: baseProject.id,
      branchMode: "existing",
      branchName: "feature/existing",
      targetPath: "/tmp/example-worktrees/feature-existing-copy",
    });

    expect(preview.canCreate).toBe(false);
    expect(preview.branchAlreadyCheckedOut).toBe(true);
    expect(preview.checkedOutPath).toBe("/repo-feature");
  });
});
