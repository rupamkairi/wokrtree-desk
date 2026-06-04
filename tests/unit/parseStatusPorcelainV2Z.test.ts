import { describe, expect, it } from "vitest";

import { parseStatusPorcelainV2Z } from "../../src/core/git/parsers/parseStatusPorcelainV2Z";
import { loadGitFixture } from "./fixtureLoader";

describe("parseStatusPorcelainV2Z", () => {
  it("parses clean branch status with upstream and ahead/behind", () => {
    const output = loadGitFixture("status-clean.fixture.txt");
    const status = parseStatusPorcelainV2Z(output);

    expect(status).toMatchObject({
      branch: "main",
      upstream: "origin/main",
      ahead: 2,
      behind: 1,
      changedCount: 0,
      untrackedCount: 0,
      conflictCount: 0,
      clean: true,
      detached: false,
    });
  });

  it("parses modified, untracked, and conflicted entries", () => {
    const output = loadGitFixture("status-dirty.fixture.txt");
    const status = parseStatusPorcelainV2Z(output);

    expect(status).toMatchObject({
      branch: "feature/spike",
      upstream: "origin/feature/spike",
      changedCount: 2,
      untrackedCount: 1,
      conflictCount: 1,
      clean: false,
      detached: false,
    });
  });

  it("parses detached head status", () => {
    const output = loadGitFixture("status-detached.fixture.txt");
    const status = parseStatusPorcelainV2Z(output);

    expect(status).toMatchObject({
      branch: undefined,
      detached: true,
      untrackedCount: 1,
      clean: false,
    });
  });

  it("rejects malformed status output", () => {
    const output = loadGitFixture("status-malformed.fixture.txt");

    expect(() => parseStatusPorcelainV2Z(output)).toThrow(
      /unsupported record/u,
    );
  });
});
