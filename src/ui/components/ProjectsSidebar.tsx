import type { ProjectSummary } from "../../core/domain/types";

type ProjectsSidebarProps = {
  projects: ProjectSummary[];
  projectFilter: string;
  selectedProjectId: string | null;
  onProjectFilterChange: (value: string) => void;
  onSelectProject: (projectId: string) => void;
  onAddProject: () => void;
};

export function ProjectsSidebar({
  projects,
  projectFilter,
  selectedProjectId,
  onProjectFilterChange,
  onSelectProject,
  onAddProject,
}: ProjectsSidebarProps) {
  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-slate-200 bg-slate-100/90">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Worktree Desk
        </div>
        <div className="mt-2 text-xl font-semibold text-slate-950">Projects</div>
      </div>

      <div className="border-b border-slate-200 px-4 py-3">
        <input
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          onChange={(event) => onProjectFilterChange(event.target.value)}
          placeholder="Filter projects"
          type="search"
          value={projectFilter}
        />
        <button
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={onAddProject}
          type="button"
        >
          Add Project
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {projects.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-sm leading-6 text-slate-600">
            No registered projects yet.
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => {
              const isSelected = project.id === selectedProjectId;

              return (
                <button
                  key={project.id}
                  className={`flex w-full flex-col rounded-lg border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-sky-500 bg-white shadow-sm"
                      : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white/70"
                  }`}
                  onClick={() => onSelectProject(project.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-slate-950">
                      {project.displayName}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {project.worktreeCount}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {project.primaryPath}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                    <span>{project.modifiedWorktreeCount} modified</span>
                    <span>{project.attentionCount} attention</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
