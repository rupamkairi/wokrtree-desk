import { useEffect, useMemo, useState } from "react";

import type {
  BranchRef,
  CreateWorktreePreview,
  OperationDetails,
  ProjectDefaults,
  ProjectDetails,
  ProjectSummary,
} from "../core/domain/types";
import { desktopBridge } from "./bridge/electrobunDesktopBridge";
import { CreateProjectPanel } from "./components/CreateProjectPanel";
import { CreateWorktreePanel } from "./components/CreateWorktreePanel";
import { OperationPanel } from "./components/OperationPanel";
import { ProjectDefaultsForm } from "./components/ProjectDefaultsForm";
import { ProjectsSidebar } from "./components/ProjectsSidebar";
import { WorktreeBoard } from "./components/WorktreeBoard";
import { WorktreeInspector } from "./components/WorktreeInspector";
import {
  buildDefaultProjectDefaults,
  buildSuggestedWorktreePath,
} from "./lib/projectDefaults";

type InspectorMode =
  | "worktree"
  | "projectDefaults"
  | "createProject"
  | "createWorktree";

type CreateWorktreeState = {
  branchMode: "existing" | "new";
  existingBranch: string;
  newBranchName: string;
  baseRef: string;
  targetPath: string;
  hasCustomTargetPath: boolean;
};

function App() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [selectedWorktreePath, setSelectedWorktreePath] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [worktreeFilter, setWorktreeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [operation, setOperation] = useState<OperationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>("worktree");
  const [createProjectPath, setCreateProjectPath] = useState<string | null>(null);
  const [createProjectDefaults, setCreateProjectDefaults] =
    useState<ProjectDefaults | null>(null);
  const [projectDefaultsDraft, setProjectDefaultsDraft] =
    useState<ProjectDefaults | null>(null);
  const [branchRefs, setBranchRefs] = useState<BranchRef[]>([]);
  const [createWorktreeState, setCreateWorktreeState] =
    useState<CreateWorktreeState | null>(null);
  const [createWorktreePreview, setCreateWorktreePreview] =
    useState<CreateWorktreePreview | null>(null);

  const filteredProjects = useMemo(() => {
    const normalizedFilter = projectFilter.trim().toLowerCase();
    if (!normalizedFilter) {
      return projects;
    }

    return projects.filter((project) =>
      [project.displayName, project.primaryPath].some((value) =>
        value.toLowerCase().includes(normalizedFilter),
      ),
    );
  }, [projectFilter, projects]);

  const filteredWorktrees = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    const normalizedFilter = worktreeFilter.trim().toLowerCase();
    if (!normalizedFilter) {
      return selectedProject.worktrees;
    }

    return selectedProject.worktrees.filter((worktree) =>
      [worktree.displayBranch, worktree.path].some((value) =>
        value.toLowerCase().includes(normalizedFilter),
      ),
    );
  }, [selectedProject, worktreeFilter]);

  const selectedWorktree =
    selectedProject?.worktrees.find(
      (worktree) => worktree.path === selectedWorktreePath,
    ) ?? null;

  async function loadProject(projectId: string) {
    const project = await desktopBridge.getProject({ projectId });
    setSelectedProject(project);
    setSelectedWorktreePath(project.worktrees[0]?.path ?? null);
    setProjectDefaultsDraft(project.defaults);
  }

  async function refreshProjectsList() {
    const nextProjects = await desktopBridge.getProjects();
    setProjects(nextProjects);
    return nextProjects;
  }

  async function syncLastOperation() {
    const latestOperation = await desktopBridge.getLastOperation();
    setOperation(latestOperation);
    return latestOperation;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      try {
        const [initialProjects, latestOperation] = await Promise.all([
          desktopBridge.getProjects(),
          desktopBridge.getLastOperation(),
        ]);

        if (cancelled) {
          return;
        }

        setProjects(initialProjects);
        setOperation(latestOperation);

        if (initialProjects[0]) {
          const project = await desktopBridge.getProject({
            projectId: initialProjects[0].id,
          });

          if (!cancelled) {
            setSelectedProject(project);
            setSelectedWorktreePath(project.worktrees[0]?.path ?? null);
            setProjectDefaultsDraft(project.defaults);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load application state.",
          );
        }
      }
    }

    void loadInitialState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProject || !createWorktreeState || inspectorMode !== "createWorktree") {
      setCreateWorktreePreview(null);
      return;
    }

    const activeProject = selectedProject;
    const activeCreateState = createWorktreeState;
    const branchName =
      activeCreateState.branchMode === "existing"
        ? activeCreateState.existingBranch
        : activeCreateState.newBranchName;

    if (
      !branchName ||
      !activeCreateState.targetPath ||
      (activeCreateState.branchMode === "new" && !activeCreateState.baseRef)
    ) {
      setCreateWorktreePreview(null);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      try {
        const preview = await desktopBridge.previewCreateWorktree({
          projectId: activeProject.id,
          branchMode: activeCreateState.branchMode,
          branchName,
          baseRef:
            activeCreateState.branchMode === "new"
              ? activeCreateState.baseRef
              : undefined,
          targetPath: activeCreateState.targetPath,
        });

        if (!cancelled) {
          setCreateWorktreePreview(preview);
        }
      } catch {
        if (!cancelled) {
          setCreateWorktreePreview(null);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [createWorktreeState, inspectorMode, selectedProject]);

  async function handleAddProject() {
    setInspectorMode("createProject");
    setErrorMessage(null);
    setCreateProjectPath(null);
    setCreateProjectDefaults(null);
  }

  async function handlePickProjectDirectory() {
    setErrorMessage(null);
    const selectedPath = await desktopBridge.chooseRepositoryDirectory();
    if (!selectedPath) {
      return;
    }

    setCreateProjectPath(selectedPath);
    setCreateProjectDefaults(buildDefaultProjectDefaults(selectedPath));
  }

  async function handleRegisterProject() {
    if (!createProjectPath || !createProjectDefaults) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      const project = await desktopBridge.registerProject({
        selectedPath: createProjectPath,
        defaults: createProjectDefaults,
      });
      const nextProjects = await refreshProjectsList();
      setSelectedProject(project);
      setSelectedWorktreePath(project.worktrees[0]?.path ?? null);
      setProjectDefaultsDraft(project.defaults);
      setInspectorMode("worktree");
      setCreateProjectPath(null);
      setCreateProjectDefaults(null);
      setProjects(nextProjects);
      await syncLastOperation();
    } catch (error) {
      await syncLastOperation();
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to register the project.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSelectProject(projectId: string) {
    setIsWorking(true);
    setErrorMessage(null);

    try {
      await loadProject(projectId);
      setInspectorMode("worktree");
      await refreshProjectsList();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load the selected project.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRefreshProject() {
    if (!selectedProject) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      const project = await desktopBridge.refreshProject({
        projectId: selectedProject.id,
      });
      setSelectedProject(project);
      setSelectedWorktreePath((currentSelection) => {
        if (
          currentSelection &&
          project.worktrees.some((worktree) => worktree.path === currentSelection)
        ) {
          return currentSelection;
        }

        return project.worktrees[0]?.path ?? null;
      });
      setProjectDefaultsDraft(project.defaults);
      await refreshProjectsList();
      await syncLastOperation();
    } catch (error) {
      await syncLastOperation();
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to refresh the selected project.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSaveProjectDefaults() {
    if (!selectedProject || !projectDefaultsDraft) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      const project = await desktopBridge.updateProjectDefaults({
        projectId: selectedProject.id,
        defaults: projectDefaultsDraft,
      });
      setSelectedProject(project);
      await refreshProjectsList();
      setInspectorMode("worktree");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save project defaults.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleStartCreateWorktree() {
    if (!selectedProject) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      const branches = await desktopBridge.getBranchRefs({
        projectId: selectedProject.id,
      });
      const preferredExistingBranch =
        branches.find((branch) => !branch.checkedOut)?.name ?? branches[0]?.name ?? "";
      const defaultBaseRef = branches[0]?.name ?? "";

      setBranchRefs(branches);
      setCreateWorktreeState({
        branchMode: "existing",
        existingBranch: preferredExistingBranch,
        newBranchName: "",
        baseRef: defaultBaseRef,
        targetPath: buildSuggestedWorktreePath(
          selectedProject.defaults.worktreeRoot,
          preferredExistingBranch || defaultBaseRef,
        ),
        hasCustomTargetPath: false,
      });
      setInspectorMode("createWorktree");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to prepare worktree creation.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  function updateCreateWorktreeState(
    updater: (currentState: CreateWorktreeState) => CreateWorktreeState,
  ) {
    setCreateWorktreeState((currentState) => {
      if (!currentState || !selectedProject) {
        return currentState;
      }

      const nextState = updater(currentState);
      const branchName =
        nextState.branchMode === "existing"
          ? nextState.existingBranch
          : nextState.newBranchName;

      if (!nextState.hasCustomTargetPath) {
        nextState.targetPath = buildSuggestedWorktreePath(
          selectedProject.defaults.worktreeRoot,
          branchName,
        );
      }

      return nextState;
    });
  }

  async function handleCreateWorktree() {
    if (!selectedProject || !createWorktreeState) {
      return;
    }

    const branchName =
      createWorktreeState.branchMode === "existing"
        ? createWorktreeState.existingBranch
        : createWorktreeState.newBranchName;

    setIsWorking(true);
    setErrorMessage(null);

    try {
      const result = await desktopBridge.createWorktree({
        projectId: selectedProject.id,
        branchMode: createWorktreeState.branchMode,
        branchName,
        baseRef:
          createWorktreeState.branchMode === "new"
            ? createWorktreeState.baseRef
            : undefined,
        targetPath: createWorktreeState.targetPath,
      });
      setSelectedProject(result.project);
      setSelectedWorktreePath(result.createdPath);
      setInspectorMode("worktree");
      setCreateWorktreeState(null);
      setCreateWorktreePreview(null);
      await refreshProjectsList();
      await syncLastOperation();
    } catch (error) {
      await syncLastOperation();
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create the worktree.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleOpenPath(path: string) {
    try {
      await desktopBridge.openPath({ path });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to open the requested path.",
      );
    }
  }

  return (
    <main className="h-screen bg-slate-200 text-slate-900">
      <div className="flex h-full min-w-[1180px] overflow-hidden">
        <ProjectsSidebar
          onAddProject={() => {
            void handleAddProject();
          }}
          onProjectFilterChange={setProjectFilter}
          onSelectProject={(projectId) => {
            void handleSelectProject(projectId);
          }}
          projectFilter={projectFilter}
          projects={filteredProjects}
          selectedProjectId={selectedProject?.id ?? null}
        />

        {selectedProject ? (
          <WorktreeBoard
            onCreateWorktree={() => {
              void handleStartCreateWorktree();
            }}
            onEditDefaults={() => setInspectorMode("projectDefaults")}
            onRefresh={() => {
              void handleRefreshProject();
            }}
            onSelectWorktree={(worktreePath) => {
              setSelectedWorktreePath(worktreePath);
              setInspectorMode("worktree");
            }}
            onToggleViewMode={setViewMode}
            onWorktreeFilterChange={setWorktreeFilter}
            project={selectedProject}
            selectedWorktreePath={selectedWorktreePath}
            viewMode={viewMode}
            worktreeFilter={worktreeFilter}
            worktrees={filteredWorktrees}
          />
        ) : (
          <section className="flex min-w-0 flex-1 items-center justify-center bg-slate-50">
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-8 py-10 text-center">
              <h1 className="text-2xl font-semibold text-slate-950">
                Worktree Desk
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                Register a project from the left sidebar to start managing worktrees,
                branches, and project defaults.
              </p>
              <button
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
                onClick={() => {
                  void handleAddProject();
                }}
                type="button"
              >
                Add Project
              </button>
            </div>
          </section>
        )}

        <aside className="flex h-full w-[400px] flex-col border-l border-slate-200 bg-slate-100/95">
          <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
            {errorMessage ? (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-4">
              {inspectorMode === "createProject" ? (
                <CreateProjectPanel
                  defaults={createProjectDefaults}
                  isWorking={isWorking}
                  onChangeDefaults={setCreateProjectDefaults}
                  onPickDirectory={() => {
                    void handlePickProjectDirectory();
                  }}
                  onSubmit={() => {
                    void handleRegisterProject();
                  }}
                  selectedPath={createProjectPath}
                />
              ) : null}

              {inspectorMode === "projectDefaults" && projectDefaultsDraft ? (
                <section className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-semibold text-slate-950">
                      Project Defaults
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Configure the default worktree root and preferred launchers for
                      future worktree creation.
                    </p>
                  </div>
                  <div className="space-y-4 px-5 py-5">
                    <ProjectDefaultsForm
                      defaults={projectDefaultsDraft}
                      onChange={setProjectDefaultsDraft}
                    />
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isWorking}
                      onClick={() => {
                        void handleSaveProjectDefaults();
                      }}
                      type="button"
                    >
                      {isWorking ? "Saving..." : "Save Defaults"}
                    </button>
                  </div>
                </section>
              ) : null}

              {inspectorMode === "createWorktree" &&
              selectedProject &&
              createWorktreeState ? (
                <CreateWorktreePanel
                  baseRef={createWorktreeState.baseRef}
                  branchMode={createWorktreeState.branchMode}
                  branches={branchRefs}
                  existingBranch={createWorktreeState.existingBranch}
                  isWorking={isWorking}
                  newBranchName={createWorktreeState.newBranchName}
                  onChangeBaseRef={(value) =>
                    updateCreateWorktreeState((currentState) => ({
                      ...currentState,
                      baseRef: value,
                    }))
                  }
                  onChangeBranchMode={(value) =>
                    updateCreateWorktreeState((currentState) => ({
                      ...currentState,
                      branchMode: value,
                    }))
                  }
                  onChangeExistingBranch={(value) =>
                    updateCreateWorktreeState((currentState) => ({
                      ...currentState,
                      existingBranch: value,
                    }))
                  }
                  onChangeNewBranchName={(value) =>
                    updateCreateWorktreeState((currentState) => ({
                      ...currentState,
                      newBranchName: value,
                    }))
                  }
                  onChangeTargetPath={(value) =>
                    updateCreateWorktreeState((currentState) => ({
                      ...currentState,
                      targetPath: value,
                      hasCustomTargetPath: true,
                    }))
                  }
                  onSubmit={() => {
                    void handleCreateWorktree();
                  }}
                  preview={createWorktreePreview}
                  project={selectedProject}
                  targetPath={createWorktreeState.targetPath}
                />
              ) : null}

              {inspectorMode === "worktree" && selectedProject ? (
                <WorktreeInspector
                  onOpenPath={(path) => {
                    void handleOpenPath(path);
                  }}
                  project={selectedProject}
                  worktree={selectedWorktree}
                />
              ) : null}

              <OperationPanel operation={operation} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default App;
