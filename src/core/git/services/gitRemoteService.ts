import type { ProjectDetails, RemoteHost, RemoteInfo } from "../../domain/types";
import type { CommandRunner } from "../../ports/commandRunner";

function hostKind(hostname: string): RemoteHost {
  const lower = hostname.toLowerCase();
  if (lower.includes("github")) return "github";
  if (lower.includes("gitlab")) return "gitlab";
  if (lower.includes("bitbucket")) return "bitbucket";
  return "other";
}

/**
 * Normalizes a git remote URL (ssh or https) to a web base URL + host kind.
 * Returns null baseUrl for unrecognized/local remotes.
 *
 *   git@github.com:org/repo.git        -> https://github.com/org/repo
 *   https://github.com/org/repo.git    -> https://github.com/org/repo
 *   ssh://git@gitlab.com/org/repo.git  -> https://gitlab.com/org/repo
 */
export function normalizeRemoteUrl(raw: string): RemoteInfo {
  const url = raw.trim();
  const none: RemoteInfo = { baseUrl: null, host: "other" };
  if (!url) {
    return none;
  }

  // scp-like syntax: git@host:org/repo(.git)
  const scp = url.match(/^[\w.-]+@([^:]+):(.+?)(?:\.git)?\/?$/u);
  if (scp) {
    const hostname = scp[1];
    return { baseUrl: `https://${hostname}/${scp[2]}`, host: hostKind(hostname) };
  }

  // URL syntax: https://host/path, ssh://git@host/path, git://host/path
  const match = url.match(/^[a-z]+:\/\/(?:[^@/]+@)?([^/]+)\/(.+?)(?:\.git)?\/?$/u);
  if (match) {
    const hostname = match[1];
    return { baseUrl: `https://${hostname}/${match[2]}`, host: hostKind(hostname) };
  }

  return none;
}

/** Reads `origin` (or the first remote) and normalizes it to a web base URL. */
export async function getRemoteInfo(
  commandRunner: CommandRunner,
  project: ProjectDetails,
): Promise<RemoteInfo> {
  const origin = await commandRunner.run("git", ["remote", "get-url", "origin"], {
    cwd: project.primaryPath,
  });
  if (origin.success && origin.stdout.trim()) {
    return normalizeRemoteUrl(origin.stdout);
  }

  // Fall back to whatever remote exists.
  const list = await commandRunner.run("git", ["remote"], { cwd: project.primaryPath });
  const first = list.success ? list.stdout.split("\n").map((r) => r.trim()).find(Boolean) : null;
  if (!first) {
    return { baseUrl: null, host: "other" };
  }

  const url = await commandRunner.run("git", ["remote", "get-url", first], {
    cwd: project.primaryPath,
  });
  return url.success ? normalizeRemoteUrl(url.stdout) : { baseUrl: null, host: "other" };
}
