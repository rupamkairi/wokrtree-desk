# 02 — Technical Architecture

## 1. Architecture overview

Worktree Desk is a privileged local desktop application. The architecture separates UI from operating-system access.

```text
┌─────────────────────────────────────────────────────┐
│ Renderer: React UI                                   │
│ Components, view models, local display state        │
│ No direct Git, filesystem or arbitrary process API  │
└──────────────────────────┬──────────────────────────┘
                           │ narrow typed IPC
┌──────────────────────────▼──────────────────────────┐
│ Preload bridge                                       │
│ Exposes approved operations only                    │
└──────────────────────────┬──────────────────────────┘
                           │ validated requests
┌──────────────────────────▼──────────────────────────┐
│ Electron Main Process / Application Services        │
│ ProjectRegistry, GitAdapter, ResourceService,       │
│ OperationService, LauncherService, ConfigStore      │
└──────────────────────────┬──────────────────────────┘
                           │ execa, Node fs APIs
┌──────────────────────────▼──────────────────────────┐
│ Local OS / Installed Git / Editor / Filesystem      │
└─────────────────────────────────────────────────────┘
```

## 2. Key rules

1. The renderer cannot run Git or access the filesystem directly.
2. Every IPC payload and stored configuration object is schema-validated.
3. Every Git action uses argument arrays rather than a concatenated shell command.
4. Every parser consumes documented machine output, not human display output.
5. Mutating commands are queued per repository to avoid overlapping conflicting actions.
6. Operations persist sanitized logs; no secret file contents are loaded into logs.

## 3. Core modules

| Module | Responsibility |
|---|---|
| `ProjectRegistryService` | Register projects, deduplicate by Git common directory, persist preferences |
| `GitCommandRunner` | Execute installed Git with `execa`, stream output, provide structured raw result |
| `GitRepositoryAdapter` | Discover/verify repository and common directory |
| `GitWorktreeAdapter` | List/create/move/remove/lock/unlock/prune/repair worktrees |
| `GitStatusAdapter` | Read clean/dirty/untracked and branch ahead/behind state |
| `GitRefAdapter` | List branches/base refs for creation wizard |
| `SharedResourceService` | Validate rules, create/copy/repair links, report health |
| `IgnoreValidationService` | Use Git ignore checks for protected targets |
| `SetupCommandService` | Run opt-in post-create actions and capture logs |
| `OperationJournalService` | Record operations, steps, errors and retry metadata |
| `ErrorInterpreter` | Map known Git/filesystem failures to safe UI remedies |
| `LauncherService` | Open editor/terminal/Finder from configured worktree |
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

```ts
import { execa } from "execa";

export type RawCommandResult = {
  executable: string;
  args: string[];
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

export async function runGit(
  cwd: string,
  args: string[]
): Promise<RawCommandResult> {
  const result = await execa("git", args, {
    cwd,
    reject: false,
    encoding: "utf8"
  });

  return {
    executable: "git",
    args,
    cwd,
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}
```

Rules:

- Never execute `git ${userInput}` through a shell string.
- Validate paths, refs and operation inputs before invocation.
- Keep raw stdout/stderr available for diagnostics.
- Redact configured secret path values when exporting diagnostic reports if filenames themselves are sensitive.

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

## 12. Electron security architecture

Required configuration:

- `contextIsolation: true`;
- renderer sandbox enabled;
- no Node integration in the renderer;
- preload exposes individual approved methods, not raw IPC or shell execution;
- IPC handlers validate input with schemas;
- application loads only local packaged renderer content for MVP;
- no remote arbitrary content in privileged window.

Example exposed API shape:

```ts
type DesktopApi = {
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
- https://github.com/sindresorhus/execa
- https://github.com/desktop/dugite
- https://www.electronjs.org/docs/latest/tutorial/security
- https://www.electronjs.org/docs/latest/tutorial/context-isolation
- https://www.electronjs.org/docs/latest/tutorial/ipc
- https://pnpm.io/motivation
- https://pnpm.io/settings
