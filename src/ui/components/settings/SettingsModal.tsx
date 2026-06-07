import { Check, Construction } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { THEMES, useThemeStore } from "../../store/themeStore";
import { WipBadge } from "../WipBadge";

export function SettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure this repository and the app.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="app">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="repository">Repository</TabsTrigger>
            <TabsTrigger value="app">App</TabsTrigger>
          </TabsList>

          <TabsContent value="repository">
            <div className="flex flex-col items-center gap-2 rounded-sm border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
              <Construction className="h-6 w-6 text-warning-bright" />
              <div className="flex items-center gap-2 text-ui-reg font-medium text-foreground">
                Repository settings <WipBadge />
              </div>
              <p className="max-w-sm text-ui-sm">
                Per-repository preferences are under development.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="app">
            <AppSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function AppSettings() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-ui-reg font-semibold text-foreground">Theme</h3>
        <p className="text-ui-sm text-muted-foreground">
          Pick a color scheme. Applied instantly and remembered.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {THEMES.map((option) => {
          const active = option.id === theme;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={cn(
                "flex items-center gap-3 rounded-md border p-2.5 text-left transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent",
              )}
            >
              <span
                className="flex h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-border"
                aria-hidden
              >
                {option.swatch.map((color, index) => (
                  <span
                    key={index}
                    className="h-full flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate text-ui-reg font-medium text-foreground">
                {option.label}
              </span>
              {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
            </button>
          );
        })}
      </div>

      <div className="border-t border-border pt-3 text-ui-sm text-muted-foreground">
        Worktree Desk <span className="font-mono">v0.1.0</span>
      </div>
    </div>
  );
}
