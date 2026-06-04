const docs = [
  {
    title: "Project decision",
    path: "00-decision-and-project-plans.md",
    summary: "Electrobun-first direction, Electron fallback, and platform rules.",
  },
  {
    title: "Product scope",
    path: "01-product-scope-sow.md",
    summary: "MVP outcomes, releases, exclusions, and acceptance criteria.",
  },
  {
    title: "Architecture",
    path: "02-technical-architecture.md",
    summary: "Core services, parsers, shell adapters, and failure handling.",
  },
  {
    title: "UI system",
    path: "03-ui-ux-specification.md",
    summary: "Screen flows, shell-independent UX, and component behavior.",
  },
  {
    title: "Implementation roadmap",
    path: "04-implementation-roadmap-tools-and-skills.md",
    summary: "Stack, bootstrap path, and the repo-local skill contract.",
  },
  {
    title: "Capability gate",
    path: "05-electrobun-validation-and-electron-fallback.md",
    summary: "Electrobun validation spike and migration criteria.",
  },
] as const;

const metrics = [
  { label: "Initial shell", value: "Electrobun" },
  { label: "UI stack", value: "React + TypeScript" },
  { label: "Build path", value: "Vite + Electrobun" },
  { label: "Fallback", value: "Electron adapter" },
] as const;

const commands = [
  "bun install",
  "bun run dev",
  "bun run build:canary",
] as const;

function App() {
  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-5 py-5 sm:px-8 lg:px-10">
        <header className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Worktree Desk
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                A desktop workspace for Git projects, linked worktrees, and safe local resources.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                The repository is now organized around the Electrobun-first plan described in the
                planning docs. This starter screen is a placeholder for the real product shell
                while the worktree services and resource flows are implemented.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-950 p-4 text-white shadow-lg sm:min-w-[280px]">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Current status</div>
              <div className="text-2xl font-semibold">Project scaffold ready</div>
              <div className="text-sm leading-6 text-slate-300">
                Source docs are indexed, the Electrobun starter is in place, and the build path is
                wired for the first validation pass.
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {metric.label}
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-950">{metric.value}</div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Source documentation index</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  The planning docs remain unchanged. This index file is the navigation layer.
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                docs/INDEX.md
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {docs.map((doc) => (
                <div
                  key={doc.path}
                  className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-950">{doc.title}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600">{doc.summary}</div>
                    </div>
                    <code className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-100">
                      {doc.path}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="grid gap-6">
            <article className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
              <h2 className="text-2xl font-semibold">Next build commands</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                These are the commands I will use to validate the scaffold and package the first
                Electrobun build.
              </p>
              <div className="mt-5 grid gap-3">
                {commands.map((command) => (
                  <div
                    key={command}
                    className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 font-mono text-sm text-slate-100"
                  >
                    {command}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-[0_16px_40px_rgba(120,53,15,0.08)]">
              <h2 className="text-xl font-semibold text-amber-950">Conversation source</h2>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                The Electrobun-first direction came from the shared conversation thread below and is
                preserved in the docs index.
              </p>
              <a
                className="mt-4 inline-flex text-sm font-semibold text-amber-800 underline decoration-amber-300 underline-offset-4 hover:text-amber-950"
                href="https://chatgpt.com/share/6a216f6b-57a0-83a7-9951-2b28814a013f"
                target="_blank"
                rel="noreferrer"
              >
                Open the source conversation
              </a>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default App;
