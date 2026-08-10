import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOs } from "../../os/store";
import { APPS } from "../../os/apps";
import { AppIcon, SearchIcon, GridIcon, CloseIcon } from "../../ui/icons";
import { profile } from "../../content/profile";
import { displayRect, TOPBAR } from "./windowGeometry";
import type { OsWindow } from "../../os/types";

const WORKSPACES = 3;
const THUMB_SCALE = 1 / 14;

const appName = (id: string) => APPS.find(a => a.id === id)?.name ?? id;

/* ------------------------------------------------------------------ *
 * Content search — Apps / Projects / Skills, matched as you type.
 * ------------------------------------------------------------------ */
type Result =
  | { type: "app"; id: string; title: string; subtitle: string }
  | { type: "project"; id: string; title: string; subtitle: string }
  | { type: "skill"; id: string; title: string; subtitle: string };

function buildResults(query: string): Result[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: Result[] = [];

  // Apps (exclude desktop-hidden helpers like evince).
  for (const a of APPS.filter(a => !a.desktopHidden)) {
    if (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)) {
      out.push({ type: "app", id: a.id, title: a.name, subtitle: "Application" });
    }
  }

  // Projects — search name, tagline AND tech arrays (spec: "pytorch" → Deep-Emotion).
  for (const p of profile.projects) {
    const hay = [p.name, p.tagline, ...p.tech].join(" ").toLowerCase();
    if (hay.includes(q)) {
      out.push({ type: "project", id: p.id, title: p.name, subtitle: p.tech.join(" · ") });
    }
  }

  // Skills — languages / frameworks / tools.
  const skillGroups: [string, readonly string[]][] = [
    ["Language", profile.skills.languages],
    ["Framework", profile.skills.frameworks],
    ["Tool", profile.skills.tools],
  ];
  for (const [kind, list] of skillGroups) {
    for (const s of list) {
      if (s.toLowerCase().includes(q)) {
        out.push({ type: "skill", id: s, title: s, subtitle: kind });
      }
    }
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Viewport tracker (mini-rects scale from real window geometry).
 * ------------------------------------------------------------------ */
function useViewport() {
  const [size, setSize] = useState({ vw: window.innerWidth, vh: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

/* ------------------------------------------------------------------ *
 * A single static window card (NOT a live app remount).
 * ------------------------------------------------------------------ */
const WindowCard: FC<{
  w: OsWindow;
  onActivate: () => void;
  onClose: () => void;
}> = ({ w, onActivate, onClose }) => {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18 }}
    >
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", w.id); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onActivate}
      style={{
        position: "relative", width: 240, cursor: "pointer",
        borderRadius: 12, overflow: "hidden",
        background: "#2b2b2b", border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: hover ? "0 12px 34px rgba(0,0,0,0.6)" : "0 8px 22px rgba(0,0,0,0.45)",
        outline: hover ? "2px solid var(--yaru-accent)" : "2px solid transparent",
      }}
    >
      {/* headerbar */}
      <div style={{
        height: 32, background: "#3a3a3a", display: "flex", alignItems: "center",
        padding: "0 10px", gap: 8, borderBottom: "1px solid rgba(0,0,0,0.4)",
      }}>
        <AppIcon app={w.appId} size={16} />
        <span style={{ fontSize: 12, color: "#eee", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {appName(w.appId)}
        </span>
      </div>
      {/* body — big icon snapshot */}
      <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: "#242424" }}>
        <AppIcon app={w.appId} size={64} />
      </div>
      {/* hover close button */}
      {hover && (
        <button
          aria-label={`Close ${appName(w.appId)}`}
          onClick={e => { e.stopPropagation(); onClose(); }}
          style={{
            position: "absolute", top: 6, right: 6, width: 24, height: 24,
            borderRadius: "50%", border: "none", cursor: "pointer",
            background: "rgba(0,0,0,0.7)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <CloseIcon size={14} />
        </button>
      )}
    </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * Workspace strip — 3 thumbnails, drop target for window cards.
 * ------------------------------------------------------------------ */
const WorkspaceStrip: FC<{ vw: number; vh: number }> = ({ vw, vh }) => {
  const windows = useOs(s => s.windows);
  const activeWorkspace = useOs(s => s.activeWorkspace);
  const setWorkspace = useOs(s => s.setWorkspace);
  const moveWindowToWorkspace = useOs(s => s.moveWindowToWorkspace);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const tw = Math.round(vw * THUMB_SCALE);
  const th = Math.round(vh * THUMB_SCALE);

  return (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
      {Array.from({ length: WORKSPACES }, (_, n) => {
        const active = n === activeWorkspace;
        const wins = windows.filter(w => w.workspace === n && w.mode !== "minimized");
        return (
          <button
            key={n}
            onClick={() => setWorkspace(n)}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropTarget(n); }}
            onDragLeave={() => setDropTarget(t => (t === n ? null : t))}
            onDrop={e => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) moveWindowToWorkspace(id, n);
              setDropTarget(null);
            }}
            aria-label={`Workspace ${n + 1}`}
            style={{
              position: "relative", width: tw, height: th, padding: 0, cursor: "pointer",
              borderRadius: 8, background: "rgba(0,0,0,0.35)",
              border: "none",
              outline: active
                ? "2px solid var(--yaru-accent)"
                : dropTarget === n
                  ? "2px dashed var(--yaru-accent)"
                  : "1px solid rgba(255,255,255,0.18)",
              boxShadow: active ? "0 0 0 3px rgba(233,84,32,0.25)" : "none",
              overflow: "hidden",
            }}
          >
            {wins.map(w => {
              const r = displayRect(w, vw, vh);
              return (
                <div
                  key={w.id}
                  style={{
                    position: "absolute",
                    left: r.x * THUMB_SCALE,
                    top: (r.y - TOPBAR) * THUMB_SCALE,
                    width: Math.max(4, r.w * THUMB_SCALE),
                    height: Math.max(4, r.h * THUMB_SCALE),
                    background: "#4a4a4a",
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: 2,
                  }}
                />
              );
            })}
          </button>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * App grid page.
 * ------------------------------------------------------------------ */
const AppGrid: FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const apps = APPS.filter(a => !a.desktopHidden);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 28,
      maxWidth: 820, margin: "0 auto", padding: "0 20px",
    }}>
      {apps.map(a => (
        <button
          key={a.id}
          onClick={() => onOpen(a.id)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            background: "transparent", border: "none", cursor: "pointer", padding: 10,
            borderRadius: 14,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <AppIcon app={a.id} size={64} />
          <span style={{ fontSize: 13, color: "#fff", textAlign: "center", lineHeight: 1.2 }}>{a.name}</span>
        </button>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Search results panel.
 * ------------------------------------------------------------------ */
const SearchResults: FC<{ results: Result[]; onSelect: (r: Result) => void }> = ({ results, onSelect }) => {
  const groups: [string, Result["type"]][] = [
    ["Apps", "app"], ["Projects", "project"], ["Skills", "skill"],
  ];
  if (results.length === 0) {
    return <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 15, pointerEvents: "none" }}>No results</div>;
  }
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      {groups.map(([label, type]) => {
        const items = results.filter(r => r.type === type);
        if (items.length === 0) return null;
        return (
          <div key={type}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map(r => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => onSelect(r)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                    padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "rgba(255,255,255,0.06)", color: "#fff", width: "100%",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                >
                  <AppIcon app={r.type === "app" ? r.id : r.type === "project" ? "files" : "settings"} size={34} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{r.title}</span>
                    <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Overview — mounted only while overviewOpen (fresh state each open).
 * ------------------------------------------------------------------ */
const Overview: FC = () => {
  const windows = useOs(s => s.windows);
  const activeWorkspace = useOs(s => s.activeWorkspace);
  const setOverview = useOs(s => s.setOverview);
  const focusWindow = useOs(s => s.focusWindow);
  const closeWindow = useOs(s => s.closeWindow);
  const openApp = useOs(s => s.openApp);
  const wallpaper = useOs(s => s.settings.wallpaper);
  const { vw, vh } = useViewport();

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"windows" | "grid">("windows");
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => setOverview(false);

  // Autofocus the search bar on open.
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => buildResults(query), [query]);
  const searching = query.trim().length > 0;

  const activate = (r: Result) => {
    if (r.type === "app") openApp(r.id);
    else if (r.type === "project") openApp("files", { path: `~/Projects/${r.id}` });
    else openApp("settings");
    close();
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) { e.preventDefault(); activate(results[0]); }
  };

  const cards = windows.filter(w => w.workspace === activeWorkspace && w.mode !== "minimized");

  const backdropClose = (e: React.MouseEvent) => { if (e.target === e.currentTarget) close(); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ position: "absolute", inset: 0, zIndex: 300, fontFamily: "var(--font-ui)" }}
    >
      {/* Darkened, slightly zoomed wallpaper backdrop */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1.02 }}
        exit={{ scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onMouseDown={close}
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(0.4)",
        }}
      />

      {/* Foreground content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onMouseDown={backdropClose}
        style={{
          position: "absolute", inset: 0, paddingTop: 40,
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Search bar */}
        <div onMouseDown={e => e.stopPropagation()} style={{ display: "flex", justifyContent: "center", padding: "16px 0 10px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            width: 420, maxWidth: "80%", padding: "10px 16px",
            borderRadius: 999, background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
          }}>
            <SearchIcon size={18} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); if (e.target.value) setMode("windows"); }}
              onKeyDown={onInputKey}
              placeholder="Type to search"
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                color: "#fff", fontSize: 15, fontFamily: "var(--font-ui)",
              }}
            />
          </div>
        </div>

        {/* Middle — search results OR window grid OR app grid */}
        <div
          onMouseDown={backdropClose}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: "10px 20px" }}
        >
          {searching ? (
            <SearchResults results={results} onSelect={activate} />
          ) : mode === "grid" ? (
            <AppGrid onOpen={id => { openApp(id); close(); }} />
          ) : cards.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, pointerEvents: "none" }}>No open windows on this workspace</div>
          ) : (
            <div onMouseDown={e => e.stopPropagation()} style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", maxWidth: 900 }}>
              <AnimatePresence>
                {cards.map(w => (
                  <WindowCard
                    key={w.id}
                    w={w}
                    onActivate={() => { focusWindow(w.id); close(); }}
                    onClose={() => closeWindow(w.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom — workspace strip + grid toggle */}
        {!searching && (
          <div onMouseDown={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingBottom: 22 }}>
            {mode === "windows" && <WorkspaceStrip vw={vw} vh={vh} />}
            <button
              onClick={() => setMode(m => (m === "grid" ? "windows" : "grid"))}
              aria-label={mode === "grid" ? "Show windows" : "Show applications"}
              style={{
                width: 44, height: 44, borderRadius: 12, cursor: "pointer",
                border: "none", color: "#fff",
                background: mode === "grid" ? "var(--yaru-accent)" : "rgba(255,255,255,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <GridIcon size={22} />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * Activities — mount point; renders the overview while open.
 * ------------------------------------------------------------------ */
const Activities: FC = () => {
  const overviewOpen = useOs(s => s.overviewOpen);
  return (
    <AnimatePresence>
      {overviewOpen && <Overview key="overview" />}
    </AnimatePresence>
  );
};

export default Activities;
