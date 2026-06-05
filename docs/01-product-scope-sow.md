# 01 — Product Scope and Scope of Work

## 1. Product identity

**Working title:** Worktree Desk  
**Application type:** Local desktop developer utility  
**Primary user:** A developer working on multiple features/projects locally through Git worktrees  
**Initial platform:** macOS, with cross-platform-safe architectural decisions  
**MVP shell:** Electron

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

## 4. MVP functional scope: v0.1

> **Build status legend** (as of `v0.1.0`): ✅ Built · 🟡 Partial · 🚧 WIP (not yet
> functional). This SOW remains the MVP target; markers below record what the
> current build actually does.

### 4.1 Project registry — 🟡 Partial

> ✅ Locate + register a local repository, identity via common Git directory,
> duplicate collapse across linked worktrees. 🚧 Remove-from-app, and the
> Clone/Create entry points (marked 🚧 in the UI). Editor/resource rule storage
> uses defaults only.

The user can register a repository by selecting either its primary checkout or any linked worktree directory.

The application must:

- verify that selected directory belongs to a Git worktree;
- resolve the primary repository identity using the common Git directory;
- prevent duplicate project registration when another linked worktree of the same repository is selected;
- store display name, resolved primary/worktree information, preferred worktree root, editor and resource rules;
- remove a project from the application without deleting repository files.

### 4.2 Multi-project dashboard — ✅ Built

> Recent Projects list with name, path, worktree count and clean/modified
> summary; project filter. Branch and worktree-path search is 🚧.

The application must show all registered projects.

Each project summary must display:

- project name;
- primary path;
- number of linked worktrees;
- count of clean/modified/attention-required worktrees;
- last operation failure indicator, when applicable;
- action to open project detail.

Search must match project name, branch name and worktree path.

### 4.3 Worktree inventory and status — 🟡 Partial

> ✅ Read-only worktree board (branch, path, clean/modified/untracked status,
> locked/prunable). ✅ Open path. 🚧 All other operations — editor/terminal
> launch, reveal, copy path, lock/unlock, move, remove, repair, prune. Branch
> list + paged commit history (per branch) is ✅ built in the Repositories view.

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

### 4.4 Create-worktree workflow — 🚧 WIP

> Backend exists and is tested (preview + create services, RPC handlers), but
> no UI surface is wired yet; the entry points are marked 🚧.

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

### 4.5 Shared resource profiles — 🚧 WIP

> Not implemented. No profile storage, linking, or ignore validation yet.

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

### 4.6 Dependencies and setup actions — 🚧 WIP

> Not implemented. No post-create command execution yet.

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

### 4.7 Error reporting and diagnostics — 🟡 Partial

> ✅ Operation records captured for git commands; ✅ inline error banner with
> message + dismiss. 🚧 Structured error interface (titled, safe next action,
> expandable technical details) and the operation-center panel.

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

### 4.8 Preferences — 🚧 WIP

> Not implemented. Settings is a 🚧 nav item; defaults are hardcoded
> (editor `cursor`, terminal `terminal`, worktree root `<repo>-worktrees`).

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

### Desktop security

- Renderer process has no general Node.js or filesystem access.
- All privileged operations are exposed as a narrow validated API through preload/IPC.
- Input paths and operation payloads are validated before use.
- The app invokes Git without shell command-string interpolation.

## 8. Definition of done

MVP is complete when the acceptance criteria pass on macOS against temporary integration repositories and at least one real multi-worktree JavaScript project, and the application can be packaged and used daily without relying on manual terminal steps for the scoped worktree/resource flows.
