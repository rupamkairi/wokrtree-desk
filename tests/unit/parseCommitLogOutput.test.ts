import { describe, expect, it } from "vitest";

import {
  COMMIT_LOG_FORMAT,
  parseCommitLogOutput,
} from "../../src/core/git/parsers/parseCommitLogOutput";

const US = String.fromCharCode(0x1f);

function record(fields: string[]): string {
  return fields.join(US);
}

describe("parseCommitLogOutput", () => {
  it("parses NUL-separated commit records into summaries", () => {
    const output = [
      record([
        "1111111111111111111111111111111111111111",
        "1111111",
        "Ada Lovelace",
        "2026-06-01T10:00:00+00:00",
        "0000000000000000000000000000000000000000",
        "feat: add analytical engine",
      ]),
      record([
        "2222222222222222222222222222222222222222",
        "2222222",
        "Grace Hopper",
        "2026-05-30T08:30:00+00:00",
        "1111111111111111111111111111111111111111 0000000000000000000000000000000000000000",
        "Merge branch 'compiler'",
      ]),
    ].join("\0");

    expect(parseCommitLogOutput(output)).toEqual([
      {
        hash: "1111111111111111111111111111111111111111",
        shortHash: "1111111",
        author: "Ada Lovelace",
        date: "2026-06-01T10:00:00+00:00",
        subject: "feat: add analytical engine",
        parents: ["0000000000000000000000000000000000000000"],
        isMerge: false,
      },
      {
        hash: "2222222222222222222222222222222222222222",
        shortHash: "2222222",
        author: "Grace Hopper",
        date: "2026-05-30T08:30:00+00:00",
        subject: "Merge branch 'compiler'",
        parents: [
          "1111111111111111111111111111111111111111",
          "0000000000000000000000000000000000000000",
        ],
        isMerge: true,
      },
    ]);
  });

  it("handles a root commit with no parents and a subject containing the field separator", () => {
    const output = record([
      "3333333333333333333333333333333333333333",
      "3333333",
      "Linus",
      "2026-04-01T00:00:00+00:00",
      "",
      "initial commit",
    ]);

    const [commit] = parseCommitLogOutput(output);
    expect(commit.parents).toEqual([]);
    expect(commit.isMerge).toBe(false);
    expect(commit.subject).toBe("initial commit");
  });

  it("ignores empty trailing records", () => {
    expect(parseCommitLogOutput("\0\0")).toEqual([]);
  });

  it("uses the unit separator in the git format string", () => {
    expect(COMMIT_LOG_FORMAT).toBe(["%H", "%h", "%an", "%aI", "%P", "%s"].join("%x1f"));
  });

  it("rejects malformed commit records", () => {
    expect(() => parseCommitLogOutput(record(["onlyhash"]))).toThrow(
      /Malformed commit log output/u,
    );
  });
});
