import type { EditorTarget } from "../domain/types";

/**
 * Fixed list of supported "Open with" targets. `app` is the macOS application
 * name passed to `open -a`. Detection (open -Ra) decides which are shown.
 */
export const EDITOR_TARGETS: EditorTarget[] = [
  { id: "vscode", label: "VS Code", app: "Visual Studio Code" },
  { id: "vscode-insiders", label: "VS Code Insiders", app: "Visual Studio Code - Insiders" },
  { id: "zed", label: "Zed", app: "Zed" },
  { id: "cursor", label: "Cursor", app: "Cursor" },
  { id: "antigravity", label: "Antigravity", app: "Antigravity" },
  { id: "trae", label: "Trae", app: "Trae" },
  { id: "sublime", label: "Sublime Text", app: "Sublime Text" },
  { id: "terminal", label: "Terminal", app: "Terminal" },
  { id: "ghostty", label: "ghostty", app: "Ghostty" },
  { id: "iterm2", label: "iTerm2", app: "iTerm" },
  { id: "warp", label: "Warp", app: "Warp" },
];
