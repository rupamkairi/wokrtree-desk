import { describe, expect, it } from "vitest";

import { createBranch } from "../../src/core/git/services/gitBranchMutationService";
import { listBranchRefs } from "../../src/core/git/services/gitBranchService";
import { loadProjectDetails } from "../../src/core/git/services/gitWorktreeService";
import { createRepositoryFixture, NodeCommandRunner } from "./gitHelpers";

const defaults = {
  preferredEditor: "cursor" as const,
  preferredTerminal: "terminal" as const,
};

describe("branch creation flows", () => {
  it("creates a new branch from a base ref without switching", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();
    const project = (
      await loadProjectDetails(runner, fixture.repoPath, {
        ...defaults,
        worktreeRoot: fixture.worktreeRoot,
      })
    ).project;

    const result = await createBranch(runner, project, {
      projectId: project.id,
      branchName: "feature/new-thing",
      baseRef: "main",
      checkout: false,
    });

    expect(result.branchName).toBe("feature/new-thing");
    expect(result.operation.success).toBe(true);

    const branches = await listBranchRefs(runner, project);
    const created = branches.find((branch) => branch.name === "feature/new-thing");
    expect(created).toBeDefined();
    // Without checkout, the main worktree stays on main.
    const main = branches.find((branch) => branch.name === "main");
    expect(main?.checkedOut).toBe(true);
  });

  it("creates and checks out a new branch when requested", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();
    const project = (
      await loadProjectDetails(runner, fixture.repoPath, {
        ...defaults,
        worktreeRoot: fixture.worktreeRoot,
      })
    ).project;

    await createBranch(runner, project, {
      projectId: project.id,
      branchName: "feature/switch-here",
      baseRef: "develop",
      checkout: true,
    });

    const head = await runner.run("git", ["symbolic-ref", "--short", "HEAD"], {
      cwd: project.primaryPath,
    });
    expect(head.stdout.trim()).toBe("feature/switch-here");
  });

  it("fails when the branch already exists", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();
    const project = (
      await loadProjectDetails(runner, fixture.repoPath, {
        ...defaults,
        worktreeRoot: fixture.worktreeRoot,
      })
    ).project;

    await expect(
      createBranch(runner, project, {
        projectId: project.id,
        branchName: "develop",
        baseRef: "main",
        checkout: false,
      }),
    ).rejects.toThrow();
  });
});
