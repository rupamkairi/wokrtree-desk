import { existsSync } from "node:fs";
import path from "node:path";

import type {
  OperationDetails,
  ProjectDefaults,
  ProjectDetails,
  RepositoryInfo,
  WorktreeSnapshot,
  WorktreeStatus,
} from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";
import { parseStatusPorcelainV2Z } from "../parsers/parseStatusPorcelainV2Z";
import { parseWorktreePorcelainZ } from "../parsers/parseWorktreePorcelainZ";
import { discoverRepository } from "./gitRepositoryService";

function toProjectId(commonGitDir: string): string {
  return commonGitDir;
}

function normalizeBranchRef(branchRef?: string): string | undefined {
  if (!branchRef) {
    return undefined;
  }

  return branchRef.startsWith("refs/heads/")
    ? branchRef.slice("refs/heads/".length)
    : branchRef;
}

function toDisplayName(primaryPath: string): string {
  return path.basename(primaryPath);
}

// Status we cannot read from disk (bare worktree, prunable/stale entry, or a
// directory git lists but no longer exists). Returned instead of spawning git
// in a missing cwd, which fails as a misleading "ENOENT posix_spawn 'git'".
function unreadableStatus(detached: boolean): WorktreeStatus {
  return {
    ahead: 0,
    behind: 0,
    changedCount: 0,
    untrackedCount: 0,
    conflictCount: 0,
    clean: false,
    detached,
  };
}

async function listWorktrees(
  commandRunner: CommandRunner,
  repository: RepositoryInfo,
): Promise<{ worktrees: WorktreeSnapshot[]; operation: OperationDetails }> {
  const worktreeListResult = await commandRunner.run(
    "git",
    ["worktree", "list", "--porcelain", "-z"],
    { cwd: repository.primaryPath },
  );
  const worktreeListOperation = toOperationDetails(worktreeListResult);

  if (!worktreeListResult.success) {
    throw new OperationError(
      "Unable to read Git worktree inventory.",
      worktreeListOperation,
    );
  }

  let records;
  try {
    records = parseWorktreePorcelainZ(worktreeListResult.stdout);
  } catch (error) {
    throw new OperationError(
      error instanceof Error ? error.message : "Unable to parse Git worktree list output.",
      worktreeListOperation,
    );
  }

  let lastOperation = worktreeListOperation;
  const worktrees: WorktreeSnapshot[] = [];

  for (const record of records) {
    // A bare or prunable worktree has no usable working tree, and a prunable
    // "gitdir points to non-existent location" entry means the directory is
    // gone. Running git with cwd set to a missing directory fails as
    // "ENOENT posix_spawn 'git'". Skip the status call and report the entry
    // with its prunable/locked flags intact.
    if (record.bare || record.prunableReason || !existsSync(record.path)) {
      worktrees.push({
        path: record.path,
        headOid: record.headOid,
        branchRef: record.branchRef,
        displayBranch: normalizeBranchRef(record.branchRef) ?? "detached",
        detached: record.detached,
        bare: record.bare,
        lockedReason: record.lockedReason,
        prunableReason:
          record.prunableReason ??
          (!record.bare && !existsSync(record.path)
            ? "worktree directory is missing"
            : undefined),
        status: unreadableStatus(record.detached),
      });
      continue;
    }

    const statusResult = await commandRunner.run(
      "git",
      ["status", "--porcelain=v2", "--branch", "-z", "--untracked-files=normal"],
      { cwd: record.path },
    );
    const statusOperation = toOperationDetails(statusResult);
    lastOperation = statusOperation;

    if (!statusResult.success) {
      throw new OperationError(
        `Unable to read Git status for worktree ${record.path}.`,
        statusOperation,
      );
    }

    let status;
    try {
      status = parseStatusPorcelainV2Z(statusResult.stdout);
    } catch (error) {
      throw new OperationError(
        error instanceof Error ? error.message : "Unable to parse Git status output.",
        statusOperation,
      );
    }

    worktrees.push({
      path: record.path,
      headOid: record.headOid,
      branchRef: record.branchRef,
      displayBranch:
        status.branch ?? normalizeBranchRef(record.branchRef) ?? "detached",
      detached: record.detached,
      bare: record.bare,
      lockedReason: record.lockedReason,
      prunableReason: record.prunableReason,
      status,
    });
  }

  return { worktrees, operation: lastOperation };
}

export async function loadProjectDetails(
  commandRunner: CommandRunner,
  selectedPath: string,
  defaults: ProjectDefaults,
): Promise<{ project: ProjectDetails; operation: OperationDetails }> {
  const { repository } = await discoverRepository(commandRunner, selectedPath);
  const { worktrees, operation } = await listWorktrees(commandRunner, repository);

  return {
    project: {
      id: toProjectId(repository.commonGitDir),
      displayName: toDisplayName(repository.primaryPath),
      selectedPath: repository.selectedPath,
      primaryPath: repository.primaryPath,
      commonGitDir: repository.commonGitDir,
      defaults,
      worktrees,
    },
    operation,
  };
}
