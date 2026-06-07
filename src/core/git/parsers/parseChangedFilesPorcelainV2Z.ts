import type { ChangedFile } from "../../domain/types";

/**
 * Parses `git status --porcelain=v2 -z` into per-file change entries.
 *
 * Record shapes (NUL-separated):
 *   1 <xy> <sub> <mH> <mI> <mW> <hH> <hI> <path>           ordinary change
 *   2 <xy> <sub> <mH> <mI> <mW> <hH> <hI> <Xscore> <path>\0<origPath>   rename/copy
 *   u <xy> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path> unmerged (conflict)
 *   ? <path>                                                untracked
 *   ! <path>                                                ignored (skipped)
 * `# ` header lines are skipped. `xy` is two chars: X = index/staged, Y = worktree.
 */
export function parseChangedFilesPorcelainV2Z(output: string): ChangedFile[] {
  const tokens = output.split("\0");
  const files: ChangedFile[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token) {
      continue;
    }

    if (token.startsWith("# ")) {
      continue;
    }

    if (token.startsWith("1 ")) {
      const parts = token.split(" ");
      const xy = parts[1] ?? "..";
      files.push({
        path: parts.slice(8).join(" "),
        index: xy[0] ?? ".",
        worktree: xy[1] ?? ".",
        untracked: false,
        conflict: false,
      });
      continue;
    }

    if (token.startsWith("2 ")) {
      const parts = token.split(" ");
      const xy = parts[1] ?? "..";
      // The original path is the next NUL-separated token.
      const origPath = tokens[i + 1];
      i += 1;
      files.push({
        path: parts.slice(9).join(" "),
        oldPath: origPath || undefined,
        index: xy[0] ?? ".",
        worktree: xy[1] ?? ".",
        untracked: false,
        conflict: false,
      });
      continue;
    }

    if (token.startsWith("u ")) {
      const parts = token.split(" ");
      const xy = parts[1] ?? "..";
      files.push({
        path: parts.slice(10).join(" "),
        index: xy[0] ?? "U",
        worktree: xy[1] ?? "U",
        untracked: false,
        conflict: true,
      });
      continue;
    }

    if (token.startsWith("? ")) {
      files.push({
        path: token.slice(2),
        index: "?",
        worktree: "?",
        untracked: true,
        conflict: false,
      });
      continue;
    }

    if (token.startsWith("! ")) {
      continue;
    }
  }

  return files;
}
