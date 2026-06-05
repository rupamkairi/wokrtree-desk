import { describe, expect, it } from "vitest";

import type {
  BranchRef,
  CommitPage,
  ProjectDetails,
  ProjectSummary,
} from "../../src/core/domain/types";
import type { DesktopBridge } from "../../src/platform/contracts/desktopBridge";
import { createRepositoryStore } from "../../src/ui/store/repositoryStore";

function makeProject(overrides: Partial<ProjectDetails> = {}): ProjectDetails {
  return {
    id: "/repo/.git",
    displayName: "repo",
    selectedPath: "/repo",
    primaryPath: "/repo",
    commonGitDir: "/repo/.git",
    defaults: {
      worktreeRoot: "/repo-worktrees",
      preferredEditor: "cursor",
      preferredTerminal: "terminal",
    },
    worktrees: [],
    ...overrides,
  };
}

function makeBranch(overrides: Partial<BranchRef> = {}): BranchRef {
  return {
    fullRef: "refs/heads/main",
    name: "main",
    sha: "abc",
    checkedOut: true,
    checkedOutPath: "/repo",
    isDefault: true,
    ...overrides,
  };
}

/**
 * Faithful in-memory stand-in for the desktop bridge. It models the part that
 * matters for loading: registered projects are keyed by id, and getProject
 * looks them up by that same id (mirroring JsonProjectRegistry).
 */
class FakeBridge implements DesktopBridge {
  private readonly registry = new Map<string, ProjectDetails>();

  constructor(
    private readonly options: {
      chosenPath?: string | null;
      project?: ProjectDetails;
      branches?: BranchRef[];
      commits?: CommitPage;
    } = {},
  ) {}

  chosenPathRequests = 0;

  async chooseRepositoryDirectory() {
    this.chosenPathRequests += 1;
    return this.options.chosenPath ?? null;
  }

  async openPath() {}

  async getProjects(): Promise<ProjectSummary[]> {
    return [...this.registry.values()].map((project) => ({
      id: project.id,
      displayName: project.displayName,
      primaryPath: project.primaryPath,
      worktreeCount: project.worktrees.length,
      modifiedWorktreeCount: 0,
      attentionCount: 0,
      defaults: project.defaults,
    }));
  }

  async getProject(input: { projectId: string }): Promise<ProjectDetails> {
    const project = this.registry.get(input.projectId);
    if (!project) {
      throw new Error(`No project registered for ${input.projectId}`);
    }
    return project;
  }

  async registerProject(): Promise<ProjectDetails> {
    const project = this.options.project ?? makeProject();
    this.registry.set(project.id, project);
    return project;
  }

  async updateProjectDefaults(): Promise<ProjectDetails> {
    return this.options.project ?? makeProject();
  }

  async getBranchRefs(): Promise<BranchRef[]> {
    return this.options.branches ?? [makeBranch()];
  }

  async getCommits(): Promise<CommitPage> {
    return (
      this.options.commits ?? {
        branchName: "main",
        commits: [],
        skip: 0,
        limit: 20,
        hasMore: false,
      }
    );
  }

  async previewCreateWorktree(): Promise<never> {
    throw new Error("not used");
  }

  async createWorktree(): Promise<never> {
    throw new Error("not used");
  }

  async refreshProject(input: { projectId: string }): Promise<ProjectDetails> {
    return this.getProject(input);
  }

  async getLastOperation() {
    return null;
  }
}

describe("repository store — add project flow", () => {
  it("loads the chosen repository as the selected project", async () => {
    const project = makeProject();
    const bridge = new FakeBridge({ chosenPath: "/repo", project });
    const store = createRepositoryStore(bridge);

    await store.getState().addProject();

    const state = store.getState();
    expect(state.selectedProject?.id).toBe(project.id);
    expect(state.view).toBe("repositories");
  });

  it("loads branches and commits for the newly added repository", async () => {
    const project = makeProject();
    const branches = [makeBranch({ name: "main", isDefault: true })];
    const commits = {
      branchName: "main",
      commits: [
        {
          hash: "a".repeat(40),
          shortHash: "aaaaaaa",
          author: "Dev",
          date: "2026-06-01T00:00:00+00:00",
          subject: "initial",
          parents: [],
          isMerge: false,
        },
      ],
      skip: 0,
      limit: 20,
      hasMore: false,
    };
    const bridge = new FakeBridge({ chosenPath: "/repo", project, branches, commits });
    const store = createRepositoryStore(bridge);

    await store.getState().addProject();

    const state = store.getState();
    expect(state.branches.map((branch) => branch.name)).toEqual(["main"]);
    expect(state.selectedBranch).toBe("main");
    expect(state.commits).toHaveLength(1);
  });

  it("does nothing when the directory picker is cancelled", async () => {
    const bridge = new FakeBridge({ chosenPath: null });
    const store = createRepositoryStore(bridge);

    await store.getState().addProject();

    const state = store.getState();
    expect(state.selectedProject).toBeNull();
    expect(state.errorMessage).toBeNull();
  });

  it("surfaces an error instead of loading nothing when registration fails", async () => {
    const bridge = new FakeBridge({ chosenPath: "/repo" });
    bridge.registerProject = async () => {
      throw new Error("not a git worktree");
    };
    const store = createRepositoryStore(bridge);

    await store.getState().addProject();

    const state = store.getState();
    expect(state.selectedProject).toBeNull();
    expect(state.errorMessage).toBe("not a git worktree");
  });
});
