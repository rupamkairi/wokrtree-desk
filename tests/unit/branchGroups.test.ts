import { describe, expect, it } from "vitest";

import type { BranchRef, ProjectDetails } from "../../src/core/domain/types";
import {
  decorateBranch,
  groupBranches,
} from "../../src/ui/lib/branchGroups";

const PROJECT = {
  id: "/repo/.git",
  displayName: "repo",
  selectedPath: "/repo",
  primaryPath: "/repo",
  commonGitDir: "/repo/.git",
  defaults: {
    worktreeRoot: "/repo-worktrees",
    preferredEditor: "cursor",
    preferredTerminal: "terminal",
  },
  worktrees: [],
} satisfies ProjectDetails;

function branch(overrides: Partial<BranchRef> & { name: string }): BranchRef {
  return {
    fullRef: `refs/heads/${overrides.name}`,
    sha: "0".repeat(40),
    checkedOut: false,
    isDefault: false,
    ...overrides,
  };
}

describe("decorateBranch", () => {
  it("marks the branch checked out in the primary path as active", () => {
    const result = decorateBranch(
      branch({ name: "main", checkedOut: true, checkedOutPath: "/repo" }),
      PROJECT,
    );
    expect(result.accent).toBe("active");
    expect(result.worktreeName).toBe("repo");
  });

  it("marks a branch checked out in a linked worktree as worktree", () => {
    const result = decorateBranch(
      branch({
        name: "feature/x",
        checkedOut: true,
        checkedOutPath: "/repo-worktrees/repo-feature-x",
      }),
      PROJECT,
    );
    expect(result.accent).toBe("worktree");
    expect(result.worktreeName).toBe("repo-feature-x");
  });

  it("leaves a branch with no worktree unaccented", () => {
    const result = decorateBranch(branch({ name: "old/topic" }), PROJECT);
    expect(result.accent).toBe("none");
    expect(result.worktreeName).toBeUndefined();
  });
});

describe("groupBranches", () => {
  it("splits into Default, Recent (first 6 non-default), then Other", () => {
    const branches = [
      branch({ name: "develop", isDefault: true }),
      ...Array.from({ length: 8 }, (_unused, index) =>
        branch({ name: `feature/${index}` }),
      ),
    ];

    const groups = groupBranches(branches, PROJECT, "");

    expect(groups.map((group) => group.key)).toEqual([
      "default",
      "recent",
      "other",
    ]);
    expect(groups[0].branches.map((b) => b.name)).toEqual(["develop"]);
    expect(groups[1].branches).toHaveLength(6);
    expect(groups[2].branches).toHaveLength(2);
  });

  it("omits empty groups", () => {
    const groups = groupBranches(
      [branch({ name: "main", isDefault: true })],
      PROJECT,
      "",
    );
    expect(groups.map((group) => group.key)).toEqual(["default"]);
  });

  it("filters by case-insensitive name substring", () => {
    const branches = [
      branch({ name: "main", isDefault: true }),
      branch({ name: "feature/login" }),
      branch({ name: "fix/logout" }),
    ];

    const groups = groupBranches(branches, PROJECT, "LOG");
    const names = groups.flatMap((group) => group.branches.map((b) => b.name));
    expect(names).toEqual(expect.arrayContaining(["feature/login", "fix/logout"]));
    expect(names).not.toContain("main");
  });
});
