# Agent Guidance

This repository uses the Electrobun-first Worktree Desk plan.

Read `docs/INDEX.md` before changing app code.

Primary rules:

- Keep the product core shell-agnostic.
- Start with Electrobun + React + TypeScript.
- Preserve Electron only as a fallback adapter.
- Use machine-readable Git output and typed bridge contracts.
- Preserve raw sanitized failure details.
- Avoid shared writable `node_modules` as a default behavior.

Repository-local skill reference:

- `docs/agents/worktree-desk-domain/SKILL.md`
