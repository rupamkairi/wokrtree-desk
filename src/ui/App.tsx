import { useEffect } from "react";
import { X } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./components/AppSidebar";
import { RepositoriesView } from "./components/repositories/RepositoriesView";
import { WorktreesView } from "./components/worktrees/WorktreesView";
import { useRepositoryStore } from "./store/useRepositoryStore";

function ErrorBanner() {
  const errorMessage = useRepositoryStore((state) => state.errorMessage);
  const clearError = useRepositoryStore((state) => state.clearError);

  if (!errorMessage) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 border-b border-destructive/40 bg-destructive/15 px-4 py-2.5 text-ui-reg text-destructive">
      <span className="flex-1">{errorMessage}</span>
      <button
        type="button"
        onClick={clearError}
        className="rounded-sm p-0.5 transition-colors hover:bg-destructive/20"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function App() {
  const view = useRepositoryStore((state) => state.view);
  const init = useRepositoryStore((state) => state.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <TooltipProvider delayDuration={300}>
      <main className="h-screen overflow-hidden bg-background text-foreground">
        <div className="flex h-full min-w-[1080px]">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <ErrorBanner />
            {view === "worktrees" ? <WorktreesView /> : <RepositoriesView />}
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}

export default App;
