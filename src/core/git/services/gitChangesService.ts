import { existsSync } from "node:fs";

import type { ChangedFile, ProjectDetails } from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";
import { parseChangedFilesPorcelainV2Z } from "../parsers/parseChangedFilesPorcelainV2Z";
import { parseNumstat } from "../parsers/parseNumstat";

/** Attaches additions/deletions/binary from numstat output, keyed by path. */
function mergeNumstat(files: ChangedFile[], numstatOutput: string): ChangedFile[] {
  const stats = new Map(
    parseNumstat(numstatOutput).map((entry) => [entry.path, entry]),
  );
  return files.map((file) => {
    const stat = stats.get(file.path);
    if (!stat) {
      return file;
    }
    return {
      ...file,
      additions: stat.additions,
      deletions: stat.deletions,
      binary: stat.binary,
    };
  });
}

/** Working-tree changes (staged + unstaged + untracked) for one worktree. */
export async function listWorktreeChanges(
  commandRunner: CommandRunner,
  worktreePath: string,
): Promise<ChangedFile[]> {
  // A prunable/stale worktree dir may no longer exist; spawning git there fails
  // as a misleading ENOENT. Report no changes instead.
  if (!existsSync(worktreePath)) {
    return [];
  }

  const result = await commandRunner.run(
    "git",
    ["status", "--porcelain=v2", "-z", "--untracked-files=all"],
    { cwd: worktreePath },
  );
  const operation = toOperationDetails(result);

  if (!result.success) {
    throw new OperationError("Unable to read working-tree changes.", operation);
  }

  let files: ChangedFile[];
  try {
    files = parseChangedFilesPorcelainV2Z(result.stdout);
  } catch (error) {
    throw new OperationError(
      error instanceof Error ? error.message : "Unable to parse status output.",
      operation,
    );
  }

  // Best-effort line counts vs HEAD (covers staged + unstaged tracked files).
  const numstat = await commandRunner.run("git", ["diff", "HEAD", "--numstat"], {
    cwd: worktreePath,
  });
  return numstat.success ? mergeNumstat(files, numstat.stdout) : files;
}

/**
 * Files changed by a single commit (relative to its first parent). Uses
 * `--name-status -z` so renames/copies carry both paths.
 */
export async function listCommitChanges(
  commandRunner: CommandRunner,
  project: ProjectDetails,
  hash: string,
): Promise<ChangedFile[]> {
  const result = await commandRunner.run(
    "git",
    ["diff-tree", "--no-commit-id", "-r", "-z", "--name-status", hash],
    { cwd: project.primaryPath },
  );
  const operation = toOperationDetails(result);

  if (!result.success) {
    throw new OperationError(`Unable to read changes for commit ${hash}.`, operation);
  }

  const files = parseNameStatusZ(result.stdout);

  const numstat = await commandRunner.run(
    "git",
    ["diff-tree", "--no-commit-id", "-r", "--numstat", hash],
    { cwd: project.primaryPath },
  );
  return numstat.success ? mergeNumstat(files, numstat.stdout) : files;
}

/**
 * Parses `git diff-tree --name-status -z` output. Records are NUL-separated:
 *   <status>\0<path>            for M/A/D/T
 *   <Rxx>\0<oldPath>\0<newPath> for renames/copies
 */
function parseNameStatusZ(output: string): ChangedFile[] {
  const tokens = output.split("\0");
  const files: ChangedFile[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const status = tokens[i];
    if (!status) {
      continue;
    }

    const code = status[0];
    if (code === "R" || code === "C") {
      const oldPath = tokens[i + 1];
      const newPath = tokens[i + 2];
      i += 2;
      if (!newPath) {
        continue;
      }
      files.push({
        path: newPath,
        oldPath: oldPath || undefined,
        index: code,
        worktree: ".",
        untracked: false,
        conflict: false,
      });
      continue;
    }

    const path = tokens[i + 1];
    i += 1;
    if (!path) {
      continue;
    }
    files.push({
      path,
      index: code ?? "M",
      worktree: ".",
      untracked: false,
      conflict: false,
    });
  }

  return files;
}
