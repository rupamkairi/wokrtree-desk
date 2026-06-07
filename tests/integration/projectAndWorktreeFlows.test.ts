import { describe, expect, it } from "vitest";
import { lstat, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { listBranchRefs } from "../../src/core/git/services/gitBranchService";
import { createWorktree } from "../../src/core/git/services/gitWorktreeMutationService";
import { previewCreateWorktree } from "../../src/core/git/services/gitWorktreePreviewService";
import { loadProjectDetails } from "../../src/core/git/services/gitWorktreeService";
import { createRepositoryFixture, NodeCommandRunner } from "./gitHelpers";

function normalizeSystemPath(value: string) {
  // macOS resolves /tmp and /var to /private/tmp and /private/var via symlink.
  // git reports the realpath while path.resolve keeps the symlink form, so strip
  // the /private prefix on both sides before comparing.
  return path.resolve(value).replace(/^\/private(\/(?:tmp|var)\/)/u, "$1");
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

  it("loads a project even when a listed worktree directory is missing", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    // Delete the linked worktree directory without telling git. Git still
    // lists it (now `prunable: gitdir ... non-existent location`), and naively
    // running `git status` there fails as "ENOENT posix_spawn 'git'".
    await rm(fixture.featureWorktreePath, { recursive: true, force: true });

    const { project } = await loadProjectDetails(runner, fixture.repoPath, {
      worktreeRoot: fixture.worktreeRoot,
      preferredEditor: "cursor",
      preferredTerminal: "terminal",
    });

    expect(project.worktrees).toHaveLength(2);
    const missing = project.worktrees.find(
      (worktree) =>
        normalizeSystemPath(worktree.path) ===
        normalizeSystemPath(fixture.featureWorktreePath),
    );
    expect(missing).toBeDefined();
    expect(missing?.prunableReason).toBeTruthy();
    expect(missing?.status.clean).toBe(false);
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

  it("copies a file and symlinks a folder into the new worktree", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    // Untracked, git-ignored-style artefacts in the source checkout.
    await writeFile(path.join(fixture.repoPath, ".env"), "SECRET=1\n", "utf8");
    await mkdir(path.join(fixture.repoPath, "vendor"), { recursive: true });
    await writeFile(path.join(fixture.repoPath, "vendor", "lib.txt"), "dep\n", "utf8");

    const project = (
      await loadProjectDetails(runner, fixture.repoPath, {
        worktreeRoot: fixture.worktreeRoot,
        preferredEditor: "cursor",
        preferredTerminal: "terminal",
      })
    ).project;

    const targetPath = `${fixture.worktreeRoot}/feature-copy`;
    const result = await createWorktree(runner, project, {
      projectId: project.id,
      branchMode: "new",
      branchName: "feature/copy",
      baseRef: "main",
      targetPath,
      copyFiles: [path.join(fixture.repoPath, ".env")],
      copyFolders: [{ path: path.join(fixture.repoPath, "vendor"), mode: "symlink" }],
    });

    expect(result.copyWarnings).toEqual([]);

    const copiedEnv = await readFile(path.join(targetPath, ".env"), "utf8");
    expect(copiedEnv).toBe("SECRET=1\n");

    const linkStat = await lstat(path.join(targetPath, "vendor"));
    expect(linkStat.isSymbolicLink()).toBe(true);
  });
});
