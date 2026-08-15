import { Suspense, useEffect, useRef, useState, type FC, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useOs } from "../../os/store";
import { getManifest } from "../../os/apps";
import type { OsWindow } from "../../os/types";
import { CloseIcon, MinimizeIcon, MaximizeIcon, RestoreIcon } from "../../ui/icons";
import { HEADER, TOPBAR, DOCK, EDGE, displayRect, type PreviewZone } from "./windowGeometry";

/** GNOME-style indeterminate ring shown while a lazy app chunk loads. */
export const AdwaitaSpinner: FC = () => (
  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration: 0.9 }}
      style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "3px solid rgba(150,150,150,0.25)",
        borderTopColor: "var(--yaru-accent)",
      }}
    />
  </div>
);

const HANDLES: { dir: string; cursor: string; style: React.CSSProperties }[] = [
  { dir: "n", cursor: "ns-resize", style: { top: -EDGE / 2, left: EDGE, right: EDGE, height: EDGE } },
  { dir: "s", cursor: "ns-resize", style: { bottom: -EDGE / 2, left: EDGE, right: EDGE, height: EDGE } },
  { dir: "e", cursor: "ew-resize", style: { right: -EDGE / 2, top: EDGE, bottom: EDGE, width: EDGE } },
  { dir: "w", cursor: "ew-resize", style: { left: -EDGE / 2, top: EDGE, bottom: EDGE, width: EDGE } },
  { dir: "ne", cursor: "nesw-resize", style: { top: -EDGE / 2, right: -EDGE / 2, width: EDGE * 2, height: EDGE * 2 } },
  { dir: "nw", cursor: "nwse-resize", style: { top: -EDGE / 2, left: -EDGE / 2, width: EDGE * 2, height: EDGE * 2 } },
  { dir: "se", cursor: "nwse-resize", style: { bottom: -EDGE / 2, right: -EDGE / 2, width: EDGE * 2, height: EDGE * 2 } },
  { dir: "sw", cursor: "nesw-resize", style: { bottom: -EDGE / 2, left: -EDGE / 2, width: EDGE * 2, height: EDGE * 2 } },
];

interface Props {
  w: OsWindow;
  vw: number;
  vh: number;
  onPreview: (z: PreviewZone | null) => void;
}

const WindowFrame: FC<Props> = ({ w, vw, vh, onPreview }) => {
  const manifest = getManifest(w.appId);
  const theme = useOs(s => s.settings.theme);
  const focusedId = useOs(s => s.focusedId);
  const focusWindow = useOs(s => s.focusWindow);
  const closeWindow = useOs(s => s.closeWindow);
  const minimizeWindow = useOs(s => s.minimizeWindow);
  const toggleMaximize = useOs(s => s.toggleMaximize);
  const snapWindow = useOs(s => s.snapWindow);
  const unsnapWindow = useOs(s => s.unsnapWindow);
  const moveWindow = useOs(s => s.moveWindow);
  const resizeWindow = useOs(s => s.resizeWindow);

  const focused = focusedId === w.id;
  const rect = displayRect(w, vw, vh);
  const rounded = w.mode === "normal";

  // Deferred exit: set the exit intent, THEN remove from the store (via effect)
  // so AnimatePresence sees the correct exit variant on removal.
  const [exitMode, setExitMode] = useState<"min" | "close" | null>(null);
  useEffect(() => {
    if (exitMode === "min") minimizeWindow(w.id);
    else if (exitMode === "close") closeWindow(w.id);
  }, [exitMode, w.id, minimizeWindow, closeWindow]);

  const zoneRef = useRef<PreviewZone | null>(null);
  // Cleanup for an in-flight drag/resize gesture (window listeners), for unmount safety.
  const gestureCleanup = useRef<(() => void) | null>(null);
  // While a drag/resize is live, a full-screen overlay (this cursor) sits on top
  // so the pointer never hits app content — that both blocks native
  // text-selection/drag (which would fire pointercancel and kill the gesture)
  // and shows a consistent cursor.
  const [gestureCursor, setGestureCursor] = useState<string | null>(null);
  useEffect(() => () => gestureCleanup.current?.(), []);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  /* ---- Header drag (move / restore / snap / maximize) ----
     Window-level listeners + a small threshold: a click (or double-click) never
     starts a drag or restores a maximized window; only real movement does. */
  const onHeaderDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    focusWindow(w.id);
    const disp = displayRect(w, vw, vh);
    const startX = e.clientX, startY = e.clientY;
    const propX = disp.w > 0 ? (startX - disp.x) / disp.w : 0.5;
    let started = false;
    let offX = startX - disp.x;
    let offY = startY - disp.y;
    let dragW = w.rect.w;

    const begin = () => {
      // On first real movement, restore a maximized/snapped window under the cursor.
      if (w.mode !== "normal") {
        const restored = w.prevRect ?? { x: disp.x, y: disp.y, w: manifest.defaultSize.w, h: manifest.defaultSize.h };
        offX = propX * restored.w;
        offY = Math.min(startY - disp.y, HEADER);
        dragW = restored.w;
        if (w.mode === "maximized") toggleMaximize(w.id);
        else unsnapWindow(w.id);
      }
      setGestureCursor("grabbing");
      started = true;
    };

    const onMove = (ev: PointerEvent) => {
      if (!started) {
        if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) return;
        begin();
      }
      const nx = clamp(ev.clientX - offX, DOCK - dragW + 120, vw - 60);
      const ny = clamp(ev.clientY - offY, TOPBAR, vh - 40);
      moveWindow(w.id, nx, ny);
      let z: PreviewZone | null = null;
      if (ev.clientY < TOPBAR + 8) z = { kind: "max" };
      else if (ev.clientX < DOCK + 12) z = { kind: "left" };
      else if (ev.clientX > vw - 12) z = { kind: "right" };
      zoneRef.current = z;
      onPreview(z);
    };
    const onUp = () => {
      gestureCleanup.current?.();
      gestureCleanup.current = null;
      setGestureCursor(null);
      const z = zoneRef.current;
      zoneRef.current = null;
      onPreview(null);
      if (!z) return;
      if (z.kind === "max") { if (w.mode !== "maximized") toggleMaximize(w.id); }
      else snapWindow(w.id, z.kind);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    gestureCleanup.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  };

  /* ---- Edge / corner resize (window-level listeners, clamped to minSize) ---- */
  const onResizeDown = (e: ReactPointerEvent, dir: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    focusWindow(w.id);
    const start = { startX: e.clientX, startY: e.clientY, rect: { ...w.rect } };
    const { minSize } = manifest;
    setGestureCursor(HANDLES.find(h => h.dir === dir)?.cursor ?? "default");
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.startX;
      const dy = ev.clientY - start.startY;
      let { x, y, w: ww, h: hh } = start.rect;
      if (dir.includes("e")) ww = start.rect.w + dx;
      if (dir.includes("s")) hh = start.rect.h + dy;
      if (dir.includes("w")) { ww = start.rect.w - dx; x = start.rect.x + dx; }
      if (dir.includes("n")) { hh = start.rect.h - dy; y = start.rect.y + dy; }
      if (ww < minSize.w) { if (dir.includes("w")) x = start.rect.x + (start.rect.w - minSize.w); ww = minSize.w; }
      if (hh < minSize.h) { if (dir.includes("n")) y = start.rect.y + (start.rect.h - minSize.h); hh = minSize.h; }
      resizeWindow(w.id, { x, y, w: ww, h: hh });
    };
    const onUp = () => { gestureCleanup.current?.(); gestureCleanup.current = null; setGestureCursor(null); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    gestureCleanup.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  };

  /* ---- Exit animation target (minimize shrinks toward the dock) ---- */
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const exit = exitMode === "min"
    ? { opacity: 0, scale: 0.1, x: 32 - cx, y: vh / 2 - cy, transition: { duration: 0.25, ease: "easeIn" as const } }
    : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } };

  const headerBg = theme === "light" ? "var(--headerbar-light)" : "var(--headerbar)";
  const titleColor = theme === "light" ? "#2a2a2a" : "#eaeaea";
  const bodyBg = theme === "light" ? "#ffffff" : "#242424";
  const Comp = manifest.component;

  return (
    <>
    {gestureCursor && createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 100000, cursor: gestureCursor }} />,
      document.body,
    )}
    <motion.div
      data-window-id={w.id}
      onPointerDown={() => focusWindow(w.id)}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.2, ease: "easeOut" } }}
      exit={exit}
      style={{
        position: "absolute",
        left: rect.x, top: rect.y, width: rect.w, height: rect.h,
        zIndex: w.z,
        borderRadius: rounded ? 12 : 0,
        pointerEvents: "auto",
        filter: focused ? "none" : "brightness(0.97)",
        boxShadow: focused ? "0 4px 24px rgba(0,0,0,0.55)" : "0 2px 12px rgba(0,0,0,0.35)",
      }}
    >
      {/* Rounded chrome (clips header + content). Kept separate from the frame
          so resize handles can extend past the edges without being clipped. */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        borderRadius: rounded ? 12 : 0, overflow: "hidden",
        outline: "1px solid rgba(255,255,255,0.1)", outlineOffset: -1,
      }}>
        {/* Header bar */}
        <div
          onPointerDown={onHeaderDown}
          onDoubleClick={() => toggleMaximize(w.id)}
          style={{
            height: HEADER, flexShrink: 0,
            background: headerBg,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 8px", cursor: "default", touchAction: "none", userSelect: "none",
          }}
        >
          {/* left spacer keeps title centred against the 3 controls on the right */}
          <div style={{ width: 96, flexShrink: 0 }} />
          <div style={{
            flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontSize: 13, fontWeight: 600, color: titleColor, opacity: focused ? 1 : 0.7,
          }}>
            {manifest.name}
          </div>
          <div style={{ width: 96, flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <WinControl label="Minimize" theme={theme} onClick={() => setExitMode("min")}>
              <MinimizeIcon size={16} />
            </WinControl>
            <WinControl label={w.mode === "maximized" ? "Restore" : "Maximize"} theme={theme} onClick={() => toggleMaximize(w.id)}>
              {w.mode === "maximized" ? <RestoreIcon size={15} /> : <MaximizeIcon size={14} />}
            </WinControl>
            <WinControl label="Close" theme={theme} close onClick={() => setExitMode("close")}>
              <CloseIcon size={16} />
            </WinControl>
          </div>
        </div>

        {/* App content */}
        <div style={{ flex: 1, position: "relative", background: bodyBg, overflow: "hidden" }}>
          <Suspense fallback={<AdwaitaSpinner />}>
            <Comp windowId={w.id} props={w.props} />
          </Suspense>
        </div>
      </div>

      {/* Resize handles (normal windows only) — outside the clip so they can
          be grabbed slightly beyond the window edge, like GNOME. */}
      {w.mode === "normal" && HANDLES.map(h => (
        <div
          key={h.dir}
          onPointerDown={e => onResizeDown(e, h.dir)}
          style={{ position: "absolute", cursor: h.cursor, touchAction: "none", zIndex: 3, ...h.style }}
        />
      ))}
    </motion.div>
    </>
  );
};

/* Circular Yaru window control; close variant turns orange on hover. */
const WinControl: FC<{ label: string; theme: string; close?: boolean; onClick: () => void; children: React.ReactNode }> = ({ label, theme, close, onClick, children }) => {
  const [hover, setHover] = useState(false);
  const base = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";
  const bg = hover ? (close ? "#E95420" : base) : (theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)");
  const color = hover && close ? "#fff" : (theme === "light" ? "#2a2a2a" : "#e6e6e6");
  return (
    <button
      aria-label={label}
      onPointerDown={e => e.stopPropagation()}
      onClick={onClick}
      onDoubleClick={e => e.stopPropagation()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer",
        background: bg, color, display: "grid", placeItems: "center", flexShrink: 0,
        transition: "background 120ms ease",
      }}
    >
      {children}
    </button>
  );
};

export default WindowFrame;
