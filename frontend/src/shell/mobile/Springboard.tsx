import { useEffect, useRef, useState, type FC } from "react";
import { motion } from "framer-motion";
import { APPS } from "../../os/apps";
import { AppIcon } from "../../ui/icons";
import { IOS_FONT } from "./IosStatusBar";

export type OpenApp = (appId: string, title: string, props?: Record<string, unknown>) => void;

/** Dock apps (id, iOS-facing label, launch props). */
const DOCK: { id: string; label: string; props?: Record<string, unknown> }[] = [
  { id: "firefox", label: "Safari" },
  { id: "terminal", label: "Terminal" },
  { id: "files", label: "Files" },
  { id: "evince", label: "Resume", props: { url: "/resume.pdf" } },
];

const DOCK_IDS = new Set(DOCK.map(d => d.id));
const PAGE_SIZE = 8; // 2 rows × 4 columns per springboard page

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** iOS squircle: wrap the shared Yaru AppIcon in a ~22% rounded-square mask. */
const AppTile: FC<{ app: string; size?: number }> = ({ app, size = 60 }) => {
  const icon = Math.round(size / 0.92); // scale so the icon's inner tile fills the mask
  const off = -(icon - size) / 2;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.2237, overflow: "hidden",
      position: "relative", boxShadow: "0 4px 12px rgba(0,0,0,0.28)", flexShrink: 0,
    }}>
      <div style={{ position: "absolute", left: off, top: off }}>
        <AppIcon app={app} size={icon} />
      </div>
    </div>
  );
};

interface IconButtonProps {
  app: { id: string; name: string; props?: Record<string, unknown> };
  label: string;
  showLabel?: boolean;
  jiggle: boolean;
  onOpen: OpenApp;
  onExitJiggle: () => void;
  onEnterJiggle: () => void;
  onRemove: () => void;
}

const IconButton: FC<IconButtonProps> = ({ app, label, showLabel = true, jiggle, onOpen, onExitJiggle, onEnterJiggle, onRemove }) => {
  const pressTimer = useRef<number | null>(null);

  const startPress = () => {
    pressTimer.current = window.setTimeout(() => { onEnterJiggle(); pressTimer.current = null; }, 500);
  };
  const cancelPress = () => {
    if (pressTimer.current !== null) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  };
  useEffect(() => () => cancelPress(), []);

  const handleClick = () => {
    if (jiggle) { onExitJiggle(); return; }
    onOpen(app.id, label, app.props);
  };

  return (
    <motion.div
      animate={jiggle ? { rotate: [-2.2, 2.2, -2.2] } : { rotate: 0 }}
      transition={jiggle ? { repeat: Infinity, duration: 0.28, ease: "easeInOut" } : { duration: 0.15 }}
      style={{ position: "relative", width: 76, display: "flex", justifyContent: "center" }}
    >
      <button
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={e => e.preventDefault()}
        style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          fontFamily: IOS_FONT, WebkitTapHighlightColor: "transparent",
        }}
      >
        <AppTile app={app.id} />
        {showLabel && (
          <span style={{
            fontSize: 11.5, fontWeight: 400, color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.6)", maxWidth: 74,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {label}
          </span>
        )}
      </button>
      {jiggle && (
        <button
          aria-label={`Remove ${label}`}
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{
            position: "absolute", top: -4, left: 6, width: 22, height: 22, borderRadius: "50%",
            border: "none", cursor: "pointer", background: "rgba(60,60,60,0.95)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          ×
        </button>
      )}
    </motion.div>
  );
};

/** iOS home screen: paged 4-column icon grid, page dots, and a blurred dock. */
const Springboard: FC<{ onOpen: OpenApp }> = ({ onOpen }) => {
  const gridApps = APPS.filter(a => !a.desktopHidden && !DOCK_IDS.has(a.id));
  const pages = chunk(gridApps, PAGE_SIZE);
  const [page, setPage] = useState(0);
  const [jiggle, setJiggle] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => () => { if (toastTimer.current !== null) clearTimeout(toastTimer.current); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <div
      onClick={() => { if (jiggle) setJiggle(false); }}
      style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        overflow: "hidden", fontFamily: IOS_FONT,
      }}
    >
      {/* Paged icon grid */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <motion.div
          drag={pages.length > 1 ? "x" : false}
          dragConstraints={{ left: -(pages.length - 1) * width, right: 0 }}
          dragElastic={0.12}
          animate={{ x: -page * width }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60 && page < pages.length - 1) setPage(p => p + 1);
            else if (info.offset.x > 60 && page > 0) setPage(p => p - 1);
          }}
          style={{ display: "flex", height: "100%", width: pages.length * width }}
        >
          {pages.map((chunkApps, pi) => (
            <div
              key={pi}
              style={{
                width, flexShrink: 0, padding: "28px 16px 8px",
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                gridAutoRows: "min-content", rowGap: 22, columnGap: 4,
                justifyItems: "center", alignContent: "start",
              }}
            >
              {chunkApps.map(a => (
                <IconButton
                  key={a.id}
                  app={a}
                  label={a.name}
                  jiggle={jiggle}
                  onOpen={onOpen}
                  onEnterJiggle={() => setJiggle(true)}
                  onExitJiggle={() => setJiggle(false)}
                  onRemove={() => showToast("App Store refunds not available.")}
                />
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Page dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 7, padding: "4px 0 14px" }}>
        {pages.map((_, i) => (
          <span
            key={i}
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: i === page ? "#fff" : "rgba(255,255,255,0.4)",
            }}
          />
        ))}
      </div>

      {/* Dock */}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          padding: "14px 12px", borderRadius: 34,
          background: "rgba(255,255,255,0.16)",
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.14)",
        }}>
          {DOCK.map(d => (
            <IconButton
              key={d.id}
              app={{ id: d.id, name: d.label, props: d.props }}
              label={d.label}
              showLabel={false}
              jiggle={jiggle}
              onOpen={onOpen}
              onEnterJiggle={() => setJiggle(true)}
              onExitJiggle={() => setJiggle(false)}
              onRemove={() => showToast("App Store refunds not available.")}
            />
          ))}
        </div>
      </div>

      {/* Home indicator */}
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
        <div style={{ width: 134, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.85)" }} />
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute", bottom: 130, left: "50%", transform: "translateX(-50%)",
            padding: "10px 18px", borderRadius: 18, whiteSpace: "nowrap",
            background: "rgba(30,30,30,0.92)", color: "#fff", fontSize: 13,
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 20,
          }}
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
};

export default Springboard;
