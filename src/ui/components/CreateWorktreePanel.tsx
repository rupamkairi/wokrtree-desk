import type {
  BranchRef,
  CreateWorktreePreview,
  ProjectDetails,
} from "../../core/domain/types";

type CreateWorktreePanelProps = {
  project: ProjectDetails;
  branches: BranchRef[];
  branchMode: "existing" | "new";
  existingBranch: string;
  newBranchName: string;
  baseRef: string;
  targetPath: string;
  preview: CreateWorktreePreview | null;
  isWorking: boolean;
  onChangeBranchMode: (value: "existing" | "new") => void;
  onChangeExistingBranch: (value: string) => void;
  onChangeNewBranchName: (value: string) => void;
  onChangeBaseRef: (value: string) => void;
  onChangeTargetPath: (value: string) => void;
  onSubmit: () => void;
};

export function CreateWorktreePanel({
  project,
  branches,
  branchMode,
  existingBranch,
  newBranchName,
  baseRef,
  targetPath,
  preview,
  isWorking,
  onChangeBranchMode,
  onChangeExistingBranch,
  onChangeNewBranchName,
  onChangeBaseRef,
  onChangeTargetPath,
  onSubmit,
}: CreateWorktreePanelProps) {
  const availableBranches = branches.filter((branch) => !branch.checkedOut);

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-950">Create Worktree</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Create a worktree inside the selected project using an existing local
          branch or a new branch from a chosen base.
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="flex gap-2 rounded-md bg-slate-100 p-1">
          <button
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${
              branchMode === "existing"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600"
            }`}
            onClick={() => onChangeBranchMode("existing")}
            type="button"
          >
            Existing branch
          </button>
          <button
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${
              branchMode === "new"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600"
            }`}
            onClick={() => onChangeBranchMode("new")}
            type="button"
          >
            New branch
          </button>
        </div>

        {branchMode === "existing" ? (
          <label className="block">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Existing branch
            </div>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              onChange={(event) => onChangeExistingBranch(event.target.value)}
              value={existingBranch}
            >
              {branches.map((branch) => (
                <option key={branch.fullRef} value={branch.name}>
                  {branch.name}
                  {branch.checkedOut && branch.checkedOutPath
                    ? ` (checked out at ${branch.checkedOutPath})`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="block">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Base branch
              </div>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                onChange={(event) => onChangeBaseRef(event.target.value)}
                value={baseRef}
              >
                {branches.map((branch) => (
                  <option key={branch.fullRef} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                New branch name
              </div>
              <input
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                onChange={(event) => onChangeNewBranchName(event.target.value)}
                type="text"
                value={newBranchName}
              />
            </label>
          </>
        )}

        <label className="block">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Target path
          </div>
          <input
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => onChangeTargetPath(event.target.value)}
            type="text"
            value={targetPath}
          />
        </label>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Review
          </div>
          <div className="mt-2 space-y-1 text-slate-700">
            <div>Project: {project.displayName}</div>
            <div>
              Branch: {branchMode === "existing" ? existingBranch : newBranchName || "(new branch)"}
            </div>
            {branchMode === "new" ? <div>Base: {baseRef}</div> : null}
            <div>Directory: {targetPath}</div>
            <div className="break-all font-mono text-xs text-slate-600">
              {preview
                ? [preview.command.executable, ...preview.command.args].join(" ")
                : "Preview unavailable yet."}
            </div>
          </div>

          {preview?.warnings.length ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
              {preview.warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isWorking || !preview?.canCreate || (!availableBranches.length && branchMode === "existing")}
          onClick={onSubmit}
          type="button"
        >
          {isWorking ? "Creating..." : "Create Worktree"}
        </button>
      </div>
    </section>
  );
}
