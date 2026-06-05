# Worktree Desk — Context Glossary

Canonical language for the Worktree Desk domain. Glossary only — no implementation detail.

## Terms

### Project
A registered Git repository. Identified by its common Git directory. Registered by locating either its primary checkout or any linked worktree directory. One Project maps to one repository regardless of how many worktrees it has.

### Primary Path / Default Worktree
The repository directory selected when the Project was registered. Treated as the Project's main working directory. The branch checked out here is the **Active Branch**.

### Worktree
A Git linked working tree — a checkout of one branch in its own directory, created via `git worktree`. A Project has one default worktree plus zero or more linked worktrees. Each Worktree has at most one branch checked out.

### Active Branch
The branch checked out in the Project's Default Worktree. Marked with primary-blue accent in the branch list.

### Worktree Branch
A branch checked out in a linked Worktree (not the default). Marked with secondary-green accent. A branch with no worktree gets no accent (plain).

### Branch
A Git ref under `refs/heads`. Listed grouped as Default / Recent / Other. Each branch row may carry a Worktree badge (the worktree's directory leaf name; full path on tooltip).

### History
The commit log of a selected branch. Loaded via `git log`, 20 commits initially, paginated. Each commit shows message, author name, relative time. (Avatar excluded.)

### Changes
The uncommitted working-tree changes of the current branch. Placeholder only (WIP) in current scope.

### Diff
Per-commit or per-file line changes. Placeholder only (WIP) in current scope.

## Status vocabulary (Worktree)

| Term | Meaning |
|---|---|
| Clean | No changed / untracked / conflict files |
| Modified | Tracked changes exist |
| Untracked | Untracked files exist |
| Conflict | Unmerged files exist (highest visual priority) |
| Locked | Worktree protected from pruning |
| Prunable | Metadata marks it removable/stale |

## Convention

🚧 (WIP — Work In Progress) marks any under-development feature surfaced in the UI but not yet functional.
