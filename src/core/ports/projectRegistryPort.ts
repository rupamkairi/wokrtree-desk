import type { ProjectDetails } from "../domain/types";

export interface ProjectRegistryPort {
  getProjects(): Promise<ProjectDetails[]>;
  getProject(projectId: string): Promise<ProjectDetails | null>;
  saveProject(project: ProjectDetails): Promise<void>;
  removeProject(projectId: string): Promise<void>;
  getSelectedProjectId(): Promise<string | null>;
  setSelectedProjectId(projectId: string | null): Promise<void>;
}
