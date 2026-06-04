import type { ProjectDefaults } from "../../core/domain/types";
import { ProjectDefaultsForm } from "./ProjectDefaultsForm";

type CreateProjectPanelProps = {
  selectedPath: string | null;
  defaults: ProjectDefaults | null;
  isWorking: boolean;
  onPickDirectory: () => void;
  onChangeDefaults: (defaults: ProjectDefaults) => void;
  onSubmit: () => void;
};

export function CreateProjectPanel({
  selectedPath,
  defaults,
  isWorking,
  onPickDirectory,
  onChangeDefaults,
  onSubmit,
}: CreateProjectPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-950">Create or Register Project</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Choose a repository or worktree folder, then set the project defaults used
          for future worktree creation.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Selected directory
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            {selectedPath ?? "No directory selected yet."}
          </div>
          <button
            className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            disabled={isWorking}
            onClick={onPickDirectory}
            type="button"
          >
            Choose Directory
          </button>
        </div>

        {defaults ? (
          <>
            <ProjectDefaultsForm defaults={defaults} onChange={onChangeDefaults} />
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isWorking || !selectedPath}
              onClick={onSubmit}
              type="button"
            >
              {isWorking ? "Registering..." : "Register Project"}
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
