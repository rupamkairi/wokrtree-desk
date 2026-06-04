import { BrowserView, Utils } from "electrobun/bun";

import { toProjectSummary } from "../../core/domain/projectSummary";
import type {
  OperationDetails,
  ProjectDefaults,
} from "../../core/domain/types";
import { OperationError } from "../../core/errors/operationError";
import { listBranchRefs } from "../../core/git/services/gitBranchService";
import { createWorktree } from "../../core/git/services/gitWorktreeMutationService";
import { previewCreateWorktree } from "../../core/git/services/gitWorktreePreviewService";
import { loadProjectDetails } from "../../core/git/services/gitWorktreeService";
import { BunSpawnCommandRunner } from "./commandRunner";
import { JsonProjectRegistry } from "./configStore";
import {
  branchRefSchema,
  createWorktreePreviewSchema,
  createWorktreeRequestSchema,
  createWorktreeResultSchema,
  getBranchRefsRequestSchema,
  getProjectRequestSchema,
  operationDetailsNullableSchema,
  openPathRequestSchema,
  projectDetailsSchema,
  projectSummarySchema,
  registerProjectRequestSchema,
  repositorySelectionResultSchema,
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

  return repositorySelectionResultSchema.parse({
    selectedPath: selectedPaths[0] ?? null,
  });
}

async function openPath(params: { path: string }) {
  const request = openPathRequestSchema.parse(params);
  Utils.openPath(request.path);
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

async function getLastOperation() {
  return operationDetailsNullableSchema.parse(lastOperation);
}

export function createDesktopRpc() {
  return BrowserView.defineRPC<DesktopElectrobunRpcSchema>({
    handlers: {
      requests: {
        chooseRepositoryDirectory,
        openPath,
        getProjects,
        getProject,
        registerProject,
        updateProjectDefaults,
        getBranchRefs,
        previewCreateWorktree: previewWorktree,
        createWorktree: createProjectWorktree,
        refreshProject,
        getLastOperation,
      },
    },
  });
}
