import type { CommandRunner } from "../../core/ports/commandRunner";

// When the app is launched as a bundled .app (double-clicked / `open`), the
// process inherits launchd's minimal PATH (typically /usr/bin:/bin:/usr/sbin:
// /sbin) — it does NOT include Homebrew. `open` lives in /usr/bin so it resolves,
// but a Homebrew `git` (/opt/homebrew/bin or /usr/local/bin) does not, so
// Bun.spawn("git", ...) fails as "ENOENT ... posix_spawn 'git'". Prepend the
// common install dirs so executables resolve regardless of how the app started.
const COMMON_BIN_DIRS = [
  "/opt/homebrew/bin",
  "/opt/homebrew/sbin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
];

function resolvedPath(): string {
  const inherited = process.env.PATH ?? "";
  const seen = new Set<string>();
  const dirs: string[] = [];
  for (const dir of [...inherited.split(":"), ...COMMON_BIN_DIRS]) {
    if (dir && !seen.has(dir)) {
      seen.add(dir);
      dirs.push(dir);
    }
  }
  return dirs.join(":");
}

export class BunSpawnCommandRunner implements CommandRunner {
  private readonly path = resolvedPath();

  async run(
    executable: string,
    args: string[],
    options: { cwd: string },
  ) {
    const startedAt = new Date();
    const child = Bun.spawn([executable, ...args], {
      cwd: options.cwd,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: this.path },
    });

    const stdoutPromise = child.stdout
      ? new Response(child.stdout).text()
      : Promise.resolve("");
    const stderrPromise = child.stderr
      ? new Response(child.stderr).text()
      : Promise.resolve("");

    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      stdoutPromise,
      stderrPromise,
    ]);
    const finishedAt = new Date();

    return {
      executable,
      args,
      cwd: options.cwd,
      exitCode,
      stdout,
      stderr,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      success: exitCode === 0,
    };
  }
}
