import { describe, expect, it } from "vitest";
import path from "node:path";

import { switchWorktreeBranch } from "../../src/core/git/services/gitWorktreeMutationService";
import { loadProjectDetails } from "../../src/core/git/services/gitWorktreeService";
import { createRepositoryFixture, NodeCommandRunner } from "./gitHelpers";

function normalizeSystemPath(value: string) {
  return path.resolve(value).replace(/^\/private(\/(?:tmp|var)\/)/u, "$1");
}

describe("switch worktree branch flows", () => {
  it("switches a worktree to a branch not checked out elsewhere", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    const result = await switchWorktreeBranch(
      runner,
      fixture.featureWorktreePath,
      "develop",
      { cwd: fixture.repoPath },
    );

    expect(result.operation.success).toBe(true);

    const { project } = await loadProjectDetails(runner, fixture.repoPath, {
      worktreeRoot: fixture.worktreeRoot,
      preferredEditor: "cursor",
      preferredTerminal: "terminal",
    });
    const switched = project.worktrees.find(
      (worktree) =>
        normalizeSystemPath(worktree.path) ===
        normalizeSystemPath(fixture.featureWorktreePath),
    );
    expect(switched?.displayBranch).toBe("develop");
  });

  it("refuses to switch to a branch already checked out in another worktree", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    // `main` is checked out in the primary worktree; git must refuse it here.
    await expect(
      switchWorktreeBranch(runner, fixture.featureWorktreePath, "main", {
        cwd: fixture.repoPath,
      }),
    ).rejects.toThrow(/Unable to switch worktree to main/u);
  });
});
