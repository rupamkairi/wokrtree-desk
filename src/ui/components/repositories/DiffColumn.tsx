import { lazy, Suspense } from "react";
import { FileDiff, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDiffViewStore } from "../../store/diffViewStore";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { CommitInfoPanel } from "./CommitInfoPanel";

const MonacoDiff = lazy(() => import("./MonacoDiff"));

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      {children}
    </div>
  );
}

function ModeToggle() {
  const mode = useDiffViewStore((state) => state.mode);
  const setMode = useDiffViewStore((state) => state.setMode);
  return (
    <div className="flex shrink-0 overflow-hidden rounded-sm border border-border">
      {(["split", "unified"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setMode(option)}
          className={cn(
            "px-2 py-0.5 text-[11px] font-medium capitalize transition-colors",
            mode === option
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/60",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function DiffColumn() {
  const diff = useRepositoryStore((state) => state.diff);
  const selectedFile = useRepositoryStore((state) => state.selectedFile);
  const isLoadingDiff = useRepositoryStore((state) => state.isLoadingDiff);
  const selectedCommit = useRepositoryStore((state) => state.selectedCommit);
  const commits = useRepositoryStore((state) => state.commits);
  const commitChanges = useRepositoryStore((state) => state.commitChanges);
  const remoteInfo = useRepositoryStore((state) => state.remoteInfo);
  const mode = useDiffViewStore((state) => state.mode);

  const commit = selectedCommit
    ? commits.find((entry) => entry.hash === selectedCommit) ?? null
    : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-container-high">
      {commit ? (
        <CommitInfoPanel commit={commit} remoteInfo={remoteInfo} files={commitChanges} />
      ) : null}

      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <FileDiff className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span
          className="min-w-0 flex-1 truncate font-mono text-ui-sm text-foreground"
          title={selectedFile ?? undefined}
        >
          {selectedFile ?? "Diff"}
        </span>
        <ModeToggle />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoadingDiff ? (
          <Centered>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-ui-sm text-muted-foreground">Loading diff…</span>
          </Centered>
        ) : !diff ? (
          <Centered>
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface-container">
              <FileDiff className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="max-w-sm text-ui-sm leading-5 text-muted-foreground">
              Select a changed file or a commit file to view its diff.
            </p>
          </Centered>
        ) : diff.binary ? (
          <Centered>
            <p className="text-ui-sm text-muted-foreground">
              Binary file — no text diff available.
            </p>
          </Centered>
        ) : diff.original === "" && diff.modified === "" ? (
          <Centered>
            <p className="text-ui-sm text-muted-foreground">No changes to display.</p>
          </Centered>
        ) : (
          <Suspense
            fallback={
              <Centered>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </Centered>
            }
          >
            <MonacoDiff
              original={diff.original}
              modified={diff.modified}
              language={diff.language}
              renderSideBySide={mode === "split"}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
