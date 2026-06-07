import type { RPCSchema } from "electrobun/bun";

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
  RepositorySelectionResult,
  SwitchWorktreeBranchRequest,
  SwitchWorktreeBranchResult,
} from "../../core/domain/types";

type BunRequests = {
  chooseRepositoryDirectory: {
    params: undefined;
    response: RepositorySelectionResult;
  };
  chooseFiles: {
    params: { startingFolder?: string } | undefined;
    response: string[];
  };
  chooseFolders: {
    params: { startingFolder?: string } | undefined;
    response: string[];
  };
  openPath: {
    params: { path: string };
    response: void;
  };
  getProjects: {
    params: undefined;
    response: ProjectSummary[];
  };
  getProject: {
    params: { projectId: string };
    response: ProjectDetails;
  };
  registerProject: {
    params: { selectedPath: string; defaults: ProjectDefaults };
    response: ProjectDetails;
  };
  updateProjectDefaults: {
    params: { projectId: string; defaults: ProjectDefaults };
    response: ProjectDetails;
  };
  getBranchRefs: {
    params: { projectId: string };
    response: BranchRef[];
  };
  getCommits: {
    params: {
      projectId: string;
      branchName: string;
      limit?: number;
      skip?: number;
    };
    response: CommitPage;
  };
  createBranch: {
    params: CreateBranchRequest;
    response: CreateBranchResult;
  };
  previewCreateWorktree: {
    params: CreateWorktreeRequest;
    response: CreateWorktreePreview;
  };
  createWorktree: {
    params: CreateWorktreeRequest;
    response: CreateWorktreeResult;
  };
  refreshProject: {
    params: { projectId: string };
    response: ProjectDetails;
  };
  switchWorktreeBranch: {
    params: SwitchWorktreeBranchRequest;
    response: SwitchWorktreeBranchResult;
  };
  listEditors: {
    params: undefined;
    response: EditorTarget[];
  };
  openWith: {
    params: { app: string; path: string };
    response: void;
  };
  getWorktreeChanges: {
    params: { projectId: string; worktreePath: string };
    response: ChangedFile[];
  };
  getCommitChanges: {
    params: { projectId: string; hash: string };
    response: ChangedFile[];
  };
  getFileDiff: {
    params: FileDiffRequest;
    response: FileDiff;
  };
  getRemoteInfo: {
    params: { projectId: string };
    response: RemoteInfo;
  };
  getLastOperation: {
    params: undefined;
    response: OperationDetails | null;
  };
};

export type DesktopElectrobunRpcSchema = {
  bun: {
    requests: RPCSchema<{ requests: BunRequests }>["requests"];
    messages: RPCSchema["messages"];
  };
  webview: {
    requests: RPCSchema["requests"];
    messages: RPCSchema["messages"];
  };
};
