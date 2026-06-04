import type { ProjectDetails, WorktreeSnapshot } from "../../core/domain/types";

type WorktreeInspectorProps = {
  project: ProjectDetails;
  worktree: WorktreeSnapshot | null;
  onOpenPath: (path: string) => void;
};

export function WorktreeInspector({
  project,
  worktree,
  onOpenPath,
}: WorktreeInspectorProps) {
  if (!worktree) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-950">Inspector</h2>
        </div>
        <div className="px-5 py-5 text-sm leading-6 text-slate-600">
          Select a worktree to inspect its path, branch, status, and quick actions.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-950">Selected Worktree</h2>
      </div>

      <div className="space-y-4 px-5 py-5 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Branch
          </div>
          <div className="mt-1 text-base font-semibold text-slate-950">
            {worktree.displayBranch}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Path
          </div>
          <div className="mt-1 break-all text-slate-700">{worktree.path}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status
            </div>
            <div className="mt-1 font-semibold text-slate-950">
              {worktree.status.clean ? "Clean" : "Modified"}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ahead / Behind
            </div>
            <div className="mt-1 font-semibold text-slate-950">
              ↑{worktree.status.ahead} ↓{worktree.status.behind}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Lock state
            </div>
            <div className="mt-1 font-semibold text-slate-950">
              {worktree.lockedReason ?? "Unlocked"}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Prunable
            </div>
            <div className="mt-1 font-semibold text-slate-950">
              {worktree.prunableReason ?? "No"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            onClick={() => onOpenPath(worktree.path)}
            type="button"
          >
            Open Worktree
          </button>
          <button
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            onClick={() => onOpenPath(project.primaryPath)}
            type="button"
          >
            Open Project Root
          </button>
        </div>
      </div>
    </section>
  );
}
