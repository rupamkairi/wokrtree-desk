# 04 — Implementation Roadmap, Tools and Skills

## 1. Terminology: project packages vs agent skills

Two different categories are relevant:

1. **Application dependencies** are npm/pnpm packages installed into the repository to build and run Worktree Desk.
2. **Agent skills** are repository-local instruction/resources installed for coding assistants such as Codex, enabling the assistant to follow stable architecture and UI rules while generating or reviewing implementation work.

Both are recommended below. Agent skills do not replace packages or tests.

## 2. Recommended application dependency stack

### Production dependencies

| Package/category | Purpose |
|---|---|
| `electron` | Desktop shell and Node-backed main process |
| `react`, `react-dom` | Renderer UI |
| `execa` | Run Git/setup subprocesses and capture outputs |
| `zod` | Validate config, command requests and IPC payloads |
| `zustand` | Lightweight renderer state |
| `lucide-react` | Icon set |
| `clsx`, `tailwind-merge` | Component class composition |

### Development dependencies/tooling

| Package/category | Purpose |
|---|---|
| `@electron-forge/cli`, Forge Vite plugin/template | Package/build desktop application |
| `vite`, `@vitejs/plugin-react`, `typescript` | UI compilation and TypeScript |
| `tailwindcss` and shadcn/ui CLI/components | UI system |
| `vitest` | Unit tests and parser fixtures |
| `@testing-library/react` | Component behavior testing |
| `playwright` | End-to-end desktop/UI flows |
| `eslint`, `prettier` | Static quality/style |

### Optional later dependency

| Package | Introduce when |
|---|---|
| `@xterm/xterm`, `@xterm/addon-fit` | v0.2 only when long setup-command streaming needs a terminal-style presentation |

## 3. Suggested project creation commands

A practical Electron Forge/Vite baseline:

```sh
npx create-electron-app@latest worktree-desk --template=vite
cd worktree-desk

pnpm add react react-dom execa zod zustand lucide-react clsx tailwind-merge
pnpm add -D typescript @vitejs/plugin-react vitest @testing-library/react playwright eslint prettier

pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add sidebar button badge card dialog alert-dialog command sheet form dropdown-menu scroll-area separator tabs tooltip table
```

During implementation, configure the renderer as React/Vite/TypeScript and keep Node/process functionality exclusively in the main/preload layers.

## 4. Repository structure

```text
worktree-desk/
├── .agents/
│   └── skills/
│       └── worktree-desk-domain/
│           └── SKILL.md
├── src/
│   ├── main/
│   │   ├── ipc/
│   │   ├── services/
│   │   │   ├── git/
│   │   │   ├── resources/
│   │   │   ├── operations/
│   │   │   ├── launcher/
│   │   │   └── config/
│   │   └── index.ts
│   ├── preload/
│   │   └── index.ts
│   ├── renderer/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── features/
│   │   │   ├── projects/
│   │   │   ├── worktrees/
│   │   │   ├── resource-profiles/
│   │   │   ├── operations/
│   │   │   └── settings/
│   │   └── main.tsx
│   └── shared/
│       ├── schemas/
│       ├── domain/
│       └── ipc-contract.ts
├── tests/
│   ├── fixtures/git/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

## 5. Agent skills to install or create

### 5.1 Recommended existing skills

Install focused UI skills, not a large arbitrary catalog.

#### React best practices and web design review

Use Vercel's maintained agent skills for React implementation/performance guidance and web UI review:

```sh
npx skills add vercel-labs/agent-skills \
  --skill react-best-practices \
  --skill web-design-guidelines \
  -a codex -y
```

Recommended uses:

| Skill | Use it for |
|---|---|
| `react-best-practices` | Renderer architecture, component boundaries, responsiveness and avoiding inefficient UI patterns |
| `web-design-guidelines` | Reviewing dashboard/wizard/error panels for interface quality and accessibility concerns |

#### Optional frontend design skill

For initial UI explorations and polished visual treatment, optionally install Anthropic's `frontend-design` skill through the skills installer:

```sh
npx skills add https://github.com/anthropics/skills/tree/main/skills/frontend-design \
  -a codex -y
```

Use this for proposing screen-level designs and component styling; do not let it alter domain safety or Git operation rules.

### 5.2 Required custom project skill

Create a repository-owned Codex skill at:

```text
.agents/skills/worktree-desk-domain/SKILL.md
```

Its job is to preserve domain rules throughout implementation.

Suggested content:

```md
---
name: worktree-desk-domain
description: Apply the Worktree Desk Git worktree, resource safety, diagnostics and Electron architecture contract when implementing or reviewing this repository.
---

# Worktree Desk domain constraints

Read `docs/01-product-scope-sow.md` and `docs/02-technical-architecture.md` before making feature changes.

Mandatory rules:
- Execute Git using argument arrays through the command runner; do not interpolate shell strings.
- Parse only documented machine output: porcelain/v2/NUL-delimited formats.
- Keep renderer free of unrestricted Node, filesystem and arbitrary command execution.
- Validate IPC payloads and stored configuration.
- Block secret-resource links unless the target is Git-ignored.
- Never introduce direct shared writable node_modules as a standard feature.
- Preserve raw sanitized stderr/exit-code diagnostics for every failed operation.
- Distinguish partial success: a created worktree remains visible even if setup fails.

Before completing a change:
- Add/update unit tests for parsers or classifiers.
- Add/update integration coverage for Git/filesystem mutations.
- State any scope change against the MVP exclusions.
```

This skill is specific to this product and is therefore more valuable for architecture consistency than a generic software-architecture prompt.

## 6. Implementation phases

### Phase 0 — Foundation

Deliverables:

- Electron Forge + React/Vite/TypeScript shell.
- Main/preload/renderer boundary.
- Zod-validated typed IPC convention.
- Config store with schema version.
- Git availability/version check.
- Initial layout shell and project sidebar.

Exit criteria:

- Packaged app launches on macOS.
- Renderer cannot access arbitrary Node functionality.
- Main process can run `git --version` through the approved service and return structured status to UI.

### Phase 1 — Project registry and read-only worktree inventory

Deliverables:

- Add/remove registered project.
- Resolve repository common directory.
- Prevent duplicate registration through linked worktrees.
- Typed parser for `git worktree list --porcelain -z`.
- Typed parser for `git status --porcelain=v2 --branch -z`.
- Worktree board with clean/modified/locked/prunable states.

Exit criteria:

- Multiple repositories persist and reload.
- Parser fixture tests pass for edge-case paths and statuses.
- User can open worktree paths in editor/terminal/Finder.

### Phase 2 — Safe worktree mutations

Deliverables:

- Create existing-branch/new-branch worktrees.
- Branch listing and preflight.
- Lock/unlock, move, repair.
- Safe remove flow and prune preview/execute.
- Operation journal and basic failure panel.

Exit criteria:

- All mutating operations are serialized per repository.
- Dirty-removal safeguards pass integration tests.
- Every mutation produces inspectable success/failure records.

### Phase 3 — Shared resources and setup commands

Deliverables:

- Resource profile editor.
- Symlink/copy actions.
- Git ignore validation for protected targets.
- Link health and repair.
- Setup profile commands and operation logs.
- Partial-success UI for setup failures.

Exit criteria:

- Ignored `.env` link workflow works end-to-end.
- Non-ignored secret links are blocked.
- Failed setup does not obscure successful worktree creation.
- No secret content stored or logged.

### Phase 4 — UI refinement and packaging

Deliverables:

- Complete wizard UX.
- Operation Center and diagnostic-copy workflow.
- Loading/empty/error states.
- Keyboard/accessibility checks.
- Packaging configuration and real-project daily-use validation.

Exit criteria:

- MVP acceptance criteria in the scope document pass.
- Application is usable for daily worktree management on macOS.

## 7. Testing plan

### Unit tests

| Area | Test focus |
|---|---|
| Worktree parser | All porcelain fields, NUL terminators, locked/prunable states |
| Status parser | Clean/modified/untracked/conflicted and ahead/behind |
| Error interpreter | Known stderr/path/exit-code classifications |
| Schemas | Rejection of malformed IPC/config/resource data |
| Path validation | Prevent resource targets escaping worktree directory |

### Integration tests

Create temporary Git repositories during tests and invoke real Git to cover:

- add/list/move/remove/lock/unlock/repair/prune behavior;
- duplicate registration through primary and linked worktree paths;
- paths containing spaces and Unicode;
- ignored `.env` validation and symlink setup;
- dirty worktree removal failure and explicit force removal;
- setup-command partial failure.

### UI tests

Automate:

- adding projects;
- create-worktree wizard;
- resource validation error;
- operation technical-details view;
- dirty-remove safety confirmation;
- application restart persistence.

### Security verification

- Confirm no unrestricted Node integration in renderer.
- Confirm privileged operations require validated typed IPC.
- Confirm shell injection is not possible through branch/path values.
- Confirm diagnostics never contain secret file contents.

## 8. References

### Git and process execution

- Git worktree documentation: https://git-scm.com/docs/git-worktree
- Git status porcelain formats: https://git-scm.com/docs/git-status
- Git reference formatting: https://git-scm.com/docs/git-for-each-ref
- Git ignore checking: https://git-scm.com/docs/git-check-ignore
- execa: https://github.com/sindresorhus/execa
- dugite: https://github.com/desktop/dugite
- Node child process API: https://nodejs.org/api/child_process.html

### Desktop platform options

- Electron documentation: https://www.electronjs.org/docs/latest/
- Electron security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron context isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation
- Electron IPC: https://www.electronjs.org/docs/latest/tutorial/ipc
- Electron Forge: https://www.electronforge.io/
- Neutralinojs: https://neutralino.js.org/
- Neutralinojs process API: https://neutralino.js.org/docs/api/os/
- Bun spawn: https://bun.sh/docs/api/spawn
- Tauri architecture/reference comparison: https://tauri.app/

### Dependency/setup strategy

- pnpm motivation and store model: https://pnpm.io/motivation
- pnpm settings/global virtual store: https://pnpm.io/settings

### UI system

- shadcn/ui: https://ui.shadcn.com/docs
- Radix Primitives: https://www.radix-ui.com/primitives
- Zod: https://zod.dev/
- xterm.js: https://xtermjs.org/

### Agent skills

- OpenAI Codex skills documentation: https://developers.openai.com/codex/skills/
- OpenAI skills catalog: https://github.com/openai/skills
- Vercel agent skills: https://github.com/vercel-labs/agent-skills
- `skills` installer: https://github.com/vercel-labs/skills
- Anthropic frontend design skill: https://github.com/anthropics/skills/tree/main/skills/frontend-design
