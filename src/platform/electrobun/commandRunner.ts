import type { CommandRunner } from "../../core/ports/commandRunner";

export class BunSpawnCommandRunner implements CommandRunner {
  async run(
    executable: string,
    args: string[],
    options: { cwd: string },
  ) {
    const startedAt = new Date();
    const process = Bun.spawn([executable, ...args], {
      cwd: options.cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdoutPromise = process.stdout
      ? new Response(process.stdout).text()
      : Promise.resolve("");
    const stderrPromise = process.stderr
      ? new Response(process.stderr).text()
      : Promise.resolve("");

    const [exitCode, stdout, stderr] = await Promise.all([
      process.exited,
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
