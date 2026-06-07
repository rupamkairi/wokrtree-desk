import type { EditorTarget } from "../../core/domain/types";
import { EDITOR_TARGETS } from "../../core/editors/editorTargets";
import { OperationError } from "../../core/errors/operationError";
import { toOperationDetails } from "../../core/operations/toOperationDetails";
import type { CommandRunner } from "../../core/ports/commandRunner";

/**
 * Probes each supported editor/terminal with `open -Ra "<App>"` (exit 0 = the app
 * is registered with LaunchServices, anywhere on disk) and returns the installed
 * subset, in the declared order.
 */
export async function detectEditors(
  commandRunner: CommandRunner,
): Promise<EditorTarget[]> {
  const checks = await Promise.all(
    EDITOR_TARGETS.map(async (target) => {
      const result = await commandRunner.run("open", ["-Ra", target.app], {
        cwd: "/",
      });
      return result.success ? target : null;
    }),
  );

  return checks.filter((target): target is EditorTarget => target !== null);
}

/** Launches a path in the given macOS application via `open -a "<App>" <path>`. */
export async function openWith(
  commandRunner: CommandRunner,
  app: string,
  path: string,
): Promise<void> {
  const result = await commandRunner.run("open", ["-a", app, path], { cwd: "/" });
  if (!result.success) {
    const detail = result.stderr.trim() || `exit ${result.exitCode}`;
    throw new OperationError(
      `Unable to open with ${app} (${detail}).`,
      toOperationDetails(result),
    );
  }
}
