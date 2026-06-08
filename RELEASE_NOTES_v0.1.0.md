# v0.1.0 — Initial Public Release

**Worktree Desk** is a desktop app for managing Git worktrees across multiple repos. Stop losing track of which branch is checked out where.

![Worktree Desk](https://cdn.rupamkairi.dev/worktree-desktop/SCR-20260608-jzjz.png)

## What's in this release

**Project registry**
- Register any local repo by selecting its primary checkout or any linked worktree
- Deduplicates automatically — same common Git directory = one project
- Dashboard shows name, path, worktree count, and clean/modified summary

**Worktree board**
- Branch name or detached state
- Folder path, abbreviated HEAD commit
- Clean / modified / untracked status
- Locked and prunable indicators
- Open path in Finder

**Repo browser**
- Branch list per project
- Paged commit history per branch

**Error reporting**
- Every Git operation records command, args, working directory, exit code, stdout/stderr
- Inline error banner with full raw diagnostics

---

![Dashboard](https://cdn.rupamkairi.dev/worktree-desktop/SCR-20260608-jzyu.png)

![Worktree Detail](https://cdn.rupamkairi.dev/worktree-desktop/SCR-20260608-kagq.png)

---

## Not yet in v0.1.0

- Create-worktree wizard (backend ready, UI wiring in progress)
- Editor and terminal launch from worktree
- Shared resource / `.env` profiles
- Preferences panel
- Windows and Linux builds

## Install

Download `Worktree Desk.app` below. macOS arm64 only.

Right-click > Open on first launch — this build is unsigned.

## Build from source

```sh
git clone https://github.com/rupamkairi/wokrtree-desk.git
cd wokrtree-desk
bun install
bun run build:stable
```

---

Built with [Electrobun](https://electrobun.dev), React 18, TypeScript, Vite, Tailwind CSS, and shadcn/ui.
