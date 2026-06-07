import { copyFile, cp, mkdir, symlink } from "node:fs/promises";
import path from "node:path";

import type { CopyFolderSpec } from "../../domain/types";

/**
 * Resolves where a source path should land inside the new worktree. Paths under
 * the source repo keep their relative location (so `apps/api/.env` lands at the
 * same spot); anything outside falls back to its basename at the worktree root.
 */
function destinationFor(
  sourceRoot: string,
  createdPath: string,
  absoluteSource: string,
): string {
  const relative = path.relative(sourceRoot, absoluteSource);
  const inside = relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
  return inside
    ? path.join(createdPath, relative)
    : path.join(createdPath, path.basename(absoluteSource));
}

/**
 * Copies files and copies/symlinks folders from the source checkout into a
 * freshly created worktree. Runs after `git worktree add` succeeded, so failures
 * here are non-fatal: each problem is collected as a warning instead of throwing,
 * leaving the created worktree intact.
 */
export async function copyIntoWorktree(params: {
  sourceRoot: string;
  createdPath: string;
  files: string[];
  folders: CopyFolderSpec[];
}): Promise<string[]> {
  const { sourceRoot, createdPath, files, folders } = params;
  const warnings: string[] = [];

  for (const source of files) {
    const destination = destinationFor(sourceRoot, createdPath, source);
    try {
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(source, destination);
    } catch (error) {
      warnings.push(
        `Could not copy file ${source}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  for (const folder of folders) {
    const destination = destinationFor(sourceRoot, createdPath, folder.path);
    try {
      await mkdir(path.dirname(destination), { recursive: true });
      if (folder.mode === "symlink") {
        await symlink(folder.path, destination, "dir");
      } else {
        await cp(folder.path, destination, { recursive: true });
      }
    } catch (error) {
      const verb = folder.mode === "symlink" ? "symlink" : "copy";
      warnings.push(
        `Could not ${verb} folder ${folder.path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return warnings;
}
