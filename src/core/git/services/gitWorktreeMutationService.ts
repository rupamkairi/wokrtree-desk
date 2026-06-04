import type {
  CreateWorktreeRequest,
  CreateWorktreeResult,
  ProjectDetails,
} from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";
import { previewCreateWorktree } from "./gitWorktreePreviewService";
import { loadProjectDetails } from "./gitWorktreeService";

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
  };
}
