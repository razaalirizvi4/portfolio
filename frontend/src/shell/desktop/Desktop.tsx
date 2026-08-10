import { useEffect, useRef, useState, type FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOs } from "../../os/store";
import { AppIcon } from "../../ui/icons";
import TopBar from "./TopBar";
import Dock from "./Dock";
import WindowLayer from "./WindowLayer";
import WindowSwitcher from "./WindowSwitcher";
import Activities from "./Activities";
import { useContextMenu } from "./ContextMenu";

/* ------------------------------------------------------------------ *
 * Desktop icons — top-right column.
 * ------------------------------------------------------------------ */
interface DeskIcon { id: string; label: string; icon: string; open: () => void }

const DesktopIcons: FC = () => {
  const openApp = useOs(s => s.openApp);
  const [selected, setSelected] = useState<string | null>(null);

  const icons: DeskIcon[] = [
    { id: "home", label: "Home", icon: "files", open: () => openApp("files") },
    { id: "resume", label: "resume.pdf", icon: "evince", open: () => openApp("evince", { url: "/resume.pdf" }) },
    { id: "trash", label: "Trash", icon: "trash", open: () => openApp("files", { path: "~/.local/Trash" }) },
  ];

  return (
    <div
      // Clicking empty desktop clears selection (right-click menu handled by parent).
      onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}
      style={{
        position: "absolute", top: 40, right: 12, bottom: 12,
        display: "flex", flexDirection: "column", gap: 6, zIndex: 2,
        alignItems: "flex-end",
      }}
    >
      {icons.map(ic => (
        <button
          key={ic.id}
          onClick={e => { e.stopPropagation(); setSelected(ic.id); }}
          onDoubleClick={() => ic.open()}
          style={{
            width: 88, padding: "8px 4px", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            borderRadius: 10, background: selected === ic.id ? "rgba(233,84,32,0.25)" : "transparent",
            outline: selected === ic.id ? "1px solid var(--yaru-accent)" : "1px solid transparent",
          }}
        >
          <AppIcon app={ic.icon} size={48} />
          <span style={{
            fontSize: 12, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            textAlign: "center", lineHeight: 1.2,
          }}>
            {ic.label}
          </span>
        </button>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Toasts — bottom-centre stack, auto-dismiss after 4s.
 * ------------------------------------------------------------------ */
const TOAST_MS = 4000;

const Toasts: FC = () => {
  const notifications = useOs(s => s.notifications);
  const dismiss = useOs(s => s.dismissNotification);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    for (const n of notifications) {
      if (!timers.current.has(n.id)) {
        const t = window.setTimeout(() => {
          dismiss(n.id);
          timers.current.delete(n.id);
        }, TOAST_MS);
        timers.current.set(n.id, t);
      }
    }
  }, [notifications, dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div style={{
      position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 400,
      pointerEvents: "none",
    }}>
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={() => dismiss(n.id)}
            style={{
              pointerEvents: "auto", cursor: "pointer",
              display: "flex", gap: 12, alignItems: "flex-start",
              minWidth: 300, maxWidth: 420, padding: "12px 16px",
              background: "rgba(40,40,40,0.96)", color: "#fff",
              borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ flexShrink: 0 }}><AppIcon app={n.appId} size={28} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{n.body}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Konami basketball rain — ↑↑↓↓←→←→BA
 * ------------------------------------------------------------------ */
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

const Basketball: FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#E8863C" stroke="#7A3B12" strokeWidth="1.5" />
    <g stroke="#7A3B12" strokeWidth="1.5" fill="none">
      <line x1="20" y1="2" x2="20" y2="38" />
      <line x1="2" y1="20" x2="38" y2="20" />
      <path d="M6 7 C16 16 16 24 6 33" />
      <path d="M34 7 C24 16 24 24 34 33" />
    </g>
  </svg>
);

interface Ball { id: number; left: number; top: number; delay: number; duration: number; size: number }

/** Generates the falling-ball descriptors (called from the keydown handler, not render). */
function makeBalls(): Ball[] {
  return Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 94,
    top: 24 + Math.random() * 62,
    delay: Math.random() * 0.8,
    duration: 1.6 + Math.random() * 1,
    size: 26 + Math.random() * 18,
  }));
}

const BasketballRain: FC<{ balls: Ball[] }> = ({ balls }) => {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 250, pointerEvents: "none", overflow: "hidden" }}>
      {balls.map(b => (
        <div key={`t-${b.id}`}>
          {/* web thread the ball settles onto */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.22 }}
            transition={{ delay: b.delay + b.duration - 0.2, duration: 0.4 }}
            style={{
              position: "absolute", left: 0, right: 0, top: `calc(${b.top}vh + ${b.size / 2}px)`,
              height: 1, background: "#fff",
            }}
          />
          {/* falling, decelerating ball */}
          <motion.div
            initial={{ top: "-8vh" }}
            animate={{ top: `${b.top}vh` }}
            transition={{ delay: b.delay, duration: b.duration, ease: [0.15, 0.75, 0.3, 1] }}
            style={{ position: "absolute", left: `${b.left}%` }}
          >
            <Basketball size={b.size} />
          </motion.div>
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Desktop shell.
 * ------------------------------------------------------------------ */
export default function Desktop() {
  const wallpaper = useOs(s => s.settings.wallpaper);
  const theme = useOs(s => s.settings.theme);
  const accent = useOs(s => s.settings.accent);
  const openApp = useOs(s => s.openApp);
  const { open: openContext, element: contextElement } = useContextMenu();

  const [rainId, setRainId] = useState(0);
  const [balls, setBalls] = useState<Ball[]>([]);
  const konamiIdx = useRef(0);
  const rainTimer = useRef<number | null>(null);

  // Apply theme + accent to the document (Settings / QuickSettings drive these).
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--yaru-accent", accent);
  }, [theme, accent]);

  // Global keyboard: Ctrl+Alt+T → terminal; Konami → basketball rain.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        openApp("terminal");
        return;
      }
      const expected = KONAMI[konamiIdx.current];
      if (e.key === expected || e.key.toLowerCase() === expected) {
        konamiIdx.current += 1;
        if (konamiIdx.current === KONAMI.length) {
          konamiIdx.current = 0;
          setRainId(id => id + 1);
          setBalls(makeBalls());
          if (rainTimer.current !== null) clearTimeout(rainTimer.current);
          rainTimer.current = window.setTimeout(() => setBalls([]), 8000);
        }
      } else {
        konamiIdx.current = e.key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (rainTimer.current !== null) clearTimeout(rainTimer.current);
    };
  }, [openApp]);

  const desktopMenu = (e: React.MouseEvent) => {
    openContext(e, [
      { label: "Change Background…", onClick: () => openApp("settings") },
      { label: "Display Settings…", onClick: () => openApp("settings") },
      { separator: true },
      { label: "Open Terminal", onClick: () => openApp("terminal") },
    ]);
  };

  return (
    <div
      onContextMenu={desktopMenu}
      style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000", fontFamily: "var(--font-ui)" }}
    >
      {/* Wallpaper (crossfades on change) */}
      <AnimatePresence>
        <motion.img
          key={wallpaper}
          src={wallpaper}
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AnimatePresence>

      {/* Desktop icons */}
      <DesktopIcons />

      {/* WindowLayer mounts here (Task 9) */}
      <WindowLayer />
      <WindowSwitcher />

      {/* Dock + Top bar */}
      <Dock />
      <TopBar />

      {/* Toasts */}
      <Toasts />

      {/* Konami rain */}
      {balls.length > 0 && <BasketballRain key={rainId} balls={balls} />}

      {/* Activities overlay mounts here (Task 10) */}
      <Activities />

      {/* Desktop right-click menu */}
      {contextElement}
    </div>
  );
}
