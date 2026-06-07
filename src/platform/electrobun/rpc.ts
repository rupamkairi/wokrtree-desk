import { BrowserView, Utils } from "electrobun/bun";

import { toProjectSummary } from "../../core/domain/projectSummary";
import type {
  OperationDetails,
  ProjectDefaults,
} from "../../core/domain/types";
import { OperationError } from "../../core/errors/operationError";
import { toOperationDetails } from "../../core/operations/toOperationDetails";
import { createBranch } from "../../core/git/services/gitBranchMutationService";
import { listBranchRefs } from "../../core/git/services/gitBranchService";
import {
  listCommitChanges,
  listWorktreeChanges,
} from "../../core/git/services/gitChangesService";
import { listCommits } from "../../core/git/services/gitCommitService";
import { getFileDiff } from "../../core/git/services/gitDiffService";
import { getRemoteInfo } from "../../core/git/services/gitRemoteService";
import {
  createWorktree,
  switchWorktreeBranch,
} from "../../core/git/services/gitWorktreeMutationService";
import { detectEditors, openWith } from "./editorService";
import { previewCreateWorktree } from "../../core/git/services/gitWorktreePreviewService";
import { loadProjectDetails } from "../../core/git/services/gitWorktreeService";
import { BunSpawnCommandRunner } from "./commandRunner";
import { JsonProjectRegistry } from "./configStore";
import {
  branchRefSchema,
  changedFileSchema,
  commitPageSchema,
  createBranchRequestSchema,
  createBranchResultSchema,
  createWorktreePreviewSchema,
  createWorktreeRequestSchema,
  createWorktreeResultSchema,
  editorTargetSchema,
  fileDiffRequestSchema,
  fileDiffSchema,
  getCommitChangesRequestSchema,
  getWorktreeChangesRequestSchema,
  openWithRequestSchema,
  remoteInfoSchema,
  getBranchRefsRequestSchema,
  getCommitsRequestSchema,
  getProjectRequestSchema,
  operationDetailsNullableSchema,
  openPathRequestSchema,
  projectDetailsSchema,
  projectSummarySchema,
  registerProjectRequestSchema,
  repositorySelectionResultSchema,
  switchWorktreeBranchRequestSchema,
  switchWorktreeBranchResultSchema,
  updateProjectDefaultsRequestSchema,
} from "../contracts/schemas";
import type { DesktopElectrobunRpcSchema } from "../contracts/electrobunRpc";

const commandRunner = new BunSpawnCommandRunner();
const projectRegistry = new JsonProjectRegistry();

let lastOperation: OperationDetails | null = null;

function setLastOperation(operation: OperationDetails | null): OperationDetails | null {
  lastOperation = operation;
  return lastOperation;
}

async function getStoredProject(projectId: string) {
  const project = await projectRegistry.getProject(projectId);
  if (!project) {
    throw new Error("No registered project matched the requested project.");
  }

  return project;
}

async function chooseRepositoryDirectory() {
  const selectedPaths = await Utils.openFileDialog({
    canChooseFiles: false,
    canChooseDirectory: true,
    allowsMultipleSelection: false,
  });

  // Utils.openFileDialog returns `result.split(",")`, so a cancelled dialog
  // yields [""] rather than []. Drop blank entries before picking the first.
  const firstPath = selectedPaths
    .map((path) => path.trim())
    .find((path) => path.length > 0);

  return repositorySelectionResultSchema.parse({
    selectedPath: firstPath ?? null,
  });
}

function cleanDialogPaths(selectedPaths: string[]): string[] {
  // Utils.openFileDialog returns `result.split(",")`, so a cancelled dialog
  // yields [""]. Drop blank entries before returning real selections.
  return selectedPaths.map((path) => path.trim()).filter((path) => path.length > 0);
}

async function chooseFiles(params?: { startingFolder?: string }) {
  const selectedPaths = await Utils.openFileDialog({
    startingFolder: params?.startingFolder,
    canChooseFiles: true,
    canChooseDirectory: false,
    allowsMultipleSelection: true,
  });
  return cleanDialogPaths(selectedPaths);
}

async function chooseFolders(params?: { startingFolder?: string }) {
  const selectedPaths = await Utils.openFileDialog({
    startingFolder: params?.startingFolder,
    canChooseFiles: false,
    canChooseDirectory: true,
    allowsMultipleSelection: true,
  });
  return cleanDialogPaths(selectedPaths);
}

async function createProjectBranch(params: {
  projectId: string;
  branchName: string;
  baseRef: string;
  checkout: boolean;
}) {
  const request = createBranchRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);

  try {
    const result = await createBranch(commandRunner, project, request);
    setLastOperation(result.operation);
    return createBranchResultSchema.parse(result);
  } catch (error) {
    if (error instanceof OperationError) {
      setLastOperation(error.operation);
    }

    throw error;
  }
}

async function openPath(params: { path: string }) {
  const request = openPathRequestSchema.parse(params);

  // Utils.openPath is the native NSWorkspace call and returns false on failure
  // (e.g. it cannot reach the GUI session). When that happens, fall back to a
  // spawned `open <path>` so we capture the real exit code + stderr instead of
  // failing silently.
  const opened = Utils.openPath(request.path);
  if (opened) {
    return;
  }

  const result = await commandRunner.run("open", [request.path], { cwd: "/" });
  setLastOperation(toOperationDetails(result));
  if (!result.success) {
    const detail = result.stderr.trim() || `exit ${result.exitCode}`;
    throw new OperationError(
      `Unable to open ${request.path} in Finder (${detail}).`,
      toOperationDetails(result),
    );
  }
}

async function getProjects() {
  const [projects, selectedProjectId] = await Promise.all([
    projectRegistry.getProjects(),
    projectRegistry.getSelectedProjectId(),
  ]);
  const summaries = projects.map(toProjectSummary).sort((left, right) => {
    if (left.id === selectedProjectId) {
      return -1;
    }

    if (right.id === selectedProjectId) {
      return 1;
    }

    return left.displayName.localeCompare(right.displayName);
  });

  return summaries.map((summary) => projectSummarySchema.parse(summary));
}

async function getProject(params: { projectId: string }) {
  const request = getProjectRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);
  await projectRegistry.setSelectedProjectId(project.id);
  return projectDetailsSchema.parse(project);
}

async function registerProject(params: {
  selectedPath: string;
  defaults: ProjectDefaults;
}) {
  const request = registerProjectRequestSchema.parse(params);

  try {
    const { project, operation } = await loadProjectDetails(
      commandRunner,
      request.selectedPath,
      request.defaults,
    );
    setLastOperation(operation);
    await projectRegistry.saveProject(project);
    return projectDetailsSchema.parse(project);
  } catch (error) {
    if (error instanceof OperationError) {
      setLastOperation(error.operation);
    }

    throw error;
  }
}

async function updateProjectDefaults(params: {
  projectId: string;
  defaults: ProjectDefaults;
}) {
  const request = updateProjectDefaultsRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);
  const updatedProject = {
    ...project,
    defaults: request.defaults,
  };
  await projectRegistry.saveProject(updatedProject);
  return projectDetailsSchema.parse(updatedProject);
}

async function getBranchRefs(params: { projectId: string }) {
  const request = getBranchRefsRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);
  const branches = await listBranchRefs(commandRunner, project);
  return branches.map((branch) => branchRefSchema.parse(branch));
}

async function getCommits(params: {
  projectId: string;
  branchName: string;
  limit?: number;
  skip?: number;
}) {
  const request = getCommitsRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);
  const page = await listCommits(commandRunner, project, {
    branchName: request.branchName,
    limit: request.limit,
    skip: request.skip,
  });
  return commitPageSchema.parse(page);
}

async function previewWorktree(params: {
  projectId: string;
  branchMode: "existing" | "new";
  branchName: string;
  targetPath: string;
  baseRef?: string;
}) {
  const request = createWorktreeRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);
  return createWorktreePreviewSchema.parse(
    await previewCreateWorktree(project, request),
  );
}

async function createProjectWorktree(params: {
  projectId: string;
  branchMode: "existing" | "new";
  branchName: string;
  targetPath: string;
  baseRef?: string;
}) {
  const request = createWorktreeRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);

  try {
    const result = await createWorktree(commandRunner, project, request);
    setLastOperation(result.operation);
    await projectRegistry.saveProject(result.project);
    return createWorktreeResultSchema.parse(result);
  } catch (error) {
    if (error instanceof OperationError) {
      setLastOperation(error.operation);
    }

    throw error;
  }
}

async function refreshProject(params: { projectId: string }) {
  const request = getProjectRequestSchema.parse(params);
  const storedProject = await getStoredProject(request.projectId);

  try {
    const { project, operation } = await loadProjectDetails(
      commandRunner,
      storedProject.primaryPath,
      storedProject.defaults,
    );
    setLastOperation(operation);
    await projectRegistry.saveProject(project);
    return projectDetailsSchema.parse(project);
  } catch (error) {
    if (error instanceof OperationError) {
      setLastOperation(error.operation);
    }

    throw error;
  }
}

async function switchProjectWorktreeBranch(params: {
  projectId: string;
  worktreePath: string;
  branchName: string;
}) {
  const request = switchWorktreeBranchRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);

  try {
    const result = await switchWorktreeBranch(
      commandRunner,
      request.worktreePath,
      request.branchName,
      { cwd: project.primaryPath },
    );
    setLastOperation(result.operation);
    return switchWorktreeBranchResultSchema.parse(result);
  } catch (error) {
    if (error instanceof OperationError) {
      setLastOperation(error.operation);
    }

    throw error;
  }
}

let cachedEditors: ReturnType<typeof editorTargetSchema.parse>[] | null = null;

async function listEditors() {
  if (!cachedEditors) {
    const detected = await detectEditors(commandRunner);
    cachedEditors = detected.map((editor) => editorTargetSchema.parse(editor));
  }
  return cachedEditors;
}

async function openWithApp(params: { app: string; path: string }) {
  const request = openWithRequestSchema.parse(params);
  try {
    await openWith(commandRunner, request.app, request.path);
  } catch (error) {
    if (error instanceof OperationError) {
      setLastOperation(error.operation);
    }
    throw error;
  }
}

async function getWorktreeChanges(params: { projectId: string; worktreePath: string }) {
  const request = getWorktreeChangesRequestSchema.parse(params);
  await getStoredProject(request.projectId);
  const changes = await listWorktreeChanges(commandRunner, request.worktreePath);
  return changes.map((file) => changedFileSchema.parse(file));
}

async function getCommitChanges(params: { projectId: string; hash: string }) {
  const request = getCommitChangesRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);
  const changes = await listCommitChanges(commandRunner, project, request.hash);
  return changes.map((file) => changedFileSchema.parse(file));
}

async function getFileDiffHandler(params: unknown) {
  const request = fileDiffRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);
  return fileDiffSchema.parse(await getFileDiff(commandRunner, project, request));
}

async function getProjectRemoteInfo(params: { projectId: string }) {
  const request = getProjectRequestSchema.parse(params);
  const project = await getStoredProject(request.projectId);
  return remoteInfoSchema.parse(await getRemoteInfo(commandRunner, project));
}

async function getLastOperation() {
  return operationDetailsNullableSchema.parse(lastOperation);
}

export function createDesktopRpc() {
  return BrowserView.defineRPC<DesktopElectrobunRpcSchema>({
    handlers: {
      requests: {
        chooseRepositoryDirectory,
        chooseFiles,
        chooseFolders,
        openPath,
        getProjects,
        getProject,
        registerProject,
        updateProjectDefaults,
        getBranchRefs,
        getCommits,
        createBranch: createProjectBranch,
        previewCreateWorktree: previewWorktree,
        createWorktree: createProjectWorktree,
        refreshProject,
        switchWorktreeBranch: switchProjectWorktreeBranch,
        listEditors,
        openWith: openWithApp,
        getWorktreeChanges,
        getCommitChanges,
        getFileDiff: getFileDiffHandler,
        getRemoteInfo: getProjectRemoteInfo,
        getLastOperation,
      },
    },
  });
}
