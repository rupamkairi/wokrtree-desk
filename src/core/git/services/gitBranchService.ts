import type { BranchRef, ProjectDetails } from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";
import { parseForEachRefOutput } from "../parsers/parseForEachRefOutput";

export async function listBranchRefs(
  commandRunner: CommandRunner,
  project: ProjectDetails,
) {
  const result = await commandRunner.run(
    "git",
    ["for-each-ref", "--format=%(refname)%00%(refname:short)%00%(objectname)", "refs/heads"],
    { cwd: project.primaryPath },
  );
  const operation = toOperationDetails(result);

  if (!result.success) {
    throw new OperationError("Unable to list local Git branches.", operation);
  }

  const checkedOutByBranch = new Map(
    project.worktrees.map((worktree) => [worktree.displayBranch, worktree.path]),
  );

  try {
    return parseForEachRefOutput(result.stdout).map((branch) => ({
      ...branch,
      checkedOut: checkedOutByBranch.has(branch.name),
      checkedOutPath: checkedOutByBranch.get(branch.name),
    })) satisfies BranchRef[];
  } catch (error) {
    throw new OperationError(
      error instanceof Error ? error.message : "Unable to parse Git branch output.",
      operation,
    );
  }
}
