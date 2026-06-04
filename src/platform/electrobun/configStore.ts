import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { app } from "electrobun/bun";
import { z } from "zod";

import type { ConfigState, ProjectSnapshot } from "../../core/domain/types";
import type { ProjectRegistryPort } from "../../core/ports/projectRegistryPort";
import { projectSnapshotSchema } from "../contracts/schemas";

const configStateSchema = z.object({
  version: z.literal(1),
  project: projectSnapshotSchema.nullable(),
});

const defaultState: ConfigState = {
  version: 1,
  project: null,
};

export class JsonProjectRegistry implements ProjectRegistryPort {
  private readonly filePath: string;

  constructor() {
    const baseStatePath =
      app.statePath || path.join(process.cwd(), ".worktree-desk-state");
    this.filePath = path.join(baseStatePath, "phase0-project.json");
  }

  async getRegisteredProject(): Promise<ProjectSnapshot | null> {
    const state = await this.readState();
    return state.project;
  }

  async saveRegisteredProject(project: ProjectSnapshot): Promise<void> {
    await this.writeState({
      version: 1,
      project,
    });
  }

  async clearRegisteredProject(): Promise<void> {
    await this.writeState(defaultState);
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
