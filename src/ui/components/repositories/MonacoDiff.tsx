import { useEffect, useRef } from "react";
import { DiffEditor, type DiffOnMount } from "@monaco-editor/react";

import "../../lib/monacoSetup";
import { monacoThemeName } from "../../lib/monacoThemes";
import { useThemeStore } from "../../store/themeStore";

type DiffEditorInstance = Parameters<DiffOnMount>[0];

export default function MonacoDiff({
  original,
  modified,
  language,
  renderSideBySide,
}: {
  original: string;
  modified: string;
  language: string;
  renderSideBySide: boolean;
}) {
  const theme = useThemeStore((state) => state.theme);
  const editorRef = useRef<DiffEditorInstance | null>(null);

  // @monaco-editor/react only reads `options` at mount, so toggling
  // split/unified after mount is ignored unless we re-apply it on the instance.
  useEffect(() => {
    editorRef.current?.updateOptions({ renderSideBySide });
  }, [renderSideBySide]);

  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={language}
      theme={monacoThemeName(theme)}
      onMount={(editor) => {
        editorRef.current = editor;
      }}
      options={{
        readOnly: true,
        renderSideBySide,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 12,
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
      }}
    />
  );
}
