import { useState } from "react";
import {
  ChevronDown,
  FolderGit2,
  GitBranch,
  LifeBuoy,
  Loader2,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { SettingsModal } from "../settings/SettingsModal";
import { BranchColumn } from "./BranchColumn";
import { DiffColumn } from "./DiffColumn";
import { GetStarted } from "./GetStarted";
import { HistoryColumn } from "./HistoryColumn";

function HeaderIconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `${label} — work in progress` : label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function RepositoriesView() {
  const project = useRepositoryStore((state) => state.selectedProject);
  const projects = useRepositoryStore((state) => state.projects);
  const isLoadingProject = useRepositoryStore((state) => state.isLoadingProject);
  const selectProject = useRepositoryStore((state) => state.selectProject);
  const showRepositoryList = useRepositoryStore((state) => state.showRepositoryList);
  const addProject = useRepositoryStore((state) => state.addProject);
  const refreshProject = useRepositoryStore((state) => state.refreshProject);

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <GitBranch className="h-4 w-4" />
          </div>
          <span className="text-ui-bold font-semibold text-foreground">Worktree Desk</span>
        </div>

        <span className="text-muted-foreground">/</span>

        <button
          type="button"
          onClick={showRepositoryList}
          className="text-ui-reg font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Repositories
        </button>

        {project ? (
          <>
            <span className="text-muted-foreground">/</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-ui-reg font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                  {project.displayName}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Switch repository</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projects.map((candidate) => (
                  <DropdownMenuItem
                    key={candidate.id}
                    onSelect={() => void selectProject(candidate.id)}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="text-ui-reg font-medium">{candidate.displayName}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {candidate.primaryPath}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void addProject()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add repository…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}

        <div className="flex-1" />

        {project ? (
          <button
            type="button"
            onClick={() => void refreshProject()}
            disabled={isLoadingProject}
            className="flex h-8 items-center gap-1.5 rounded-sm border border-border px-2.5 text-ui-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            <RefreshCw className={isLoadingProject ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Refresh
          </button>
        ) : null}

        <HeaderIconButton label="Settings" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon className="h-4 w-4" />
        </HeaderIconButton>
        <HeaderIconButton label="Docs" disabled>
          <LifeBuoy className="h-4 w-4" />
        </HeaderIconButton>
        <HeaderIconButton label="Support" disabled>
          <LifeBuoy className="h-4 w-4" />
        </HeaderIconButton>
      </header>

      {project ? (
        <div className="flex min-h-0 flex-1">
          <BranchColumn />
          <HistoryColumn />
          <DiffColumn />
        </div>
      ) : isLoadingProject ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-ui-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading repository…
        </div>
      ) : (
        <GetStarted />
      )}

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </section>
  );
}
