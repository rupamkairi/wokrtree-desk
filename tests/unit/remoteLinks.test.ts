import { describe, expect, it } from "vitest";

import { normalizeRemoteUrl } from "../../src/core/git/services/gitRemoteService";
import {
  commitUrl,
  parsePullRequestNumbers,
  pullRequestUrl,
} from "../../src/ui/lib/remoteLinks";

describe("normalizeRemoteUrl", () => {
  it("normalizes scp-style GitHub ssh remotes", () => {
    expect(normalizeRemoteUrl("git@github.com:org/repo.git")).toEqual({
      baseUrl: "https://github.com/org/repo",
      host: "github",
    });
  });

  it("normalizes https remotes and strips .git", () => {
    expect(normalizeRemoteUrl("https://gitlab.com/group/sub/repo.git")).toEqual({
      baseUrl: "https://gitlab.com/group/sub/repo",
      host: "gitlab",
    });
  });

  it("returns null base for unrecognized remotes", () => {
    expect(normalizeRemoteUrl("/local/path/repo").baseUrl).toBeNull();
    expect(normalizeRemoteUrl("").baseUrl).toBeNull();
  });
});

describe("parsePullRequestNumbers", () => {
  it("extracts PR number from a merge subject", () => {
    expect(parsePullRequestNumbers("Merge pull request #191 from org/feat", "")).toContain(191);
  });

  it("extracts PR number from a squash subject", () => {
    expect(parsePullRequestNumbers("Add bundle handling (#142)", "")).toContain(142);
  });

  it("dedupes references", () => {
    expect(parsePullRequestNumbers("Merge pull request #5", "closes #5")).toEqual([5]);
  });
});

describe("commit + PR urls", () => {
  const github = { baseUrl: "https://github.com/org/repo", host: "github" as const };
  const gitlab = { baseUrl: "https://gitlab.com/org/repo", host: "gitlab" as const };

  it("builds host-specific commit urls", () => {
    expect(commitUrl(github, "abc")).toBe("https://github.com/org/repo/commit/abc");
    expect(commitUrl(gitlab, "abc")).toBe("https://gitlab.com/org/repo/-/commit/abc");
  });

  it("builds host-specific PR/MR urls", () => {
    expect(pullRequestUrl(github, 7)).toBe("https://github.com/org/repo/pull/7");
    expect(pullRequestUrl(gitlab, 7)).toBe("https://gitlab.com/org/repo/-/merge_requests/7");
  });

  it("returns null without a remote", () => {
    expect(commitUrl(null, "abc")).toBeNull();
    expect(pullRequestUrl({ baseUrl: null, host: "other" }, 7)).toBeNull();
  });
});
