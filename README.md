# Worktree Desk

**Git worktree manager for developers who work on many things at once.**

![Worktree Desk](https://cdn.rupamkairi.dev/worktree-desktop/SCR-20260608-jzjz.png)

---

Git worktrees let you check out multiple branches in parallel without cloning again. Worktree Desk gives you a single desktop interface to register repos, inspect worktree status, launch editors, and navigate between contexts — without touching the terminal.

## Screenshots

![Dashboard](https://cdn.rupamkairi.dev/worktree-desktop/SCR-20260608-jzyu.png)

![Worktree Detail](https://cdn.rupamkairi.dev/worktree-desktop/SCR-20260608-kagq.png)

## Features (v0.1.0)

- Register local repos — detects worktrees, deduplicates by common Git dir
- Multi-project dashboard — name, path, worktree count, clean/modified summary
- Worktree board — branch, path, HEAD commit, status (clean/modified/untracked), locked/prunable state
- Open worktree path in Finder
- Branch list and commit history per repo
- Inline error reporting with raw Git diagnostics

> **Note:** Create-worktree wizard, shared resource profiles, editor/terminal launch, and preferences are work-in-progress. See the [roadmap](#roadmap).

## Download

Grab the latest `.app` from [Releases](https://github.com/rupamkairi/wokrtree-desk/releases).

macOS arm64 only for v0.1.0. Right-click > Open on first launch (unsigned build).

## Build from Source

Requires [Bun](https://bun.sh) and [Electrobun](https://electrobun.dev).

```sh
git clone https://github.com/rupamkairi/wokrtree-desk.git
cd wokrtree-desk
bun install

# dev (HMR)
bun run dev:hmr

# stable build
bun run build:stable
```

Output lands in `build/stable-macos-arm64/`.

## Stack

| Layer | Tool |
|---|---|
| Desktop runtime | [Electrobun](https://electrobun.dev) 1.18.1 |
| UI | React 18 + TypeScript |
| Build | Vite 6 + Bun |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |

## Roadmap

**v0.2** — Setup profiles, post-create commands, streaming output panel  
**v1.0** — Signed release, Windows + Linux, command palette, keyboard-first UX

## License

[MIT](./LICENSE) — Rupam Kairi
