import { ChevronDown, GitMerge, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChangedFile, CommitSummary } from "../../../core/domain/types";
import { formatRelativeTime } from "../../lib/time";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { Avatar } from "../Avatar";
import { ChangeStat } from "../ChangeStat";
import { WipBadge } from "../WipBadge";

type StatusTone = "added" | "modified" | "deleted" | "renamed" | "untracked" | "conflict";

function classify(code: string, untracked: boolean, conflict: boolean): StatusTone {
  if (conflict) return "conflict";
  if (untracked) return "untracked";
  switch (code) {
    case "A":
      return "added";
    case "D":
      return "deleted";
    case "R":
    case "C":
      return "renamed";
    default:
      return "modified";
  }
}

const TONE_CLASS: Record<StatusTone, string> = {
  added: "text-success-bright",
  modified: "text-warning-bright",
  deleted: "text-destructive",
  renamed: "text-link",
  untracked: "text-success-bright",
  conflict: "text-destructive",
};

const TONE_LETTER: Record<StatusTone, string> = {
  added: "A",
  modified: "M",
  deleted: "D",
  renamed: "R",
  untracked: "U",
  conflict: "!",
};

function FileRow({
  file,
  code,
  untracked,
  conflict,
  selected,
  onSelect,
}: {
  file: ChangedFile;
  code: string;
  untracked: boolean;
  conflict: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = classify(code, untracked, conflict);
  const segments = file.path.split("/");
  const name = segments.pop() ?? file.path;
  const dir = segments.join("/");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 border-b border-border/60 px-3 py-1.5 text-left transition-colors",
        selected ? "bg-accent" : "hover:bg-accent/50",
      )}
    >
      <span className={cn("w-3 shrink-0 text-center font-mono text-[11px] font-bold", TONE_CLASS[tone])}>
        {TONE_LETTER[tone]}
      </span>
      <span className="min-w-0 flex-1 truncate text-ui-reg text-foreground" title={file.path}>
        {name}
        {dir ? <span className="ml-1.5 text-[11px] text-muted-foreground">{dir}</span> : null}
      </span>
      <ChangeStat
        additions={file.additions}
        deletions={file.deletions}
        binary={file.binary}
        className="shrink-0"
      />
    </button>
  );
}

function ChangedFilesList({
  files,
  grouped,
  source,
}: {
  files: ChangedFile[];
  grouped: boolean;
  source: "worktree" | "commit";
}) {
  const selectedFile = useRepositoryStore((state) => state.selectedFile);
  const selectChangedFile = useRepositoryStore((state) => state.selectChangedFile);

  function row(file: ChangedFile, code: string, untracked: boolean, conflict: boolean) {
    return (
      <FileRow
        key={`${file.path}:${code}`}
        file={file}
        code={code}
        untracked={untracked}
        conflict={conflict}
        selected={selectedFile === file.path}
        onSelect={() => void selectChangedFile(file, source)}
      />
    );
  }

  if (!grouped) {
    return <div>{files.map((file) => row(file, file.index, false, false))}</div>;
  }

  const staged = files.filter((f) => !f.untracked && !f.conflict && f.index !== ".");
  const unstaged = files.filter((f) => !f.untracked && !f.conflict && f.worktree !== ".");
  const conflicts = files.filter((f) => f.conflict);
  const untracked = files.filter((f) => f.untracked);

  return (
    <div>
      <Group label="Conflicts" show={conflicts.length > 0}>
        {conflicts.map((f) => row(f, f.index, false, true))}
      </Group>
      <Group label="Staged" show={staged.length > 0}>
        {staged.map((f) => row(f, f.index, false, false))}
      </Group>
      <Group label="Changes" show={unstaged.length > 0}>
        {unstaged.map((f) => row(f, f.worktree, false, false))}
      </Group>
      <Group label="Untracked" show={untracked.length > 0}>
        {untracked.map((f) => row(f, "?", true, false))}
      </Group>
    </div>
  );
}

function Group({
  label,
  show,
  children,
}: {
  label: string;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="pb-1">
      <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ChangesTab() {
  const changes = useRepositoryStore((state) => state.changes);
  const isLoading = useRepositoryStore((state) => state.isLoadingChanges);
  const worktreePath = useRepositoryStore((state) => state.changesWorktreePath);

  if (!worktreePath) {
    return (
      <div className="px-3 py-6 text-ui-sm text-muted-foreground">
        This branch is not checked out in a worktree, so it has no working changes.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-6 text-ui-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading changes…
      </div>
    );
  }
  if (changes.length === 0) {
    return <div className="px-3 py-6 text-ui-sm text-muted-foreground">No uncommitted changes.</div>;
  }
  return <ChangedFilesList files={changes} grouped source="worktree" />;
}

function CommitRow({ commit }: { commit: CommitSummary }) {
  const selectedCommit = useRepositoryStore((state) => state.selectedCommit);
  const selectCommit = useRepositoryStore((state) => state.selectCommit);
  const commitChanges = useRepositoryStore((state) => state.commitChanges);
  const isLoadingCommitChanges = useRepositoryStore((state) => state.isLoadingCommitChanges);
  const isSelected = selectedCommit === commit.hash;

  return (
    <div className={cn("border-b border-border/60", isSelected && "bg-accent/30")}>
      <button
        type="button"
        onClick={() => void selectCommit(commit.hash)}
        className="w-full px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
      >
        <div className="flex items-start gap-2">
          {commit.isMerge ? (
            <GitMerge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-link" />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="truncate text-ui-reg font-medium text-foreground">{commit.subject}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Avatar email={commit.authorEmail} name={commit.author} size={14} />
              <span className="truncate">{commit.author}</span>
              <span aria-hidden>·</span>
              <span className="whitespace-nowrap">{formatRelativeTime(commit.date)}</span>
              <span aria-hidden>·</span>
              <span className="font-mono text-[10px]">{commit.shortHash}</span>
            </div>
          </div>
        </div>
      </button>
      {isSelected ? (
        isLoadingCommitChanges ? (
          <div className="flex items-center gap-2 px-3 py-2 text-ui-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading files…
          </div>
        ) : commitChanges.length === 0 ? (
          <div className="px-3 py-2 text-ui-sm text-muted-foreground">No file changes.</div>
        ) : (
          <ChangedFilesList files={commitChanges} grouped={false} source="commit" />
        )
      ) : null}
    </div>
  );
}

function HistoryTab() {
  const commits = useRepositoryStore((state) => state.commits);
  const selectedBranch = useRepositoryStore((state) => state.selectedBranch);
  const isLoadingCommits = useRepositoryStore((state) => state.isLoadingCommits);
  const isLoadingMore = useRepositoryStore((state) => state.isLoadingMoreCommits);
  const hasMore = useRepositoryStore((state) => state.commitsHasMore);
  const loadMore = useRepositoryStore((state) => state.loadMoreCommits);

  if (isLoadingCommits) {
    return (
      <div className="flex items-center gap-2 px-3 py-6 text-ui-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading commits…
      </div>
    );
  }
  if (commits.length === 0) {
    return (
      <div className="px-3 py-6 text-ui-sm text-muted-foreground">
        {selectedBranch ? "No commits on this branch." : "Select a branch to view its history."}
      </div>
    );
  }
  return (
    <>
      {commits.map((commit) => (
        <CommitRow key={commit.hash} commit={commit} />
      ))}
      {hasMore ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={isLoadingMore}
          className="flex w-full items-center justify-center gap-2 px-3 py-3 text-ui-sm font-medium text-link transition-colors hover:bg-accent/40 disabled:opacity-60"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading…
            </>
          ) : (
            "Load more commits"
          )}
        </button>
      ) : (
        <div className="px-3 py-3 text-center text-[11px] text-muted-foreground">End of history</div>
      )}
    </>
  );
}

export function HistoryColumn() {
  const detailTab = useRepositoryStore((state) => state.detailTab);
  const setDetailTab = useRepositoryStore((state) => state.setDetailTab);
  const changeCount = useRepositoryStore((state) => state.changes.length);

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-r border-border bg-surface-container">
      <div className="flex border-b border-border">
        {(
          [
            { id: "changes", label: "Changes" },
            { id: "history", label: "History" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setDetailTab(tab.id)}
            className={cn(
              "relative flex-1 px-3 py-2.5 text-ui-reg font-medium transition-colors",
              detailTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.id === "changes" && changeCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {changeCount}
              </span>
            ) : null}
            {detailTab === tab.id ? (
              <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />
            ) : null}
          </button>
        ))}
      </div>

      {detailTab === "history" ? (
        <button
          type="button"
          disabled
          className="flex cursor-not-allowed items-center gap-2 border-b border-border px-3 py-2.5 text-ui-reg text-muted-foreground opacity-60"
        >
          <span className="flex-1 text-left">Select Branch to Compare…</span>
          <WipBadge />
          <ChevronDown className="h-4 w-4" />
        </button>
      ) : null}

      <div className="wtd-scroll min-h-0 flex-1">
        {detailTab === "changes" ? <ChangesTab /> : <HistoryTab />}
      </div>
    </div>
  );
}
