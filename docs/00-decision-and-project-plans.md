# 00 — Decision and Project Plans

## 1. The decision

Build **Worktree Desk** as an Electron application for the initial production-quality version.

Electron is not selected because it is smallest. It is selected because this application is a local developer tool that must coordinate privileged desktop operations:

- run and stream Git and setup commands;
- inspect and create filesystem symlinks;
- open directories in editors, terminals, or Finder;
- use native directory selection dialogs;
- keep a rich, predictable React UI;
- package the app for desktop use within the JavaScript ecosystem.

The Electron application must be narrowly scoped: it manages Git worktrees and related local setup, not complete Git history or branching visualization.

## 2. Non-negotiable technical principle

Do **not** parse normal human-readable terminal output.

The application will execute Git commands and consume Git's documented machine formats:

- `git worktree list --porcelain -z` for worktree records;
- `git status --porcelain=v2 --branch -z` for worktree status and ahead/behind information;
- `git for-each-ref --format=...` for available local branch records;
- `git check-ignore --stdin -v -z` before creating links for secrets or ignored-only resources.

This removes dependencies on terminal colors, localized text, Git display configuration, spaces/newlines in paths, and formatting changes intended for human users.

`execa` is the recommended JavaScript package for command execution and streaming. It does not replace Git's domain model; Worktree Desk owns small, typed parsers for the machine-formatted output.

## 3. Platform plans

### Plan A — Electron + Node.js + React desktop application — Recommended

#### Purpose

Deliver the intended desktop product: polished GUI, local filesystem operations, subprocess management, native dialogs and editor launching, entirely through a JavaScript/TypeScript application stack.

#### Stack

| Area | Technology |
|---|---|
| Shell/runtime | Electron |
| Packaging | Electron Forge |
| UI | React, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Privileged backend | Electron main process on Node.js |
| Privileged API boundary | Sandboxed renderer + context-isolated preload + typed IPC |
| Git/process runner | `execa` executing installed `git` |
| Models/config validation | Zod |
| UI state | Zustand |
| Unit/integration tests | Vitest |
| UI tests | Playwright Electron support |
| Package manager | pnpm |

#### Benefits

- Fits the JavaScript-only implementation constraint.
- Best access to Node filesystem/process/package ecosystem.
- Predictable modern React component behavior because Chromium is shipped with the app.
- Officially documented security architecture for separating privileged main-process behavior from the UI renderer.
- Most straightforward route to reliable app packaging and native desktop interactions.

#### Tradeoffs

- Larger binary and memory footprint than OS-webview shells.
- Requires discipline: renderer cannot receive unrestricted Node/filesystem access.
- Framework updates and packaging/codesigning need proper release work.

#### Delivery decision

Use this plan for v0.1 through v1 unless footprint proves to be an actual user blocker.

---

### Plan B — Neutralinojs + React lightweight desktop application — Contingency

#### Purpose

Provide the same product behavior with a smaller desktop shell based on system webviews.

#### Stack

| Area | Technology |
|---|---|
| Shell | Neutralinojs |
| UI | React, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Git/process runner | Neutralino operating-system process API |
| Parser/domain code | Same TypeScript parser and domain modules where feasible |
| Config | TypeScript/Zod-like validation in frontend/service boundary |

#### Benefits

- Much smaller footprint than bundling Chromium.
- Remains inside the JavaScript/UI ecosystem.
- Supports running processes and handling process stdout/stderr events.

#### Tradeoffs and validation gate

This path should not be selected only because Electron has a poor reputation. Before committing to it, a technical spike must prove each of these:

1. Securely execute Git commands and stream output.
2. Create/repair symlinks with correct macOS behavior.
3. Use native directory selection and launch editors/terminal reliably.
4. Store and migrate per-project configuration cleanly.
5. Package an installable app without forcing unsuitable architecture workarounds.
6. Support the same operation-log and error-reporting UX as Plan A.

When any of these becomes awkward or unreliable, return to Plan A rather than compromising the product.

#### Delivery decision

Keep as an evaluation path only when installation size or memory usage becomes a primary product requirement.

---

### Plan C — Bun local service + React browser application — Internal-tool alternative

#### Purpose

Produce the fastest purely JavaScript internal tool with a React UI served locally, without committing to a desktop application shell.

#### Stack

| Area | Technology |
|---|---|
| Local backend/runtime | Bun |
| UI | React + Vite |
| Git runner | `Bun.spawn()` |
| Access | Local browser tab |

#### Benefits

- Low implementation and runtime overhead.
- Simple Git/process/filesystem service architecture.
- Good for a personal utility or proving product workflow.

#### Tradeoffs

- It is not a real desktop application: window lifecycle, native menus, secure native dialogs, app launching, signing and distribution are less polished.
- A local-server security model must be designed so browser origins cannot invoke privileged actions accidentally.
- Less satisfying for daily desktop workflow than a dedicated application.

#### Delivery decision

Use only for a private proof-of-concept, not as the intended product.

---

## 4. Rejected or deferred options

| Option | Decision | Reason |
|---|---|---|
| Tauri as primary plan | Not selected | Excellent lightweight option, but its privileged backend is Rust and therefore outside the JavaScript-only implementation constraint. |
| React NodeGui | Not selected | Native UI approach is not aligned with the preferred React web-component workflow; React NodeGui maintenance confidence is insufficient for this product. |
| Full Git GUI from day one | Rejected | Commit graphs, staging, merges and PRs expand scope without solving the user's worktree setup pain. |
| Direct shared `node_modules` symlink | Excluded from defaults | Divergent lockfiles/installs can mutate runtime dependencies beneath other active worktrees. |

## 5. Recommended product positioning

**Worktree Desk** is a companion to existing Git clients and editors.

It owns:

- repository/worktree registration and navigation;
- worktree creation and removal safety;
- shared resource linking;
- setup commands and dependency installation triggers;
- editor/terminal opening;
- operational visibility and diagnostics.

It intentionally leaves these to existing tools:

- commits and staging;
- branch graph/history;
- interactive rebase/merge resolution;
- remote pull-request workflows.

## 6. Primary sources

- Git worktree commands and porcelain output: https://git-scm.com/docs/git-worktree
- Git stable status formats: https://git-scm.com/docs/git-status
- Git ignore validation: https://git-scm.com/docs/git-check-ignore
- Git reference listing: https://git-scm.com/docs/git-for-each-ref
- Electron platform and security: https://www.electronjs.org/docs/latest/
- Electron Forge: https://www.electronforge.io/
- Neutralinojs: https://neutralino.js.org/
- Bun child processes: https://bun.sh/docs/api/spawn
