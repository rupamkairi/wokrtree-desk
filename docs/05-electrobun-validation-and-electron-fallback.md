# 05 — Electrobun Validation and Electron Fallback Contract

## 1. Purpose

Worktree Desk starts in Electrobun, but it must not become trapped by framework-specific choices. This document defines the initial Electrobun capability spike and the precise conditions under which Electron becomes the practical fallback.

## 2. What must be proved before building full MVP features

Build a thin vertical slice before implementing the full dashboard.

### Spike deliverable

A single packaged macOS development application containing:

1. A React screen listing one selected repository.
2. A typed UI-to-Bun request that asks the backend to run Git.
3. Git execution through `Bun.spawn()` using argument arrays.
4. Parsed results for:
   - `git worktree list --porcelain -z`
   - `git status --porcelain=v2 --branch -z`
5. A directory selection action through Electrobun utilities.
6. One safe resource action:
   - validate an ignored `.env` target with Git;
   - create a symlink from a canonical local source into a test worktree;
   - display broken-link/repair state.
7. An operation detail view showing command, cwd, exit code, stdout/stderr and interpreted failure.
8. Opening a selected worktree directory externally or launching the configured editor through the privileged process.
9. A built app that launches normally on the developer's macOS machine.

## 3. Capability gate

| Capability | Pass condition | Blocking if failed? |
|---|---|---:|
| React UI | Dashboard components render and interact correctly in chosen WebView configuration | Yes |
| Typed boundary | UI can call privileged handlers without exposing unrestricted process/fs access | Yes |
| Git execution | Git commands run through safe argument arrays and output/exit codes are captured | Yes |
| Output streaming | Setup-command progress can reach UI without losing useful stderr/stdout | Required before setup-command phase |
| Git parser | Porcelain/NUL parser tests pass with real Git fixture repos | Yes |
| Filesystem resources | Symlink/copy/check/repair workflows function safely | Yes |
| Native dialogs | User can choose repository and shared-file paths | Yes |
| External launching | Worktree can be opened in Finder/editor/terminal workflow | Yes |
| Persistent config | Project/resource rules persist outside repository without secrets content | Yes |
| Packaging | A macOS app can be built and used for the vertical slice | Yes |
| Renderer consistency | Native WebView is sufficient, or optional CEF resolves necessary compatibility issues | Yes |

## 4. Continue with Electrobun when

Continue the Electrobun implementation when:

- all blocking capability gates pass;
- remaining limitations are UI polish, API learning or implementation-level issues;
- required functionality can be isolated behind existing adapter interfaces;
- React features do not need framework-specific rewrites.

A minor undocumented edge case or extra adapter work is not by itself a reason to migrate.

## 5. Move to Electron when

Use the Electron fallback only when one or more of these is demonstrated and documented:

- a required privileged operation cannot be implemented reliably in Electrobun;
- application UI behavior required for MVP remains incorrect after evaluating acceptable WebView/CEF configuration;
- packaging, signing, or daily launch behavior blocks a usable macOS application;
- a critical API is unstable in a way that materially prevents the MVP workflow;
- integration testing of Git/resource mutations cannot be made reliable without unacceptable workarounds;
- maintaining Electrobun-specific code starts leaking into product core or UI feature logic.

Before migration, record:

1. capability tested;
2. minimal reproduction;
3. expected behavior;
4. actual failure;
5. workaround attempted;
6. why the workaround is unsuitable;
7. Electron adapter implementation impact.

## 6. Portability contract

These modules must remain independent of the selected desktop shell:

```text
src/core/domain/
src/core/git/parsers/
src/core/services/
src/core/errors/
src/core/schemas/
src/ui/features/
src/ui/components/
```

Only these modules may know which shell is active:

```text
src/platform/electrobun/
src/platform/electron/       # added only if fallback becomes necessary
src/platform/contracts/
```

### Mandatory interfaces

```ts
export interface CommandRunner {
  run(command: string, args: string[], options: { cwd: string }): Promise<CommandResult>;
  stream(
    command: string,
    args: string[],
    options: { cwd: string; onOutput: (entry: CommandOutput) => void }
  ): Promise<CommandResult>;
}

export interface DesktopBridge {
  chooseDirectory(request: ChooseDirectoryRequest): Promise<string | null>;
  revealPath(path: string): Promise<void>;
  openConfiguredApp(request: OpenWorktreeRequest): Promise<void>;
  getProjects(): Promise<Project[]>;
  runOperation(request: OperationRequest): Promise<OperationRecord>;
}
```

## 7. Initial platform implementation mapping

| Product need | Electrobun-first implementation | Electron fallback implementation |
|---|---|---|
| Run Git/setup process | `Bun.spawn()` | `execa` in Node main process |
| UI privileged calls | Typed RPC | Preload/IPC |
| Choose folder | Electrobun `Utils.openFileDialog()` | Electron dialog API |
| Show destructive confirmation | Electrobun `Utils.showMessageBox()` or controlled UI confirmation | Electron dialog/UI confirmation |
| Reveal/open folder | Electrobun `Utils` open/reveal methods | Electron shell API |
| Filesystem links | Bun-compatible TypeScript filesystem adapter | Node filesystem adapter |
| Packaging | Electrobun tooling | Electron Forge |
| UI | Shared React/TypeScript code | Shared React/TypeScript code |

## 8. Spike execution order

1. Scaffold Electrobun application and add React UI view.
2. Establish typed RPC with a narrow `DesktopBridge`.
3. Implement `BunSpawnCommandRunner`.
4. Add real Git porcelain parser fixtures and repository integration test setup.
5. Add project selection and worktree board vertical slice.
6. Add one `.env` ignored-symlink validation flow.
7. Add operation/error panel.
8. Build and run packaged macOS app.
9. Complete the gate table with pass/fail evidence.
10. Continue Electrobun or initiate documented Electron fallback.

## 9. References

- https://docs.electrobunny.ai/electrobun/
- https://docs.electrobunny.ai/electrobun/guides/quick-start/
- https://docs.electrobunny.ai/electrobun/guides/architecture/overview/
- https://docs.electrobunny.ai/electrobun/apis/browser-view/
- https://docs.electrobunny.ai/electrobun/apis/utils/
- https://github.com/blackboardsh/electrobun/releases
- https://bun.com/docs/runtime/child-process
- https://www.electronjs.org/docs/latest/tutorial/ipc
- https://www.electronjs.org/docs/latest/tutorial/security
