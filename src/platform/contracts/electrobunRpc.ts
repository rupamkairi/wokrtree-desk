import type { RPCSchema } from "electrobun/bun";

import type {
  BranchRef,
  CommitPage,
  CreateWorktreePreview,
  CreateWorktreeRequest,
  CreateWorktreeResult,
  OperationDetails,
  ProjectDefaults,
  ProjectDetails,
  ProjectSummary,
  RepositorySelectionResult,
} from "../../core/domain/types";

type BunRequests = {
  chooseRepositoryDirectory: {
    params: undefined;
    response: RepositorySelectionResult;
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
