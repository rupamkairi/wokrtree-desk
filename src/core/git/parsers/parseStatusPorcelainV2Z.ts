import type { WorktreeStatus } from "../../domain/types";

export function parseStatusPorcelainV2Z(output: string): WorktreeStatus {
  const status: Omit<WorktreeStatus, "clean"> = {
    branch: undefined,
    upstream: undefined,
    ahead: 0,
    behind: 0,
    changedCount: 0,
    untrackedCount: 0,
    conflictCount: 0,
    detached: false,
  };

  const tokens = output.split("\0").filter((token) => token.length > 0);

  for (const token of tokens) {
    if (token.startsWith("# ")) {
      if (token.startsWith("# branch.head ")) {
        const value = token.slice("# branch.head ".length);
        if (value === "(detached)") {
          status.detached = true;
          status.branch = undefined;
        } else if (value !== "(initial)") {
          status.branch = value;
        }
        continue;
      }

      if (token.startsWith("# branch.upstream ")) {
        status.upstream = token.slice("# branch.upstream ".length);
        continue;
      }

      if (token.startsWith("# branch.ab ")) {
        const value = token.slice("# branch.ab ".length);
        const match = value.match(/^\+(\d+)\s+-(\d+)$/u);
        if (!match) {
          throw new Error(`Malformed status output: invalid branch.ab "${value}"`);
        }

        status.ahead = Number(match[1]);
        status.behind = Number(match[2]);
        continue;
      }

      continue;
    }

    if (token.startsWith("1 ") || token.startsWith("2 ")) {
      status.changedCount += 1;
      continue;
    }

    if (token.startsWith("u ")) {
      status.conflictCount += 1;
      continue;
    }

    if (token.startsWith("? ")) {
      status.untrackedCount += 1;
      continue;
    }

    if (token.startsWith("! ")) {
      continue;
    }

    throw new Error(`Malformed status output: unsupported record "${token}"`);
  }

  return {
    ...status,
    clean:
      status.changedCount === 0 &&
      status.untrackedCount === 0 &&
      status.conflictCount === 0,
  };
}
