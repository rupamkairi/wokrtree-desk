import type {
  CreateWorktreeRequest,
  CreateWorktreeResult,
  ProjectDetails,
  SwitchWorktreeBranchResult,
} from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";
import { previewCreateWorktree } from "./gitWorktreePreviewService";
import { loadProjectDetails } from "./gitWorktreeService";
import { copyIntoWorktree } from "./worktreeCopyService";

export async function createWorktree(
  commandRunner: CommandRunner,
  project: ProjectDetails,
  request: CreateWorktreeRequest,
): Promise<CreateWorktreeResult> {
  const preview = await previewCreateWorktree(project, request);
  if (!preview.canCreate) {
    throw new Error(preview.warnings[0] ?? "This worktree cannot be created yet.");
  }

  const args =
    request.branchMode === "existing"
      ? ["worktree", "add", request.targetPath, request.branchName]
      : ["worktree", "add", "-b", request.branchName, request.targetPath, request.baseRef ?? ""];

  const result = await commandRunner.run("git", args, { cwd: project.primaryPath });
  const operation = toOperationDetails(result);

  if (!result.success) {
    throw new OperationError("Unable to create the requested worktree.", operation);
  }

  // The worktree now exists. Copy/symlink any requested files and folders; these
  // are best-effort, so problems surface as warnings rather than failing the op.
  const copyWarnings = await copyIntoWorktree({
    sourceRoot: project.primaryPath,
    createdPath: request.targetPath,
    files: request.copyFiles ?? [],
    folders: request.copyFolders ?? [],
  });

  const refreshedProject = await loadProjectDetails(
    commandRunner,
    project.primaryPath,
    project.defaults,
  );

  return {
    project: refreshedProject.project,
    createdPath: request.targetPath,
    branchName: request.branchName,
    operation,
    copyWarnings,
  };
}

/**
 * Switches the branch checked out in an existing worktree, without the caller
 * having to cd into it. Runs `git -C <worktreePath> switch <branchName>`. git
 * itself enforces the safety rules (refuses a branch already checked out in
 * another worktree, refuses to switch over conflicting local changes); on any
 * such failure we surface git's exact stderr rather than forcing.
 */
export async function switchWorktreeBranch(
  commandRunner: CommandRunner,
  worktreePath: string,
  branchName: string,
  options: { cwd: string },
): Promise<SwitchWorktreeBranchResult> {
  // Run from a directory that is guaranteed to exist (the primary checkout) and
  // target the worktree with `-C`. Using the worktree itself as cwd would fail
  // as a misleading "ENOENT posix_spawn 'git'" whenever that worktree directory
  // is missing (e.g. a prunable entry).
  const result = await commandRunner.run(
    "git",
    ["-C", worktreePath, "switch", branchName],
    { cwd: options.cwd },
  );
  const operation = toOperationDetails(result);

  if (!result.success) {
    const detail = result.stderr.trim() || `exit ${result.exitCode}`;
    throw new OperationError(
      `Unable to switch worktree to ${branchName} (${detail}).`,
      operation,
    );
  }

  return { worktreePath, branchName, operation };
}
