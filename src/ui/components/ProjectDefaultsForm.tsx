import type { ProjectDefaults } from "../../core/domain/types";

type ProjectDefaultsFormProps = {
  defaults: ProjectDefaults;
  onChange: (defaults: ProjectDefaults) => void;
};

export function ProjectDefaultsForm({
  defaults,
  onChange,
}: ProjectDefaultsFormProps) {
  return (
    <div className="space-y-4">
      <label className="block">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Default worktree root
        </div>
        <input
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          onChange={(event) =>
            onChange({
              ...defaults,
              worktreeRoot: event.target.value,
            })
          }
          type="text"
          value={defaults.worktreeRoot}
        />
      </label>

      <label className="block">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Preferred editor
        </div>
        <select
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          onChange={(event) =>
            onChange({
              ...defaults,
              preferredEditor: event.target.value as ProjectDefaults["preferredEditor"],
            })
          }
          value={defaults.preferredEditor}
        >
          <option value="cursor">Cursor</option>
          <option value="code">VS Code</option>
          <option value="terminal">Terminal</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      <label className="block">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Preferred terminal
        </div>
        <select
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          onChange={(event) =>
            onChange({
              ...defaults,
              preferredTerminal:
                event.target.value as ProjectDefaults["preferredTerminal"],
            })
          }
          value={defaults.preferredTerminal}
        >
          <option value="terminal">Terminal</option>
          <option value="iterm">iTerm</option>
          <option value="custom">Custom</option>
        </select>
      </label>
    </div>
  );
}
