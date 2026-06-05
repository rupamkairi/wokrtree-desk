import {
  Database,
  GitBranch,
  History,
  LifeBuoy,
  ListChecks,
  Network,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AppView } from "../store/useRepositoryStore";
import { useRepositoryStore } from "../store/useRepositoryStore";
import { WipBadge } from "./WipBadge";

type NavItem = {
  id: AppView | "changes" | "history" | "settings";
  label: string;
  icon: LucideIcon;
  wip?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "repositories", label: "Repositories", icon: Database },
  { id: "changes", label: "Changes", icon: ListChecks, wip: true },
  { id: "history", label: "History", icon: History, wip: true },
  { id: "worktrees", label: "Worktrees", icon: Network },
  { id: "settings", label: "Settings", icon: Settings, wip: true },
];

export function AppSidebar() {
  const view = useRepositoryStore((state) => state.view);
  const setView = useRepositoryStore((state) => state.setView);

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
          <GitBranch className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-ui-bold font-semibold text-foreground">
            Worktree Desk
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">v0.1.0</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.wip && item.id === view;
          const isInteractive = !item.wip;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              disabled={item.wip}
              onClick={() => {
                if (isInteractive) {
                  setView(item.id as AppView);
                }
              }}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-ui-reg transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                item.wip && "cursor-not-allowed opacity-60 hover:bg-transparent",
              )}
            >
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              ) : null}
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.wip ? <WipBadge /> : null}
            </button>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-border px-2 py-3">
        <SidebarFooterLink icon={LifeBuoy} label="Docs" />
        <SidebarFooterLink icon={LifeBuoy} label="Support" />
      </div>
    </aside>
  );
}

function SidebarFooterLink({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-ui-reg text-muted-foreground opacity-70"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      <WipBadge />
    </button>
  );
}
