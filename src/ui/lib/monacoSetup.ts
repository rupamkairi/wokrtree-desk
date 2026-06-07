import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

import { defineMonacoThemes } from "./monacoThemes";

// Self-host Monaco and its (single) editor worker so the diff editor works
// offline inside the Electrobun webview — no CDN fetch. Plain diff needs only
// the base editor worker; language services/workers are not loaded.
(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

// Register the five app-matched diff themes on the same monaco the editor uses.
defineMonacoThemes(monaco);

loader.config({ monaco });
