export function parseForEachRefOutput(output: string): Array<{
  fullRef: string;
  name: string;
  sha: string;
  committerDate?: string;
}> {
  const lines = output
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const [fullRef, name, sha, committerDate] = line.split("\0");
    if (!fullRef || !name || !sha) {
      throw new Error(`Malformed branch ref output: "${line}"`);
    }

    return {
      fullRef,
      name,
      sha,
      committerDate: committerDate || undefined,
    };
  });
}
