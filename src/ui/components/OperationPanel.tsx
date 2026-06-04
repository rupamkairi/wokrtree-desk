import type { OperationDetails } from "../../core/domain/types";

function formatOutputText(value: string): string {
  return value.split("\0").join("\\0");
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export function OperationPanel({ operation }: { operation: OperationDetails | null }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-950 text-white">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-sm font-semibold">Operation Details</h2>
      </div>

      {!operation ? (
        <div className="px-5 py-5 text-sm leading-6 text-slate-300">
          The latest Git or filesystem operation will appear here.
        </div>
      ) : (
        <div className="space-y-4 px-5 py-5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-slate-300">
              Finished {formatTimestamp(operation.finishedAt)}
            </div>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                operation.success
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-rose-500/20 text-rose-200"
              }`}
            >
              {operation.success ? "Success" : "Failed"}
            </span>
          </div>

          <div className="rounded-md bg-white/5 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Command
            </div>
            <div className="mt-2 break-all font-mono text-xs text-slate-100">
              {operation.commandDisplay}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-white/5 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Cwd
              </div>
              <div className="mt-1 break-all text-xs text-slate-200">{operation.cwd}</div>
            </div>
            <div className="rounded-md bg-white/5 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Exit / duration
              </div>
              <div className="mt-1 text-xs text-slate-200">
                {operation.exitCode} · {operation.durationMs}ms
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                stdout
              </div>
              <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-black/25 p-3 text-xs leading-6 text-slate-100">
                {formatOutputText(operation.stdout) || "(empty)"}
              </pre>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                stderr
              </div>
              <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-black/25 p-3 text-xs leading-6 text-slate-100">
                {formatOutputText(operation.stderr) || "(empty)"}
              </pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
