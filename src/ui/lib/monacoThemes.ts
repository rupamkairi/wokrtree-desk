import type * as Monaco from "monaco-editor";

import type { ThemeId } from "../store/themeStore";

/**
 * Monaco ships only "vs"/"vs-dark". To make the diff editor match the five app
 * themes, we register one custom Monaco theme per app theme. Colors are the same
 * HSL values that live in `index.css` (kept hardcoded here, converted to hex at
 * registration). Each theme sets chrome (background/foreground/gutters/selection),
 * diff line backgrounds, and a curated syntax token map derived from the theme's
 * accent palette.
 */

type Hsl = [number, number, number];

type Palette = {
  base: "vs" | "vs-dark";
  bg: Hsl;
  fg: Hsl;
  muted: Hsl;
  border: Hsl;
  primary: Hsl;
  link: Hsl;
  added: Hsl;
  removed: Hsl;
  warning: Hsl;
};

const PALETTES: Record<ThemeId, Palette> = {
  "github-dark": {
    base: "vs-dark",
    bg: [215, 21, 7],
    fg: [213, 40, 89],
    muted: [212, 9, 58],
    border: [212, 14, 21],
    primary: [215, 84, 52],
    link: [212, 100, 67],
    added: [135, 49, 49],
    removed: [3, 92, 63],
    warning: [41, 73, 48],
  },
  "github-light": {
    base: "vs",
    bg: [0, 0, 100],
    fg: [213, 12, 14],
    muted: [213, 8, 43],
    border: [210, 18, 84],
    primary: [212, 92, 45],
    link: [212, 92, 45],
    added: [137, 62, 33],
    removed: [356, 72, 47],
    warning: [40, 100, 30],
  },
  dracula: {
    base: "vs-dark",
    bg: [231, 15, 18],
    fg: [60, 30, 96],
    muted: [228, 27, 60],
    border: [232, 14, 31],
    primary: [265, 89, 78],
    link: [191, 97, 77],
    added: [135, 94, 65],
    removed: [0, 100, 67],
    warning: [31, 100, 71],
  },
  palenight: {
    base: "vs-dark",
    bg: [229, 21, 20],
    fg: [231, 31, 73],
    muted: [230, 19, 56],
    border: [228, 19, 28],
    primary: [222, 100, 75],
    link: [197, 100, 77],
    added: [88, 63, 73],
    removed: [350, 100, 66],
    warning: [39, 100, 71],
  },
  synthwave: {
    base: "vs-dark",
    bg: [270, 27, 15],
    fg: [290, 5, 94],
    muted: [233, 31, 67],
    border: [260, 31, 24],
    primary: [313, 100, 75],
    link: [179, 94, 59],
    added: [154, 81, 70],
    removed: [356, 99, 63],
    warning: [51, 99, 68],
  },
};

/** Converts an HSL triplet to a `#rrggbb` hex string. */
function hslToHex([h, s, l]: Hsl): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const m = lN - c / 2;
  const channel = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Token foreground for Monaco `rules` (6 hex chars, no leading `#`). */
function token(hsl: Hsl): string {
  return hslToHex(hsl).slice(1);
}

export function monacoThemeName(id: ThemeId): string {
  return `wtd-${id}`;
}

/** Registers all five custom Monaco themes on the given monaco instance. */
export function defineMonacoThemes(monaco: typeof Monaco): void {
  for (const id of Object.keys(PALETTES) as ThemeId[]) {
    const p = PALETTES[id];
    const bg = hslToHex(p.bg);
    const fg = hslToHex(p.fg);
    const muted = hslToHex(p.muted);
    const border = hslToHex(p.border);
    const primary = hslToHex(p.primary);
    const added = hslToHex(p.added);
    const removed = hslToHex(p.removed);

    monaco.editor.defineTheme(monacoThemeName(id), {
      base: p.base,
      inherit: true,
      rules: [
        { token: "", foreground: token(p.fg) },
        { token: "comment", foreground: token(p.muted), fontStyle: "italic" },
        { token: "keyword", foreground: token(p.primary) },
        { token: "string", foreground: token(p.added) },
        { token: "number", foreground: token(p.warning) },
        { token: "type", foreground: token(p.link) },
        { token: "function", foreground: token(p.link) },
        { token: "variable", foreground: token(p.fg) },
        { token: "constant", foreground: token(p.warning) },
        { token: "delimiter", foreground: token(p.muted) },
      ],
      colors: {
        "editor.background": bg,
        "editor.foreground": fg,
        "editorLineNumber.foreground": muted,
        "editorLineNumber.activeForeground": fg,
        "editorCursor.foreground": fg,
        "editor.selectionBackground": `${primary}44`,
        "editor.lineHighlightBackground": `${border}33`,
        "editorIndentGuide.background": border,
        "editorGutter.background": bg,
        "diffEditor.insertedTextBackground": `${added}33`,
        "diffEditor.removedTextBackground": `${removed}33`,
        "diffEditor.insertedLineBackground": `${added}1f`,
        "diffEditor.removedLineBackground": `${removed}1f`,
      },
    });
  }
}
