# Documentation Index

This file organizes the source documents for Worktree Desk without rewriting their contents.

## Source Docs

| File | Purpose |
|---|---|
| [00-decision-and-project-plans.md](../00-decision-and-project-plans.md) | Electrobun-first decision baseline and fallback rules. |
| [01-product-scope-sow.md](../01-product-scope-sow.md) | Product scope, release boundaries, and acceptance criteria. |
| [02-technical-architecture.md](../02-technical-architecture.md) | Architecture, services, parsers, and platform boundaries. |
| [03-ui-ux-specification.md](../03-ui-ux-specification.md) | UI flows, screens, and shell-independent behavior. |
| [04-implementation-roadmap-tools-and-skills.md](../04-implementation-roadmap-tools-and-skills.md) | Bootstrap path, dependency stack, and repo-local skill plan. |
| [05-electrobun-validation-and-electron-fallback.md](../05-electrobun-validation-and-electron-fallback.md) | Electrobun capability gate and migration contract. |
| [Worktree-Desk-Complete-Scope.md](../Worktree-Desk-Complete-Scope.md) | Alternate complete-scope copy provided in the workspace. |
| [worktree-desk-planning-bundle-v2-electrobun-first.zip](../worktree-desk-planning-bundle-v2-electrobun-first.zip) | Archived source bundle that contains the revised planning set. |

## Conversation Sources

| Source | Notes |
|---|---|
| [ChatGPT shared thread](https://chatgpt.com/share/6a216f6b-57a0-83a7-9951-2b28814a013f) | Source context for the Electrobun-first direction and scope clarification. |

## Project Setup

- Desktop scaffold: Electrobun + React + TypeScript.
- App entry: `src/bun/index.ts`.
- UI entry: `src/mainview/main.tsx`.
- Build commands: `bun run dev`, `bun run build:canary`, or `bun run build:stable`.
