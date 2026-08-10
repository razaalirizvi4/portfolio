import { useEffect, useRef, useState, type FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOs } from "../../os/store";
import { getManifest } from "../../os/apps";
import { AppIcon } from "../../ui/icons";

/**
 * GNOME Alt+Tab affordance. Browsers swallow the real Alt+Tab, so we surface
 * an on-screen strip while Alt is held; Tab / Alt+Arrow cycles, release focuses.
 */
const WindowSwitcher: FC = () => {
  const windows = useOs(s => s.windows);
  const focusWindow = useOs(s => s.focusWindow);
  const restoreWindow = useOs(s => s.restoreWindow);

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);

  // Snapshot of the candidate list captured when Alt goes down. Refs keep the
  // key handlers stable and free of stale-closure bugs.
  const listRef = useRef<string[]>([]);
  const selRef = useRef(0);
  const openRef = useRef(false);

  const commit = () => {
    const ids = listRef.current;
    const id = ids[selRef.current];
    if (id) { restoreWindow(id); focusWindow(id); }
    openRef.current = false;
    setOpen(false);
  };

  useEffect(() => {
    const currentList = () =>
      useOs.getState().windows
        .filter(w => w.workspace === useOs.getState().activeWorkspace)
        .sort((a, b) => b.z - a.z)
        .map(w => w.id);

    const move = (delta: number) => {
      const n = listRef.current.length;
      if (n === 0) return;
      const next = (selRef.current + delta + n) % n;
      selRef.current = next;
      setSel(next);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        if (!openRef.current) {
          const ids = currentList();
          if (ids.length === 0) return;
          listRef.current = ids;
          // Preselect the next window (like GNOME), falling back to the first.
          selRef.current = ids.length > 1 ? 1 : 0;
          setSel(selRef.current);
          openRef.current = true;
          setOpen(true);
        }
        e.preventDefault();
        return;
      }
      if (!openRef.current) return;
      if (e.key === "Tab" || e.key === "ArrowRight") { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
      else if (e.key === "Escape") { e.preventDefault(); openRef.current = false; setOpen(false); }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" && openRef.current) { e.preventDefault(); commit(); }
    };

    // If focus leaves the page while Alt is held, don't get stuck open.
    const onBlur = () => { if (openRef.current) { openRef.current = false; setOpen(false); } };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ids = listRef.current;
  const entries = ids.map(id => windows.find(w => w.id === id)).filter((w): w is NonNullable<typeof w> => !!w);

  return (
    <AnimatePresence>
      {open && entries.length > 0 && (
        <motion.div
          key="switcher"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.12 }}
          style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            zIndex: 500, display: "flex", gap: 8, padding: 14,
            background: "rgba(30,30,30,0.92)", borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)", pointerEvents: "auto",
          }}
        >
          {entries.map((w, i) => {
            const active = i === sel;
            return (
              <button
                key={w.id}
                onMouseEnter={() => { selRef.current = i; setSel(i); }}
                onClick={() => { selRef.current = i; commit(); }}
                aria-label={getManifest(w.appId).name}
                style={{
                  width: 92, height: 92, border: "none", cursor: "pointer",
                  borderRadius: 12, background: active ? "rgba(255,255,255,0.16)" : "transparent",
                  outline: active ? "2px solid var(--yaru-accent)" : "2px solid transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                <AppIcon app={w.appId} size={56} />
              </button>
            );
          })}
          <div style={{
            position: "absolute", bottom: -30, left: 0, right: 0, textAlign: "center",
            color: "#fff", fontSize: 13, textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            pointerEvents: "none",
          }}>
            {entries[sel] ? getManifest(entries[sel].appId).name : ""}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WindowSwitcher;
