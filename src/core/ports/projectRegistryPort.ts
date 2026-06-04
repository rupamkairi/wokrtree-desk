import type { ProjectSnapshot } from "../domain/types";

export interface ProjectRegistryPort {
  getRegisteredProject(): Promise<ProjectSnapshot | null>;
  saveRegisteredProject(project: ProjectSnapshot): Promise<void>;
  clearRegisteredProject(): Promise<void>;
}
