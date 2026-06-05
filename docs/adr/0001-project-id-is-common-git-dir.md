# 1. Project identity is the common Git directory path

Date: 2026-06-05

## Status

Accepted

## Context

Worktree Desk registers a Project from any checkout or linked worktree of a
repository, and must resolve a single identity per repository (see
`docs/01-product-scope-sow.md` §4.1: "resolve the primary repository identity
using the common Git directory" and "prevent duplicate project registration").

The registry (`JsonProjectRegistry`) needs a stable key to store, look up, and
deduplicate Projects. React lists and the store selection also key on it.

`git rev-parse --git-common-dir` yields the same directory for the main
checkout and all linked worktrees of one repository, so it naturally collapses
linked worktrees to one identity.

## Decision

Project `id` is the **absolute path of the common Git directory**
(`toProjectId(commonGitDir)`), resolved to absolute in `gitRepositoryService`.

## Consequences

Positive:
- Linked worktrees of the same repository resolve to one Project (dedup works
  for the common "open a worktree directory" case).
- No extra Git call beyond the `rev-parse` already run during discovery.
- Trivially stable while the repository stays in place.

Negative / known limitation:
- Identity is **path-sensitive**. Moving or renaming the repository on disk
  changes `commonGitDir`, so the same repository re-registers as a new Project
  and the old entry dangles.

## Alternatives considered

- **First-commit SHA** as id — survives moves, but breaks on shallow clones and
  empty repositories, and needs an extra `git rev-list --max-parents=0`.
- **Normalized realpath** — reduces symlink-driven duplicates but still breaks
  on a real move.

## Deferral

Repository moves are rare for a local dev tool, so path-based identity is
accepted for now. If repo-move becomes a real workflow, migrate to a
move-stable id; that migration must rewrite existing registry keys.
