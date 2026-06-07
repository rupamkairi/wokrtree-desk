import { describe, expect, it } from "vitest";

import { parseChangedFilesPorcelainV2Z } from "../../src/core/git/parsers/parseChangedFilesPorcelainV2Z";

// NUL separator built at runtime so no raw NUL byte lives in this source file.
const NUL = String.fromCharCode(0);

describe("parseChangedFilesPorcelainV2Z", () => {
  it("parses ordinary, untracked, and rename records", () => {
    const output =
      [
        "# branch.head main",
        "1 .M N... 100644 100644 100644 1111111 2222222 README.md",
        "? new.txt",
        "2 R. N... 100644 100644 100644 aaaa bbbb R100 newname.ts",
        "oldname.ts",
      ].join(NUL) + NUL;

    const files = parseChangedFilesPorcelainV2Z(output);

    expect(files).toHaveLength(3);

    const readme = files.find((f) => f.path === "README.md");
    expect(readme).toMatchObject({ index: ".", worktree: "M", untracked: false, conflict: false });

    const untracked = files.find((f) => f.path === "new.txt");
    expect(untracked).toMatchObject({ untracked: true });

    const renamed = files.find((f) => f.path === "newname.ts");
    expect(renamed).toMatchObject({ oldPath: "oldname.ts", index: "R" });
  });

  it("flags unmerged records as conflicts", () => {
    const output =
      "u UU N... 100644 100644 100644 100644 h1 h2 h3 conflict.txt" + NUL;
    const files = parseChangedFilesPorcelainV2Z(output);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ path: "conflict.txt", conflict: true });
  });

  it("skips ignored records and returns empty for clean output", () => {
    expect(parseChangedFilesPorcelainV2Z("")).toEqual([]);
    expect(parseChangedFilesPorcelainV2Z("! ignored.log" + NUL)).toEqual([]);
  });
});
