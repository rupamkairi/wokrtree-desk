import type { CommitSummary } from "../../domain/types";

// Unit separator (US, 0x1f) splits fields within one commit record.
// Records are NUL-separated by `git log -z`.
const FIELD_SEPARATOR = "";

// git --format placeholders, joined by the unit separator above.
export const COMMIT_LOG_FORMAT = ["%H", "%h", "%an", "%aI", "%P", "%s"].join(
  "%x1f",
);

export function parseCommitLogOutput(output: string): CommitSummary[] {
  const records = output
    .split("\0")
    .map((record) => record.replace(/^\r?\n/u, ""))
    .filter((record) => record.length > 0);

  return records.map((record) => {
    const [hash, shortHash, author, date, parents, ...subjectParts] =
      record.split(FIELD_SEPARATOR);

    if (!hash || !shortHash || !author || !date) {
      throw new Error(`Malformed commit log output: "${record}"`);
    }

    const parentHashes = (parents ?? "")
      .split(" ")
      .map((parent) => parent.trim())
      .filter((parent) => parent.length > 0);

    return {
      hash,
      shortHash,
      author,
      date,
      subject: subjectParts.join(FIELD_SEPARATOR),
      parents: parentHashes,
      isMerge: parentHashes.length > 1,
    } satisfies CommitSummary;
  });
}
