import type {
  OperationDetails,
  ProjectSnapshot,
} from "../../core/domain/types";

export interface DesktopBridge {
  chooseRepositoryDirectory(): Promise<string | null>;
  registerRepository(input: { selectedPath: string }): Promise<ProjectSnapshot>;
  refreshRepository(input: { projectId: string }): Promise<ProjectSnapshot>;
  getRegisteredProject(): Promise<ProjectSnapshot | null>;
  getLastOperation(): Promise<OperationDetails | null>;
}
