import { describe, expect, it } from "vitest";

import { parseForEachRefOutput } from "../../src/core/git/parsers/parseForEachRefOutput";

describe("parseForEachRefOutput", () => {
  it("parses branch refs with short names and SHAs", () => {
    const output = [
      ["refs/heads/main", "main", "1111111111111111111111111111111111111111"].join(
        "\0",
      ),
      [
        "refs/heads/feature/spike",
        "feature/spike",
        "2222222222222222222222222222222222222222",
      ].join("\0"),
    ].join("\n");

    expect(parseForEachRefOutput(output)).toEqual([
      {
        fullRef: "refs/heads/main",
        name: "main",
        sha: "1111111111111111111111111111111111111111",
      },
      {
        fullRef: "refs/heads/feature/spike",
        name: "feature/spike",
        sha: "2222222222222222222222222222222222222222",
      },
    ]);
  });

  it("rejects malformed branch output", () => {
    expect(() => parseForEachRefOutput("refs/heads/main\0main")).toThrow(
      /Malformed branch ref output/u,
    );
  });
});
