export type CommandResult = {
  executable: string;
  args: string[];
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
};

export interface CommandRunner {
  run(
    executable: string,
    args: string[],
    options: { cwd: string },
  ): Promise<CommandResult>;
}
