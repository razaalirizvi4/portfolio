import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { vfs } from "../../os/vfsInstance";
import { HOME, type VfsNode } from "../../os/vfs";
import Terminal from "../terminal/Terminal";

/* Code OSS dark palette */
const C = {
  editorBg: "#1e1e1e",
  sideBg: "#252526",
  activityBg: "#333333",
  border: "#333333",
  accent: "#007acc",
  text: "#cccccc",
  dim: "#858585",
  tabActiveBg: "#1e1e1e",
  tabInactiveBg: "#2d2d2d",
};

const PROJECTS = `${HOME}/Projects`;

type ViewId = "explorer" | "search" | "scm" | "debug" | "extensions";

/* ------------------------------------------------------------------ *
 * Language detection (drives shiki grammar + status-bar label)
 * ------------------------------------------------------------------ */
function langOf(name: string): { shiki: string; label: string } {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  switch (ext) {
    case "py": return { shiki: "python", label: "Python" };
    case "diff": return { shiki: "diff", label: "Diff" };
    case "jsx": return { shiki: "jsx", label: "JavaScript JSX" };
    case "tsx": return { shiki: "tsx", label: "TypeScript JSX" };
    case "ts": return { shiki: "typescript", label: "TypeScript" };
    case "js": return { shiki: "javascript", label: "JavaScript" };
    case "json": return { shiki: "json", label: "JSON" };
    case "md": return { shiki: "markdown", label: "Markdown" };
    default: return { shiki: "text", label: "Plain Text" };
  }
}

function baseName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

/* ------------------------------------------------------------------ *
 * Activity-bar icons (simple inline SVGs, VS Code style)
 * ------------------------------------------------------------------ */
type IconProps = { size?: number };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ExplorerIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path {...stroke} d="M4 5 h6 l1.5 2 H20 v12 H4 z" /></svg>
);
const SearchIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><circle {...stroke} cx="10.5" cy="10.5" r="5.5" /><path {...stroke} d="M15 15 l4 4" /></svg>
);
const ScmIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><circle {...stroke} cx="6" cy="6" r="2.2" /><circle {...stroke} cx="6" cy="18" r="2.2" /><circle {...stroke} cx="18" cy="8" r="2.2" /><path {...stroke} d="M6 8.2 V15.8 M6 15.8 C6 11 18 13 18 10.2" /></svg>
);
const DebugIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><circle {...stroke} cx="12" cy="12" r="4" /><path {...stroke} d="M12 5 V8 M12 16 V19 M5 12 H8 M16 12 H19 M6.5 6.5 L8.5 8.5 M17.5 6.5 L15.5 8.5" /></svg>
);
const ExtensionsIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path {...stroke} d="M5 5 h5 v5 h-5 z M14 5 h5 v5 h-5 z M5 14 h5 v5 h-5 z" /><path {...stroke} d="M14 14 h5 v5 h-5 z" strokeDasharray="2 2" /></svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 120ms" }}>
    <path fill="currentColor" d="M6 4 l4 4 l-4 4 z" />
  </svg>
);
const CloseX = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16"><path {...stroke} d="M4 4 l8 8 M12 4 l-8 8" /></svg>
);
const GitBranchTiny = () => (
  <svg width={13} height={13} viewBox="0 0 16 16" style={{ verticalAlign: "-2px" }}><circle {...stroke} cx="4" cy="4" r="1.6" /><circle {...stroke} cx="4" cy="12" r="1.6" /><circle {...stroke} cx="12" cy="5" r="1.6" /><path {...stroke} d="M4 5.6 V10.4 M4 10.4 C4 7 12 8.5 12 6.6" /></svg>
);

const ACTIVITY: { id: ViewId; label: string; Icon: (p: IconProps) => React.ReactElement }[] = [
  { id: "explorer", label: "Explorer", Icon: ExplorerIcon },
  { id: "search", label: "Search", Icon: SearchIcon },
  { id: "scm", label: "Source Control", Icon: ScmIcon },
  { id: "debug", label: "Run and Debug", Icon: DebugIcon },
  { id: "extensions", label: "Extensions", Icon: ExtensionsIcon },
];

/* ------------------------------------------------------------------ *
 * Extensions panel (static joke list)
 * ------------------------------------------------------------------ */
const EXTENSIONS = [
  { name: "Spider-Sense Linter", detail: "detects danger in your code", meta: "★★★★★", installed: true },
  { name: "GitHub Copilot", detail: "declined — does his own reps", meta: "not installed", installed: false },
  { name: "Basketball Court Theme", detail: "hardwood syntax colors, swish on save", meta: "★★★★☆", installed: true },
  { name: "Vim", detail: "installed, never exited", meta: "∞ open", installed: true },
];

/* ------------------------------------------------------------------ *
 * Shiki highlighter (lazy — only pulls the chunk when VS Code renders code)
 * ------------------------------------------------------------------ */
function useHighlighted(code: string, lang: string): string | null {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    (async () => {
      try {
        const { codeToHtml } = await import("shiki");
        const out = await codeToHtml(code, { lang, theme: "github-dark" });
        if (!cancelled) setHtml(out);
      } catch {
        if (!cancelled) setHtml(null); // fall back to plain <pre>
      }
    })();
    return () => { cancelled = true; };
  }, [code, lang]);
  return html;
}

/* Decorative minimap — cheap colored-bar abstraction of the code lines. */
function Minimap({ code }: { code: string }) {
  const lines = useMemo(() => code.split("\n"), [code]);
  return (
    <div style={{ width: 58, flexShrink: 0, background: C.editorBg, borderLeft: `1px solid ${C.border}`, overflow: "hidden", padding: "6px 6px", opacity: 0.6 }}>
      {lines.map((l, i) => {
        const indent = l.length - l.trimStart().length;
        const len = Math.min(l.trim().length, 40);
        if (len === 0) return <div key={i} style={{ height: 3 }} />;
        return (
          <div key={i} style={{ height: 2, marginBottom: 1, marginLeft: Math.min(indent, 12) * 1.5, width: `${Math.max(6, len * 2)}%`, background: "#6a6a6a", borderRadius: 1 }} />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Main component
 * ------------------------------------------------------------------ */
export default function VsCode({ windowId, props }: AppProps) {
  const focusedId = useOs(s => s.focusedId);
  const focused = focusedId === windowId;

  const [view, setView] = useState<ViewId>("explorer");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openTabs, setOpenTabs] = useState<string[]>([]); // absolute vfs paths
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  // Explorer tree: projects + expanded state
  const projects = useMemo(() => vfs.list(PROJECTS).filter(n => n.type === "dir"), []);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(vfs.list(PROJECTS).filter(n => n.type === "dir").map(n => [n.name, true])),
  );

  const openFile = useCallback((path: string) => {
    const norm = vfs.normalize(path);
    const node = vfs.resolve(norm);
    if (!node || node.type !== "file") return;
    setOpenTabs(t => (t.includes(norm) ? t : [...t, norm]));
    setActiveTab(norm);
    // reveal: expand its project folder + ensure Explorer is showing
    const rel = norm.startsWith(PROJECTS + "/") ? norm.slice(PROJECTS.length + 1) : "";
    const proj = rel.split("/")[0];
    if (proj) setExpanded(e => ({ ...e, [proj]: true }));
  }, []);

  // React to props.path — both on mount and when a later openApp("vscode",{path})
  // refreshes props on the already-mounted single-instance window.
  const path = typeof props?.path === "string" ? (props.path as string) : null;
  useEffect(() => {
    if (path) { openFile(path); setView("explorer"); }
  }, [path, openFile]);

  const closeTab = useCallback((path: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenTabs(t => {
      const next = t.filter(p => p !== path);
      setActiveTab(cur => (cur === path ? (next[next.length - 1] ?? null) : cur));
      return next;
    });
  }, []);

  // Ctrl+` toggles the integrated terminal (does NOT collide with the OS's Ctrl+Alt+T).
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.altKey && !e.metaKey && e.key === "`") {
        e.preventDefault();
        setTerminalOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  const activeCode = activeTab ? safeRead(activeTab) : null;
  const activeLang = activeTab ? langOf(baseName(activeTab)) : null;

  const toggleView = (id: ViewId) => {
    if (id === view && sidebarOpen) setSidebarOpen(false);
    else { setView(id); setSidebarOpen(true); }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.editorBg, color: C.text, fontFamily: "'Ubuntu', system-ui, sans-serif", fontSize: 13, overflow: "hidden" }}>
      {/* main row */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* activity bar */}
        <div style={{ width: 48, flexShrink: 0, background: C.activityBg, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 6 }}>
          {ACTIVITY.map(({ id, label, Icon }) => {
            const active = id === view && sidebarOpen;
            return (
              <button
                key={id}
                title={label}
                onClick={() => toggleView(id)}
                style={{
                  width: 48, height: 48, border: "none", background: "transparent", cursor: "pointer",
                  color: active ? "#ffffff" : "#8a8a8a",
                  borderLeft: active ? "2px solid #ffffff" : "2px solid transparent",
                  display: "grid", placeItems: "center",
                }}
              >
                <Icon size={24} />
              </button>
            );
          })}
        </div>

        {/* side panel */}
        {sidebarOpen && (
          <div style={{ width: 220, flexShrink: 0, background: C.sideBg, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {view === "explorer" && (
              <ExplorerPanel projects={projects} expanded={expanded} setExpanded={setExpanded} activeTab={activeTab} onOpen={openFile} />
            )}
            {view === "extensions" && <ExtensionsPanel />}
            {view === "search" && <SimplePanel title="SEARCH" body="Nothing to search — the code speaks for itself." />}
            {view === "scm" && <SimplePanel title="SOURCE CONTROL" body="✓ main — working tree clean. (One commit fixed everything.)" />}
            {view === "debug" && <SimplePanel title="RUN AND DEBUG" body="No bugs to debug. Spider-sense would have tingled." />}
          </div>
        )}

        {/* editor column */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: C.editorBg }}>
          {/* tab strip */}
          <div style={{ display: "flex", background: "#252526", borderBottom: `1px solid ${C.border}`, minHeight: 35, overflowX: "auto" }}>
            {openTabs.map(p => {
              const active = p === activeTab;
              return (
                <div
                  key={p}
                  onClick={() => setActiveTab(p)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 35, cursor: "pointer",
                    background: active ? C.tabActiveBg : C.tabInactiveBg,
                    color: active ? "#ffffff" : "#9d9d9d",
                    borderTop: active ? `1px solid ${C.accent}` : "1px solid transparent",
                    borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  <span style={{ color: fileTint(p) }}>●</span>
                  <span>{baseName(p)}</span>
                  <span onClick={(e) => closeTab(p, e)} title="Close" style={{ display: "grid", placeItems: "center", width: 18, height: 18, borderRadius: 4, opacity: 0.7 }}>
                    <CloseX size={13} />
                  </span>
                </div>
              );
            })}
          </div>

          {/* breadcrumbs */}
          {activeTab && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 12px", fontSize: 12, color: C.dim, background: C.editorBg, borderBottom: `1px solid ${C.border}` }}>
              {breadcrumbSegments(activeTab).map((seg, i, arr) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: i === arr.length - 1 ? C.text : C.dim }}>{seg}</span>
                  {i < arr.length - 1 && <span style={{ opacity: 0.6 }}>›</span>}
                </span>
              ))}
            </div>
          )}

          {/* editor body + optional terminal panel */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              {activeTab && activeCode !== null && activeLang ? (
                <>
                  <EditorPane code={activeCode} lang={activeLang.shiki} />
                  <Minimap code={activeCode} />
                </>
              ) : (
                <WelcomePane />
              )}
            </div>

            {terminalOpen && (
              <div style={{ height: 220, flexShrink: 0, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", background: "var(--terminal-bg, #1e1e1e)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, height: 28, padding: "0 12px", fontSize: 11, letterSpacing: 0.5, color: C.dim, borderBottom: `1px solid ${C.border}`, background: C.sideBg }}>
                  <span style={{ color: C.text, borderBottom: `1px solid ${C.accent}`, paddingBottom: 4 }}>TERMINAL</span>
                  <span>PROBLEMS</span>
                  <span>OUTPUT</span>
                  <span style={{ marginLeft: "auto", cursor: "pointer" }} title="Close panel (Ctrl+`)" onClick={() => setTerminalOpen(false)}><CloseX size={13} /></span>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Terminal windowId={windowId} props={props} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* status bar */}
      <div style={{ height: 22, flexShrink: 0, background: C.accent, color: "#ffffff", display: "flex", alignItems: "center", fontSize: 12, paddingLeft: 4 }}>
        <StatusItem title="Toggle terminal (Ctrl+`)" onClick={() => setTerminalOpen(o => !o)}><GitBranchTiny /> main</StatusItem>
        <StatusItem>✓ 0 ⚠ 0</StatusItem>
        <div style={{ flex: 1 }} />
        <StatusItem>Ln 1, Col 1</StatusItem>
        <StatusItem>Spaces: 4</StatusItem>
        <StatusItem>UTF-8</StatusItem>
        <StatusItem>{activeLang?.label ?? "Plain Text"}</StatusItem>
        <StatusItem>Prettier ✓</StatusItem>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sub-components
 * ------------------------------------------------------------------ */
function StatusItem({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <span onClick={onClick} title={title} style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px", height: "100%", cursor: onClick ? "pointer" : "default" }}>
      {children}
    </span>
  );
}

function ExplorerPanel({ projects, expanded, setExpanded, activeTab, onOpen }: {
  projects: VfsNode[];
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeTab: string | null;
  onOpen: (path: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div style={{ padding: "8px 12px 4px", fontSize: 11, letterSpacing: 0.6, color: C.dim, textTransform: "uppercase" }}>Explorer</div>
      <div style={{ padding: "2px 8px 4px 10px", fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: 0.4 }}>PROJECTS</div>
      {projects.map(proj => {
        const isOpen = !!expanded[proj.name];
        const projPath = `${PROJECTS}/${proj.name}`;
        const files = isOpen ? vfs.list(projPath).filter(n => n.type === "file") : [];
        return (
          <div key={proj.name}>
            <div
              onClick={() => setExpanded(e => ({ ...e, [proj.name]: !e[proj.name] }))}
              style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px 8px", cursor: "pointer", color: C.text }}
            >
              <span style={{ color: C.dim, display: "grid", placeItems: "center" }}><ChevronIcon open={isOpen} /></span>
              <span>📁</span>
              <span style={{ marginLeft: 2 }}>{proj.name}</span>
            </div>
            {files.map(f => {
              const fp = `${projPath}/${f.name}`;
              const active = fp === activeTab;
              return (
                <div
                  key={f.name}
                  onClick={() => onOpen(fp)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 30px", cursor: "pointer", background: active ? "#37373d" : "transparent", color: active ? "#ffffff" : C.text }}
                >
                  <span style={{ color: fileTint(f.name), fontSize: 10 }}>●</span>
                  <span>{f.name}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ExtensionsPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div style={{ padding: "8px 12px 6px", fontSize: 11, letterSpacing: 0.6, color: C.dim, textTransform: "uppercase" }}>Extensions</div>
      {EXTENSIONS.map(ext => (
        <div key={ext.name} style={{ display: "flex", gap: 10, padding: "8px 12px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 6, background: "#3a3d41", display: "grid", placeItems: "center", fontSize: 18 }}>
            {iconForExt(ext.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ext.name}</div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 1 }}>{ext.detail}</div>
            <div style={{ fontSize: 11, color: ext.installed ? "#4ec9b0" : "#858585", marginTop: 3 }}>{ext.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SimplePanel({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 12px 6px", fontSize: 11, letterSpacing: 0.6, color: C.dim, textTransform: "uppercase" }}>{title}</div>
      <div style={{ padding: "4px 12px", fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

function WelcomePane() {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", color: C.dim, textAlign: "center", padding: 24 }}>
      <div>
        <div style={{ fontSize: 40, opacity: 0.4, marginBottom: 12 }}>{"</>"}</div>
        <div style={{ fontSize: 15, color: C.text }}>Visual Studio Code</div>
        <div style={{ fontSize: 12, marginTop: 8, maxWidth: 340, lineHeight: 1.6 }}>
          Open a file from the Explorer to browse Raza's real project source — the Deep-Emotion dropout fix, Twin's NL→shell CLI, or Agri-Pro's Mapbox field mapper.
        </div>
        <div style={{ fontSize: 11, marginTop: 14, opacity: 0.7 }}>Press <kbd style={{ border: `1px solid ${C.border}`, borderRadius: 3, padding: "1px 5px" }}>Ctrl</kbd> + <kbd style={{ border: `1px solid ${C.border}`, borderRadius: 3, padding: "1px 5px" }}>`</kbd> for the integrated terminal.</div>
      </div>
    </div>
  );
}

/* Editor pane: shiki github-dark with inline line numbers; plain <pre> fallback. */
function EditorPane({ code, lang }: { code: string; lang: string }) {
  const html = useHighlighted(code, lang);
  const scrollStyle: React.CSSProperties = { flex: 1, minWidth: 0, overflow: "auto", background: C.editorBg };
  const preBase: React.CSSProperties = {
    margin: 0, fontFamily: "var(--font-mono, 'Ubuntu Mono', monospace)", fontSize: 13, lineHeight: "20px", tabSize: 4,
  };
  if (!html) {
    // Fallback while the shiki chunk loads — plain monospaced text.
    return (
      <div style={scrollStyle}>
        <pre style={{ ...preBase, padding: "8px 16px", color: C.text, whiteSpace: "pre" }}>{code}</pre>
      </div>
    );
  }
  return (
    <div className="vscode-shiki" style={scrollStyle}>
      <style>{`
        .vscode-shiki pre.shiki { margin:0 !important; padding: 8px 0 !important; background: ${C.editorBg} !important; font-family: var(--font-mono, 'Ubuntu Mono', monospace); font-size:13px; line-height:20px; }
        .vscode-shiki code { counter-reset: step; counter-increment: step 0; display: inline-block; min-width: 100%; }
        .vscode-shiki .line { display:inline-block; width:100%; padding: 0 16px 0 0; }
        .vscode-shiki .line::before {
          content: counter(step); counter-increment: step;
          display: inline-block; width: 40px; margin-right: 16px;
          text-align: right; color: #6e7681; user-select: none;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
function safeRead(path: string): string | null {
  try { return vfs.read(path); } catch { return null; }
}

// A tab/file dot tint by extension, echoing VS Code file-icon colors.
function fileTint(path: string): string {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "py") return "#4b8bbe";
  if (ext === "diff") return "#e2c08d";
  if (ext === "jsx" || ext === "js") return "#e8d44d";
  if (ext === "tsx" || ext === "ts") return "#4ec9b0";
  if (ext === "md") return "#519aba";
  return "#9d9d9d";
}

function iconForExt(name: string): string {
  if (name.startsWith("Spider")) return "🕷";
  if (name.startsWith("GitHub")) return "🤖";
  if (name.startsWith("Basketball")) return "🏀";
  if (name.startsWith("Vim")) return "📗";
  return "🧩";
}

function breadcrumbSegments(path: string): string[] {
  const norm = vfs.normalize(path);
  const rel = norm.startsWith(HOME + "/") ? norm.slice(HOME.length + 1) : norm.replace(/^\//, "");
  return rel.split("/").filter(Boolean);
}
