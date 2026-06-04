import type { ProjectDefaults } from "../../core/domain/types";

function getParentPath(inputPath: string) {
  const normalized = inputPath.replace(/\/+$/u, "");
  const parts = normalized.split("/");
  parts.pop();
  return parts.join("/") || "/";
}

function getLeafName(inputPath: string) {
  const normalized = inputPath.replace(/\/+$/u, "");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || "project";
}

export function buildDefaultProjectDefaults(selectedPath: string): ProjectDefaults {
  const leafName = getLeafName(selectedPath);
  const parentPath = getParentPath(selectedPath);

  return {
    worktreeRoot: `${parentPath}/${leafName}-worktrees`,
    preferredEditor: "cursor",
    preferredTerminal: "terminal",
  };
}

export function buildSuggestedWorktreePath(
  worktreeRoot: string,
  branchName: string,
): string {
  const slug = branchName
    .trim()
    .replace(/^refs\/heads\//u, "")
    .replace(/[^\w./-]+/gu, "-")
    .replace(/[/.]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");

  return `${worktreeRoot.replace(/\/+$/u, "")}/${slug || "new-worktree"}`;
}
