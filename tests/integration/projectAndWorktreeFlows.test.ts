import { describe, expect, it } from "vitest";
import path from "node:path";

import { listBranchRefs } from "../../src/core/git/services/gitBranchService";
import { createWorktree } from "../../src/core/git/services/gitWorktreeMutationService";
import { previewCreateWorktree } from "../../src/core/git/services/gitWorktreePreviewService";
import { loadProjectDetails } from "../../src/core/git/services/gitWorktreeService";
import { createRepositoryFixture, NodeCommandRunner } from "./gitHelpers";

function normalizeSystemPath(value: string) {
  return path.resolve(value).replace(/^\/private\/var\//u, "/var/");
}

describe("project and worktree flows", () => {
  it("loads project details from a main checkout and linked worktree", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    const defaults = {
      worktreeRoot: fixture.worktreeRoot,
      preferredEditor: "cursor" as const,
      preferredTerminal: "terminal" as const,
    };

    const fromMain = await loadProjectDetails(runner, fixture.repoPath, defaults);
    const fromWorktree = await loadProjectDetails(
      runner,
      fixture.featureWorktreePath,
      defaults,
    );

    expect(normalizeSystemPath(fromMain.project.commonGitDir)).toBe(
      normalizeSystemPath(fromWorktree.project.commonGitDir),
    );
    expect(fromMain.project.worktrees).toHaveLength(2);
  });

  it("lists local branches and marks checked-out worktree branches", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    const project = (
      await loadProjectDetails(runner, fixture.repoPath, {
        worktreeRoot: fixture.worktreeRoot,
        preferredEditor: "cursor",
        preferredTerminal: "terminal",
      })
    ).project;
    const branches = await listBranchRefs(runner, project);

    expect(branches.map((branch) => branch.name)).toEqual(
      expect.arrayContaining(["main", "develop", "feature/existing"]),
    );
    const existingBranch = branches.find(
      (branch) => branch.name === "feature/existing",
    );

    expect(existingBranch?.checkedOut).toBe(true);
    expect(normalizeSystemPath(existingBranch?.checkedOutPath ?? "")).toBe(
      normalizeSystemPath(fixture.featureWorktreePath),
    );
  });

  it("previews and creates a worktree from a new branch", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    const project = (
      await loadProjectDetails(runner, fixture.repoPath, {
        worktreeRoot: fixture.worktreeRoot,
        preferredEditor: "cursor",
        preferredTerminal: "terminal",
      })
    ).project;

    const targetPath = `${fixture.worktreeRoot}/feature-qa`;
    const preview = await previewCreateWorktree(project, {
      projectId: project.id,
      branchMode: "new",
      branchName: "feature/qa",
      baseRef: "develop",
      targetPath,
    });

    expect(preview.canCreate).toBe(true);

    const result = await createWorktree(runner, project, {
      projectId: project.id,
      branchMode: "new",
      branchName: "feature/qa",
      baseRef: "develop",
      targetPath,
    });

    expect(normalizeSystemPath(result.createdPath)).toBe(
      normalizeSystemPath(targetPath),
    );
    expect(
      result.project.worktrees
        .map((worktree) => normalizeSystemPath(worktree.path))
        .includes(normalizeSystemPath(targetPath)),
    ).toBe(true);
  });

  it("rejects preview when a destination already exists", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    const project = (
      await loadProjectDetails(runner, fixture.repoPath, {
        worktreeRoot: fixture.worktreeRoot,
        preferredEditor: "cursor",
        preferredTerminal: "terminal",
      })
    ).project;

    const preview = await previewCreateWorktree(project, {
      projectId: project.id,
      branchMode: "existing",
      branchName: "main",
      targetPath: fixture.featureWorktreePath,
    });

    expect(preview.canCreate).toBe(false);
    expect(preview.destinationExists).toBe(true);
  });
});
