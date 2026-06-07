import { useEffect, useMemo, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRepositoryStore } from "../../store/useRepositoryStore";

const FIELD_CLASS =
  "h-9 w-full rounded-sm border border-input bg-background px-3 text-ui-reg text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring";

export function CreateBranchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const branches = useRepositoryStore((state) => state.branches);
  const selectedBranch = useRepositoryStore((state) => state.selectedBranch);
  const createBranch = useRepositoryStore((state) => state.createBranch);

  const defaultBase = useMemo(() => {
    if (selectedBranch && branches.some((branch) => branch.name === selectedBranch)) {
      return selectedBranch;
    }
    return (
      branches.find((branch) => branch.isDefault)?.name ?? branches[0]?.name ?? ""
    );
  }, [branches, selectedBranch]);

  const [name, setName] = useState("");
  const [baseRef, setBaseRef] = useState(defaultBase);
  const [checkout, setCheckout] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setName("");
      setBaseRef(defaultBase);
      setCheckout(true);
      setSubmitting(false);
    }
  }, [open, defaultBase]);

  const canSubmit = name.trim().length > 0 && baseRef.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    const ok = await createBranch({ branchName: name.trim(), baseRef, checkout });
    setSubmitting(false);
    if (ok) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            Create Branch
          </DialogTitle>
          <DialogDescription>
            Create a new local branch from an existing base branch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-ui-sm font-medium text-foreground">Branch name</label>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
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

          <label className="flex items-center gap-2 text-ui-reg text-foreground">
            <input
              type="checkbox"
              checked={checkout}
              onChange={(event) => setCheckout(event.target.checked)}
              className="h-4 w-4 rounded-sm accent-primary"
            />
            Checkout this branch after creating
          </label>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-sm border border-border px-3 text-ui-reg text-foreground transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-ui-reg font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Create Branch
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
