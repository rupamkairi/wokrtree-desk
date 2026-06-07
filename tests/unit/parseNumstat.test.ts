import { describe, expect, it } from "vitest";

import { parseNumstat } from "../../src/core/git/parsers/parseNumstat";

describe("parseNumstat", () => {
  it("parses additions/deletions per file", () => {
    const output = "12\t3\tsrc/a.ts\n0\t5\tsrc/b.ts\n";
    expect(parseNumstat(output)).toEqual([
      { path: "src/a.ts", additions: 12, deletions: 3, binary: false },
      { path: "src/b.ts", additions: 0, deletions: 5, binary: false },
    ]);
  });

  it("flags binary files", () => {
    const [entry] = parseNumstat("-\t-\tlogo.png\n");
    expect(entry).toEqual({ path: "logo.png", additions: 0, deletions: 0, binary: true });
  });

  it("resolves rename brace syntax to the new path", () => {
    const [entry] = parseNumstat("4\t2\tsrc/{old => new}.ts\n");
    expect(entry.path).toBe("src/new.ts");
  });

  it("resolves bare rename syntax", () => {
    const [entry] = parseNumstat("1\t1\told.ts => new.ts\n");
    expect(entry.path).toBe("new.ts");
  });
});
