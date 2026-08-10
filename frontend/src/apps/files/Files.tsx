import { useEffect, useRef, useState, type FC, type ReactNode } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { vfs } from "../../os/vfsInstance";
import { HOME, type VfsNode } from "../../os/vfs";
import { useContextMenu, type MenuItem } from "../../shell/desktop/ContextMenu";
import { ChevronIcon, SearchIcon, GridIcon } from "../../ui/icons";

const DOCUMENTS = `${HOME}/Documents`;
const PROJECTS = `${HOME}/Projects`;
const PICTURES = `${HOME}/Pictures`;
const DOWNLOADS = `${HOME}/Downloads`;
const SECRETS = `${HOME}/.secrets`;
const TRASH = `${HOME}/.local/Trash`;

const SIDEBAR: { label: string; path: string }[] = [
  { label: "Home", path: HOME },
  { label: "Documents", path: DOCUMENTS },
  { label: "Projects", path: PROJECTS },
  { label: "Pictures", path: PICTURES },
  { label: "Downloads", path: DOWNLOADS },
  { label: "Web-Shooters", path: SECRETS },
];

const FAKE_DATES = ["Aug 10", "Aug 9", "Aug 6", "Jul 30", "Jul 22", "Jul 15", "Jun 28", "Jun 12"];
function fakeModified(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return FAKE_DATES[h % FAKE_DATES.length];
}

function sizeLabel(node: VfsNode): string {
  if (node.type === "dir") return "—";
  const bytes = node.content.length;
  return bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1)} KB`;
}

/* ------------------------------------------------------------------ *
 * Cross-app opening contract — other tasks rely on this exact mapping.
 * ------------------------------------------------------------------ */
function kindApp(node: VfsNode, path: string, openApp: (id: string, props?: Record<string, unknown>) => string) {
  if (node.type === "dir") return null;
  switch (node.kind) {
    case "pdf": return openApp("evince", { url: node.url });
    case "markdown":
    case "text": return openApp("texteditor", { path });
    case "image": return openApp("imageviewer", { url: node.url, name: node.name });
    case "code": return openApp("vscode", { path });
    default: return openApp("texteditor", { path });
  }
}

/* ------------------------------------------------------------------ *
 * File-type icons — manila folder, red PDF sheet, lined text sheet,
 * blue code sheet, image thumbnail.
 * ------------------------------------------------------------------ */
const SheetBase: FC<{ children?: ReactNode }> = ({ children }) => (
  <>
    <path d="M12 3 h24 l13 13 v42 a3 3 0 0 1 -3 3 H12 a3 3 0 0 1 -3 -3 V6 a3 3 0 0 1 3-3z" fill="#FAFAFA" stroke="rgba(0,0,0,0.12)" />
    <path d="M36 3 v11 a2 2 0 0 0 2 2 h11 z" fill="#E4E0DD" />
    {children}
  </>
);

const NodeIcon: FC<{ node: VfsNode; size?: number }> = ({ node, size = 64 }) => {
  if (node.type === "dir") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <path d="M6 16 h17 l6 8 h26 a4 4 0 0 1 4 4 v3 H3 v-11 a4 4 0 0 1 3-4z" fill="#E0A63C" />
        <path d="M3 27 h58 v22 a4 4 0 0 1 -4 4 H7 a4 4 0 0 1 -4 -4 z" fill="#F6B84C" />
      </svg>
    );
  }
  if (node.kind === "image" && node.url) {
    return (
      <img
        src={node.url}
        alt=""
        style={{ width: size, height: size, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", display: "block" }}
      />
    );
  }
  if (node.kind === "pdf") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <SheetBase>
          <rect x="9" y="38" width="28" height="15" rx="2" fill="#C01C28" />
          <text x="23" y="49" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="Ubuntu, sans-serif">PDF</text>
        </SheetBase>
      </svg>
    );
  }
  if (node.kind === "code") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <SheetBase>
          <text x="24" y="50" textAnchor="middle" fontSize="15" fontWeight="700" fill="#2C9CDB" fontFamily="Ubuntu Mono, monospace">{"</>"}</text>
        </SheetBase>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <SheetBase>
        <line x1="14" y1="30" x2="42" y2="30" stroke="#B5AFAB" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="38" x2="42" y2="38" stroke="#B5AFAB" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="46" x2="34" y2="46" stroke="#B5AFAB" strokeWidth="3" strokeLinecap="round" />
      </SheetBase>
    </svg>
  );
};

const HomeGlyph: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11 L12 4 L20 11" />
    <path d="M6 10 V20 H18 V10" />
  </svg>
);

const TrashGlyph: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 7 h14" />
    <path d="M9 7 V5 h6 v2" />
    <path d="M6.5 7 l1 12.5 a1 1 0 0 0 1 0.9 h7 a1 1 0 0 0 1 -0.9 L17.5 7" />
  </svg>
);

const StarGlyph: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 3 l2.6 5.8 6.3 0.6 -4.8 4.2 1.4 6.2 -5.5 -3.3 -5.5 3.3 1.4 -6.2 -4.8 -4.2 6.3 -0.6 z" />
  </svg>
);

const HamburgerGlyph: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

const ListGlyph: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="6" x2="19" y2="6" />
    <line x1="5" y1="12" x2="19" y2="12" />
    <line x1="5" y1="18" x2="19" y2="18" />
  </svg>
);

const ToolbarButton: FC<{ title?: string; disabled?: boolean; active?: boolean; onClick?: (e: React.MouseEvent) => void; children: ReactNode }> = ({ title, disabled, active, onClick, children }) => {
  const theme = useOs(s => s.settings.theme);
  const [hover, setHover] = useState(false);
  const light = theme === "light";
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30, height: 30, display: "grid", placeItems: "center",
        border: "none", borderRadius: 7, cursor: disabled ? "default" : "pointer",
        color: disabled ? (light ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)") : (light ? "#2a2a2a" : "#eee"),
        background: active ? "var(--yaru-accent)" : hover && !disabled ? (light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.1)") : "transparent",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
};

export default function Files({ props }: AppProps) {
  const theme = useOs(s => s.settings.theme);
  const openApp = useOs(s => s.openApp);
  const notify = useOs(s => s.notify);
  const light = theme === "light";
  const { open, element } = useContextMenu();

  const initialPath = (() => {
    const raw = typeof props?.path === "string" ? (props.path as string) : HOME;
    const norm = vfs.normalize(raw);
    const node = vfs.resolve(norm);
    return node && node.type === "dir" ? norm : HOME;
  })();

  const [history, setHistory] = useState<string[]>([initialPath]);
  const [histIdx, setHistIdx] = useState(0);
  const cwd = history[histIdx];

  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showHidden, setShowHidden] = useState(false);
  const [renaming, setRenaming] = useState<{ name: string; value: string } | null>(null);
  const [propertiesNode, setPropertiesNode] = useState<VfsNode | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setTick] = useState(0);
  const bump = () => setTick(t => t + 1);

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => { rootRef.current?.focus(); }, []);

  // Guards the Enter-then-blur double-commit of an inline rename: Enter commits
  // and unmounts the input, whose native blur would fire commitRename again
  // with a stale closure and raise a false "already exists" toast.
  const renameCommittedRef = useRef(false);

  const canBack = histIdx > 0;
  const canForward = histIdx < history.length - 1;

  function navigate(rawPath: string) {
    const norm = vfs.normalize(rawPath);
    if (norm === cwd) return;
    const node = vfs.resolve(norm);
    if (!node || node.type !== "dir") return;
    setHistory(h => [...h.slice(0, histIdx + 1), norm]);
    setHistIdx(i => i + 1);
    setSelected(null);
    setRenaming(null);
    setSearchOpen(false);
    setQuery("");
  }
  const goBack = () => { if (canBack) { setHistIdx(i => i - 1); setSelected(null); } };
  const goForward = () => { if (canForward) { setHistIdx(i => i + 1); setSelected(null); } };

  function openNode(node: VfsNode, path: string) {
    if (node.type === "dir") { navigate(path); return; }
    kindApp(node, path, openApp);
  }

  function createFolder() {
    const parent = vfs.resolve(cwd);
    if (!parent || parent.type !== "dir") return;
    let name = "New Folder";
    let n = 2;
    while (parent.children[name]) name = `New Folder (${n++})`;
    vfs.mkdir(vfs.normalize(name, cwd));
    bump();
    setSelected(name);
    startRename(name);
  }

  function startRename(name: string) {
    renameCommittedRef.current = false;
    setRenaming({ name, value: name });
  }

  function cancelRename() {
    renameCommittedRef.current = true;
    setRenaming(null);
  }

  function commitRename(node: VfsNode) {
    if (renameCommittedRef.current) return;
    renameCommittedRef.current = true;
    const trimmed = renaming?.value.trim();
    setRenaming(null);
    if (!trimmed || trimmed === node.name) return;
    const parent = vfs.resolve(cwd);
    if (!parent || parent.type !== "dir") return;
    if (parent.children[trimmed]) {
      notify("files", "Rename failed", `An item named "${trimmed}" already exists.`);
      return;
    }
    if (vfs.isProtected(vfs.normalize(node.name, cwd))) {
      notify("files", "Permission denied", `${node.name} is load-bearing.`);
      return;
    }
    // Re-insert the same node under the new key so kind/url/content survive
    // for every file type (vfs.write would re-infer kind and drop url).
    delete parent.children[node.name];
    parent.children[trimmed] = { ...node, name: trimmed };
    bump();
    setSelected(trimmed);
  }

  function moveToTrash(node: VfsNode, path: string) {
    const res = vfs.rm(path);
    if (!res.ok) {
      notify("files", "Permission denied", res.error ?? "Unknown error");
      return;
    }
    if (selected === node.name) setSelected(null);
    bump();
  }

  function itemMenuItems(node: VfsNode, path: string): MenuItem[] {
    const items: MenuItem[] = [{ label: "Open", onClick: () => openNode(node, path) }];
    if (node.type === "file") {
      items.push({ label: "Open With Text Editor", onClick: () => openApp("texteditor", { path }) });
    }
    items.push({ separator: true });
    items.push({ label: "Rename", onClick: () => { setSelected(node.name); startRename(node.name); } });
    items.push({ label: "Move to Trash", danger: true, onClick: () => moveToTrash(node, path) });
    items.push({ separator: true });
    items.push({ label: "Properties", onClick: () => setPropertiesNode(node) });
    return items;
  }
  const backgroundMenuItems: MenuItem[] = [
    { label: "New Folder", onClick: () => createFolder() },
    { label: "Paste" },
  ];
  const hamburgerItems: MenuItem[] = [
    { label: `${showHidden ? "✓ " : "   "}Show Hidden Files    Ctrl+H`, onClick: () => setShowHidden(v => !v) },
    { separator: true },
    { label: "New Folder", onClick: () => createFolder() },
  ];

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h") {
      e.preventDefault();
      setShowHidden(v => !v);
    }
  }

  const items = vfs.list(cwd)
    .filter(n => showHidden || !n.name.startsWith("."))
    .filter(n => !query || n.name.toLowerCase().includes(query.toLowerCase()));

  // Breadcrumb segments.
  const relFromHome = cwd === HOME ? "" : cwd.startsWith(HOME + "/") ? cwd.slice(HOME.length + 1) : null;
  const crumbs: { label: string; path: string }[] = relFromHome !== null
    ? [{ label: "Home", path: HOME }, ...(relFromHome ? relFromHome.split("/") : []).map((seg, i, arr) => ({ label: seg, path: HOME + "/" + arr.slice(0, i + 1).join("/") }))]
    : cwd.split("/").filter(Boolean).map((seg, i, arr) => ({ label: seg, path: "/" + arr.slice(0, i + 1).join("/") }));

  const sidebarBg = light ? "#EDEDED" : "#28222F";
  const toolbarBg = light ? "#F4F4F4" : "#2A2434";
  const mainBg = light ? "#FAFAFA" : "#241F31";
  const border = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)";
  const fg = light ? "#1a1a1a" : "#eee";
  const dim = light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{ height: "100%", display: "flex", flexDirection: "column", outline: "none", fontFamily: "var(--font-ui)", color: fg, background: mainBg }}
    >
      {/* Toolbar */}
      <div style={{
        height: 46, flexShrink: 0, display: "flex", alignItems: "center", gap: 4, padding: "0 8px",
        background: toolbarBg, borderBottom: `1px solid ${border}`,
      }}>
        <ToolbarButton title="Back" disabled={!canBack} onClick={goBack}>
          <span style={{ display: "inline-block", transform: "rotate(90deg)" }}><ChevronIcon size={16} /></span>
        </ToolbarButton>
        <ToolbarButton title="Forward" disabled={!canForward} onClick={goForward}>
          <span style={{ display: "inline-block", transform: "rotate(-90deg)" }}><ChevronIcon size={16} /></span>
        </ToolbarButton>

        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", marginLeft: 6 }}>
          {searchOpen ? (
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") { setSearchOpen(false); setQuery(""); } }}
              placeholder="Search this folder…"
              style={{
                width: "100%", height: 28, borderRadius: 7, border: `1px solid ${border}`,
                background: light ? "#fff" : "#1E1926", color: fg, padding: "0 10px", fontSize: 13, outline: "none",
              }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden", whiteSpace: "nowrap" }}>
              {crumbs.map((c, i) => (
                <span key={c.path} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {i > 0 && <span style={{ opacity: 0.4, fontSize: 12 }}>›</span>}
                  <button
                    onClick={() => navigate(c.path)}
                    style={{
                      border: "none", background: "transparent", cursor: "pointer",
                      padding: "4px 6px", borderRadius: 6,
                      color: i === crumbs.length - 1 ? fg : dim,
                      fontWeight: i === crumbs.length - 1 ? 600 : 400,
                      fontSize: 13, whiteSpace: "nowrap",
                    }}
                  >
                    {c.label}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <ToolbarButton title="Search" active={searchOpen} onClick={() => { setSearchOpen(v => !v); if (searchOpen) setQuery(""); }}>
          <SearchIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Grid view" active={view === "grid"} onClick={() => setView("grid")}>
          <GridIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="List view" active={view === "list"} onClick={() => setView("list")}>
          <ListGlyph size={16} />
        </ToolbarButton>
        <ToolbarButton title="Menu" onClick={e => open(e, hamburgerItems)}>
          <HamburgerGlyph size={16} />
        </ToolbarButton>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 180, flexShrink: 0, background: sidebarBg, borderRight: `1px solid ${border}`, padding: 10, display: "flex", flexDirection: "column", gap: 1 }}>
          {SIDEBAR.map(item => {
            const active = cwd === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                  border: "none", cursor: "pointer", borderRadius: 7, padding: "7px 8px", fontSize: 13,
                  background: active ? "var(--yaru-accent)" : "transparent",
                  color: active ? "#fff" : fg,
                }}
              >
                {item.label === "Home" ? <HomeGlyph size={16} /> : item.label === "Web-Shooters" ? <StarGlyph size={15} /> : <NodeIcon node={{ type: "dir", name: "", children: {} }} size={16} />}
                {item.label}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <button
            title="Symbiote Containment"
            onClick={() => navigate(TRASH)}
            style={{
              display: "flex", alignItems: "center", gap: 8, textAlign: "left",
              border: "none", cursor: "pointer", borderRadius: 7, padding: "7px 8px", fontSize: 13,
              background: cwd === TRASH ? "var(--yaru-accent)" : "transparent",
              color: cwd === TRASH ? "#fff" : fg,
            }}
          >
            <TrashGlyph size={16} />
            Trash
          </button>
        </div>

        {/* Main pane */}
        <div
          style={{ flex: 1, overflow: "auto", padding: 14 }}
          onMouseDown={e => { if (e.currentTarget === e.target) { setSelected(null); setRenaming(null); } }}
          onContextMenu={e => { if (e.currentTarget === e.target) open(e, backgroundMenuItems); }}
        >
          {items.length === 0 ? (
            <div style={{ color: dim, fontSize: 13, padding: 24, textAlign: "center" }}>This folder is empty</div>
          ) : view === "grid" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignContent: "flex-start" }}>
              {items.map(node => {
                const path = vfs.normalize(node.name, cwd);
                const isSelected = selected === node.name;
                const isRenaming = renaming?.name === node.name;
                return (
                  <div
                    key={node.name}
                    onClick={e => { e.stopPropagation(); setSelected(node.name); }}
                    onDoubleClick={e => { e.stopPropagation(); openNode(node, path); }}
                    onContextMenu={e => { e.stopPropagation(); setSelected(node.name); open(e, itemMenuItems(node, path)); }}
                    style={{
                      width: 92, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "10px 4px", borderRadius: 9, cursor: "default",
                      background: isSelected ? "color-mix(in srgb, var(--yaru-accent) 25%, transparent)" : "transparent",
                      outline: isSelected ? "1px solid var(--yaru-accent)" : "1px solid transparent",
                    }}
                  >
                    <NodeIcon node={node} size={56} />
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renaming.value}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setRenaming({ name: node.name, value: e.target.value })}
                        onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitRename(node); if (e.key === "Escape") cancelRename(); }}
                        onBlur={() => commitRename(node)}
                        style={{ width: "100%", fontSize: 12, textAlign: "center", borderRadius: 4, border: "1px solid var(--yaru-accent)", outline: "none", background: light ? "#fff" : "#1E1926", color: fg }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, textAlign: "center", wordBreak: "break-word", lineHeight: 1.25, maxHeight: "2.5em", overflow: "hidden" }}>
                        {node.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: dim, textAlign: "left" }}>
                  <th style={{ fontWeight: 500, padding: "4px 8px" }}>Name</th>
                  <th style={{ fontWeight: 500, padding: "4px 8px", width: 100 }}>Size</th>
                  <th style={{ fontWeight: 500, padding: "4px 8px", width: 100 }}>Modified</th>
                </tr>
              </thead>
              <tbody>
                {items.map(node => {
                  const path = vfs.normalize(node.name, cwd);
                  const isSelected = selected === node.name;
                  const isRenaming = renaming?.name === node.name;
                  return (
                    <tr
                      key={node.name}
                      onClick={e => { e.stopPropagation(); setSelected(node.name); }}
                      onDoubleClick={e => { e.stopPropagation(); openNode(node, path); }}
                      onContextMenu={e => { e.stopPropagation(); setSelected(node.name); open(e, itemMenuItems(node, path)); }}
                      style={{ background: isSelected ? "color-mix(in srgb, var(--yaru-accent) 22%, transparent)" : "transparent", cursor: "default" }}
                    >
                      <td style={{ padding: "5px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                        <NodeIcon node={node} size={20} />
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renaming.value}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setRenaming({ name: node.name, value: e.target.value })}
                            onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitRename(node); if (e.key === "Escape") cancelRename(); }}
                            onBlur={() => commitRename(node)}
                            style={{ fontSize: 13, borderRadius: 4, border: "1px solid var(--yaru-accent)", outline: "none", background: light ? "#fff" : "#1E1926", color: fg, flex: 1 }}
                          />
                        ) : (
                          <span>{node.name}</span>
                        )}
                      </td>
                      <td style={{ padding: "5px 8px", color: dim }}>{sizeLabel(node)}</td>
                      <td style={{ padding: "5px 8px", color: dim }}>{fakeModified(node.name)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {element}

      {propertiesNode && (
        <PropertiesModal node={propertiesNode} cwd={cwd} theme={theme} onClose={() => setPropertiesNode(null)} />
      )}
    </div>
  );
}

const PropertiesModal: FC<{ node: VfsNode; cwd: string; theme: "dark" | "light"; onClose: () => void }> = ({ node, cwd, theme, onClose }) => {
  const light = theme === "light";
  const bg = light ? "#ffffff" : "#2b2b2b";
  const fg = light ? "#1a1a1a" : "#eeeeee";
  const dim = light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const perms = node.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
  return (
    <div
      onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center" }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{ width: 300, borderRadius: 12, background: bg, color: fg, padding: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <NodeIcon node={node} size={40} />
          <div style={{ fontWeight: 600, fontSize: 14, wordBreak: "break-word" }}>{node.name}</div>
        </div>
        <Row label="Type" value={node.type === "dir" ? "Folder" : `${node.kind} document`} dim={dim} />
        <Row label="Location" value={cwd} dim={dim} />
        <Row label="Size" value={sizeLabel(node)} dim={dim} />
        <Row label="Modified" value={fakeModified(node.name)} dim={dim} />
        <Row label="Permissions" value={perms} dim={dim} mono />
        <button
          onClick={onClose}
          style={{
            marginTop: 14, width: "100%", padding: "8px 0", borderRadius: 8, border: "none",
            background: "var(--yaru-accent)", color: "#fff", fontSize: 13, cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const Row: FC<{ label: string; value: string; dim: string; mono?: boolean }> = ({ label, value, dim, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5, padding: "3px 0" }}>
    <span style={{ color: dim }}>{label}</span>
    <span style={{ fontFamily: mono ? "var(--font-mono)" : undefined, wordBreak: "break-all", textAlign: "right" }}>{value}</span>
  </div>
);
