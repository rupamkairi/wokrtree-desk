import type { WorktreeRecord } from "../../domain/types";

function parseField(token: string): { field: string; value: string } {
  const separatorIndex = token.indexOf(" ");
  if (separatorIndex === -1) {
    return { field: token, value: "" };
  }

  return {
    field: token.slice(0, separatorIndex),
    value: token.slice(separatorIndex + 1),
  };
}

export function parseWorktreePorcelainZ(output: string): WorktreeRecord[] {
  const tokens = output.split("\0");
  const worktrees: WorktreeRecord[] = [];
  let current: WorktreeRecord | null = null;

  const commit = () => {
    if (current) {
      if (!current.path) {
        throw new Error("Malformed worktree output: missing worktree path");
      }

      worktrees.push(current);
      current = null;
    }
  };

  for (const token of tokens) {
    if (token === "") {
      commit();
      continue;
    }

    const { field, value } = parseField(token);

    if (field === "worktree") {
      commit();
      current = {
        path: value,
        detached: false,
        bare: false,
      };
      continue;
    }

    if (!current) {
      throw new Error(`Malformed worktree output: unexpected field "${field}"`);
    }

    switch (field) {
      case "HEAD":
        current.headOid = value;
        break;
      case "branch":
        current.branchRef = value;
        break;
      case "detached":
        current.detached = true;
        break;
      case "bare":
        current.bare = true;
        break;
      case "locked":
        current.lockedReason = value || "locked";
        break;
      case "prunable":
        current.prunableReason = value || "prunable";
        break;
      default:
        throw new Error(`Malformed worktree output: unknown field "${field}"`);
    }
  }

  commit();
  return worktrees;
}
