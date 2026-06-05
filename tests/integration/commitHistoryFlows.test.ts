import { describe, expect, it } from "vitest";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { listCommits } from "../../src/core/git/services/gitCommitService";
import { loadProjectDetails } from "../../src/core/git/services/gitWorktreeService";
import { createRepositoryFixture, NodeCommandRunner } from "./gitHelpers";

const DEFAULTS = {
  worktreeRoot: "/tmp/ignored",
  preferredEditor: "cursor" as const,
  preferredTerminal: "terminal" as const,
};

async function commit(
  runner: NodeCommandRunner,
  repoPath: string,
  subject: string,
) {
  const file = path.join(repoPath, `${subject.replace(/\W+/gu, "-")}.txt`);
  await writeFile(file, `${subject}\n`, "utf8");
  await runner.run("git", ["add", "-A"], { cwd: repoPath });
  await runner.run("git", ["commit", "-m", subject], { cwd: repoPath });
}

describe("commit history flows", () => {
  it("pages commits newest-first with an accurate hasMore flag", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    // Fixture starts with one commit ("initial"); add two more on main.
    await commit(runner, fixture.repoPath, "second");
    await commit(runner, fixture.repoPath, "third");

    const project = (
      await loadProjectDetails(runner, fixture.repoPath, DEFAULTS)
    ).project;

    const firstPage = await listCommits(runner, project, {
      branchName: "main",
      limit: 2,
      skip: 0,
    });

    expect(firstPage.commits.map((c) => c.subject)).toEqual(["third", "second"]);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.commits).toHaveLength(2);

    const secondPage = await listCommits(runner, project, {
      branchName: "main",
      limit: 2,
      skip: 2,
    });

    expect(secondPage.commits.map((c) => c.subject)).toEqual(["initial"]);
    expect(secondPage.hasMore).toBe(false);
  });

  it("reports hasMore false when the limit covers every commit", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();
    await commit(runner, fixture.repoPath, "second");

    const project = (
      await loadProjectDetails(runner, fixture.repoPath, DEFAULTS)
    ).project;

    const page = await listCommits(runner, project, {
      branchName: "main",
      limit: 20,
      skip: 0,
    });

    expect(page.commits).toHaveLength(2);
    expect(page.hasMore).toBe(false);
  });

  it("populates commit fields and flags merge commits", async () => {
    const fixture = await createRepositoryFixture();
    const runner = new NodeCommandRunner();

    const project = (
      await loadProjectDetails(runner, fixture.repoPath, DEFAULTS)
    ).project;

    const [commitSummary] = (
      await listCommits(runner, project, { branchName: "main", limit: 1 })
    ).commits;

    expect(commitSummary.subject).toBe("initial");
    expect(commitSummary.author).toBe("Worktree Desk Tests");
    expect(commitSummary.shortHash.length).toBeGreaterThan(0);
    expect(commitSummary.hash.length).toBe(40);
    expect(commitSummary.isMerge).toBe(false);
  });
});
