import type { ProjectDetails, WorktreeSnapshot } from "../../core/domain/types";

type WorktreeBoardProps = {
  project: ProjectDetails;
  worktrees: WorktreeSnapshot[];
  selectedWorktreePath: string | null;
  viewMode: "cards" | "table";
  worktreeFilter: string;
  onWorktreeFilterChange: (value: string) => void;
  onToggleViewMode: (viewMode: "cards" | "table") => void;
  onSelectWorktree: (worktreePath: string) => void;
  onRefresh: () => void;
  onEditDefaults: () => void;
  onCreateWorktree: () => void;
};

function WorktreeCard({
  worktree,
  isSelected,
  onSelect,
}: {
  worktree: WorktreeSnapshot;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`w-full rounded-lg border px-4 py-4 text-left transition ${
        isSelected
          ? "border-sky-500 bg-sky-50/80"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">
            {worktree.displayBranch}
          </div>
          <div className="mt-1 break-all text-xs leading-5 text-slate-500">
            {worktree.path}
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
            worktree.status.clean
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {worktree.status.clean ? "Clean" : "Modified"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-600">
        <span>↑{worktree.status.ahead}</span>
        <span>↓{worktree.status.behind}</span>
        <span>{worktree.status.changedCount} changed</span>
        <span>{worktree.status.untrackedCount} untracked</span>
        {worktree.lockedReason ? <span>Locked</span> : null}
        {worktree.prunableReason ? <span>Prunable</span> : null}
      </div>
    </button>
  );
}

export function WorktreeBoard({
  project,
  worktrees,
  selectedWorktreePath,
  viewMode,
  worktreeFilter,
  onWorktreeFilterChange,
  onToggleViewMode,
  onSelectWorktree,
  onRefresh,
  onEditDefaults,
  onCreateWorktree,
}: WorktreeBoardProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Selected project
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {project.displayName}
            </h1>
            <div className="mt-2 text-sm text-slate-600">{project.primaryPath}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              onClick={onEditDefaults}
              type="button"
            >
              Project Defaults
            </button>
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              onClick={onRefresh}
              type="button"
            >
              Refresh
            </button>
            <button
              className="h-10 rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
              onClick={onCreateWorktree}
              type="button"
            >
              Create Worktree
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Worktrees
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-950">
              {project.worktrees.length}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Modified
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-950">
              {project.worktrees.filter((worktree) => !worktree.status.clean).length}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Locked
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-950">
              {project.worktrees.filter((worktree) => worktree.lockedReason).length}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Default root
            </div>
            <div className="mt-1 truncate text-sm font-medium text-slate-950">
              {project.defaults.worktreeRoot}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <input
          className="h-10 w-full max-w-md rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          onChange={(event) => onWorktreeFilterChange(event.target.value)}
          placeholder="Filter worktrees by branch or path"
          type="search"
          value={worktreeFilter}
        />
        <div className="flex rounded-md border border-slate-300 bg-white p-1">
          <button
            className={`rounded px-3 py-1.5 text-xs font-semibold ${
              viewMode === "cards" ? "bg-slate-900 text-white" : "text-slate-700"
            }`}
            onClick={() => onToggleViewMode("cards")}
            type="button"
          >
            Cards
          </button>
          <button
            className={`rounded px-3 py-1.5 text-xs font-semibold ${
              viewMode === "table" ? "bg-slate-900 text-white" : "text-slate-700"
            }`}
            onClick={() => onToggleViewMode("table")}
            type="button"
          >
            Table
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-slate-50/60 px-6 py-5">
        {worktrees.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-600">
            No worktrees match the current filter.
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {worktrees.map((worktree) => (
              <WorktreeCard
                isSelected={worktree.path === selectedWorktreePath}
                key={worktree.path}
                onSelect={() => onSelectWorktree(worktree.path)}
                worktree={worktree}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Path</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ahead/Behind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {worktrees.map((worktree) => (
                  <tr
                    className={`cursor-pointer transition hover:bg-slate-50 ${
                      worktree.path === selectedWorktreePath ? "bg-sky-50" : ""
                    }`}
                    key={worktree.path}
                    onClick={() => onSelectWorktree(worktree.path)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {worktree.displayBranch}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{worktree.path}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {worktree.status.clean ? "Clean" : "Modified"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      ↑{worktree.status.ahead} ↓{worktree.status.behind}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
