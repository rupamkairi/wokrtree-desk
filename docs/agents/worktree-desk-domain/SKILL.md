---
name: worktree-desk-domain
description: Apply the Worktree Desk Electrobun-first architecture, source-doc, and safety rules when changing this repository.
---

# Worktree Desk domain constraints

Read `docs/INDEX.md` and the planning docs before changing product code.

## Platform decision

- Start with Electrobun + React + TypeScript.
- Preserve Electron as an adapter-level fallback only.
- Keep the product core and React features free of framework-specific imports.

## Mandatory rules

- Execute Git through typed command runners and argument arrays.
- Initial command execution should use `Bun.spawn()` in the Electrobun Bun process.
- If Electron fallback is ever triggered, add an `execa` adapter implementing the same contract.
- Parse only documented Git machine output formats.
- Expose only typed, validated bridge operations to UI code.
- Preserve raw sanitized stderr and exit-code diagnostics for failed operations.
- Never introduce a direct shared writable `node_modules` symlink as standard behavior.
- Distinguish partial success: created worktrees should remain visible even if setup fails.

## Before finishing a change

- Add or update parser and classifier tests when behavior changes.
- Add or update integration coverage for filesystem and Git mutations when available.
- Call out any change to MVP scope or fallback criteria explicitly.
