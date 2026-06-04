import { BrowserView, Utils } from "electrobun/bun";

import type { OperationDetails, ProjectSnapshot } from "../../core/domain/types";
import { OperationError } from "../../core/errors/operationError";
import { loadProjectSnapshot } from "../../core/git/services/gitWorktreeService";
import { BunSpawnCommandRunner } from "./commandRunner";
import { JsonProjectRegistry } from "./configStore";
import {
  operationDetailsNullableSchema,
  projectSnapshotNullableSchema,
  projectSnapshotSchema,
  refreshRepositoryRequestSchema,
  registerRepositoryRequestSchema,
  repositorySelectionResultSchema,
} from "../contracts/schemas";
import type { DesktopElectrobunRpcSchema } from "../contracts/electrobunRpc";

const commandRunner = new BunSpawnCommandRunner();
const projectRegistry = new JsonProjectRegistry();

let lastOperation: OperationDetails | null = null;

function setLastOperation(operation: OperationDetails | null): OperationDetails | null {
  lastOperation = operation;
  return lastOperation;
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

async function registerRepository(params: { selectedPath: string }) {
  const request = registerRepositoryRequestSchema.parse(params);

  try {
    const { project, operation } = await loadProjectSnapshot(
      commandRunner,
      request.selectedPath,
    );
    setLastOperation(operation);
    await projectRegistry.saveRegisteredProject(project);
    return projectSnapshotSchema.parse(project);
  } catch (error) {
    if (error instanceof OperationError) {
      setLastOperation(error.operation);
    }

    throw error;
  }
}

async function refreshRepository(params: { projectId: string }) {
  const request = refreshRepositoryRequestSchema.parse(params);
  const savedProject = await projectRegistry.getRegisteredProject();

  if (!savedProject || savedProject.id !== request.projectId) {
    throw new Error("No registered repository matched the requested project.");
  }

  try {
    const { project, operation } = await loadProjectSnapshot(
      commandRunner,
      savedProject.primaryPath,
    );
    setLastOperation(operation);
    await projectRegistry.saveRegisteredProject(project);
    return projectSnapshotSchema.parse(project);
  } catch (error) {
    if (error instanceof OperationError) {
      setLastOperation(error.operation);
    }

    throw error;
  }
}

async function getRegisteredProject(): Promise<ProjectSnapshot | null> {
  const project = await projectRegistry.getRegisteredProject();
  return projectSnapshotNullableSchema.parse(project);
}

async function getLastOperation() {
  return operationDetailsNullableSchema.parse(lastOperation);
}

export function createDesktopRpc() {
  return BrowserView.defineRPC<DesktopElectrobunRpcSchema>({
    handlers: {
      requests: {
        chooseRepositoryDirectory,
        registerRepository,
        refreshRepository,
        getRegisteredProject,
        getLastOperation,
      },
    },
  });
}
