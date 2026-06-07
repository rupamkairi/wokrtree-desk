import { create } from "zustand";

import type {
  BranchRef,
  ChangedFile,
  CommitSummary,
  CreateWorktreePreview,
  CreateWorktreeRequest,
  CreateWorktreeResult,
  EditorTarget,
  FileDiff,
  OperationDetails,
  ProjectDetails,
  ProjectSummary,
  RemoteInfo,
  WorktreeSnapshot,
} from "../../core/domain/types";
import type { DesktopBridge } from "../../platform/contracts/desktopBridge";

const COMMIT_PAGE_SIZE = 20;

export type BranchTab = "branches" | "worktrees";
export type DetailTab = "changes" | "history";

type RepositoryState = {
  projects: ProjectSummary[];
  selectedProject: ProjectDetails | null;
  projectFilter: string;

  branches: BranchRef[];
  branchFilter: string;
  selectedBranch: string | null;
  /** Path of the worktree currently driving the panels (Worktrees tab), or null. */
  focusedWorktree: string | null;
  branchTab: BranchTab;

  detailTab: DetailTab;
  commits: CommitSummary[];
  commitsHasMore: boolean;
  commitsSkip: number;

  availableEditors: EditorTarget[];
  remoteInfo: RemoteInfo | null;

  changes: ChangedFile[];
  changesWorktreePath: string | null;
  isLoadingChanges: boolean;

  selectedCommit: string | null;
  commitChanges: ChangedFile[];
  isLoadingCommitChanges: boolean;

  selectedFile: string | null;
  diff: FileDiff | null;
  isLoadingDiff: boolean;

  lastOperation: OperationDetails | null;
  errorMessage: string | null;

  isLoadingProjects: boolean;
  isLoadingProject: boolean;
  isLoadingCommits: boolean;
  isLoadingMoreCommits: boolean;

  init: () => Promise<void>;
  setProjectFilter: (value: string) => void;
  setBranchFilter: (value: string) => void;
  setBranchTab: (tab: BranchTab) => void;
  setDetailTab: (tab: DetailTab) => void;
  addProject: () => Promise<void>;
  showRepositoryList: () => void;
  selectProject: (projectId: string) => Promise<void>;
  refreshProject: () => Promise<void>;
  selectBranch: (branchName: string) => Promise<void>;
  focusWorktree: (worktree: WorktreeSnapshot) => Promise<void>;
  switchWorktreeBranch: (
    worktreePath: string,
    branchName: string,
  ) => Promise<boolean>;
  /** Lazily totals a worktree's working-tree changes for the hover tooltip. */
  getWorktreeChangeStats: (
    worktreePath: string,
  ) => Promise<{ files: number; additions: number; deletions: number } | null>;
  loadMoreCommits: () => Promise<void>;
  openPath: (path: string) => Promise<void>;
  createBranch: (input: {
    branchName: string;
    baseRef: string;
    checkout: boolean;
  }) => Promise<boolean>;
  previewCreateWorktree: (
    request: CreateWorktreeRequest,
  ) => Promise<CreateWorktreePreview | null>;
  createWorktree: (
    request: CreateWorktreeRequest,
  ) => Promise<CreateWorktreeResult | null>;
  chooseFiles: () => Promise<string[]>;
  chooseFolders: () => Promise<string[]>;
  openWith: (app: string, path: string) => Promise<void>;
  selectCommit: (hash: string) => Promise<void>;
  selectChangedFile: (
    file: ChangedFile,
    source: "worktree" | "commit",
  ) => Promise<void>;
  clearError: () => void;
};

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  // RPC rejections can cross the bridge as plain objects/strings rather than
  // Error instances; still surface their message so the real failure shows.
  if (typeof error === "string" && error) {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) {
      return message;
    }
  }
  return fallback;
}

function pickInitialBranch(branches: BranchRef[]): string | null {
  const active = branches.find((branch) => branch.checkedOut);
  if (active) {
    return active.name;
  }

  const fallbackDefault = branches.find((branch) => branch.isDefault);
  return fallbackDefault?.name ?? branches[0]?.name ?? null;
}

export function createRepositoryStore(bridge: DesktopBridge) {
  return create<RepositoryState>((set, get) => ({
  projects: [],
  selectedProject: null,
  projectFilter: "",

  branches: [],
  branchFilter: "",
  selectedBranch: null,
  focusedWorktree: null,
  branchTab: "branches",

  detailTab: "history",
  commits: [],
  commitsHasMore: false,
  commitsSkip: 0,

  availableEditors: [],
  remoteInfo: null,

  changes: [],
  changesWorktreePath: null,
  isLoadingChanges: false,

  selectedCommit: null,
  commitChanges: [],
  isLoadingCommitChanges: false,

  selectedFile: null,
  diff: null,
  isLoadingDiff: false,

  lastOperation: null,
  errorMessage: null,

  isLoadingProjects: false,
  isLoadingProject: false,
  isLoadingCommits: false,
  isLoadingMoreCommits: false,

  async init() {
    set({ isLoadingProjects: true, errorMessage: null });
    try {
      const [projects, lastOperation, availableEditors] = await Promise.all([
        bridge.getProjects(),
        bridge.getLastOperation(),
        bridge.listEditors().catch(() => []),
      ]);
      set({ projects, lastOperation, availableEditors, isLoadingProjects: false });

      if (projects[0]) {
        await get().selectProject(projects[0].id);
      }
    } catch (error) {
      set({
        isLoadingProjects: false,
        errorMessage: toMessage(error, "Unable to load application state."),
      });
    }
  },

  setProjectFilter(value) {
    set({ projectFilter: value });
  },

  setBranchFilter(value) {
    set({ branchFilter: value });
  },

  setBranchTab(tab) {
    set({ branchTab: tab });
  },

  setDetailTab(tab) {
    set({ detailTab: tab });
  },

  async addProject() {
    set({ errorMessage: null });
    try {
      const selectedPath = await bridge.chooseRepositoryDirectory();
      if (!selectedPath) {
        return;
      }

      const leaf = selectedPath.replace(/\/+$/u, "").split("/").pop() ?? "project";
      const parent = selectedPath.replace(/\/+$/u, "").split("/").slice(0, -1).join("/") || "/";

      const project = await bridge.registerProject({
        selectedPath,
        defaults: {
          worktreeRoot: `${parent}/${leaf}-worktrees`,
          preferredEditor: "cursor",
          preferredTerminal: "terminal",
        },
      });

      const projects = await bridge.getProjects();
      set({ projects });
      await get().selectProject(project.id);
    } catch (error) {
      set({ errorMessage: toMessage(error, "Unable to register the project.") });
    }
  },

  showRepositoryList() {
    set({
      selectedProject: null,
      branches: [],
      selectedBranch: null,
      focusedWorktree: null,
      commits: [],
      commitsHasMore: false,
      commitsSkip: 0,
      branchFilter: "",
    });
  },

  async selectProject(projectId) {
    set({
      isLoadingProject: true,
      errorMessage: null,
      selectedBranch: null,
      focusedWorktree: null,
      commits: [],
      commitsHasMore: false,
      commitsSkip: 0,
    });
    try {
      const project = await bridge.getProject({ projectId });
      const branches = await bridge.getBranchRefs({ projectId });
      set({ selectedProject: project, branches, isLoadingProject: false });

      void bridge
        .getRemoteInfo({ projectId })
        .then((remoteInfo) => set({ remoteInfo }))
        .catch(() => set({ remoteInfo: null }));

      const initialBranch = pickInitialBranch(branches);
      if (initialBranch) {
        await get().selectBranch(initialBranch);
      }
    } catch (error) {
      set({
        isLoadingProject: false,
        errorMessage: toMessage(error, "Unable to load the selected project."),
      });
    }
  },

  async refreshProject() {
    const project = get().selectedProject;
    if (!project) {
      return;
    }

    set({ isLoadingProject: true, errorMessage: null });
    try {
      const refreshed = await bridge.refreshProject({ projectId: project.id });
      const branches = await bridge.getBranchRefs({ projectId: project.id });
      const [projects, lastOperation] = await Promise.all([
        bridge.getProjects(),
        bridge.getLastOperation(),
      ]);
      set({
        selectedProject: refreshed,
        branches,
        projects,
        lastOperation,
        isLoadingProject: false,
      });

      const current = get().selectedBranch;
      const stillExists = branches.some((branch) => branch.name === current);
      const nextBranch = stillExists ? current : pickInitialBranch(branches);
      if (nextBranch) {
        await get().selectBranch(nextBranch);
      }
    } catch (error) {
      set({
        isLoadingProject: false,
        errorMessage: toMessage(error, "Unable to refresh the project."),
      });
    }
  },

  async selectBranch(branchName) {
    const project = get().selectedProject;
    if (!project) {
      return;
    }

    const branch = get().branches.find((entry) => entry.name === branchName);
    const worktreePath = branch?.checkedOut ? branch.checkedOutPath ?? null : null;

    set({
      selectedBranch: branchName,
      focusedWorktree: null,
      detailTab: "history",
      isLoadingCommits: true,
      commits: [],
      commitsSkip: 0,
      commitsHasMore: false,
      errorMessage: null,
      // Reset diff/commit/changes selection for the new branch.
      selectedCommit: null,
      commitChanges: [],
      selectedFile: null,
      diff: null,
      changes: [],
      changesWorktreePath: worktreePath,
    });
    try {
      const page = await bridge.getCommits({
        projectId: project.id,
        branchName,
        limit: COMMIT_PAGE_SIZE,
        skip: 0,
      });
      set({
        commits: page.commits,
        commitsHasMore: page.hasMore,
        commitsSkip: page.skip + page.commits.length,
        isLoadingCommits: false,
      });
    } catch (error) {
      set({
        isLoadingCommits: false,
        errorMessage: toMessage(error, "Unable to load commit history."),
      });
    }

    // Load working-tree changes for the worktree this branch is checked out in.
    if (worktreePath) {
      set({ isLoadingChanges: true });
      try {
        const changes = await bridge.getWorktreeChanges({
          projectId: project.id,
          worktreePath,
        });
        // Ignore if the user moved on to another branch meanwhile.
        if (get().selectedBranch === branchName) {
          set({ changes, isLoadingChanges: false });
        }
      } catch (error) {
        set({
          isLoadingChanges: false,
          errorMessage: toMessage(error, "Unable to load working-tree changes."),
        });
      }
    }
  },

  async focusWorktree(worktree) {
    const project = get().selectedProject;
    if (!project) {
      return;
    }

    const detached = worktree.detached || worktree.displayBranch === "detached";
    // Non-detached worktrees log their branch; detached ones log from HEAD.
    const ref = detached ? worktree.headOid ?? null : worktree.displayBranch;

    set({
      focusedWorktree: worktree.path,
      // Keep the Branches tab highlight in sync when the worktree has a branch.
      selectedBranch: detached ? null : worktree.displayBranch,
      detailTab: "history",
      isLoadingCommits: true,
      commits: [],
      commitsSkip: 0,
      commitsHasMore: false,
      errorMessage: null,
      selectedCommit: null,
      commitChanges: [],
      selectedFile: null,
      diff: null,
      changes: [],
      changesWorktreePath: worktree.path,
    });

    if (ref) {
      try {
        const page = await bridge.getCommits({
          projectId: project.id,
          branchName: ref,
          limit: COMMIT_PAGE_SIZE,
          skip: 0,
        });
        if (get().focusedWorktree === worktree.path) {
          set({
            commits: page.commits,
            commitsHasMore: page.hasMore,
            commitsSkip: page.skip + page.commits.length,
            isLoadingCommits: false,
          });
        }
      } catch (error) {
        set({
          isLoadingCommits: false,
          errorMessage: toMessage(error, "Unable to load commit history."),
        });
      }
    } else {
      set({ isLoadingCommits: false });
    }

    // Working-tree changes for this worktree.
    set({ isLoadingChanges: true });
    try {
      const changes = await bridge.getWorktreeChanges({
        projectId: project.id,
        worktreePath: worktree.path,
      });
      if (get().focusedWorktree === worktree.path) {
        set({ changes, isLoadingChanges: false });
      }
    } catch (error) {
      set({
        isLoadingChanges: false,
        errorMessage: toMessage(error, "Unable to load working-tree changes."),
      });
    }
  },

  async switchWorktreeBranch(worktreePath, branchName) {
    const project = get().selectedProject;
    if (!project) {
      return false;
    }

    set({ errorMessage: null });
    try {
      await bridge.switchWorktreeBranch({
        projectId: project.id,
        worktreePath,
        branchName,
      });
      const wasFocused = get().focusedWorktree === worktreePath;
      await get().refreshProject();
      // Re-focus the same worktree so the panels reflect its new branch.
      if (wasFocused) {
        const updated = get().selectedProject?.worktrees.find(
          (entry) => entry.path === worktreePath,
        );
        if (updated) {
          await get().focusWorktree(updated);
        }
      }
      return true;
    } catch (error) {
      set({ errorMessage: toMessage(error, `Unable to switch to ${branchName}.`) });
      return false;
    }
  },

  async getWorktreeChangeStats(worktreePath) {
    const project = get().selectedProject;
    if (!project) {
      return null;
    }
    try {
      const changes = await bridge.getWorktreeChanges({
        projectId: project.id,
        worktreePath,
      });
      return changes.reduce(
        (acc, file) => ({
          files: acc.files + 1,
          additions: acc.additions + (file.additions ?? 0),
          deletions: acc.deletions + (file.deletions ?? 0),
        }),
        { files: 0, additions: 0, deletions: 0 },
      );
    } catch {
      return null;
    }
  },

  async loadMoreCommits() {
    const { selectedProject, selectedBranch, commitsSkip, commitsHasMore } = get();
    if (!selectedProject || !selectedBranch || !commitsHasMore) {
      return;
    }

    set({ isLoadingMoreCommits: true });
    try {
      const page = await bridge.getCommits({
        projectId: selectedProject.id,
        branchName: selectedBranch,
        limit: COMMIT_PAGE_SIZE,
        skip: commitsSkip,
      });
      set((state) => ({
        commits: [...state.commits, ...page.commits],
        commitsHasMore: page.hasMore,
        commitsSkip: state.commitsSkip + page.commits.length,
        isLoadingMoreCommits: false,
      }));
    } catch (error) {
      set({
        isLoadingMoreCommits: false,
        errorMessage: toMessage(error, "Unable to load more commits."),
      });
    }
  },

  async openPath(path) {
    try {
      await bridge.openPath({ path });
    } catch (error) {
      set({ errorMessage: toMessage(error, "Unable to open the requested path.") });
    }
  },

  async createBranch({ branchName, baseRef, checkout }) {
    const project = get().selectedProject;
    if (!project) {
      return false;
    }

    set({ errorMessage: null });
    try {
      await bridge.createBranch({
        projectId: project.id,
        branchName,
        baseRef,
        checkout,
      });
      await get().refreshProject();
      const exists = get().branches.some((branch) => branch.name === branchName);
      if (exists) {
        await get().selectBranch(branchName);
      }
      return true;
    } catch (error) {
      set({ errorMessage: toMessage(error, "Unable to create the branch.") });
      return false;
    }
  },

  async previewCreateWorktree(request) {
    const project = get().selectedProject;
    if (!project) {
      return null;
    }

    try {
      return await bridge.previewCreateWorktree({ ...request, projectId: project.id });
    } catch (error) {
      set({ errorMessage: toMessage(error, "Unable to preview the worktree.") });
      return null;
    }
  },

  async createWorktree(request) {
    const project = get().selectedProject;
    if (!project) {
      return null;
    }

    set({ errorMessage: null });
    try {
      const result = await bridge.createWorktree({ ...request, projectId: project.id });
      await get().refreshProject();
      set({ branchTab: "worktrees" });
      return result;
    } catch (error) {
      set({ errorMessage: toMessage(error, "Unable to create the worktree.") });
      return null;
    }
  },

  async chooseFiles() {
    try {
      return await bridge.chooseFiles();
    } catch (error) {
      set({ errorMessage: toMessage(error, "Unable to open the file picker.") });
      return [];
    }
  },

  async chooseFolders() {
    try {
      return await bridge.chooseFolders();
    } catch (error) {
      set({ errorMessage: toMessage(error, "Unable to open the folder picker.") });
      return [];
    }
  },

  async openWith(app, path) {
    try {
      await bridge.openWith({ app, path });
    } catch (error) {
      set({ errorMessage: toMessage(error, `Unable to open with ${app}.`) });
    }
  },

  async selectCommit(hash) {
    const project = get().selectedProject;
    if (!project) {
      return;
    }

    set({
      selectedCommit: hash,
      isLoadingCommitChanges: true,
      commitChanges: [],
      selectedFile: null,
      diff: null,
      errorMessage: null,
    });
    try {
      const commitChanges = await bridge.getCommitChanges({ projectId: project.id, hash });
      if (get().selectedCommit === hash) {
        set({ commitChanges, isLoadingCommitChanges: false });
      }
    } catch (error) {
      set({
        isLoadingCommitChanges: false,
        errorMessage: toMessage(error, "Unable to load commit changes."),
      });
    }
  },

  async selectChangedFile(file, source) {
    const project = get().selectedProject;
    if (!project) {
      return;
    }

    const request =
      source === "commit"
        ? {
            projectId: project.id,
            kind: "commit" as const,
            path: file.path,
            oldPath: file.oldPath,
            hash: get().selectedCommit ?? undefined,
          }
        : {
            projectId: project.id,
            kind: "worktree" as const,
            path: file.path,
            oldPath: file.oldPath,
            worktreePath: get().changesWorktreePath ?? project.primaryPath,
          };

    set({ selectedFile: file.path, isLoadingDiff: true, diff: null, errorMessage: null });
    try {
      const diff = await bridge.getFileDiff(request);
      if (get().selectedFile === file.path) {
        set({ diff, isLoadingDiff: false });
      }
    } catch (error) {
      set({
        isLoadingDiff: false,
        errorMessage: toMessage(error, "Unable to load the file diff."),
      });
    }
  },

  clearError() {
    set({ errorMessage: null });
  },
  }));
}

export type RepositoryStore = ReturnType<typeof createRepositoryStore>;
