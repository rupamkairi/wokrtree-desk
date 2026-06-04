# 03 — UI and UX Specification

## 1. UI goal

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
