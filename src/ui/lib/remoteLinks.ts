import type { RemoteInfo } from "../../core/domain/types";

/**
 * Extracts pull/merge request numbers referenced by a commit message:
 *   "Merge pull request #191 from ..."  -> 191
 *   "Add thing (#142)"                  -> 142
 *   "See !88" (GitLab MR)               -> 88
 * Deduped, in first-seen order.
 */
export function parsePullRequestNumbers(subject: string, body: string): number[] {
  const text = `${subject}\n${body}`;
  const numbers = new Set<number>();
  const patterns = [
    /(?:pull request|merge request|PR|MR)\s+[#!](\d+)/giu,
    /\(#(\d+)\)/gu,
    /(?:^|\s)[#!](\d+)\b/gu,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) {
        numbers.add(value);
      }
    }
  }
  return [...numbers];
}

export function commitUrl(remote: RemoteInfo | null, hash: string): string | null {
  if (!remote?.baseUrl) return null;
  const segment = remote.host === "gitlab" ? "-/commit" : "commit";
  return `${remote.baseUrl}/${segment}/${hash}`;
}

export function pullRequestUrl(remote: RemoteInfo | null, num: number): string | null {
  if (!remote?.baseUrl) return null;
  switch (remote.host) {
    case "gitlab":
      return `${remote.baseUrl}/-/merge_requests/${num}`;
    case "bitbucket":
      return `${remote.baseUrl}/pull-requests/${num}`;
    case "github":
      return `${remote.baseUrl}/pull/${num}`;
    default:
      return null;
  }
}

export function pullRequestLabel(remote: RemoteInfo | null): string {
  return remote?.host === "gitlab" ? "MR" : "PR";
}
