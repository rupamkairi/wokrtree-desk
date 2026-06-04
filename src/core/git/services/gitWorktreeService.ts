import path from "node:path";

import type {
  OperationDetails,
  ProjectDefaults,
  ProjectDetails,
  RepositoryInfo,
  WorktreeSnapshot,
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
