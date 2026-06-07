import { Clipboard, FolderOpen, SquareArrowOutUpRight } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useRepositoryStore } from "../store/useRepositoryStore";

/**
 * Wraps a row with a themed right-click menu. Radix's Trigger calls
 * preventDefault on contextmenu, which suppresses the native webview menu.
 * Pass `path = null` to render children without a menu (e.g. a branch that is
 * not checked out anywhere).
 */
export function PathContextMenu({
  path,
  children,
}: {
  path: string | null;
  children: React.ReactNode;
}) {
  const availableEditors = useRepositoryStore((state) => state.availableEditors);
  const openWith = useRepositoryStore((state) => state.openWith);
  const openPath = useRepositoryStore((state) => state.openPath);

  if (!path) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {availableEditors.length > 0 ? (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
              Open with
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-52">
              {availableEditors.map((editor) => (
                <ContextMenuItem
                  key={editor.id}
                  onSelect={() => void openWith(editor.app, path)}
                >
                  {editor.label}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        ) : null}

        <ContextMenuItem onSelect={() => void openPath(path)}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Open in Finder
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onSelect={() => {
            void navigator.clipboard?.writeText(path);
          }}
        >
          <Clipboard className="mr-2 h-4 w-4" />
          Copy path
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
