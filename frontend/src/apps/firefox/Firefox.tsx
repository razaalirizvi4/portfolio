import { useCallback, useEffect, useRef, useState, type FC } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { SITES, resolveUrl, BrowserContext, type BrowserApi } from "../../content/fakeInternet";

/* ------------------------------------------------------------------ *
 * Firefox — authentically Firefox chrome (NOT GNOME Web) wrapped
 * around the fake internet in ../../content/fakeInternet.
 *
 * Tab strip (rounded-top tabs + favicon + × + "＋"), a toolbar row
 * (back/forward/reload + awesome-bar with padlock), and a content
 * area that renders SITES[key].component. Each tab keeps its own
 * { history: string[], pos } so back/forward are independent.
 * ------------------------------------------------------------------ */

const NEW_TAB = "about:newtab";

interface Tab {
  id: string;
  history: string[];
  pos: number;
}

let tabSeq = 0;
const newTabId = () => `ff-tab-${++tabSeq}`;

const makeTab = (start = NEW_TAB): Tab => ({ id: newTabId(), history: [start], pos: 0 });

/* ----- small chrome glyphs (Firefox toolbar) --------------------- */

const Arrow: FC<{ dir: "left" | "right" }> = ({ dir }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === "right" ? "scaleX(-1)" : undefined }}>
    <polyline points="15,18 9,12 15,6" />
  </svg>
);
const ReloadGlyph: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11a8 8 0 1 0-1.9 5.2" />
    <polyline points="20,5 20,11 14,11" />
  </svg>
);
const Padlock: FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
  </svg>
);

/* Per-site favicon dot. */
const Favicon: FC<{ entry: string }> = ({ entry }) => {
  const host = entry === NEW_TAB ? "" : entry.replace(/^https?:\/\//, "").split("/")[0];
  let color = "#E95420";
  if (host.startsWith("dailybugle")) color = "#b11313";
  else if (host.startsWith("nba")) color = "#1d428a";
  else if (host.startsWith("raza")) color = "#E95420";
  if (host.startsWith("github")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="#c9d1d9" style={{ flexShrink: 0 }}>
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    );
  }
  return <span style={{ width: 12, height: 12, borderRadius: 3, background: host ? color : "#8a8a8a", flexShrink: 0 }} aria-hidden />;
};

/* ----- content pages that live in the chrome (new tab / error) --- */

const NewTabPage: FC<{ onGo: (u: string) => void }> = ({ onGo }) => {
  const [q, setQ] = useState("");
  const shortcuts: { label: string; url: string; color: string }[] = [
    { label: "raza.dev", url: "raza.dev", color: "#E95420" },
    { label: "GitHub", url: "github.com/razaalirizvi4", color: "#24292f" },
    { label: "Daily Bugle", url: "dailybugle.com", color: "#b11313" },
    { label: "NBA Scores", url: "nba.com/scores", color: "#1d428a" },
  ];
  return (
    <div style={{ height: "100%", background: "#f9f9fb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "12vh", fontFamily: "'Ubuntu', system-ui, sans-serif", color: "#20123a" }}>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5, marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
        <FoxMark size={34} /> Firefox
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (q.trim()) onGo(q); }}
        style={{ width: "min(560px, 80%)", display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #d7d7de", borderRadius: 999, padding: "10px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8aa0" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6" /><line x1="15.5" y1="15.5" x2="20" y2="20" /></svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the web, or type a site (try dailybugle.com)"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 15, background: "transparent", color: "#20123a" }}
        />
      </form>
      <div style={{ display: "flex", gap: 18, marginTop: 34, flexWrap: "wrap", justifyContent: "center", maxWidth: 560 }}>
        {shortcuts.map((s) => (
          <button
            key={s.url}
            onClick={() => onGo(s.url)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", font: "inherit", color: "#4a4460" }}
          >
            <span style={{ width: 60, height: 60, borderRadius: 14, background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              {s.label.charAt(0)}
            </span>
            <span style={{ fontSize: 12.5 }}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ErrorPage: FC<{ url: string; onRetry: () => void }> = ({ url, onRetry }) => (
  <div style={{ height: "100%", background: "#f9f9fb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Ubuntu', system-ui, sans-serif", color: "#20123a", padding: 32 }}>
    <div style={{ maxWidth: 520 }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>&#128533;</div>
      <h1 style={{ fontSize: 26, margin: "0 0 12px", fontWeight: 700 }}>Hmm. We&apos;re having trouble finding that site.</h1>
      <p style={{ fontSize: 15, color: "#5a5470", lineHeight: 1.6, margin: "0 0 8px" }}>
        We can&apos;t connect to the server at <strong style={{ color: "#20123a" }}>{url}</strong>.
      </p>
      <p style={{ fontSize: 15, color: "#5a5470", lineHeight: 1.6, margin: "0 0 24px" }}>
        Did you make a typo? It happens to the best of us. Not to Spider-Man though.
      </p>
      <button
        onClick={onRetry}
        style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#0061e0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
      >
        Try Again
      </button>
    </div>
  </div>
);

const FoxMark: FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
    <circle cx="50" cy="52" r="30" fill="#E95420" />
    <path d="M50 20 a30 30 0 0 1 28 18 a20 20 0 0 0 -25 -8 a18 18 0 0 1 -3 -10z" fill="#FFB144" />
    <path d="M50 20 a30 30 0 0 0 -26 44 a20 20 0 0 1 8 -28 a15 15 0 0 0 18 -16z" fill="#FF7A2F" />
  </svg>
);

/* ================================================================== */

const Firefox: FC<AppProps> = () => {
  const osNotify = useOs((s) => s.notify);
  const [tabs, setTabs] = useState<Tab[]>(() => [makeTab("raza.dev")]);
  const [activeId, setActiveId] = useState<string>(() => tabs[0].id);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [omni, setOmni] = useState("raza.dev");
  const [omniFocused, setOmniFocused] = useState(false);
  const omniRef = useRef<HTMLInputElement>(null);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const current = active ? active.history[active.pos] : NEW_TAB;
  const canBack = active ? active.pos > 0 : false;
  const canFwd = active ? active.pos < active.history.length - 1 : false;

  // keep the awesome-bar in sync with the active tab's location (unless editing)
  useEffect(() => {
    if (!omniFocused) setOmni(current === NEW_TAB ? "" : current);
  }, [current, activeId, omniFocused]);

  const updateActive = useCallback(
    (fn: (t: Tab) => Tab) => setTabs((ts) => ts.map((t) => (t.id === activeId ? fn(t) : t))),
    [activeId]
  );

  const navigate = useCallback(
    (input: string) => {
      const r = resolveUrl(input);
      if ("external" in r) {
        window.open(r.external, "_blank", "noopener,noreferrer");
        return;
      }
      const entry = "key" in r ? r.key : input.trim();
      updateActive((t) => {
        const hist = t.history.slice(0, t.pos + 1);
        if (hist[hist.length - 1] === entry) return t; // no-op re-nav
        hist.push(entry);
        return { ...t, history: hist, pos: hist.length - 1 };
      });
    },
    [updateActive]
  );

  const browserApi: BrowserApi = {
    navigate,
    notify: (title, body) => osNotify("firefox", title, body),
    location: current,
  };

  const back = () => updateActive((t) => (t.pos > 0 ? { ...t, pos: t.pos - 1 } : t));
  const forward = () => updateActive((t) => (t.pos < t.history.length - 1 ? { ...t, pos: t.pos + 1 } : t));
  const reload = () => setReloadNonce((n) => n + 1);

  const addTab = () => {
    const t = makeTab(NEW_TAB);
    setTabs((ts) => [...ts, t]);
    setActiveId(t.id);
    setOmni("");
    setTimeout(() => omniRef.current?.focus(), 0);
  };

  const closeTab = (id: string) => {
    setTabs((ts) => {
      const idx = ts.findIndex((t) => t.id === id);
      const next = ts.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh = makeTab(NEW_TAB);
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        const pick = next[Math.min(idx, next.length - 1)];
        setActiveId(pick.id);
      }
      return next;
    });
  };

  const submitOmni = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(omni);
    omniRef.current?.blur();
    setOmniFocused(false);
  };

  const tabTitle = (t: Tab): string => {
    const loc = t.history[t.pos];
    if (loc === NEW_TAB) return "New Tab";
    const r = resolveUrl(loc);
    if ("key" in r) return SITES[r.key].title;
    return "Problem loading page";
  };

  /* render current page */
  let page: React.ReactNode;
  if (current === NEW_TAB) {
    page = <NewTabPage onGo={navigate} />;
  } else {
    const r = resolveUrl(current);
    if ("key" in r) {
      const Comp = SITES[r.key].component;
      page = <Comp />;
    } else {
      page = <ErrorPage url={current} onRetry={() => navigate(current)} />;
    }
  }

  const isNewTab = current === NEW_TAB;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f0f0f4", fontFamily: "'Ubuntu', system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`@keyframes bugle-spin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}`}</style>

      {/* tab strip */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, background: "#dedee3", padding: "6px 6px 0", flexShrink: 0 }}>
        {tabs.map((t) => {
          const activeTab = t.id === activeId;
          return (
            <div
              key={t.id}
              onClick={() => setActiveId(t.id)}
              title={tabTitle(t)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                maxWidth: 200,
                minWidth: 120,
                padding: "8px 10px",
                borderRadius: "8px 8px 0 0",
                background: activeTab ? "#f0f0f4" : "transparent",
                cursor: "pointer",
                position: "relative",
                color: "#20123a",
              }}
            >
              <Favicon entry={t.history[t.pos]} />
              <span style={{ flex: 1, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: activeTab ? "#15141a" : "#5a5470" }}>
                {tabTitle(t)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
                aria-label="Close tab"
                style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "transparent", color: "#6a6478", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, lineHeight: 1 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                &#10005;
              </button>
            </div>
          );
        })}
        <button
          onClick={addTab}
          aria-label="New tab"
          style={{ width: 30, height: 30, marginBottom: 4, borderRadius: 6, border: "none", background: "transparent", color: "#20123a", cursor: "pointer", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          &#43;
        </button>
      </div>

      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#f0f0f4", borderBottom: "1px solid #d0d0d8", flexShrink: 0 }}>
        <ToolBtn onClick={back} disabled={!canBack} label="Back"><Arrow dir="left" /></ToolBtn>
        <ToolBtn onClick={forward} disabled={!canFwd} label="Forward"><Arrow dir="right" /></ToolBtn>
        <ToolBtn onClick={reload} label="Reload"><ReloadGlyph /></ToolBtn>

        <form onSubmit={submitOmni} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${omniFocused ? "#0061e0" : "#d0d0d8"}`, borderRadius: 999, padding: "6px 14px", boxShadow: omniFocused ? "0 0 0 2px rgba(0,97,224,0.2)" : "none" }}>
          <span style={{ color: isNewTab ? "#b0b0bb" : "#6a8a6a", display: "flex" }}><Padlock /></span>
          <input
            ref={omniRef}
            value={omni}
            onChange={(e) => setOmni(e.target.value)}
            onFocus={() => setOmniFocused(true)}
            onBlur={() => setOmniFocused(false)}
            placeholder="Search or enter address"
            spellCheck={false}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#15141a" }}
          />
        </form>
      </div>

      {/* content */}
      <div key={`${activeId}:${current}:${reloadNonce}`} style={{ flex: 1, overflow: "auto", background: "#fff", position: "relative" }}>
        <BrowserContext.Provider value={browserApi}>{page}</BrowserContext.Provider>
      </div>
    </div>
  );
};

const ToolBtn: FC<{ onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }> = ({ onClick, disabled, label, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    style={{
      width: 32,
      height: 32,
      borderRadius: 8,
      border: "none",
      background: "transparent",
      color: disabled ? "#c0c0c8" : "#4a4458",
      cursor: disabled ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "rgba(0,0,0,0.07)"; }}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    {children}
  </button>
);

export default Firefox;
