import path from "node:path";

import type { RepositoryInfo } from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";

function resolveMaybeRelative(basePath: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(basePath, value);
}

export async function discoverRepository(
  commandRunner: CommandRunner,
  selectedPath: string,
): Promise<{ repository: RepositoryInfo; operation: ReturnType<typeof toOperationDetails> }> {
  const result = await commandRunner.run(
    "git",
    ["rev-parse", "--show-toplevel", "--git-common-dir", "--is-inside-work-tree"],
    { cwd: selectedPath },
  );
  const operation = toOperationDetails(result);

  if (!result.success) {
    throw new OperationError(
      "Unable to resolve the selected directory as a Git worktree.",
      operation,
    );
  }

  const lines = result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 3) {
    throw new OperationError(
      "Git rev-parse returned incomplete repository metadata.",
      operation,
    );
  }

  const [primaryPath, commonGitDir, insideWorkTree] = lines;
  if (insideWorkTree !== "true") {
    throw new OperationError(
      "The selected directory is not inside a Git worktree.",
      operation,
    );
  }

  return {
    repository: {
      selectedPath,
      primaryPath,
      commonGitDir: resolveMaybeRelative(selectedPath, commonGitDir),
    },
    operation,
  };
}
