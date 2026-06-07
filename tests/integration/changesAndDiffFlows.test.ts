import { describe, expect, it } from "vitest";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  listCommitChanges,
  listWorktreeChanges,
} from "../../src/core/git/services/gitChangesService";
import { getFileDiff } from "../../src/core/git/services/gitDiffService";
import { loadProjectDetails } from "../../src/core/git/services/gitWorktreeService";
import { createRepositoryFixture, NodeCommandRunner } from "./gitHelpers";

const defaults = {
  preferredEditor: "cursor" as const,
  preferredTerminal: "terminal" as const,
};

async function loadProject(repoPath: string, worktreeRoot: string) {
  return (
    await loadProjectDetails(new NodeCommandRunner(), repoPath, {
      ...defaults,
      worktreeRoot,
    })
  ).project;
}

describe("changes and diff flows", () => {
  it("lists working-tree changes including untracked files", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    await writeFile(path.join(fixture.repoPath, "README.md"), "# repo edited\n", "utf8");
    await writeFile(path.join(fixture.repoPath, "fresh.txt"), "new\n", "utf8");

    const changes = await listWorktreeChanges(runner, fixture.repoPath);
    const paths = changes.map((file) => file.path);

    expect(paths).toContain("README.md");
    expect(paths).toContain("fresh.txt");
    expect(changes.find((f) => f.path === "fresh.txt")?.untracked).toBe(true);
  });

  it("produces a working-file diff of HEAD vs disk", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();
    const project = await loadProject(fixture.repoPath, fixture.worktreeRoot);

    await writeFile(path.join(fixture.repoPath, "README.md"), "# repo edited\n", "utf8");

    const diff = await getFileDiff(runner, project, {
      projectId: project.id,
      kind: "worktree",
      path: "README.md",
      worktreePath: fixture.repoPath,
    });

    expect(diff.binary).toBe(false);
    expect(diff.original).toBe("# repo\n");
    expect(diff.modified).toBe("# repo edited\n");
    expect(diff.language).toBe("markdown");
  });

  it("lists a commit's changed files and diffs them against the parent", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    // Second commit so HEAD has a parent.
    await writeFile(path.join(fixture.repoPath, "README.md"), "# repo v2\n", "utf8");
    await runner.run("git", ["add", "README.md"], { cwd: fixture.repoPath });
    await runner.run("git", ["commit", "-m", "update readme"], { cwd: fixture.repoPath });

    const project = await loadProject(fixture.repoPath, fixture.worktreeRoot);
    const head = (
      await runner.run("git", ["rev-parse", "HEAD"], { cwd: fixture.repoPath })
    ).stdout.trim();

    const commitChanges = await listCommitChanges(runner, project, head);
    expect(commitChanges.map((f) => f.path)).toContain("README.md");

    const diff = await getFileDiff(runner, project, {
      projectId: project.id,
      kind: "commit",
      path: "README.md",
      hash: head,
    });

    expect(diff.original).toBe("# repo\n");
    expect(diff.modified).toBe("# repo v2\n");
  });
});
