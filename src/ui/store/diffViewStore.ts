import { create } from "zustand";

export type DiffViewMode = "split" | "unified";

const STORAGE_KEY = "wtd:diffMode";
const DEFAULT_MODE: DiffViewMode = "split";

function readStored(): DiffViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "unified" || stored === "split" ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

type DiffViewState = {
  mode: DiffViewMode;
  setMode: (mode: DiffViewMode) => void;
};

export const useDiffViewStore = create<DiffViewState>((set) => ({
  mode: readStored(),
  setMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // best-effort persistence
    }
    set({ mode });
  },
}));
