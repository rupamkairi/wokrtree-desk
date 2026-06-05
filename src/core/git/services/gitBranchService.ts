import type { BranchRef, ProjectDetails } from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";
import { parseForEachRefOutput } from "../parsers/parseForEachRefOutput";

async function resolveDefaultBranch(
  commandRunner: CommandRunner,
  project: ProjectDetails,
): Promise<string | undefined> {
  // Prefer the remote HEAD symbolic ref; fall back to common names.
  const remoteHead = await commandRunner.run(
    "git",
    ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"],
    { cwd: project.primaryPath },
  );

  if (remoteHead.success) {
    const ref = remoteHead.stdout.trim();
    return ref.startsWith("origin/") ? ref.slice("origin/".length) : ref;
  }

  return undefined;
}

export async function listBranchRefs(
  commandRunner: CommandRunner,
  project: ProjectDetails,
): Promise<BranchRef[]> {
  const result = await commandRunner.run(
    "git",
    [
      "for-each-ref",
      "--sort=-committerdate",
      "--format=%(refname)%00%(refname:short)%00%(objectname)%00%(committerdate:iso8601)",
      "refs/heads",
    ],
    { cwd: project.primaryPath },
  );
  const operation = toOperationDetails(result);

  if (!result.success) {
    throw new OperationError("Unable to list local Git branches.", operation);
  }

  const checkedOutByBranch = new Map(
    project.worktrees.map((worktree) => [worktree.displayBranch, worktree.path]),
  );

  const defaultBranch = await resolveDefaultBranch(commandRunner, project);

  try {
    const parsed = parseForEachRefOutput(result.stdout);
    const knownNames = new Set(parsed.map((branch) => branch.name));
    const resolvedDefault =
      defaultBranch && knownNames.has(defaultBranch)
        ? defaultBranch
        : ["main", "master", "develop"].find((name) => knownNames.has(name));

    return parsed.map((branch) => ({
      ...branch,
      checkedOut: checkedOutByBranch.has(branch.name),
      checkedOutPath: checkedOutByBranch.get(branch.name),
      isDefault: branch.name === resolvedDefault,
    })) satisfies BranchRef[];
  } catch (error) {
    throw new OperationError(
      error instanceof Error ? error.message : "Unable to parse Git branch output.",
      operation,
    );
  }
}
