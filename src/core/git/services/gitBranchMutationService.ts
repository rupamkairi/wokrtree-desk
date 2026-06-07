import type {
  CreateBranchRequest,
  CreateBranchResult,
  ProjectDetails,
} from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";

/**
 * Creates a local branch from a base ref. When `checkout` is set the primary
 * checkout switches onto the new branch (`git switch`); otherwise the branch is
 * created in place (`git branch`) and the current checkout is left untouched.
 */
export async function createBranch(
  commandRunner: CommandRunner,
  project: ProjectDetails,
  request: CreateBranchRequest,
): Promise<CreateBranchResult> {
  const args = request.checkout
    ? ["switch", "--create", request.branchName, request.baseRef]
    : ["branch", request.branchName, request.baseRef];

  const result = await commandRunner.run("git", args, {
    cwd: project.primaryPath,
  });
  const operation = toOperationDetails(result);

  if (!result.success) {
    throw new OperationError(
      `Unable to create branch ${request.branchName}.`,
      operation,
    );
  }

  return {
    branchName: request.branchName,
    operation,
  };
}
