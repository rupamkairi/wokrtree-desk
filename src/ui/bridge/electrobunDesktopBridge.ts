import { Electroview } from "electrobun/view";

import type { DesktopBridge } from "../../platform/contracts/desktopBridge";
import type { DesktopElectrobunRpcSchema } from "../../platform/contracts/electrobunRpc";
import {
  branchRefSchema,
  commitPageSchema,
  createWorktreePreviewSchema,
  createWorktreeRequestSchema,
  createWorktreeResultSchema,
  getBranchRefsRequestSchema,
  getCommitsRequestSchema,
  getProjectRequestSchema,
  operationDetailsNullableSchema,
  openPathRequestSchema,
  projectDetailsSchema,
  projectSummarySchema,
  registerProjectRequestSchema,
  repositorySelectionResultSchema,
  updateProjectDefaultsRequestSchema,
} from "../../platform/contracts/schemas";

// Electrobun's default RPC timeout is 1000ms. That is far too short here:
// chooseRepositoryDirectory opens a native modal the user interacts with, and
// git-backed calls (status/log on cold spawn) can exceed a second. Give every
// request a generous window so a slow dialog or git call is not mistaken for a
// dead transport.
const RPC_MAX_REQUEST_TIME_MS = 120_000;

const rpc = Electroview.defineRPC<DesktopElectrobunRpcSchema>({
  maxRequestTime: RPC_MAX_REQUEST_TIME_MS,
  handlers: {
    requests: {},
  },
});

new Electroview({ rpc });

export const desktopBridge: DesktopBridge = {
  async chooseRepositoryDirectory() {
    const result = repositorySelectionResultSchema.parse(
      await rpc.request.chooseRepositoryDirectory(),
    );
    return result.selectedPath;
  },

  async openPath(input) {
    const request = openPathRequestSchema.parse(input);
    await rpc.request.openPath(request);
  },

  async getProjects() {
    const projects = await rpc.request.getProjects();
    return projectSummarySchema.array().parse(projects);
  },

  async getProject(input) {
    const request = getProjectRequestSchema.parse(input);
    return projectDetailsSchema.parse(await rpc.request.getProject(request));
  },

  async registerProject(input) {
    const request = registerProjectRequestSchema.parse(input);
    return projectDetailsSchema.parse(await rpc.request.registerProject(request));
  },

  async updateProjectDefaults(input) {
    const request = updateProjectDefaultsRequestSchema.parse(input);
    return projectDetailsSchema.parse(
      await rpc.request.updateProjectDefaults(request),
    );
  },

  async getBranchRefs(input) {
    const request = getBranchRefsRequestSchema.parse(input);
    return branchRefSchema.array().parse(await rpc.request.getBranchRefs(request));
  },

  async getCommits(input) {
    const request = getCommitsRequestSchema.parse(input);
    return commitPageSchema.parse(await rpc.request.getCommits(request));
  },

  async previewCreateWorktree(input) {
    const request = createWorktreeRequestSchema.parse(input);
    return createWorktreePreviewSchema.parse(
      await rpc.request.previewCreateWorktree(request),
    );
  },

  async createWorktree(input) {
    const request = createWorktreeRequestSchema.parse(input);
    return createWorktreeResultSchema.parse(
      await rpc.request.createWorktree(request),
    );
  },

  async refreshProject(input) {
    const request = getProjectRequestSchema.parse(input);
    return projectDetailsSchema.parse(await rpc.request.refreshProject(request));
  },

  async getLastOperation() {
    return operationDetailsNullableSchema.parse(await rpc.request.getLastOperation());
  },
};
