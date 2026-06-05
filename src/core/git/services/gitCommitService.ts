import type { CommitPage, ProjectDetails } from "../../domain/types";
import { OperationError } from "../../errors/operationError";
import { toOperationDetails } from "../../operations/toOperationDetails";
import type { CommandRunner } from "../../ports/commandRunner";
import {
  COMMIT_LOG_FORMAT,
  parseCommitLogOutput,
} from "../parsers/parseCommitLogOutput";

const DEFAULT_LIMIT = 20;

export async function listCommits(
  commandRunner: CommandRunner,
  project: ProjectDetails,
  input: { branchName: string; limit?: number; skip?: number },
): Promise<CommitPage> {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const skip = input.skip ?? 0;

  // Request one extra commit to detect whether more pages exist.
  const result = await commandRunner.run(
    "git",
    [
      "log",
      `--format=${COMMIT_LOG_FORMAT}`,
      "-z",
      `--max-count=${limit + 1}`,
      `--skip=${skip}`,
      input.branchName,
      "--",
    ],
    { cwd: project.primaryPath },
  );
  const operation = toOperationDetails(result);

  if (!result.success) {
    throw new OperationError(
      `Unable to read commit history for ${input.branchName}.`,
      operation,
    );
  }

  let parsed;
  try {
    parsed = parseCommitLogOutput(result.stdout);
  } catch (error) {
    throw new OperationError(
      error instanceof Error ? error.message : "Unable to parse Git commit log output.",
      operation,
    );
  }

  const hasMore = parsed.length > limit;
  const commits = hasMore ? parsed.slice(0, limit) : parsed;

  return {
    branchName: input.branchName,
    commits,
    skip,
    limit,
    hasMore,
  };
}
