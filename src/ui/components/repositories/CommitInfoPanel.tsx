import { Copy, ExternalLink, GitCommitHorizontal, GitPullRequest } from "lucide-react";

import type { ChangedFile, CommitSummary, RemoteInfo } from "../../../core/domain/types";
import { formatRelativeTime } from "../../lib/time";
import {
  commitUrl,
  parsePullRequestNumbers,
  pullRequestLabel,
  pullRequestUrl,
} from "../../lib/remoteLinks";
import { useRepositoryStore } from "../../store/useRepositoryStore";
import { Avatar } from "../Avatar";
import { ChangeStat } from "../ChangeStat";

export function CommitInfoPanel({
  commit,
  remoteInfo,
  files,
}: {
  commit: CommitSummary;
  remoteInfo: RemoteInfo | null;
  files: ChangedFile[];
}) {
  const openPath = useRepositoryStore((state) => state.openPath);

  const additions = files.reduce((sum, f) => sum + (f.additions ?? 0), 0);
  const deletions = files.reduce((sum, f) => sum + (f.deletions ?? 0), 0);
  const prNumbers = parsePullRequestNumbers(commit.subject, commit.body);
  const link = commitUrl(remoteInfo, commit.hash);
  const prLabel = pullRequestLabel(remoteInfo);

  return (
    <div className="space-y-2.5 border-b border-border bg-surface-container px-4 py-3">
      <div className="space-y-1">
        <div className="text-ui-bold font-semibold text-foreground">{commit.subject}</div>
        {commit.body ? (
          <pre className="max-h-28 overflow-y-auto whitespace-pre-wrap font-sans text-ui-sm leading-5 text-muted-foreground">
            {commit.body}
          </pre>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-ui-sm text-muted-foreground">
        <Avatar email={commit.authorEmail} name={commit.author} size={20} />
        <span className="font-medium text-foreground">{commit.author}</span>
        {commit.authorEmail ? (
          <span className="truncate text-[11px]" title={commit.authorEmail}>
            {commit.authorEmail}
          </span>
        ) : null}
        <span aria-hidden>·</span>
        <span className="whitespace-nowrap">{formatRelativeTime(commit.date)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-foreground">
          <GitCommitHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          {commit.shortHash}
        </span>
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(commit.hash)}
          title="Copy full hash"
          className="flex h-6 w-6 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Copy className="h-3 w-3" />
        </button>
        {link ? (
          <button
            type="button"
            onClick={() => void openPath(link)}
            title="Open commit on remote"
            className="flex h-6 items-center gap-1 rounded-sm border border-border px-1.5 text-[11px] text-foreground transition-colors hover:bg-accent"
          >
            <ExternalLink className="h-3 w-3" />
            Remote
          </button>
        ) : null}

        {prNumbers.map((num) => {
          const prUrl = pullRequestUrl(remoteInfo, num);
          const content = (
            <>
              <GitPullRequest className="h-3 w-3" />
              {prLabel} #{num}
            </>
          );
          return prUrl ? (
            <button
              key={num}
              type="button"
              onClick={() => void openPath(prUrl)}
              className="flex h-6 items-center gap-1 rounded-sm border border-link/40 bg-link/10 px-1.5 text-[11px] text-link transition-colors hover:bg-link/20"
            >
              {content}
            </button>
          ) : (
            <span
              key={num}
              className="flex h-6 items-center gap-1 rounded-sm border border-border px-1.5 text-[11px] text-muted-foreground"
            >
              {content}
            </span>
          );
        })}

        <span className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          {files.length} file{files.length === 1 ? "" : "s"}
          <ChangeStat additions={additions} deletions={deletions} />
        </span>
      </div>
    </div>
  );
}
