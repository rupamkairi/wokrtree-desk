import { create } from "zustand";

/** The five shipped presets. `data-theme` on <html> swaps the CSS var set. */
export type ThemeId =
  | "github-dark"
  | "github-light"
  | "dracula"
  | "palenight"
  | "synthwave";

export type ThemeOption = {
  id: ThemeId;
  label: string;
  /** Whether the preset is a light scheme (drives `color-scheme`). */
  light: boolean;
  /** Representative colors for the picker swatch: [background, surface, primary, accent]. */
  swatch: [string, string, string, string];
};

export const THEMES: ThemeOption[] = [
  {
    id: "github-dark",
    label: "GitHub Dark",
    light: false,
    swatch: ["#0d1117", "#161b22", "#1f6feb", "#3fb950"],
  },
  {
    id: "github-light",
    label: "GitHub Light",
    light: true,
    swatch: ["#ffffff", "#f6f8fa", "#0969da", "#1a7f37"],
  },
  {
    id: "dracula",
    label: "Dracula",
    light: false,
    swatch: ["#282a36", "#343746", "#bd93f9", "#50fa7b"],
  },
  {
    id: "palenight",
    label: "Palenight",
    light: false,
    swatch: ["#292d3e", "#333747", "#82aaff", "#c3e88d"],
  },
  {
    id: "synthwave",
    label: "SynthWave",
    light: false,
    swatch: ["#241b2f", "#2d2440", "#ff7edb", "#72f1b8"],
  },
];

const STORAGE_KEY = "wtd:theme";
const DEFAULT_THEME: ThemeId = "github-dark";

function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

/** Reads the persisted theme, falling back to the default. Safe to call before render. */
export function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Sets `data-theme` on the document root so the CSS var set takes effect. */
export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute("data-theme", theme);
}

type ThemeState = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStoredTheme(),
  setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Persistence is best-effort; the in-memory theme still applies.
    }
    set({ theme });
  },
}));
