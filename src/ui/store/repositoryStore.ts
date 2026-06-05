import { create } from "zustand";

import type {
  BranchRef,
  CommitSummary,
  OperationDetails,
  ProjectDetails,
  ProjectSummary,
} from "../../core/domain/types";
import type { DesktopBridge } from "../../platform/contracts/desktopBridge";

const COMMIT_PAGE_SIZE = 20;

export type AppView = "repositories" | "worktrees";
export type BranchTab = "branches" | "pulls";
export type DetailTab = "changes" | "history";

type RepositoryState = {
  view: AppView;

  projects: ProjectSummary[];
  selectedProject: ProjectDetails | null;
  projectFilter: string;

  branches: BranchRef[];
  branchFilter: string;
  selectedBranch: string | null;
  branchTab: BranchTab;

  detailTab: DetailTab;
  commits: CommitSummary[];
  commitsHasMore: boolean;
  commitsSkip: number;

  lastOperation: OperationDetails | null;
  errorMessage: string | null;

  isLoadingProjects: boolean;
  isLoadingProject: boolean;
  isLoadingCommits: boolean;
  isLoadingMoreCommits: boolean;

  init: () => Promise<void>;
  setView: (view: AppView) => void;
  setProjectFilter: (value: string) => void;
  setBranchFilter: (value: string) => void;
  setBranchTab: (tab: BranchTab) => void;
  setDetailTab: (tab: DetailTab) => void;
  addProject: () => Promise<void>;
  showRepositoryList: () => void;
  selectProject: (projectId: string) => Promise<void>;
  refreshProject: () => Promise<void>;
  selectBranch: (branchName: string) => Promise<void>;
  loadMoreCommits: () => Promise<void>;
  openPath: (path: string) => Promise<void>;
  clearError: () => void;
};

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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
  view: "repositories",

  projects: [],
  selectedProject: null,
  projectFilter: "",

  branches: [],
  branchFilter: "",
  selectedBranch: null,
  branchTab: "branches",

  detailTab: "history",
  commits: [],
  commitsHasMore: false,
  commitsSkip: 0,

  lastOperation: null,
  errorMessage: null,

  isLoadingProjects: false,
  isLoadingProject: false,
  isLoadingCommits: false,
  isLoadingMoreCommits: false,

  async init() {
    set({ isLoadingProjects: true, errorMessage: null });
    try {
      const [projects, lastOperation] = await Promise.all([
        bridge.getProjects(),
        bridge.getLastOperation(),
      ]);
      set({ projects, lastOperation, isLoadingProjects: false });

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

  setView(view) {
    set({ view });
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
      view: "repositories",
      selectedProject: null,
      branches: [],
      selectedBranch: null,
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
      view: "repositories",
      selectedBranch: null,
      commits: [],
      commitsHasMore: false,
      commitsSkip: 0,
    });
    try {
      const project = await bridge.getProject({ projectId });
      const branches = await bridge.getBranchRefs({ projectId });
      set({ selectedProject: project, branches, isLoadingProject: false });

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

    set({
      selectedBranch: branchName,
      detailTab: "history",
      isLoadingCommits: true,
      commits: [],
      commitsSkip: 0,
      commitsHasMore: false,
      errorMessage: null,
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

  clearError() {
    set({ errorMessage: null });
  },
  }));
}

export type RepositoryStore = ReturnType<typeof createRepositoryStore>;
