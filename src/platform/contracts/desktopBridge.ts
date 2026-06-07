import type {
  BranchRef,
  ChangedFile,
  CommitPage,
  CreateBranchRequest,
  CreateBranchResult,
  CreateWorktreePreview,
  CreateWorktreeRequest,
  CreateWorktreeResult,
  EditorTarget,
  FileDiff,
  FileDiffRequest,
  OperationDetails,
  ProjectDefaults,
  ProjectDetails,
  ProjectSummary,
  RemoteInfo,
  SwitchWorktreeBranchRequest,
  SwitchWorktreeBranchResult,
} from "../../core/domain/types";

export interface DesktopBridge {
  chooseRepositoryDirectory(): Promise<string | null>;
  chooseFiles(input?: { startingFolder?: string }): Promise<string[]>;
  chooseFolders(input?: { startingFolder?: string }): Promise<string[]>;
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
  getCommits(input: {
    projectId: string;
    branchName: string;
    limit?: number;
    skip?: number;
  }): Promise<CommitPage>;
  createBranch(input: CreateBranchRequest): Promise<CreateBranchResult>;
  previewCreateWorktree(
    input: CreateWorktreeRequest,
  ): Promise<CreateWorktreePreview>;
  createWorktree(input: CreateWorktreeRequest): Promise<CreateWorktreeResult>;
  refreshProject(input: { projectId: string }): Promise<ProjectDetails>;
  switchWorktreeBranch(
    input: SwitchWorktreeBranchRequest,
  ): Promise<SwitchWorktreeBranchResult>;
  listEditors(): Promise<EditorTarget[]>;
  openWith(input: { app: string; path: string }): Promise<void>;
  getWorktreeChanges(input: {
    projectId: string;
    worktreePath: string;
  }): Promise<ChangedFile[]>;
  getCommitChanges(input: { projectId: string; hash: string }): Promise<ChangedFile[]>;
  getFileDiff(input: FileDiffRequest): Promise<FileDiff>;
  getRemoteInfo(input: { projectId: string }): Promise<RemoteInfo>;
  getLastOperation(): Promise<OperationDetails | null>;
}
