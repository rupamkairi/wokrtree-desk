import type {
  BranchRef,
  CreateWorktreePreview,
  CreateWorktreeRequest,
  CreateWorktreeResult,
  OperationDetails,
  ProjectDefaults,
  ProjectDetails,
  ProjectSummary,
} from "../../core/domain/types";

export interface DesktopBridge {
  chooseRepositoryDirectory(): Promise<string | null>;
  openPath(input: { path: string }): Promise<void>;
  getProjects(): Promise<ProjectSummary[]>;
  getProject(input: { projectId: string }): Promise<ProjectDetails>;
  registerProject(input: {
    selectedPath: string;
    defaults: ProjectDefaults;
  }): Promise<ProjectDetails>;
  updateProjectDefaults(input: {
    projectId: string;
    defaults: ProjectDefaults;
  }): Promise<ProjectDetails>;
  getBranchRefs(input: { projectId: string }): Promise<BranchRef[]>;
  previewCreateWorktree(
    input: CreateWorktreeRequest,
  ): Promise<CreateWorktreePreview>;
  createWorktree(input: CreateWorktreeRequest): Promise<CreateWorktreeResult>;
  refreshProject(input: { projectId: string }): Promise<ProjectDetails>;
  getLastOperation(): Promise<OperationDetails | null>;
}
