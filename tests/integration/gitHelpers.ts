import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import type { CommandRunner } from "../../src/core/ports/commandRunner";

export class NodeCommandRunner implements CommandRunner {
  async run(executable: string, args: string[], options: { cwd: string }) {
    const startedAt = new Date();
    const result = spawnSync(executable, args, {
      cwd: options.cwd,
      encoding: "utf8",
    });
    const finishedAt = new Date();

    return {
      executable,
      args,
      cwd: options.cwd,
      exitCode: result.status ?? 1,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      success: result.status === 0,
    };
  }
}

function runGit(cwd: string, args: string[]) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed in ${cwd}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
}

export async function createRepositoryFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "worktree-desk-"));
  const repoPath = path.join(root, "repo");
  const featureWorktreePath = path.join(root, "repo-feature-existing");
  const worktreeRoot = path.join(root, "worktrees");

  await mkdir(repoPath, { recursive: true });
  await mkdir(worktreeRoot, { recursive: true });

  runGit(root, ["init", "--initial-branch=main", repoPath]);
  runGit(repoPath, ["config", "user.name", "Worktree Desk Tests"]);
  runGit(repoPath, ["config", "user.email", "tests@example.com"]);
  await writeFile(path.join(repoPath, "README.md"), "# repo\n", "utf8");
  runGit(repoPath, ["add", "README.md"]);
  runGit(repoPath, ["commit", "-m", "initial"]);
  runGit(repoPath, ["branch", "feature/existing"]);
  runGit(repoPath, ["branch", "develop"]);
  runGit(repoPath, ["worktree", "add", featureWorktreePath, "feature/existing"]);

  return {
    root,
    repoPath,
    featureWorktreePath,
    worktreeRoot,
  };
}
