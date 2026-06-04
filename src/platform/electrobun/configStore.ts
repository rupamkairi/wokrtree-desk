import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { app } from "electrobun/bun";

import { upsertProjectInList } from "../../core/domain/projectRegistryState";
import type { ConfigState, ProjectDetails } from "../../core/domain/types";
import type { ProjectRegistryPort } from "../../core/ports/projectRegistryPort";
import { configStateSchema } from "../contracts/schemas";

const defaultState: ConfigState = {
  version: 2,
  projects: [],
  selectedProjectId: null,
};

export class JsonProjectRegistry implements ProjectRegistryPort {
  private readonly filePath: string;

  constructor() {
    const baseStatePath =
      app.statePath || path.join(process.cwd(), ".worktree-desk-state");
    this.filePath = path.join(baseStatePath, "worktree-desk-projects.json");
  }

  async getProjects(): Promise<ProjectDetails[]> {
    const state = await this.readState();
    return state.projects;
  }

  async getProject(projectId: string): Promise<ProjectDetails | null> {
    const state = await this.readState();
    return state.projects.find((project) => project.id === projectId) ?? null;
  }

  async saveProject(project: ProjectDetails): Promise<void> {
    const state = await this.readState();
    await this.writeState({
      ...state,
      projects: upsertProjectInList(state.projects, project),
      selectedProjectId: project.id,
    });
  }

  async removeProject(projectId: string): Promise<void> {
    const state = await this.readState();
    const projects = state.projects.filter((project) => project.id !== projectId);
    const selectedProjectId =
      state.selectedProjectId === projectId
        ? projects[0]?.id ?? null
        : state.selectedProjectId;

    await this.writeState({
      ...state,
      projects,
      selectedProjectId,
    });
  }

  async getSelectedProjectId(): Promise<string | null> {
    const state = await this.readState();
    return state.selectedProjectId;
  }

  async setSelectedProjectId(projectId: string | null): Promise<void> {
    const state = await this.readState();
    await this.writeState({
      ...state,
      selectedProjectId: projectId,
    });
  }

  private async readState(): Promise<ConfigState> {
    try {
      const contents = await readFile(this.filePath, "utf8");
      return configStateSchema.parse(JSON.parse(contents));
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return defaultState;
      }

      return defaultState;
    }
  }

  private async writeState(state: ConfigState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      `${JSON.stringify(configStateSchema.parse(state), null, 2)}\n`,
      "utf8",
    );
  }
}
