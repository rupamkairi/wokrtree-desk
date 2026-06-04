import type { OperationDetails } from "../domain/types";

export class OperationError extends Error {
  readonly operation: OperationDetails;

  constructor(message: string, operation: OperationDetails) {
    super(message);
    this.name = "OperationError";
    this.operation = operation;
  }
}
