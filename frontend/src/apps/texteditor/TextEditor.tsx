import { useEffect, useRef, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { vfs } from "../../os/vfsInstance";
import { HOME } from "../../os/vfs";

const UNTITLED_PATH = `${HOME}/Documents/untitled.md`;

function basename(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? path : path.slice(idx + 1);
}

export default function TextEditor({ props }: AppProps) {
  const theme = useOs(s => s.settings.theme);
  const notify = useOs(s => s.notify);
  const light = theme === "light";

  const initialPath = typeof props?.path === "string" ? (props.path as string) : null;
  const [path, setPath] = useState<string | null>(() => (initialPath ? vfs.normalize(initialPath) : null));

  const initialContent = (() => {
    if (!initialPath) return "";
    try { return vfs.read(vfs.normalize(initialPath)); } catch { return ""; }
  })();
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const modified = content !== savedContent;

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => { rootRef.current?.focus(); }, []);

  function handleSave() {
    const targetPath = path ?? UNTITLED_PATH;
    try {
      vfs.write(targetPath, content);
      setPath(targetPath);
      setSavedContent(content);
      notify("texteditor", "Saved", basename(targetPath));
    } catch (e) {
      notify("texteditor", "Save failed", e instanceof Error ? e.message : String(e));
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
    }
  }

  const displayName = path ? basename(path) : "Untitled Document";
  const toolbarBg = light ? "#F4F4F4" : "#2A2434";
  const border = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)";
  const fg = light ? "#1a1a1a" : "#eee";

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{ height: "100%", display: "flex", flexDirection: "column", outline: "none", fontFamily: "var(--font-ui)" }}
    >
      <div style={{
        height: 46, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 12px",
        background: toolbarBg, borderBottom: `1px solid ${border}`, color: fg,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        {modified && (
          <span
            title="Unsaved changes"
            style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--yaru-accent)", flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleSave}
          style={{
            padding: "6px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: "var(--yaru-accent)", color: "#fff",
          }}
        >
          Save
        </button>
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        style={{
          flex: 1, width: "100%", resize: "none", border: "none", outline: "none",
          background: "#1E1E28", color: "#E6E4EA",
          fontFamily: "var(--font-mono), 'Ubuntu Mono', monospace", fontSize: 13, lineHeight: 1.5,
          padding: 16, boxSizing: "border-box",
        }}
      />
    </div>
  );
}
