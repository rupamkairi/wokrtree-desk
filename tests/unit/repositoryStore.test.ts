import { describe, expect, it } from "vitest";

import type {
  BranchRef,
  CommitPage,
  OperationDetails,
  ProjectDetails,
  ProjectSummary,
  WorktreeSnapshot,
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

function makeWorktree(overrides: Partial<WorktreeSnapshot> = {}): WorktreeSnapshot {
  return {
    path: "/repo-worktrees/feature",
    headOid: "f".repeat(40),
    branchRef: "refs/heads/feature",
    displayBranch: "feature",
    detached: false,
    bare: false,
    status: {
      ahead: 0,
      behind: 0,
      changedCount: 0,
      untrackedCount: 0,
      conflictCount: 0,
      clean: true,
      detached: false,
    },
    ...overrides,
  };
}

function makeOperation(): OperationDetails {
  return {
    executable: "git",
    args: [],
    cwd: "/repo",
    exitCode: 0,
    stdout: "",
    stderr: "",
    startedAt: "2026-06-01T00:00:00.000Z",
    finishedAt: "2026-06-01T00:00:00.000Z",
    durationMs: 0,
    success: true,
    commandDisplay: "git",
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

  async chooseFiles() {
    return [];
  }

  async chooseFolders() {
    return [];
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

  lastCommitsRequest: { branchName: string } | null = null;

  async getCommits(input: { branchName: string }): Promise<CommitPage> {
    this.lastCommitsRequest = { branchName: input.branchName };
    return (
      this.options.commits ?? {
        branchName: input.branchName,
        commits: [],
        skip: 0,
        limit: 20,
        hasMore: false,
      }
    );
  }

  async createBranch(): Promise<never> {
    throw new Error("not used");
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

  switchCalls: Array<{ worktreePath: string; branchName: string }> = [];

  async switchWorktreeBranch(input: {
    worktreePath: string;
    branchName: string;
  }) {
    this.switchCalls.push({
      worktreePath: input.worktreePath,
      branchName: input.branchName,
    });
    return {
      worktreePath: input.worktreePath,
      branchName: input.branchName,
      operation: makeOperation(),
    };
  }

  async listEditors() {
    return [];
  }

  async openWith() {}

  async getWorktreeChanges() {
    return [];
  }

  async getCommitChanges() {
    return [];
  }

  async getFileDiff(): Promise<never> {
    throw new Error("not used");
  }

  async getRemoteInfo() {
    return { baseUrl: null, host: "other" as const };
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
          authorEmail: "dev@example.com",
          date: "2026-06-01T00:00:00+00:00",
          subject: "initial",
          body: "",
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

describe("repository store — worktree focus + switch", () => {
  it("focuses a worktree, logging its checked-out branch and tracking its path", async () => {
    const project = makeProject({
      worktrees: [makeWorktree()],
    });
    const branches = [
      makeBranch({ name: "main" }),
      makeBranch({
        fullRef: "refs/heads/feature",
        name: "feature",
        checkedOut: true,
        checkedOutPath: "/repo-worktrees/feature",
        isDefault: false,
      }),
    ];
    const bridge = new FakeBridge({ chosenPath: "/repo", project, branches });
    const store = createRepositoryStore(bridge);
    await store.getState().addProject();

    await store.getState().focusWorktree(makeWorktree());

    const state = store.getState();
    expect(state.focusedWorktree).toBe("/repo-worktrees/feature");
    expect(state.changesWorktreePath).toBe("/repo-worktrees/feature");
    expect(state.selectedBranch).toBe("feature");
    expect(bridge.lastCommitsRequest?.branchName).toBe("feature");
  });

  it("logs from HEAD for a detached worktree and leaves no branch selected", async () => {
    const detached = makeWorktree({
      path: "/repo-worktrees/v1",
      displayBranch: "detached",
      detached: true,
      branchRef: undefined,
      status: {
        ahead: 0,
        behind: 0,
        changedCount: 0,
        untrackedCount: 0,
        conflictCount: 0,
        clean: true,
        detached: true,
      },
    });
    const project = makeProject({ worktrees: [detached] });
    const bridge = new FakeBridge({ chosenPath: "/repo", project });
    const store = createRepositoryStore(bridge);
    await store.getState().addProject();

    await store.getState().focusWorktree(detached);

    const state = store.getState();
    expect(state.focusedWorktree).toBe("/repo-worktrees/v1");
    expect(state.selectedBranch).toBeNull();
    expect(bridge.lastCommitsRequest?.branchName).toBe("f".repeat(40));
  });

  it("switches a worktree's branch through the bridge", async () => {
    const project = makeProject({ worktrees: [makeWorktree()] });
    const bridge = new FakeBridge({ chosenPath: "/repo", project });
    const store = createRepositoryStore(bridge);
    await store.getState().addProject();

    const ok = await store
      .getState()
      .switchWorktreeBranch("/repo-worktrees/feature", "release");

    expect(ok).toBe(true);
    expect(bridge.switchCalls).toEqual([
      { worktreePath: "/repo-worktrees/feature", branchName: "release" },
    ]);
  });
});
