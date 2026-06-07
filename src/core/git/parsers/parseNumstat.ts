export type NumstatEntry = {
  path: string;
  additions: number;
  deletions: number;
  binary: boolean;
};

/**
 * Resolves a numstat path that may carry rename syntax to the new path:
 *   "src/{old => new}.ts" -> "src/new.ts"
 *   "old.ts => new.ts"     -> "new.ts"
 */
function resolveRenamePath(raw: string): string {
  if (raw.includes("{") && raw.includes("=>")) {
    return raw.replace(/\{[^}]*=>\s*([^}]*)\}/u, "$1").replace(/\/{2,}/gu, "/");
  }
  if (raw.includes("=>")) {
    return raw.split("=>").pop()?.trim() ?? raw;
  }
  return raw;
}

/**
 * Parses `git diff --numstat` / `git diff-tree --numstat` output (tab-separated,
 * newline-delimited). Binary files report "-" for both counts.
 */
export function parseNumstat(output: string): NumstatEntry[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [addRaw, delRaw, ...pathParts] = line.split("\t");
      const rawPath = pathParts.join("\t");
      const binary = addRaw === "-" || delRaw === "-";
      return {
        path: resolveRenamePath(rawPath),
        additions: binary ? 0 : Number(addRaw) || 0,
        deletions: binary ? 0 : Number(delRaw) || 0,
        binary,
      } satisfies NumstatEntry;
    });
}
