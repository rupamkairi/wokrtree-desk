import {
  CloudDownload,
  FolderOpen,
  FolderGit2,
  PlusSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { WipBadge } from "../WipBadge";

function StarterCard({
  icon,
  title,
  description,
  children,
  accent,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-surface-container p-5">
      <div
        className={cn(
          "mb-4 flex h-11 w-11 items-center justify-center rounded-md",
          accent ? "bg-primary text-primary-foreground" : "bg-surface-container-high text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <div className="mb-1 flex items-center gap-2 text-ui-bold font-semibold text-foreground">
        {title}
      </div>
      <p className="mb-4 flex-1 text-ui-sm leading-5 text-muted-foreground">
        {description}
      </p>
      {children}
    </div>
  );
}

export function GetStarted() {
  const projects = useRepositoryStore((state) => state.projects);
  const projectFilter = useRepositoryStore((state) => state.projectFilter);
  const addProject = useRepositoryStore((state) => state.addProject);
  const selectProject = useRepositoryStore((state) => state.selectProject);

  const normalized = projectFilter.trim().toLowerCase();
  const filtered = normalized
    ? projects.filter(
        (project) =>
          project.displayName.toLowerCase().includes(normalized) ||
          project.primaryPath.toLowerCase().includes(normalized),
      )
    : projects;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
      <h1 className="mb-5 text-xl font-semibold text-foreground">Get Started</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <StarterCard
          icon={<CloudDownload className="h-5 w-5" />}
          title={
            <>
              Clone Repository <WipBadge />
            </>
          }
          description="Clone an existing project from GitHub, GitLab, or Bitbucket via URL."
        >
          <div className="flex gap-2">
            <input
              disabled
              placeholder="https://…"
              className="h-9 flex-1 cursor-not-allowed rounded-sm border border-input bg-background px-3 font-mono text-ui-sm text-muted-foreground opacity-60 outline-none"
            />
            <button
              disabled
              className="h-9 cursor-not-allowed rounded-sm border border-border px-3 text-ui-reg text-muted-foreground opacity-60"
            >
              Clone
            </button>
          </div>
        </StarterCard>

        <StarterCard
          icon={<FolderOpen className="h-5 w-5" />}
          title="Add Local Repository"
          description="Add an existing local directory to manage it with Worktree Desk."
        >
          <button
            type="button"
            onClick={() => void addProject()}
            className="h-9 w-full rounded-sm border border-border bg-surface-container-high text-ui-reg font-medium text-foreground transition-colors hover:bg-accent"
          >
            Browse Files
          </button>
        </StarterCard>

        <StarterCard
          accent
          icon={<PlusSquare className="h-5 w-5" />}
          title={
            <>
              Create New Repository <WipBadge />
            </>
          }
          description="Initialize a brand new local repository and start tracking files."
        >
          <button
            disabled
            className="h-9 w-full cursor-not-allowed rounded-sm bg-primary/40 text-ui-reg font-medium text-primary-foreground opacity-70"
          >
            Initialize Repo
          </button>
        </StarterCard>
      </div>

      <div className="mt-9">
        <h2 className="mb-3 text-ui-bold font-semibold text-foreground">
          Recent Projects
        </h2>
        {filtered.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-5 py-8 text-ui-sm text-muted-foreground">
            No registered projects yet. Use Add Local Repository to register one.
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => void selectProject(project.id)}
                className="flex w-full items-center gap-4 rounded-md border border-border bg-surface-container px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <FolderGit2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-ui-reg font-semibold text-foreground">
                    {project.displayName}
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {project.primaryPath}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{project.worktreeCount} worktrees</span>
                  {project.modifiedWorktreeCount > 0 ? (
                    <span className="text-warning-bright">
                      {project.modifiedWorktreeCount} modified
                    </span>
                  ) : (
                    <span className="text-success-bright">Clean</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
