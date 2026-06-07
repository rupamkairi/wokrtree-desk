import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FilePlus2,
  FolderPlus,
  Loader2,
  Network,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  CopyFolderSpec,
  CreateWorktreePreview,
} from "../../../core/domain/types";
import { useRepositoryStore } from "../../store/useRepositoryStore";

const FIELD_CLASS =
  "h-9 w-full rounded-sm border border-input bg-background px-3 text-ui-reg text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring";

function slugify(branchName: string): string {
  return (
    branchName
      .trim()
      .replace(/[^\w./-]+/gu, "-")
      .replace(/[/.]+/gu, "-")
      .replace(/-+/gu, "-")
      .replace(/^-|-$/gu, "") || "new-worktree"
  );
}

function leaf(path: string): string {
  return path.replace(/\/+$/u, "").split("/").pop() ?? path;
}

export function AddWorktreeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const project = useRepositoryStore((state) => state.selectedProject);
  const branches = useRepositoryStore((state) => state.branches);
  const selectedBranch = useRepositoryStore((state) => state.selectedBranch);
  const previewCreateWorktree = useRepositoryStore((state) => state.previewCreateWorktree);
  const createWorktree = useRepositoryStore((state) => state.createWorktree);
  const chooseFiles = useRepositoryStore((state) => state.chooseFiles);
  const chooseFolders = useRepositoryStore((state) => state.chooseFolders);

  const defaultBase = useMemo(
    () =>
      (selectedBranch && branches.some((b) => b.name === selectedBranch)
        ? selectedBranch
        : branches.find((b) => b.isDefault)?.name) ?? branches[0]?.name ?? "",
    [branches, selectedBranch],
  );

  const [branchMode, setBranchMode] = useState<"existing" | "new">("new");
  const [existingBranch, setExistingBranch] = useState(defaultBase);
  const [newBranchName, setNewBranchName] = useState("");
  const [baseRef, setBaseRef] = useState(defaultBase);
  const [targetPath, setTargetPath] = useState("");
  const [pathEdited, setPathEdited] = useState(false);
  const [copyFiles, setCopyFiles] = useState<string[]>([]);
  const [copyFolders, setCopyFolders] = useState<CopyFolderSpec[]>([]);
  const [preview, setPreview] = useState<CreateWorktreePreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copyWarnings, setCopyWarnings] = useState<string[]>([]);

  const branchName = branchMode === "existing" ? existingBranch : newBranchName.trim();

  useEffect(() => {
    if (open) {
      setBranchMode("new");
      setExistingBranch(defaultBase);
      setNewBranchName("");
      setBaseRef(defaultBase);
      setTargetPath("");
      setPathEdited(false);
      setCopyFiles([]);
      setCopyFolders([]);
      setPreview(null);
      setSubmitting(false);
      setCopyWarnings([]);
    }
  }, [open, defaultBase]);

  // Suggest a target path from the worktree root + branch slug until the user edits it.
  useEffect(() => {
    if (!open || pathEdited || !project) {
      return;
    }
    if (!branchName) {
      setTargetPath("");
      return;
    }
    setTargetPath(`${project.defaults.worktreeRoot}/${slugify(branchName)}`);
  }, [open, pathEdited, project, branchName]);

  // Live preview (warnings + canCreate) whenever the request shape changes.
  useEffect(() => {
    if (!open || !branchName || !targetPath) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await previewCreateWorktree({
        projectId: project?.id ?? "",
        branchMode,
        branchName,
        targetPath,
        baseRef: branchMode === "new" ? baseRef : undefined,
      });
      if (!cancelled) {
        setPreview(result);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, branchMode, branchName, targetPath, baseRef, project?.id, previewCreateWorktree]);

  const addFiles = useCallback(async () => {
    const picked = await chooseFiles();
    setCopyFiles((prev) => Array.from(new Set([...prev, ...picked])));
  }, [chooseFiles]);

  const addFolders = useCallback(async () => {
    const picked = await chooseFolders();
    setCopyFolders((prev) => {
      const seen = new Set(prev.map((f) => f.path));
      const next = [...prev];
      for (const path of picked) {
        if (!seen.has(path)) {
          next.push({ path, mode: "copy" });
        }
      }
      return next;
    });
  }, [chooseFolders]);

  const canSubmit = Boolean(branchName) && Boolean(targetPath) && !submitting && preview?.canCreate;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setCopyWarnings([]);
    const result = await createWorktree({
      projectId: project?.id ?? "",
      branchMode,
      branchName,
      targetPath,
      baseRef: branchMode === "new" ? baseRef : undefined,
      copyFiles,
      copyFolders,
    });
    setSubmitting(false);
    if (result) {
      if (result.copyWarnings.length > 0) {
        // Worktree created, but some copies failed — keep the dialog open to show why.
        setCopyWarnings(result.copyWarnings);
      } else {
        onOpenChange(false);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Add Worktree
          </DialogTitle>
          <DialogDescription>
            Check out a branch into a separate directory. Optionally copy files
            (like <span className="font-mono">.env</span>) or symlink folders into it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            {(["new", "existing"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBranchMode(mode)}
                className={cn(
                  "flex-1 rounded-sm border px-3 py-2 text-ui-reg font-medium transition-colors",
                  branchMode === mode
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {mode === "new" ? "New branch" : "Existing branch"}
              </button>
            ))}
          </div>

          {branchMode === "new" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-ui-sm font-medium text-foreground">New branch name</label>
                <input
                  autoFocus
                  value={newBranchName}
                  onChange={(event) => setNewBranchName(event.target.value)}
                  placeholder="feature/my-change"
                  className={`${FIELD_CLASS} font-mono`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-ui-sm font-medium text-foreground">Base branch</label>
                <select
                  value={baseRef}
                  onChange={(event) => setBaseRef(event.target.value)}
                  className={FIELD_CLASS}
                >
                  {branches.map((branch) => (
                    <option key={branch.fullRef} value={branch.name}>
                      {branch.name}
                      {branch.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-ui-sm font-medium text-foreground">Branch</label>
              <select
                value={existingBranch}
                onChange={(event) => setExistingBranch(event.target.value)}
                className={FIELD_CLASS}
              >
                {branches.map((branch) => (
                  <option key={branch.fullRef} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-ui-sm font-medium text-foreground">Directory</label>
            <input
              value={targetPath}
              onChange={(event) => {
                setPathEdited(true);
                setTargetPath(event.target.value);
              }}
              placeholder="/path/to/worktree"
              className={`${FIELD_CLASS} font-mono text-ui-sm`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CopyList
              icon={<FilePlus2 className="h-3.5 w-3.5" />}
              label="Copy files"
              addLabel="Add files"
              onAdd={() => void addFiles()}
              items={copyFiles.map((path) => ({ path }))}
              onRemove={(path) =>
                setCopyFiles((prev) => prev.filter((entry) => entry !== path))
              }
            />
            <CopyList
              icon={<FolderPlus className="h-3.5 w-3.5" />}
              label="Copy folders"
              addLabel="Add folders"
              onAdd={() => void addFolders()}
              items={copyFolders}
              onRemove={(path) =>
                setCopyFolders((prev) => prev.filter((entry) => entry.path !== path))
              }
              onToggleMode={(path) =>
                setCopyFolders((prev) =>
                  prev.map((entry) =>
                    entry.path === path
                      ? { ...entry, mode: entry.mode === "copy" ? "symlink" : "copy" }
                      : entry,
                  ),
                )
              }
            />
          </div>

          {preview && preview.warnings.length > 0 ? (
            <div className="space-y-1 rounded-sm border border-warning/40 bg-warning/10 px-3 py-2 text-ui-sm text-warning-bright">
              {preview.warnings.map((warning) => (
                <div key={warning} className="flex items-start gap-1.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          ) : null}

          {copyWarnings.length > 0 ? (
            <div className="space-y-1 rounded-sm border border-warning/40 bg-warning/10 px-3 py-2 text-ui-sm text-warning-bright">
              <div className="font-medium">Worktree created, but some copies failed:</div>
              {copyWarnings.map((warning) => (
                <div key={warning} className="font-mono text-[11px]">
                  {warning}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-sm border border-border px-3 text-ui-reg text-foreground transition-colors hover:bg-accent"
          >
            {copyWarnings.length > 0 ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="flex h-9 items-center gap-1.5 rounded-sm bg-success px-3 text-ui-reg font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Add Worktree
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CopyList({
  icon,
  label,
  addLabel,
  onAdd,
  items,
  onRemove,
  onToggleMode,
}: {
  icon: React.ReactNode;
  label: string;
  addLabel: string;
  onAdd: () => void;
  items: { path: string; mode?: CopyFolderSpec["mode"] }[];
  onRemove: (path: string) => void;
  onToggleMode?: (path: string) => void;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface-container-low p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-ui-sm font-medium text-foreground">
          {icon}
          {label}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-sm border border-border px-2 py-0.5 text-[11px] text-foreground transition-colors hover:bg-accent"
        >
          {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="px-1 py-2 text-[11px] text-muted-foreground">None selected.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.path}
              className="flex items-center gap-1.5 rounded-sm bg-surface-container px-2 py-1"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground" title={item.path}>
                {leaf(item.path)}
              </span>
              {onToggleMode && item.mode ? (
                <button
                  type="button"
                  onClick={() => onToggleMode(item.path)}
                  className={cn(
                    "rounded-sm border px-1.5 py-px text-[10px] uppercase tracking-wide transition-colors",
                    item.mode === "symlink"
                      ? "border-link/40 bg-link/10 text-link"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                  title="Toggle copy / symlink"
                >
                  {item.mode}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(item.path)}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
