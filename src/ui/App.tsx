import { useEffect, useState } from "react";

import type {
  OperationDetails,
  ProjectSnapshot,
  WorktreeSnapshot,
} from "../core/domain/types";
import { desktopBridge } from "./bridge/electrobunDesktopBridge";

function formatOutputText(value: string): string {
  return value.split("\0").join("\\0");
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function WorktreeCard({ worktree }: { worktree: WorktreeSnapshot }) {
  const dirtyState = worktree.status.clean ? "Clean" : "Modified";

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            {worktree.displayBranch}
          </h3>
          <p className="mt-1 break-all text-sm leading-6 text-slate-600">
            {worktree.path}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            worktree.status.clean
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {dirtyState}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Changed
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-950">
            {worktree.status.changedCount}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Untracked
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-950">
            {worktree.status.untrackedCount}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Conflicts
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-950">
            {worktree.status.conflictCount}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function OperationPanel({ operation }: { operation: OperationDetails | null }) {
  if (!operation) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <h2 className="text-xl font-semibold text-slate-950">Operation details</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The latest Git command will appear here after a repository is selected or
          refreshed.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Operation details</h2>
          <p className="mt-1 text-sm text-slate-300">
            Last command finished at {formatTimestamp(operation.finishedAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            operation.success
              ? "bg-emerald-500/15 text-emerald-200"
              : "bg-rose-500/15 text-rose-200"
          }`}
        >
          {operation.success ? "Success" : "Failed"}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Command
          </dt>
          <dd className="mt-2 break-all font-mono text-slate-100">
            {operation.commandDisplay}
          </dd>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Cwd
          </dt>
          <dd className="mt-2 break-all font-mono text-slate-100">{operation.cwd}</dd>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Exit code
          </dt>
          <dd className="mt-2 font-mono text-slate-100">{operation.exitCode}</dd>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Duration
          </dt>
          <dd className="mt-2 font-mono text-slate-100">{operation.durationMs} ms</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            stdout
          </h3>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/20 p-3 text-xs leading-6 text-slate-100">
            {formatOutputText(operation.stdout) || "(empty)"}
          </pre>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            stderr
          </h3>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/20 p-3 text-xs leading-6 text-slate-100">
            {formatOutputText(operation.stderr) || "(empty)"}
          </pre>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [project, setProject] = useState<ProjectSnapshot | null>(null);
  const [operation, setOperation] = useState<OperationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  async function syncLastOperation() {
    const latestOperation = await desktopBridge.getLastOperation();
    setOperation(latestOperation);
    return latestOperation;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      try {
        const [savedProject, savedOperation] = await Promise.all([
          desktopBridge.getRegisteredProject(),
          desktopBridge.getLastOperation(),
        ]);

        if (cancelled) {
          return;
        }

        setProject(savedProject);
        setOperation(savedOperation);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load saved state.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialState();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelectRepository() {
    setIsWorking(true);
    setErrorMessage(null);

    try {
      const selectedPath = await desktopBridge.chooseRepositoryDirectory();
      if (!selectedPath) {
        return;
      }

      const nextProject = await desktopBridge.registerRepository({ selectedPath });
      setProject(nextProject);
      await syncLastOperation();
    } catch (error) {
      await syncLastOperation();
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to register repository.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRefresh() {
    if (!project) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      const nextProject = await desktopBridge.refreshRepository({
        projectId: project.id,
      });
      setProject(nextProject);
      await syncLastOperation();
    } catch (error) {
      await syncLastOperation();
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to refresh repository.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Phase 0 Capability Spike
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Electrobun, React, typed RPC, and Git porcelain working together.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                This spike proves repository selection, Bun-side Git execution through
                argument arrays, typed bridge calls, worktree/status parsing, and raw
                diagnostics visibility without adding mutation flows yet.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isWorking || isLoading}
                onClick={() => {
                  void handleSelectRepository();
                }}
                type="button"
              >
                {isWorking ? "Working..." : "Select Repository"}
              </button>
              <button
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isWorking || !project}
                onClick={() => {
                  void handleRefresh();
                }}
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {errorMessage ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6">
            <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    Registered repository
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    One repository is persisted for the Phase 0 spike.
                  </p>
                </div>
                <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  Electrobun + Bun.spawn()
                </div>
              </div>

              {project ? (
                <dl className="mt-6 grid gap-4 text-sm text-slate-700">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Project
                    </dt>
                    <dd className="mt-2 text-lg font-semibold text-slate-950">
                      {project.displayName}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Selected path
                    </dt>
                    <dd className="mt-2 break-all font-mono text-slate-950">
                      {project.selectedPath}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Primary path
                    </dt>
                    <dd className="mt-2 break-all font-mono text-slate-950">
                      {project.primaryPath}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Common Git dir
                    </dt>
                    <dd className="mt-2 break-all font-mono text-slate-950">
                      {project.commonGitDir}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm leading-6 text-slate-600">
                  Select a local Git repository or any existing worktree to populate the
                  spike UI.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Worktrees</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Branch, path, and clean or modified state from Git porcelain output.
                  </p>
                </div>
                <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {project ? `${project.worktrees.length} discovered` : "0 discovered"}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {project?.worktrees.length ? (
                  project.worktrees.map((worktree) => (
                    <WorktreeCard key={worktree.path} worktree={worktree} />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm leading-6 text-slate-600">
                    No worktrees loaded yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <OperationPanel operation={operation} />
        </section>
      </div>
    </main>
  );
}

export default App;
