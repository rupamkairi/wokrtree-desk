# Worktree Desk — Project Planning Bundle

**Status:** Revised scope-of-work and architecture baseline  
**Starting implementation path:** Electrobun + React + TypeScript  
**Supported fallback path:** Electron + React + TypeScript, used only if an Electrobun capability gate fails  
**Product purpose:** A local desktop application for managing multiple Git projects, their linked worktrees, and safe shared local-development resources such as `.env` files and certificates.

## Decision update — June 4, 2026

The project is no longer defined around Electron. It is defined around a portable product core and two desktop-shell adapters:

1. Start development with **Electrobun**, using Bun in the privileged process and React/TypeScript in the UI.
2. Keep **Electron** as a deliberately preserved fallback, without redesigning the domain layer or UI.
3. Do not migrate because of a minor integration inconvenience. Migrate only when a required MVP capability cannot be implemented reliably or safely in Electrobun.

Electrobun is treated as a legitimate starting platform rather than an experiment-only option because its official documentation describes a TypeScript desktop framework with a Bun main process, native/system webviews with optional CEF, typed RPC, native dialogs/utilities, and packaging/update support. Its GitHub release history listed stable `v1.18.1` on May 4, 2026 when this revision was prepared.

## Documents

| Document | Purpose |
|---|---|
| `00-decision-and-project-plans.md` | Updated Electrobun-first decision and Electron fallback plan |
| `01-product-scope-sow.md` | Definitive product scope, releases, exclusions, and acceptance criteria |
| `02-technical-architecture.md` | Portable architecture, Git parsing, shell adapters, errors and resources |
| `03-ui-ux-specification.md` | Shell-independent screens, workflows and component behavior |
| `04-implementation-roadmap-tools-and-skills.md` | Electrobun-first setup, packages, testing, skills and roadmap |
| `05-electrobun-validation-and-electron-fallback.md` | Capability gate and migration contract |

## Selected MVP outcome

The initial release must allow a developer to:

1. Register multiple local Git repositories without duplicating the same repository when a linked worktree is selected.
2. View and manage every linked worktree in each repository.
3. Create, open, lock, unlock, move, remove, repair, and prune-preview worktrees through a safe UI.
4. Define shared-resource profiles and symlink ignored files such as `.env` into newly created worktrees.
5. Preserve raw Git failures and explain recognized errors with practical remediation steps.
6. Avoid unsafe defaults, especially direct sharing of a writable `node_modules` directory.

## Core decision summary

| Decision | Selection |
|---|---|
| Initial desktop shell | Electrobun |
| Fallback desktop shell | Electron |
| UI | React + TypeScript; shell-independent feature layer |
| Styling/UI | Tailwind CSS + shadcn/ui/Radix primitives |
| Privileged runtime — initial | Bun process provided by Electrobun |
| Git command execution — initial | `Bun.spawn()` behind a `CommandRunner` interface |
| Git command execution — fallback | `execa`/Node.js behind the same interface |
| UI-to-privileged bridge — initial | Electrobun typed RPC |
| UI-to-privileged bridge — fallback | Electron preload/IPC adapter |
| Git parsing | Custom typed parsers over Git machine output (`--porcelain`, `--porcelain=v2`, `-z`) |
| Validation | Zod |
| State/persistence | Zustand for UI state; versioned JSON configuration for MVP |
| Dependency sharing | Per-worktree install using package-manager storage; no direct `node_modules` link by default |
| First supported environment | macOS; architecture must not prevent later Windows/Linux support |

## References

Official Electrobun references added in this revision:

- https://docs.electrobunny.ai/electrobun/
- https://docs.electrobunny.ai/electrobun/guides/quick-start/
- https://docs.electrobunny.ai/electrobun/guides/architecture/overview/
- https://docs.electrobunny.ai/electrobun/apis/browser-view/
- https://docs.electrobunny.ai/electrobun/apis/utils/
- https://github.com/blackboardsh/electrobun/releases
- https://bun.com/docs/runtime/child-process

A complete bibliography is included in `04-implementation-roadmap-tools-and-skills.md`.

---

# 00 — Decision and Project Plans

## 1. Revised decision

Build **Worktree Desk** with an **Electrobun-first, Electron-compatible** architecture.

The product should not be coupled to either shell. The UI, Git parsers, domain services, validation rules, error model, resource profiles and operation journal are product code. Electrobun or Electron should only supply a thin desktop boundary: window lifecycle, privileged command/filesystem execution, native dialogs, app launching, persistence path discovery and UI-to-backend messaging.

### Starting path

**Electrobun + React + TypeScript** is the starting implementation.

Why this is reasonable now:

- Electrobun's official documentation describes a Bun-backed TypeScript desktop application framework using the system's native WebView by default, with CEF optional when Chromium consistency is needed.
- The framework documents typed RPC between the browser UI and Bun process.
- Its documented utilities cover selecting files/folders, message boxes, opening paths, revealing files and clipboard/system interactions needed by this product.
- Its release history listed a stable `v1.18.1` release on May 4, 2026.

### Fallback path

**Electron + React + TypeScript** remains a maintained fallback design.

Move to Electron only if an Electrobun spike or later implementation establishes a critical blocker, such as failure to safely run/stream Git operations, create required filesystem links, support the needed React UI reliably, package the application for daily macOS use, or keep the privileged/UI boundary maintainable.

## 2. Non-negotiable portable product rules

These do not change when the desktop shell changes:

1. Do not parse normal human-readable terminal output.
2. Execute Git through a `CommandRunner` abstraction using argument arrays.
3. Read Git's documented machine formats:
   - `git worktree list --porcelain -z`
   - `git status --porcelain=v2 --branch -z`
   - `git for-each-ref --format=...`
   - `git check-ignore --stdin -v -z`
4. Keep React features independent of Electrobun and Electron APIs.
5. Keep privileged filesystem/process operations behind a typed, validated `DesktopBridge`.
6. Store paths and rules, never secret file contents.
7. Never offer a shared writable `node_modules` symlink as normal behavior.
8. Preserve raw sanitized technical failure details.

## 3. Platform plans

### Plan A — Electrobun + React + TypeScript — Start here

#### Role

Primary initial implementation path for v0.1.

#### Stack

| Area | Selection |
|---|---|
| Shell/runtime | Electrobun with Bun privileged process |
| UI | React + TypeScript, loaded as a bundled view |
| Web rendering | Native system WebView initially; evaluate optional CEF only when renderer consistency requires it |
| UI/backend communication | Electrobun typed RPC |
| Git/process runner | `Bun.spawn()` implementation of `CommandRunner` |
| Filesystem/symlinks | Bun-compatible TypeScript filesystem code behind `ResourceFilesystem` |
| Dialogs/open/reveal | Electrobun `Utils` adapter |
| Packaging/distribution | Electrobun build/distribution tooling |
| Validation | Zod |
| UI state | Zustand |
| Unit tests | Vitest or Bun-compatible test setup; parser tests are runtime-independent |
| Integration tests | Real Git repositories in temporary folders |

#### Benefits

- Keeps the implementation in TypeScript/JavaScript while avoiding a Chromium-bundled application by default.
- Bun is already the privileged runtime, making subprocess operations such as Git execution natural through `Bun.spawn()`.
- Official APIs cover typed RPC and native utility operations required by the MVP.
- Desktop distribution, signing/update concerns are part of Electrobun's documented framework scope.

#### Risks to validate immediately

- React/Tailwind/shadcn rendering consistency under the chosen native WebView on macOS.
- Streaming Git/setup output into the operation center.
- Symlink creation/repair and filesystem permission behavior.
- Launching Cursor/VS Code/terminal reliably.
- Test strategy for Bun subprocess capture and packaged application execution.
- Whether optional CEF is needed to avoid UI behavior variance.

#### Rule

Do not import Electrobun APIs in product feature modules. Only the adapter layer may depend on `electrobun/bun` or `electrobun/view`.

---

### Plan B — Electron + React + TypeScript — Preserved fallback

#### Role

Fallback when an Electrobun blocker affects MVP reliability, security or maintenance.

#### Stack

| Area | Selection |
|---|---|
| Shell/runtime | Electron + Node.js main process |
| UI | Same React + TypeScript feature code |
| UI/backend communication | Preload bridge + validated IPC implementing `DesktopBridge` |
| Git/process runner | `execa` implementation of `CommandRunner` |
| Filesystem/symlinks | Node filesystem adapter implementing the same interface |
| Packaging | Electron Forge or equivalent evaluated during migration |

#### Benefits

- Broad Node/npm ecosystem compatibility.
- Chromium rendering consistency.
- Mature patterns for filesystem/process-heavy desktop utilities.

#### Cost

- Larger runtime and application footprint.
- Migration effort in the desktop adapter, packaging and tests.

#### Rule

A fallback migration must not rewrite Git parsers, domain models, resource-policy logic, error classification, or most React UI components.

## 4. Migration-resilient boundaries

```text
React feature UI
  │
  │ DesktopClient interface
  ▼
Bridge Adapter
  ├── Electrobun typed RPC adapter     ← initial implementation
  └── Electron preload/IPC adapter      ← fallback implementation
  │
  ▼
Application services
  ├── ProjectRegistryService
  ├── GitWorktreeService
  ├── SharedResourceService
  ├── OperationJournalService
  └── ErrorInterpreter
  │
  ▼
Platform ports
  ├── CommandRunner
  │     ├── BunSpawnCommandRunner       ← initial
  │     └── ExecaCommandRunner          ← fallback
  ├── ResourceFilesystem
  ├── NativeDialogService
  └── ExternalLauncherService
```

## 5. Alternatives not currently pursued

| Option | Decision | Reason |
|---|---|---|
| Neutralinojs | Deprioritized | No longer needed as the lightweight option because Electrobun is the chosen first attempt. |
| Tauri | Not selected | Its privileged backend requires Rust, outside the intended TypeScript/JavaScript implementation path. |
| Bun local browser service | Not selected for product | Useful for experiments, but not the desired desktop interaction/distribution model. |
| Full Git GUI | Rejected for MVP | It expands scope without solving worktree setup/navigation problems. |

## 6. Product positioning

Worktree Desk is a companion to existing editors and Git clients. It owns:

- repository/worktree registration and navigation;
- worktree creation, cleanup, repair and safety;
- shared resource linking;
- setup-command execution and diagnostics;
- editor/terminal/folder launching.

It leaves commits, staging, branch graphs, rebase/merge conflict UI and remote pull-request workflows to existing tools.

## 7. Decision checkpoints

| Checkpoint | Decision |
|---|---|
| Initial scaffold | Use Electrobun + React + TypeScript |
| End of capability spike | Continue Electrobun only after all critical desktop capabilities pass |
| During MVP | Fix normal integration issues; do not migrate prematurely |
| Framework-level blocker | Create Electron adapter while preserving product core |
| Before release | Confirm chosen shell packages, signs and runs daily workflow on macOS |

## 8. Official references

- Electrobun overview: https://docs.electrobunny.ai/electrobun/
- Electrobun quick start: https://docs.electrobunny.ai/electrobun/guides/quick-start/
- Electrobun architecture: https://docs.electrobunny.ai/electrobun/guides/architecture/overview/
- Electrobun typed RPC / BrowserView: https://docs.electrobunny.ai/electrobun/apis/browser-view/
- Electrobun utilities: https://docs.electrobunny.ai/electrobun/apis/utils/
- Electrobun releases: https://github.com/blackboardsh/electrobun/releases
- Bun subprocess API: https://bun.com/docs/runtime/child-process
- Electron documentation: https://www.electronjs.org/docs/latest/
- Electron security: https://www.electronjs.org/docs/latest/tutorial/security

---

# 01 — Product Scope and Scope of Work

## 1. Product identity

**Working title:** Worktree Desk  
**Application type:** Local desktop developer utility  
**Primary user:** A developer working on multiple features/projects locally through Git worktrees  
**Initial platform:** macOS, with cross-platform-safe architectural decisions  
**Initial MVP shell:** Electrobun + React + TypeScript  
**Preserved fallback shell:** Electron + React + TypeScript only after a documented Electrobun capability failure

## 2. Problem statement

Git worktrees allow parallel branches without repeated repository clones, but developer workflow around them remains manual:

- remembering and navigating worktree folders;
- repeatedly creating `.env` files, local credentials, editor setup or certificates;
- safely managing multiple concurrently active projects;
- understanding why `git worktree add/remove/move` or setup commands failed;
- launching the right editor/terminal in the right directory;
- avoiding unsafe sharing of mutable dependencies.

Worktree Desk provides a single desktop interface to execute and explain these workflows safely.

## 3. Product principles

1. **Git remains the source of truth.** The app invokes official Git commands; it does not reimplement repository state.
2. **Machine-readable output only.** The app consumes porcelain/NUL-delimited formats rather than scraping human terminal text.
3. **No silent unsafe action.** Removal, secret linking and force behavior require validation and clear warnings.
4. **Technical errors remain visible.** Friendly explanation supplements, rather than replaces, original diagnostics.
5. **Multiple projects are first-class.** The app is not designed around a single repository.
6. **Worktrees first, full Git client never by accident.** No branch graph, staging view or merge workflow in MVP.
7. **Secrets are referenced, not stored.** Configuration records file locations and rules, not secret file contents.



## 3.1 Desktop platform scope

The MVP product requirements are shell-independent. Development starts with Electrobun and Bun; Electron is a supported fallback implementation rather than a locked product dependency.

Platform requirements:

- The React UI must call privileged functionality through typed, validated bridge operations.
- The Electrobun implementation must use typed RPC and a Bun-side service layer.
- The Electron fallback, when required, must implement the same bridge through preload/IPC.
- Product services and UI features must not directly import Electrobun or Electron APIs.
- The initial capability spike and fallback rules are defined in `05-electrobun-validation-and-electron-fallback.md`.

## 4. MVP functional scope: v0.1

### 4.1 Project registry

The user can register a repository by selecting either its primary checkout or any linked worktree directory.

The application must:

- verify that selected directory belongs to a Git worktree;
- resolve the primary repository identity using the common Git directory;
- prevent duplicate project registration when another linked worktree of the same repository is selected;
- store display name, resolved primary/worktree information, preferred worktree root, editor and resource rules;
- remove a project from the application without deleting repository files.

### 4.2 Multi-project dashboard

The application must show all registered projects.

Each project summary must display:

- project name;
- primary path;
- number of linked worktrees;
- count of clean/modified/attention-required worktrees;
- last operation failure indicator, when applicable;
- action to open project detail.

Search must match project name, branch name and worktree path.

### 4.3 Worktree inventory and status

For a selected project, show each worktree with:

- branch name or detached state;
- folder path;
- abbreviated HEAD commit ID;
- clean/modified/untracked status;
- upstream ahead/behind when available;
- locked or prunable state;
- shared-resource health indicator;
- setup status: ready, incomplete, failed or not configured.

Required operations:

- open in configured editor;
- open terminal at directory;
- reveal folder in Finder;
- copy path;
- lock/unlock;
- move;
- remove safely;
- repair;
- preview prune candidates and then prune only after confirmation.

### 4.4 Create-worktree workflow

A wizard must allow the user to:

1. Choose a registered project.
2. Choose an existing local branch, remote-derived branch, or create a new branch from a selected base.
3. View/edit the proposed new directory path.
4. Choose a resource profile to apply.
5. Select optional setup actions, such as dependency install or Prisma generation.
6. Choose whether to open the new worktree in editor or terminal after setup.
7. Review actions before execution.
8. View live operation progress and any failures.

Preflight checks must detect:

- invalid repository;
- destination directory conflict;
- branch already checked out by another worktree;
- broken resource source path;
- secret target not ignored;
- unsupported symlink/setup requirements.

A worktree may be created successfully even when a post-create setup command fails. In that case, it remains listed with a clear **Setup failed** state and an action to retry setup.

### 4.5 Shared resource profiles

A user can define project-specific named profiles, for example:

- `Development .env`
- `Mobile Firebase + certificates`
- `Web local environment`

A resource rule contains:

| Field | Meaning |
|---|---|
| Source path | Canonical file/directory outside the worktree |
| Target relative path | Location inside each new worktree |
| Strategy | `symlink`, `copy`, or later `template` |
| Required | Whether worktree setup fails if unavailable |
| Secret | Whether ignore validation is mandatory |
| Require ignored | Whether Git ignore validation must pass before creation |

MVP requirements:

- symlink files and folders on macOS;
- copy non-secret files when configured;
- detect broken links;
- repair links using the configured canonical source;
- run ignore validation for secret resources before link creation;
- block linking a secret target when it is not ignored, and display how to fix the ignore rule.

### 4.6 Dependencies and setup actions

MVP must support executing explicitly configured post-create commands, such as:

```sh
pnpm install
pnpm prisma generate
```

MVP rules:

- Direct linking of a single shared `node_modules` into multiple worktrees is not offered as a standard feature.
- Each worktree remains logically isolated.
- pnpm is recommended where dependency storage efficiency matters.
- Output from setup commands is displayed in the operation record and can be copied for debugging.
- A failed setup command never hides a successful Git worktree creation.

### 4.7 Error reporting and diagnostics

Every operation must create an operation record.

The error interface must contain:

1. A concise human-readable title.
2. The operation attempted and its project/worktree context.
3. A safe next action when the error maps to a known case.
4. Expandable technical details:
   - sanitized command and arguments;
   - working directory;
   - exit code;
   - stdout/stderr;
   - timestamped operation steps.
5. Copy-diagnostics action.
6. Retry action where safe.

Errors that must be classified in MVP:

| Failure condition | User-visible remediation |
|---|---|
| Git executable unavailable | Configure/install Git and retry |
| Selected directory is not a Git repository | Select a repository/worktree folder |
| Branch is already checked out in another worktree | Navigate to existing worktree or choose another branch |
| Destination path already exists | Select another directory or inspect existing folder |
| Worktree has uncommitted/untracked files during removal | Open changed files; remove only through explicit force action |
| Linked secret target is not ignored | Add ignore rule or cancel resource link |
| Source file for symlink no longer exists | Choose new shared source or remove/repair rule |
| Permissions deny filesystem action | Inspect folder permissions/location and retry |
| Post-create command failure | Keep worktree, show setup failed state, retry selected action |
| Stale/prunable worktree metadata | Preview prune or run repair |

Unknown failures must clearly say that Git or the OS returned an unclassified failure and must expose the untouched sanitized technical output.

### 4.8 Preferences

MVP settings include:

- Git executable discovery/displayed version;
- preferred editor launcher: Cursor, VS Code, configured command;
- terminal launcher;
- default parent directory for new worktrees;
- default setup/resource profile per project;
- operation log retention and clear action.

## 5. Explicit exclusions from MVP

The following are not in v0.1 scope:

- commit/staging UI;
- branch graph or commit tree diagram;
- merging, rebasing or cherry-picking UI;
- push/pull/remotes authentication workflows;
- GitHub/GitLab/Pull Request integrations;
- embedded AI capabilities;
- direct mutable `node_modules` linking;
- general plugin marketplace;
- team/cloud synchronization;
- Windows/Linux release certification;
- visual terminal emulator.

These may not be added during MVP implementation unless the scope document is explicitly revised.

## 6. Follow-on releases

### v0.2 — Workflow productivity

- Setup profiles with sequenced commands and retry from failure.
- Generated per-worktree local override files, for example port configuration.
- Worktree-specific dev-server metadata.
- Optional streaming terminal-like panel for long commands.
- More comprehensive health repair dashboard.

### v1.0 — Product-ready desktop release

- Hardened cross-platform path/symlink behavior.
- Windows and Linux packaging/test matrix.
- Signed release workflow.
- Import/export non-secret configuration.
- Keyboard-first command palette.
- Performance validation across larger project collections.

### Later investigation only

- Package-manager-aware advanced dependency optimizations.
- Dev-process launcher and port coordination.
- Optional integrations with existing Git GUIs/editors.

## 7. Acceptance criteria for MVP

### Registry and multi-project behavior

- Selecting a main checkout or any linked worktree for the same repository registers exactly one project identity.
- The dashboard loads registered projects and their worktree counts after application restart.
- Multiple unrelated projects can be independently listed and managed.

### Parser correctness

- Worktree parsing uses NUL-delimited porcelain output.
- Status parsing uses porcelain v2 and handles branch/upstream state.
- Parser tests cover paths with spaces, Unicode characters and delimiter-sensitive cases.
- Git display configuration or color settings do not alter application state parsing.

### Creation and shared resources

- A new worktree can be created from a new branch based on a chosen ref.
- Configured `.env` link creation is blocked when its target is not ignored.
- A valid ignored `.env` target can be symlinked from the configured canonical source.
- A broken source/link is visibly reported and repairable.
- A failed optional setup command leaves the created worktree discoverable with failed setup status.

### Safe mutation

- Dirty worktree removal is blocked by default.
- Force removal requires an explicit high-friction confirmation and displays what will be lost.
- Prune is previewed before mutation.
- Git repair can be triggered for stale/moved worktree metadata.

### Diagnostics

- Every mutating action records command, sanitized arguments, cwd, outcome and raw output.
- Known failures show targeted remediation.
- Unknown failures expose technical details and allow copying diagnostics.
- No secret file content is included in logs or project configuration.

### Desktop boundary and security

- React UI has no general filesystem or arbitrary process execution access.
- Electrobun-first implementation exposes only typed RPC requests handled in the Bun privileged layer.
- Electron fallback exposes the same narrow contract through preload/IPC.
- Input paths and operation payloads are validated before use.
- The app invokes Git through argument arrays without shell command-string interpolation.

## 8. Definition of done

MVP is complete when the acceptance criteria pass on macOS against temporary integration repositories and at least one real multi-worktree JavaScript project, and the selected shell can be packaged and used daily without relying on manual terminal steps for the scoped worktree/resource flows. The initial target shell is Electrobun; Electron remains the documented fallback when a capability-gate failure is recorded.

---

# 02 — Technical Architecture

## 1. Architecture overview

Worktree Desk is a privileged local desktop application. The architecture separates UI from operating-system access.

```text
┌─────────────────────────────────────────────────────┐
│ React UI / View Features                             │
│ Components, view models, local display state        │
│ No direct Git, filesystem or arbitrary process API  │
└──────────────────────────┬──────────────────────────┘
                           │ DesktopClient contract
┌──────────────────────────▼──────────────────────────┐
│ Desktop Bridge Adapter                               │
│ Electrobun typed RPC (initial)                      │
│ Electron preload/IPC (fallback)                     │
└──────────────────────────┬──────────────────────────┘
                           │ validated requests
┌──────────────────────────▼──────────────────────────┐
│ Application Services                                 │
│ ProjectRegistry, GitAdapter, ResourceService,       │
│ OperationService, LauncherService, ConfigStore      │
└──────────────────────────┬──────────────────────────┘
                           │ platform ports
┌──────────────────────────▼──────────────────────────┐
│ Platform Adapter                                    │
│ Bun.spawn + Electrobun Utils (initial)              │
│ execa + Electron/Node APIs (fallback)               │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│ Local OS / Installed Git / Editor / Filesystem      │
└─────────────────────────────────────────────────────┘
```

## 2. Key rules

1. The React view layer cannot run Git or access the filesystem directly.
2. Every bridge/RPC/IPC payload and stored configuration object is schema-validated.
3. Every Git action uses argument arrays rather than a concatenated shell command.
4. Every parser consumes documented machine output, not human display output.
5. Mutating commands are queued per repository to avoid overlapping conflicting actions.
6. Operations persist sanitized logs; no secret file contents are loaded into logs.

## 3. Core modules

| Module | Responsibility |
|---|---|
| `ProjectRegistryService` | Register projects, deduplicate by Git common directory, persist preferences |
| `CommandRunner` | Port for safe command execution; implemented with `Bun.spawn()` initially and `execa` only in Electron fallback |
| `GitRepositoryAdapter` | Discover/verify repository and common directory |
| `GitWorktreeAdapter` | List/create/move/remove/lock/unlock/prune/repair worktrees |
| `GitStatusAdapter` | Read clean/dirty/untracked and branch ahead/behind state |
| `GitRefAdapter` | List branches/base refs for creation wizard |
| `SharedResourceService` | Validate rules, create/copy/repair links, report health |
| `IgnoreValidationService` | Use Git ignore checks for protected targets |
| `SetupCommandService` | Run opt-in post-create actions and capture logs |
| `OperationJournalService` | Record operations, steps, errors and retry metadata |
| `ErrorInterpreter` | Map known Git/filesystem failures to safe UI remedies |
| `LauncherService` | Open editor/terminal/Finder through the current desktop adapter |
| `ConfigStore` | Store versioned non-secret app and project configuration |

## 4. Git command contract

### 4.1 Read-only commands

| Purpose | Git command | Parsed result |
|---|---|---|
| Check installed Git | `git --version` | Version/availability |
| Resolve selected directory | `git rev-parse --show-toplevel --git-common-dir --is-inside-work-tree` | Project identity and primary context |
| List worktrees | `git worktree list --porcelain -z` | `Worktree[]` |
| Read worktree state | `git status --porcelain=v2 --branch -z --untracked-files=normal` in each worktree | `WorktreeStatus` |
| List local branches | `git for-each-ref --format=... refs/heads` | `BranchRef[]` |
| Validate ignored target | `git check-ignore --stdin -v -z` | Matched ignore rule or violation |
| Preview prune | `git worktree prune -n -v` | Proposed cleanup operations |

### 4.2 Mutating commands

| Operation | Command |
|---|---|
| Add existing branch worktree | `git worktree add <path> <branch>` |
| Add new branch worktree | `git worktree add -b <newBranch> <path> <baseRef>` |
| Lock | `git worktree lock --reason <reason> <path>` |
| Unlock | `git worktree unlock <path>` |
| Move | `git worktree move <path> <newPath>` |
| Remove | `git worktree remove <path>` |
| Force remove after confirmation | `git worktree remove --force <path>` |
| Prune after preview/confirmation | `git worktree prune -v` |
| Repair | `git worktree repair <path>` |

Mutating commands must run through a per-project operation lock.

## 5. Why custom parsers rather than a Git GUI library

The application does need an npm dependency for executing commands, but it does not need a package to reverse-engineer Git's user-facing terminal text.

Recommended:

- Use `execa` for process execution, captured output and streamed long-running setup output.
- Implement small domain parsers for the stable formats exposed by Git.

Deferred option:

- Evaluate `dugite` later when the application must ship a known Git binary for users whose local Git installation cannot be assumed.

Not selected as primary abstraction:

- A generic Git wrapper that mostly forwards arbitrary commands does not remove the requirement to define worktree-specific domain state, error UX or safety validation.

## 6. Data models

```ts
export type Project = {
  id: string;
  name: string;
  primaryPath: string;
  commonGitDir: string;
  worktreeRoot: string;
  editor?: "cursor" | "code" | "terminal" | "finder" | "custom";
  editorCommand?: string;
  packageManager?: "pnpm" | "npm" | "yarn" | "bun";
  resourceProfiles: ResourceProfile[];
  setupProfiles: SetupProfile[];
};

export type Worktree = {
  path: string;
  headOid?: string;
  branchRef?: string;
  detached: boolean;
  bare: boolean;
  lockedReason?: string;
  prunableReason?: string;
  status?: WorktreeStatus;
  resourceHealth?: ResourceHealth;
  setupState?: "unconfigured" | "ready" | "failed" | "running";
};

export type WorktreeStatus = {
  branch?: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
  changedCount: number;
  untrackedCount: number;
  conflictCount: number;
  clean: boolean;
};

export type ResourceProfile = {
  id: string;
  name: string;
  rules: ResourceRule[];
};

export type ResourceRule = {
  sourcePath: string;
  targetRelativePath: string;
  strategy: "symlink" | "copy";
  required: boolean;
  secret: boolean;
  requireIgnored: boolean;
};

export type SetupProfile = {
  id: string;
  name: string;
  commands: Array<{
    executable: string;
    args: string[];
    label: string;
    required: boolean;
  }>;
};

export type OperationFailure = {
  category: "git" | "filesystem" | "validation" | "dependency" | "security" | "launcher";
  code: string;
  summary: string;
  technicalDetail: string;
  command?: {
    executable: string;
    args: string[];
    cwd: string;
  };
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  suggestions: Array<{
    label: string;
    action?: string;
    explanation: string;
  }>;
  retryable: boolean;
};
```


## 7. Command runner pattern

The core service layer depends on a port, not on Bun or Electron directly.

```ts
export type RawCommandResult = {
  executable: string;
  args: string[];
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

export interface CommandRunner {
  run(cwd: string, executable: string, args: string[]): Promise<RawCommandResult>;
}
```

### Electrobun-first implementation

Electrobun uses Bun in its privileged process, so the initial runner uses `Bun.spawn()`:

```ts
export class BunSpawnCommandRunner implements CommandRunner {
  async run(
    cwd: string,
    executable: string,
    args: string[]
  ): Promise<RawCommandResult> {
    const proc = Bun.spawn([executable, ...args], {
      cwd,
      stdout: "pipe",
      stderr: "pipe"
    });

    const [stdout, stderr, exitCode] = await Promise.all([
      proc.stdout.text(),
      proc.stderr.text(),
      proc.exited
    ]);

    return { executable, args, cwd, exitCode, stdout, stderr };
  }
}
```

### Electron fallback implementation

Only if the platform fallback is triggered, implement the same port with Node and `execa`:

```ts
import { execa } from "execa";

export class ExecaCommandRunner implements CommandRunner {
  async run(
    cwd: string,
    executable: string,
    args: string[]
  ): Promise<RawCommandResult> {
    const result = await execa(executable, args, {
      cwd,
      reject: false,
      encoding: "utf8"
    });

    return {
      executable,
      args,
      cwd,
      exitCode: result.exitCode ?? 1,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? ""
    };
  }
}
```

Rules:

- Never execute a command built by interpolating untrusted values into a shell string.
- Validate paths, refs and operation inputs before invocation.
- Keep raw stdout/stderr available for diagnostics.
- Git parsers and operation services must not depend on which runner implementation is active.
- Redact configured secret-path values when exporting diagnostic reports if filenames themselves are sensitive.

## 8. Worktree parser contract

Git `worktree list --porcelain -z` emits NUL-terminated field records. A parser should recognize:

- `worktree <path>`
- `HEAD <oid>`
- `branch <ref>`
- `detached`
- `bare`
- `locked [reason]`
- `prunable [reason]`
- empty terminator between worktree records

Parser design:

```ts
export function parseWorktreePorcelainZ(output: string): Worktree[] {
  const tokens = output.split("\0");
  const worktrees: Worktree[] = [];
  let current: Partial<Worktree> | undefined;

  const commit = () => {
    if (current?.path) {
      worktrees.push({
        path: current.path,
        headOid: current.headOid,
        branchRef: current.branchRef,
        detached: current.detached ?? false,
        bare: current.bare ?? false,
        lockedReason: current.lockedReason,
        prunableReason: current.prunableReason
      });
    }
    current = undefined;
  };

  for (const token of tokens) {
    if (token === "") {
      commit();
      continue;
    }

    const [field, ...rest] = token.split(" ");
    const value = rest.join(" ");

    if (field === "worktree") {
      commit();
      current = { path: value, detached: false, bare: false };
    } else if (!current) {
      throw new Error(`Malformed worktree output: ${field}`);
    } else if (field === "HEAD") {
      current.headOid = value;
    } else if (field === "branch") {
      current.branchRef = value;
    } else if (field === "detached") {
      current.detached = true;
    } else if (field === "bare") {
      current.bare = true;
    } else if (field === "locked") {
      current.lockedReason = value || "locked";
    } else if (field === "prunable") {
      current.prunableReason = value || "prunable";
    }
  }

  commit();
  return worktrees;
}
```

Parser unit tests must be driven by output fixtures rather than only mocked objects.

## 9. Git status parser contract

For each worktree, call:

```sh
git status --porcelain=v2 --branch -z --untracked-files=normal
```

Required interpretations:

- `# branch.head`: current branch
- `# branch.upstream`: tracked upstream
- `# branch.ab +N -M`: ahead and behind values
- ordinary changed entries: increment changed count
- untracked entries: increment untracked count
- conflict/unmerged entries: increment conflict count

A directory is clean only when changed, untracked and conflict counts are all zero.

## 10. Shared-resource safety architecture

### 10.1 Allowed standard strategies

| Strategy | Standard use |
|---|---|
| `symlink` | `.env`, certificates, read-only shared local config or assets |
| `copy` | Non-secret starter files that each worktree may edit independently |

### 10.2 Protected-resource preflight

Before a resource marked `secret` or `requireIgnored` is linked:

1. Verify source exists.
2. Resolve target relative path inside worktree and prevent traversal outside the worktree.
3. Query ignore status using `git check-ignore --stdin -v -z`.
4. If not ignored, block the action.
5. When ignored, create the symlink and record health status.

### 10.3 Dependencies

The application must not directly symlink a shared writable `node_modules` folder in MVP.

Recommended behavior:

- Detect `pnpm-lock.yaml` and suggest `pnpm install` as a setup action.
- Allow every worktree to have a logically correct dependency tree while pnpm avoids unnecessary package duplication through its store.
- Only investigate package-manager-supported advanced optimizations after MVP, with explicit experimental warnings.

## 11. Error architecture

### 11.1 Operation journal structure

```ts
type OperationRecord = {
  id: string;
  projectId: string;
  worktreePath?: string;
  kind:
    | "register-project"
    | "list-worktrees"
    | "create-worktree"
    | "remove-worktree"
    | "move-worktree"
    | "resource-setup"
    | "setup-command"
    | "repair"
    | "prune";
  startedAt: string;
  completedAt?: string;
  state: "running" | "succeeded" | "failed" | "partially-succeeded";
  steps: OperationStep[];
  failure?: OperationFailure;
};
```

### 11.2 Error display strategy

The app presents errors in two layers:

**Resolution layer**

- title;
- context;
- known cause;
- safe next actions.

**Technical layer**

- sanitized command;
- working directory;
- raw exit code;
- stdout/stderr;
- operation step timeline;
- copy diagnostic report.

### 11.3 Important partial-success case

When `git worktree add` succeeds but `pnpm install` or resource setup fails:

- never say worktree creation failed;
- set overall state to `partially-succeeded`;
- show the created worktree immediately;
- mark setup as failed;
- allow retrying only failed setup steps.


## 12. Desktop bridge and security architecture

### 12.1 Shared security contract

Regardless of shell:

- UI feature code does not receive unrestricted filesystem or command-execution access.
- Only approved operations are exposed through a typed `DesktopBridge`.
- Request payloads and stored configuration are validated with schemas.
- The application loads packaged local UI content for MVP, not arbitrary remote content with privileges.
- All Git/setup commands execute through an argument-array command runner.

### 12.2 Electrobun-first adapter

Electrobun implements the bridge through typed RPC between the React browser view and Bun process. Privileged operations, including Git commands, path selection, filesystem mutations and external launching, run in Bun-side services.

Relevant Electrobun capabilities to validate in the spike:

- typed RPC for browser-to-Bun calls;
- `Utils.openFileDialog()` for selecting project/resource folders;
- `Utils.showMessageBox()` for native confirmations/errors where used;
- open/reveal utilities for workspace launching;
- application packaging on macOS.

### 12.3 Electron fallback adapter

When an Electrobun capability gate fails and migration is documented, Electron must expose the same `DesktopBridge` shape through a sandboxed renderer, context-isolated preload API and validated IPC handlers. The fallback may not expand renderer privileges.

Example shell-neutral API shape:

```ts
type DesktopBridge = {
  projects: {
    list(): Promise<Project[]>;
    register(directory: string): Promise<Project>;
  };
  worktrees: {
    list(projectId: string): Promise<Worktree[]>;
    create(request: CreateWorktreeRequest): Promise<OperationRecord>;
    remove(request: RemoveWorktreeRequest): Promise<OperationRecord>;
  };
  resources: {
    validate(profileId: string, worktreePath: string): Promise<ResourceHealth>;
    repair(request: RepairResourceRequest): Promise<OperationRecord>;
  };
  operations: {
    list(projectId?: string): Promise<OperationRecord[]>;
  };
};
```

## 13. Storage

### MVP choice: versioned JSON

Persist only:

- registered project paths and preferences;
- resource rules containing paths, not file contents;
- setup profile command arrays;
- recent sanitized operation summaries.

Advantages:

- easy to inspect and debug for a local personal utility;
- simple migrations through config schema versioning;
- avoids unnecessary database architecture.

Move to SQLite only when operation search/history or large persistent entities require it.

## 14. Technical references

- https://git-scm.com/docs/git-worktree
- https://git-scm.com/docs/git-status
- https://git-scm.com/docs/git-for-each-ref
- https://git-scm.com/docs/git-check-ignore
- https://docs.electrobunny.ai/electrobun/
- https://docs.electrobunny.ai/electrobun/guides/architecture/overview/
- https://docs.electrobunny.ai/electrobun/apis/browser-view/
- https://docs.electrobunny.ai/electrobun/apis/utils/
- https://bun.com/docs/runtime/child-process
- https://github.com/sindresorhus/execa
- https://github.com/desktop/dugite
- https://www.electronjs.org/docs/latest/tutorial/security
- https://www.electronjs.org/docs/latest/tutorial/context-isolation
- https://www.electronjs.org/docs/latest/tutorial/ipc
- https://pnpm.io/motivation
- https://pnpm.io/settings

---

# 03 — UI and UX Specification

## 1. UI goal

This UI specification is desktop-shell independent. It must be implemented once in React + TypeScript and function under the initial Electrobun view adapter or the Electron fallback without feature-level redesign.


The UI must make worktrees feel like active local workspaces rather than obscure Git metadata.

The user should be able to answer these questions immediately:

- What projects are registered?
- Which worktrees are active for each project?
- Which workspace has uncommitted work?
- Which worktree is broken, locked, stale or missing setup?
- Where will a new worktree be created?
- Which shared resources and setup actions will be applied?
- What exactly failed and how can it be fixed?

A branch graph does not answer these questions and is intentionally excluded from MVP.

## 2. Application layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Worktree Desk                    Search / Command Palette        Settings│
├──────────────────────┬───────────────────────────────────┬──────────────┤
│ Projects              │ Selected Project / Worktree Board │ Inspector    │
│                      │                                   │ or Operation │
│ FireAlert        4   │ [Create Worktree] [Refresh]       │ Details      │
│ Client Portal    2   │                                   │              │
│ Side Project     1   │ Worktree cards/table              │              │
│                      │                                   │              │
│ + Add Project         │                                   │              │
├──────────────────────┴───────────────────────────────────┴──────────────┤
│ Operation Center: latest command progress or failure                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Regions

| Region | Purpose |
|---|---|
| Left sidebar | Project switching and attention summary |
| Header | Search/command palette, current context, settings |
| Main board | Worktrees for selected project |
| Inspector | Selected worktree/resource/error details |
| Operation center | Current/recent operations and diagnostic visibility |

## 3. Information hierarchy

Prioritize:

1. Project and branch/worktree identity.
2. Safety/status state: dirty, conflict, locked, prunable, broken setup.
3. Primary actions: open, create, remove, repair.
4. Resources and dependency setup state.
5. Technical details and logs.

Avoid showing commit metadata, remote history or advanced Git terminology until it affects the worktree operation.

## 4. Screens

### 4.1 Onboarding / Add Project

#### User flow

1. User selects **Add Project**.
2. Native directory picker selects a checkout or linked worktree.
3. App validates Git repository and resolves common project identity.
4. App displays discovered worktrees.
5. User sets default:
   - worktree parent directory;
   - editor;
   - optional resource profile;
   - optional setup profile.
6. Project is added.

#### UI requirements

- Explain when a selected directory is already part of a registered repository.
- Do not create/delete/change anything during registration.
- Show Git version missing/invalid errors explicitly.

### 4.2 Global Dashboard

For each project, display:

| Display element | Example |
|---|---|
| Name | FireAlert |
| Location | `~/Code/FireAlert` |
| Worktree summary | 4 worktrees · 2 modified |
| Attention badges | Setup failed, broken link, locked |
| Latest operation | Created `feature/incident-map` |

Primary action: open project detail. Secondary actions: create worktree, reveal folder, remove from app.

### 4.3 Project Worktree Board

Use a toggle between **cards** and **compact table**, with cards as default.

#### Card example

```text
┌───────────────────────────────────────────────────────┐
│ feature/incident-proximity            Modified · 8    │
│ ~/Code/Worktrees/FireAlert/incident-proximity         │
│ ↑2 ↓0 · .env linked · Setup ready                     │
│                                                       │
│ [Open Cursor] [Terminal] [Details]                   │
│ More: Lock · Move · Remove · Repair                   │
└───────────────────────────────────────────────────────┘
```

#### Badge taxonomy

| Badge | Meaning |
|---|---|
| Clean | No changed/untracked/conflict files |
| Modified | Tracked changes exist |
| Untracked | Untracked files exist |
| Conflict | Unmerged files exist; highest visual priority |
| Locked | Worktree is protected from pruning |
| Prunable | Metadata indicates removable/stale worktree |
| Setup failed | Post-create action failed |
| Link broken | One or more configured resource links are invalid |

#### Required board actions

- Create Worktree.
- Refresh statuses.
- Search/filter by branch/path/state.
- Open selected worktree in configured editor.
- View worktree details before destructive actions.

### 4.4 Create Worktree Wizard

#### Step 1 — Branch

Options:

- Existing local branch.
- New branch from base ref.
- Later: remote branch workflow.

Fields:

- source/base branch;
- new branch name where applicable;
- warning when branch is already checked out in another worktree.

#### Step 2 — Directory

- Proposed worktree folder is generated from branch name.
- User can adjust path.
- Path conflict is checked before execution.

#### Step 3 — Resource Profile

Show rule checklist:

```text
Development Resources
[x] Symlink .env.local         source available · ignored target
[x] Symlink local certificate  source available · ignored target
[ ] Copy seed-data.json        optional
```

A blocked secret link displays the exact target and action: add ignore rule or disable link.

#### Step 4 — Setup Actions

```text
[x] pnpm install
[x] pnpm prisma generate
[ ] pnpm test
```

Each action indicates required/optional behavior.

#### Step 5 — Review and Run

Present an understandable execution plan:

```text
Create feature/fire-map-filter from develop
Directory: ~/Code/Worktrees/FireAlert/fire-map-filter
Link: .env.local and certificates
Run: pnpm install, pnpm prisma generate
Open: Cursor
```

During execution, show progress steps, not only a spinner.

### 4.5 Worktree Detail Inspector

Tabs:

| Tab | Content |
|---|---|
| Overview | Path, branch, status, opening actions, lock state |
| Changes summary | Counts and safe remove blockers; no staging interface |
| Resources | Configured links/copies and health/repair actions |
| Setup | Commands previously executed, success/failure, retry |
| Operations | Relevant diagnostic history |

### 4.6 Shared Resource Profile Editor

Resource editor fields:

- profile name;
- source location picker;
- relative target path;
- symlink/copy strategy;
- required toggle;
- secret/require ignored toggle;
- validation preview.

The UI must never render `.env` contents. It only shows file path and validation state.

### 4.7 Error and Operation Center

#### Error panel design

```text
Cannot remove worktree: local changes exist

Worktree: feature/incident-proximity
Path: ~/Code/Worktrees/FireAlert/incident-proximity

Git prevented removal because files in this workspace are modified
or untracked. Removing it now could discard local work.

[Open Worktree] [View Status Summary] [Cancel]
Advanced: [Force Remove...]

Technical Details ▾
  Command: git worktree remove <path>
  Exit code: 128
  stderr: ...
  [Copy Diagnostics]
```

#### Technical user requirements

- Raw stderr remains accessible.
- Sanitized command and cwd are displayed.
- User can copy a diagnostic report.
- A recognized cause gives safe actions; it never hides Git's own message.
- An unrecognized cause is labeled as unclassified rather than guessed.

### 4.8 Settings

Sections:

- Git executable and detected version.
- Default editor/terminal command.
- Worktree parent-directory convention.
- Appearance/theme.
- Operation log retention.
- Diagnostics export/clear.

## 5. Interaction rules

| Behavior | Rule |
|---|---|
| Destructive action | Must be explicit; dirty removal is blocked until force confirmation |
| Long operation | Show step list and live output link/panel |
| Refresh | Never discard operation/error state just because status refreshes |
| Offline/local | App should not require account/login/network to manage local projects |
| Keyboard | Command palette and shortcuts planned for v1; basic keyboard accessibility from MVP |
| Secrets | Never preview content; show only path/health/ignore status |
| Technical terminology | Use Git terms accurately; provide simple context beside them |

## 6. Component toolkit

Recommended UI foundation:

- React + TypeScript.
- Tailwind CSS for layout and tokens.
- shadcn/ui components based on accessible Radix primitives.
- Lucide icons.
- Zod-backed forms and IPC payload validation.

Likely components:

| Feature | Components |
|---|---|
| Layout | Sidebar, Scroll Area, Separator, Resizable panels optionally later |
| Worktree board | Card, Badge, Button, Dropdown Menu, Table |
| Create wizard | Dialog/Sheet, Form, Select, Checkbox, Alert |
| Command search | Command |
| Error panel | Alert Dialog, Collapsible, Tabs |
| Settings | Tabs, Form, Tooltip |
| Operations | Progress, Scroll Area, optional terminal component later |

## 7. UX anti-features

Do not implement these in MVP:

- Graph visualization.
- Terminal-like UI for every read operation.
- A file-diff editor.
- Hiding raw Git errors behind generic toasts.
- Auto-forcing worktree removals.
- Automatically linking sensitive files without ignore confirmation.
- Overloaded dashboards displaying Git information unrelated to active workspaces.

## 8. UI references

- shadcn/ui: https://ui.shadcn.com/docs
- shadcn/ui Sidebar: https://ui.shadcn.com/docs/components/sidebar
- Radix Primitives accessibility-focused components: https://www.radix-ui.com/primitives
- Lucide icons: https://lucide.dev/
- xterm.js, optional long-operation terminal view: https://xtermjs.org/

---

# 04 — Implementation Roadmap, Tools and Skills

## 1. Platform direction

Implementation starts with **Electrobun + React + TypeScript**. The project must keep **Electron + React + TypeScript** as an adapter-level fallback.

The first implementation task is not the full product. It is the capability spike defined in `05-electrobun-validation-and-electron-fallback.md`. This prevents investing heavily in shell-specific behavior before the core desktop requirements have been validated.

## 2. Terminology: project packages vs agent skills

Two categories are relevant:

1. **Application dependencies** are packages installed in the repository to build and run Worktree Desk.
2. **Agent skills** are repository-local or installed guidance for Codex and other coding agents, used to preserve UI and architecture rules while implementing the app.

Agent skills do not replace packages or tests.

## 3. Recommended application dependency stack

### Shared dependencies

| Package/category | Purpose |
|---|---|
| `react`, `react-dom` | Shared desktop UI |
| `zod` | Validate bridge payloads, configuration and domain inputs |
| `zustand` | Lightweight UI state |
| `lucide-react` | Icon set |
| `clsx`, `tailwind-merge` | Component class composition |

### Electrobun-first dependencies/tooling

| Package/category | Purpose |
|---|---|
| `electrobun` | Initial desktop shell and Bun-side desktop APIs |
| Bun built-in `Bun.spawn()` | Initial Git/setup subprocess runner |
| `vite`, `@vitejs/plugin-react`, `typescript` | React UI build setup as required by selected scaffold |
| `tailwindcss` and shadcn/ui CLI/components | UI system |
| `vitest` or verified Bun-compatible testing setup | Domain/parser unit tests |
| `@testing-library/react` | UI component tests |
| `eslint`, `prettier` | Static quality/style |

### Electron fallback-only dependencies

Do not install these at the start unless required for a migration spike:

| Package/category | Purpose |
|---|---|
| `electron` | Fallback desktop shell |
| `@electron-forge/cli` / Forge Vite tooling | Fallback packaging/build |
| `execa` | Node-side command runner implementing the same `CommandRunner` contract |
| `playwright` Electron-specific setup | Fallback desktop end-to-end coverage |

### Optional later dependency

| Package | Introduce when |
|---|---|
| `@xterm/xterm`, `@xterm/addon-fit` | Only when a long-operation terminal-style display provides meaningful UX benefit |

## 4. Starting scaffold

### Electrobun-first bootstrap

Official Electrobun documentation uses:

```sh
bunx electrobun init
cd worktree-desk
bun install
bun start
```

Select or adapt the TypeScript UI template so the project includes a React view. After the shell launches, add shared UI/domain dependencies:

```sh
bun add react react-dom zod zustand lucide-react clsx tailwind-merge
bun add -d typescript vite @vitejs/plugin-react vitest @testing-library/react eslint prettier

bunx --bun shadcn@latest init
bunx --bun shadcn@latest add sidebar button badge card dialog alert-dialog command sheet form dropdown-menu scroll-area separator tabs tooltip table
```

The exact React bundling adjustment must be validated against the current Electrobun template and documentation during Phase 0; do not bring Electron bootstrap files into the initial project.

### Electron fallback bootstrap

Only after a documented fallback decision:

```sh
npx create-electron-app@latest worktree-desk-electron --template=vite
```

Migrate by attaching the existing `src/core` and `src/ui` code to Electron adapters, not by rewriting the application.

## 5. Repository structure

```text
worktree-desk/
├── .agents/
│   └── skills/
│       └── worktree-desk-domain/
│           └── SKILL.md
├── docs/
├── src/
│   ├── core/
│   │   ├── domain/
│   │   ├── errors/
│   │   ├── git/
│   │   │   └── parsers/
│   │   ├── schemas/
│   │   └── services/
│   ├── platform/
│   │   ├── contracts/
│   │   ├── electrobun/          # initial platform adapter
│   │   │   ├── bun-entry.ts
│   │   │   ├── bridge-rpc.ts
│   │   │   ├── bun-spawn-runner.ts
│   │   │   ├── dialog-adapter.ts
│   │   │   ├── filesystem-adapter.ts
│   │   │   └── launcher-adapter.ts
│   │   └── electron/            # added only if fallback is triggered
│   └── ui/
│       ├── components/
│       ├── features/
│       ├── screens/
│       └── main.tsx
├── tests/
│   ├── fixtures/git/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── electrobun.config.ts
```

## 6. Agent skills to install or create

### Existing UI-focused skills

```sh
npx skills add vercel-labs/agent-skills \
  --skill react-best-practices \
  --skill web-design-guidelines \
  -a codex -y
```

Optional visual-design exploration:

```sh
npx skills add https://github.com/anthropics/skills/tree/main/skills/frontend-design \
  -a codex -y
```

### Required custom project skill

Create:

```text
.agents/skills/worktree-desk-domain/SKILL.md
```

Suggested content:

```md
---
name: worktree-desk-domain
description: Apply the Worktree Desk Git worktree, resource safety, diagnostics and portable desktop-shell architecture contract when implementing or reviewing this repository.
---

# Worktree Desk domain constraints

Read `docs/01-product-scope-sow.md`, `docs/02-technical-architecture.md`, and `docs/05-electrobun-validation-and-electron-fallback.md` before feature changes.

Platform decision:
- Start in Electrobun + React + TypeScript.
- Preserve Electron as an adapter-level fallback only.
- Keep product core and React features free from framework-specific imports.

Mandatory rules:
- Execute Git using argument arrays through `CommandRunner`; do not interpolate shell strings.
- Initial command runner is `Bun.spawn()` in the Electrobun Bun process.
- If Electron fallback is formally triggered, add an `execa` adapter implementing the same contract.
- Parse only documented Git machine output: porcelain/v2/NUL-delimited formats.
- Expose only typed, validated bridge operations to UI code.
- Block secret-resource links unless the target is Git-ignored.
- Never introduce direct shared writable node_modules as a standard feature.
- Preserve raw sanitized stderr/exit-code diagnostics for failed operations.
- Distinguish partial success: a created worktree remains visible even if setup fails.

Before completing a change:
- Add or update parser/classifier tests.
- Add or update Git/filesystem mutation integration coverage.
- State any modification to MVP scope or platform fallback criteria.
```

## 7. Implementation phases

### Phase 0 — Electrobun capability spike

Deliverables:

- Electrobun TypeScript application with React UI.
- Typed RPC boundary between React view and Bun privileged services.
- `BunSpawnCommandRunner` for `git --version`, worktree listing and status.
- Native directory picker and workspace-opening proof.
- `.env` ignored-target check and test symlink setup.
- Operation/error detail UI.
- Packaged macOS vertical slice.
- Written pass/fail result against the capability gate.

Exit criteria:

- Every blocking item in `05-electrobun-validation-and-electron-fallback.md` passes, or the Electron fallback is formally documented.

### Phase 1 — Project registry and read-only worktree inventory

Deliverables:

- Add/remove registered project.
- Resolve repository common directory.
- Prevent duplicate registration through linked worktrees.
- Typed parsers for `git worktree list --porcelain -z` and `git status --porcelain=v2 --branch -z`.
- Worktree board with clean/modified/locked/prunable states.

Exit criteria:

- Multiple repositories persist and reload.
- Parser fixture tests pass for edge-case paths/statuses.
- Worktree paths open through the selected desktop adapter.

### Phase 2 — Safe worktree mutations

Deliverables:

- Create existing/new branch worktrees.
- Branch listing and preflight.
- Lock/unlock, move, repair.
- Safe remove and prune preview/execute.
- Operation journal and failure panel.

Exit criteria:

- All mutations are serialized per repository.
- Dirty-removal safeguards pass integration tests.
- Every mutation produces inspectable success/failure records.

### Phase 3 — Shared resources and setup commands

Deliverables:

- Resource profile editor.
- Symlink/copy actions.
- Git-ignore validation for protected targets.
- Link health/repair.
- Setup profile commands and streamed logs.
- Partial-success UI for setup failure.

Exit criteria:

- Ignored `.env` linking works end to end.
- Non-ignored secret links are blocked.
- Failed setup never obscures successful worktree creation.
- No secret content is stored or logged.

### Phase 4 — Product refinement and release path

Deliverables:

- Completed wizard and operation center UX.
- Loading/empty/error states.
- Accessibility and keyboard review.
- Packaging/release checks for the selected shell.
- Daily-use validation with a real multi-worktree project.

Exit criteria:

- MVP acceptance criteria pass under Electrobun, or under Electron only after documented fallback.

## 8. Testing plan

### Shared unit tests

| Area | Focus |
|---|---|
| Worktree parser | Porcelain fields, NUL delimiters, locked/prunable states |
| Status parser | Clean/modified/untracked/conflicted and ahead/behind |
| Error interpreter | Known command/filesystem failure mapping |
| Schemas | Rejection of malformed bridge/config/resource payloads |
| Path validation | Prevent resource target traversal outside a worktree |

### Integration tests

Create temporary Git repositories and use real Git for:

- add/list/move/remove/lock/unlock/repair/prune behavior;
- duplicate registration through primary and linked-worktree paths;
- paths with spaces and Unicode;
- ignored `.env` validation and symlink setup;
- dirty worktree removal failure and explicit force removal;
- post-create setup partial failure.

### Platform tests

| Adapter | Test focus |
|---|---|
| Electrobun | Typed RPC boundary, `Bun.spawn()` output/error capture, dialogs/opening, packaged launch |
| Electron fallback, only when present | Preload/IPC parity, `execa` runner parity, packaged launch |

## 9. References

### Electrobun and Bun

- Electrobun documentation: https://docs.electrobunny.ai/electrobun/
- Electrobun quick start: https://docs.electrobunny.ai/electrobun/guides/quick-start/
- Electrobun architecture: https://docs.electrobunny.ai/electrobun/guides/architecture/overview/
- Electrobun BrowserView / typed RPC: https://docs.electrobunny.ai/electrobun/apis/browser-view/
- Electrobun utilities: https://docs.electrobunny.ai/electrobun/apis/utils/
- Electrobun releases: https://github.com/blackboardsh/electrobun/releases
- Bun child processes: https://bun.com/docs/runtime/child-process

### Git and fallback tooling

- Git worktree documentation: https://git-scm.com/docs/git-worktree
- Git status porcelain formats: https://git-scm.com/docs/git-status
- Git reference formatting: https://git-scm.com/docs/git-for-each-ref
- Git ignore checking: https://git-scm.com/docs/git-check-ignore
- execa, Electron fallback only: https://github.com/sindresorhus/execa
- Electron documentation: https://www.electronjs.org/docs/latest/
- Electron security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron IPC: https://www.electronjs.org/docs/latest/tutorial/ipc

### UI and skills

- shadcn/ui: https://ui.shadcn.com/docs
- Radix Primitives: https://www.radix-ui.com/primitives
- Zod: https://zod.dev/
- OpenAI Codex skills: https://developers.openai.com/codex/skills/
- Vercel agent skills: https://github.com/vercel-labs/agent-skills

---

# 05 — Electrobun Validation and Electron Fallback Contract

## 1. Purpose

Worktree Desk starts in Electrobun, but it must not become trapped by framework-specific choices. This document defines the initial Electrobun capability spike and the precise conditions under which Electron becomes the practical fallback.

## 2. What must be proved before building full MVP features

Build a thin vertical slice before implementing the full dashboard.

### Spike deliverable

A single packaged macOS development application containing:

1. A React screen listing one selected repository.
2. A typed UI-to-Bun request that asks the backend to run Git.
3. Git execution through `Bun.spawn()` using argument arrays.
4. Parsed results for:
   - `git worktree list --porcelain -z`
   - `git status --porcelain=v2 --branch -z`
5. A directory selection action through Electrobun utilities.
6. One safe resource action:
   - validate an ignored `.env` target with Git;
   - create a symlink from a canonical local source into a test worktree;
   - display broken-link/repair state.
7. An operation detail view showing command, cwd, exit code, stdout/stderr and interpreted failure.
8. Opening a selected worktree directory externally or launching the configured editor through the privileged process.
9. A built app that launches normally on the developer's macOS machine.

## 3. Capability gate

| Capability | Pass condition | Blocking if failed? |
|---|---|---:|
| React UI | Dashboard components render and interact correctly in chosen WebView configuration | Yes |
| Typed boundary | UI can call privileged handlers without exposing unrestricted process/fs access | Yes |
| Git execution | Git commands run through safe argument arrays and output/exit codes are captured | Yes |
| Output streaming | Setup-command progress can reach UI without losing useful stderr/stdout | Required before setup-command phase |
| Git parser | Porcelain/NUL parser tests pass with real Git fixture repos | Yes |
| Filesystem resources | Symlink/copy/check/repair workflows function safely | Yes |
| Native dialogs | User can choose repository and shared-file paths | Yes |
| External launching | Worktree can be opened in Finder/editor/terminal workflow | Yes |
| Persistent config | Project/resource rules persist outside repository without secrets content | Yes |
| Packaging | A macOS app can be built and used for the vertical slice | Yes |
| Renderer consistency | Native WebView is sufficient, or optional CEF resolves necessary compatibility issues | Yes |

## 4. Continue with Electrobun when

Continue the Electrobun implementation when:

- all blocking capability gates pass;
- remaining limitations are UI polish, API learning or implementation-level issues;
- required functionality can be isolated behind existing adapter interfaces;
- React features do not need framework-specific rewrites.

A minor undocumented edge case or extra adapter work is not by itself a reason to migrate.

## 5. Move to Electron when

Use the Electron fallback only when one or more of these is demonstrated and documented:

- a required privileged operation cannot be implemented reliably in Electrobun;
- application UI behavior required for MVP remains incorrect after evaluating acceptable WebView/CEF configuration;
- packaging, signing, or daily launch behavior blocks a usable macOS application;
- a critical API is unstable in a way that materially prevents the MVP workflow;
- integration testing of Git/resource mutations cannot be made reliable without unacceptable workarounds;
- maintaining Electrobun-specific code starts leaking into product core or UI feature logic.

Before migration, record:

1. capability tested;
2. minimal reproduction;
3. expected behavior;
4. actual failure;
5. workaround attempted;
6. why the workaround is unsuitable;
7. Electron adapter implementation impact.

## 6. Portability contract

These modules must remain independent of the selected desktop shell:

```text
src/core/domain/
src/core/git/parsers/
src/core/services/
src/core/errors/
src/core/schemas/
src/ui/features/
src/ui/components/
```

Only these modules may know which shell is active:

```text
src/platform/electrobun/
src/platform/electron/       # added only if fallback becomes necessary
src/platform/contracts/
```

### Mandatory interfaces

```ts
export interface CommandRunner {
  run(command: string, args: string[], options: { cwd: string }): Promise<CommandResult>;
  stream(
    command: string,
    args: string[],
    options: { cwd: string; onOutput: (entry: CommandOutput) => void }
  ): Promise<CommandResult>;
}

export interface DesktopBridge {
  chooseDirectory(request: ChooseDirectoryRequest): Promise<string | null>;
  revealPath(path: string): Promise<void>;
  openConfiguredApp(request: OpenWorktreeRequest): Promise<void>;
  getProjects(): Promise<Project[]>;
  runOperation(request: OperationRequest): Promise<OperationRecord>;
}
```

## 7. Initial platform implementation mapping

| Product need | Electrobun-first implementation | Electron fallback implementation |
|---|---|---|
| Run Git/setup process | `Bun.spawn()` | `execa` in Node main process |
| UI privileged calls | Typed RPC | Preload/IPC |
| Choose folder | Electrobun `Utils.openFileDialog()` | Electron dialog API |
| Show destructive confirmation | Electrobun `Utils.showMessageBox()` or controlled UI confirmation | Electron dialog/UI confirmation |
| Reveal/open folder | Electrobun `Utils` open/reveal methods | Electron shell API |
| Filesystem links | Bun-compatible TypeScript filesystem adapter | Node filesystem adapter |
| Packaging | Electrobun tooling | Electron Forge |
| UI | Shared React/TypeScript code | Shared React/TypeScript code |

## 8. Spike execution order

1. Scaffold Electrobun application and add React UI view.
2. Establish typed RPC with a narrow `DesktopBridge`.
3. Implement `BunSpawnCommandRunner`.
4. Add real Git porcelain parser fixtures and repository integration test setup.
5. Add project selection and worktree board vertical slice.
6. Add one `.env` ignored-symlink validation flow.
7. Add operation/error panel.
8. Build and run packaged macOS app.
9. Complete the gate table with pass/fail evidence.
10. Continue Electrobun or initiate documented Electron fallback.

## 9. References

- https://docs.electrobunny.ai/electrobun/
- https://docs.electrobunny.ai/electrobun/guides/quick-start/
- https://docs.electrobunny.ai/electrobun/guides/architecture/overview/
- https://docs.electrobunny.ai/electrobun/apis/browser-view/
- https://docs.electrobunny.ai/electrobun/apis/utils/
- https://github.com/blackboardsh/electrobun/releases
- https://bun.com/docs/runtime/child-process
- https://www.electronjs.org/docs/latest/tutorial/ipc
- https://www.electronjs.org/docs/latest/tutorial/security
