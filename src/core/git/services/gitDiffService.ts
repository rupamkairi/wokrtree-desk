import { readFile } from "node:fs/promises";
import path from "node:path";

import type { FileDiff, FileDiffRequest, ProjectDetails } from "../../domain/types";
import type { CommandRunner } from "../../ports/commandRunner";

const MAX_DIFF_BYTES = 1_000_000;

const LANGUAGE_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  less: "less",
  html: "html",
  md: "markdown",
  mdx: "markdown",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cs: "csharp",
  php: "php",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  yaml: "yaml",
  toml: "ini",
  ini: "ini",
  sql: "sql",
  xml: "xml",
  swift: "swift",
  kt: "kotlin",
};

function languageFor(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_BY_EXT[ext] ?? "plaintext";
}

/** A NUL byte in decoded text is a reliable signal the blob is binary. */
function looksBinary(content: string): boolean {
  for (let i = 0; i < content.length; i += 1) {
    if (content.charCodeAt(i) === 0) {
      return true;
    }
  }
  return false;
}

/** Returns the blob content at `<ref>:<file>`, or "" if it does not exist there. */
async function showBlob(
  commandRunner: CommandRunner,
  cwd: string,
  ref: string,
  file: string,
): Promise<string> {
  const result = await commandRunner.run("git", ["show", `${ref}:${file}`], { cwd });
  return result.success ? result.stdout : "";
}

/**
 * Produces the original/modified text pair for a file, ready for a side-by-side
 * diff. Works for an uncommitted working file (HEAD vs disk) or a committed
 * change (parent vs commit).
 */
export async function getFileDiff(
  commandRunner: CommandRunner,
  project: ProjectDetails,
  request: FileDiffRequest,
): Promise<FileDiff> {
  let original = "";
  let modified = "";

  if (request.kind === "worktree") {
    const worktreePath = request.worktreePath ?? project.primaryPath;
    original = await showBlob(commandRunner, worktreePath, "HEAD", request.path);
    try {
      modified = await readFile(path.join(worktreePath, request.path), "utf8");
    } catch {
      modified = "";
    }
  } else {
    const hash = request.hash;
    if (!hash) {
      throw new Error("A commit hash is required to diff a committed file.");
    }
    original = await showBlob(
      commandRunner,
      project.primaryPath,
      `${hash}^`,
      request.oldPath ?? request.path,
    );
    modified = await showBlob(commandRunner, project.primaryPath, hash, request.path);
  }

  const binary =
    looksBinary(original) ||
    looksBinary(modified) ||
    original.length > MAX_DIFF_BYTES ||
    modified.length > MAX_DIFF_BYTES;

  return {
    path: request.path,
    oldPath: request.oldPath,
    original: binary ? "" : original,
    modified: binary ? "" : modified,
    language: languageFor(request.path),
    binary,
  };
}
