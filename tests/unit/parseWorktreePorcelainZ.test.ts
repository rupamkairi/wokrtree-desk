import { describe, expect, it } from "vitest";

import { parseWorktreePorcelainZ } from "../../src/core/git/parsers/parseWorktreePorcelainZ";
import { loadGitFixture } from "./fixtureLoader";

describe("parseWorktreePorcelainZ", () => {
  it("parses multiple worktrees with spaces, unicode, and lock state", () => {
    const output = loadGitFixture("worktree-porcelain-multi.fixture.txt");
    const worktrees = parseWorktreePorcelainZ(output);

    expect(worktrees).toHaveLength(3);
    expect(worktrees[0]).toMatchObject({
      path: "/Users/test/Code/Main Repo",
      branchRef: "refs/heads/main",
      detached: false,
      bare: false,
    });
    expect(worktrees[1]).toMatchObject({
      path: "/Users/test/Code/Feature Space",
      branchRef: "refs/heads/feature/spike",
      lockedReason: "manually locked for setup",
    });
    expect(worktrees[2]).toMatchObject({
      path: "/Users/test/Code/Unicode-ßeta",
      detached: true,
      prunableReason: "stale metadata",
    });
  });

  it("rejects malformed worktree output", () => {
    const output = loadGitFixture("worktree-porcelain-malformed.fixture.txt");

    expect(() => parseWorktreePorcelainZ(output)).toThrow(
      /unexpected field "HEAD"/u,
    );
  });
});
