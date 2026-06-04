import { readFileSync } from "node:fs";
import path from "node:path";

export function loadGitFixture(fileName: string): string {
  const fixturePath = path.resolve(
    process.cwd(),
    "tests",
    "fixtures",
    "git",
    fileName,
  );

  return readFileSync(fixturePath, "utf8").trimEnd().replaceAll("<NUL>", "\0");
}
