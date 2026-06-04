import type { OperationDetails } from "../domain/types";
import type { CommandResult } from "../ports/commandRunner";

function quoteArg(arg: string): string {
  if (arg.length === 0) {
    return '""';
  }

  return /[\s"]/u.test(arg) ? JSON.stringify(arg) : arg;
}

export function toOperationDetails(result: CommandResult): OperationDetails {
  const commandDisplay = [result.executable, ...result.args.map(quoteArg)].join(
    " ",
  );

  return {
    ...result,
    commandDisplay,
  };
}
