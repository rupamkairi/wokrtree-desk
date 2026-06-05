import { ChevronDown, GitMerge, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CommitSummary } from "../../../core/domain/types";
import { formatRelativeTime } from "../../lib/time";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { WipBadge } from "../WipBadge";

function CommitRow({ commit }: { commit: CommitSummary }) {
  return (
    <div
      title="Commit diff — WIP"
      className="cursor-default border-b border-border/60 px-3 py-2.5 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start gap-2">
        {commit.isMerge ? (
          <GitMerge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-link" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-ui-reg font-medium text-foreground">
            {commit.subject}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="truncate">{commit.author}</span>
            <span aria-hidden>·</span>
            <span className="whitespace-nowrap">{formatRelativeTime(commit.date)}</span>
            <span aria-hidden>·</span>
            <span className="font-mono text-[10px]">{commit.shortHash}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryColumn() {
  const detailTab = useRepositoryStore((state) => state.detailTab);
  const setDetailTab = useRepositoryStore((state) => state.setDetailTab);
  const commits = useRepositoryStore((state) => state.commits);
  const selectedBranch = useRepositoryStore((state) => state.selectedBranch);
  const isLoadingCommits = useRepositoryStore((state) => state.isLoadingCommits);
  const isLoadingMore = useRepositoryStore((state) => state.isLoadingMoreCommits);
  const hasMore = useRepositoryStore((state) => state.commitsHasMore);
  const loadMore = useRepositoryStore((state) => state.loadMoreCommits);

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-r border-border bg-surface-container">
      <div className="flex border-b border-border">
        <button
          type="button"
          disabled
          className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 px-3 py-2.5 text-ui-reg font-medium text-muted-foreground opacity-60"
        >
          Changes
          <WipBadge />
        </button>
        <button
          type="button"
          onClick={() => setDetailTab("history")}
          className={cn(
            "relative flex-1 px-3 py-2.5 text-ui-reg font-medium transition-colors",
            detailTab === "history"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          History
          {detailTab === "history" ? (
            <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />
          ) : null}
        </button>
      </div>

      <button
        type="button"
        disabled
        className="flex cursor-not-allowed items-center gap-2 border-b border-border px-3 py-2.5 text-ui-reg text-muted-foreground opacity-60"
      >
        <span className="flex-1 text-left">Select Branch to Compare…</span>
        <WipBadge />
        <ChevronDown className="h-4 w-4" />
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoadingCommits ? (
          <div className="flex items-center gap-2 px-3 py-6 text-ui-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading commits…
          </div>
        ) : commits.length === 0 ? (
          <div className="px-3 py-6 text-ui-sm text-muted-foreground">
            {selectedBranch
              ? "No commits on this branch."
              : "Select a branch to view its history."}
          </div>
        ) : (
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
              <div className="px-3 py-3 text-center text-[11px] text-muted-foreground">
                End of history
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
