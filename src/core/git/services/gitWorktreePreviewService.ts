import { access } from "node:fs/promises";
import path from "node:path";

import type {
  CreateWorktreePreview,
  CreateWorktreeRequest,
  ProjectDetails,
} from "../../domain/types";

function slugifyBranchName(branchName: string): string {
  return branchName
    .trim()
    .replace(/^refs\/heads\//u, "")
    .replace(/[^\w./-]+/gu, "-")
    .replace(/[/.]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");
}

async function pathExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export function buildSuggestedWorktreePath(
  project: ProjectDetails,
  branchName: string,
) {
  const slug = slugifyBranchName(branchName) || "new-worktree";
  return path.join(project.defaults.worktreeRoot, slug);
}

function findCheckedOutBranch(project: ProjectDetails, branchName: string) {
  return project.worktrees.find((worktree) => worktree.displayBranch === branchName);
}

export async function previewCreateWorktree(
  project: ProjectDetails,
  request: CreateWorktreeRequest,
): Promise<CreateWorktreePreview> {
  const checkedOutWorktree =
    request.branchMode === "existing"
      ? findCheckedOutBranch(project, request.branchName)
      : undefined;
  const destinationExists = await pathExists(request.targetPath);
  const warnings: string[] = [];

  if (checkedOutWorktree) {
    warnings.push(
      `Branch ${request.branchName} is already checked out at ${checkedOutWorktree.path}.`,
    );
  }

  if (destinationExists) {
    warnings.push(`Destination already exists at ${request.targetPath}.`);
  }

  if (request.branchMode === "new" && !request.baseRef) {
    warnings.push("A base branch is required when creating a new worktree branch.");
  }

  const args =
    request.branchMode === "existing"
      ? ["worktree", "add", request.targetPath, request.branchName]
      : ["worktree", "add", "-b", request.branchName, request.targetPath, request.baseRef ?? ""];

  return {
    projectId: project.id,
    branchMode: request.branchMode,
    branchName: request.branchName,
    targetPath: request.targetPath,
    baseRef: request.baseRef,
    willCreateBranch: request.branchMode === "new",
    destinationExists,
    branchAlreadyCheckedOut: Boolean(checkedOutWorktree),
    checkedOutPath: checkedOutWorktree?.path,
    canCreate:
      !destinationExists &&
      !checkedOutWorktree &&
      (request.branchMode === "existing" || Boolean(request.baseRef)),
    warnings,
    command: {
      executable: "git",
      args,
      cwd: project.primaryPath,
    },
  };
}
