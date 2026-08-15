import { useEffect, useRef, useState, type FC } from "react";
import { animate, motion } from "framer-motion";
import { useOs } from "../../../os/store";
import { HEADER, displayRect } from "../windowGeometry";

/* ------------------------------------------------------------------ *
 * Thwip — the `thwip` terminal command (and any other fireEffect("thwip")
 * caller) fires a white web-line from the top-right corner of the
 * viewport to the focused window's headerbar. Once the line lands, the
 * window does a quick grab-shake and gets yanked off toward the corner,
 * then minimizes (reversible — it just goes back to the dock).
 *
 * With no focused window, the line just snaps near the empty top-right
 * corner with a small "*thwip*" text puff — no window interaction.
 * ------------------------------------------------------------------ */

const LINE_MS = 300;
const SHAKE_MS = 400; // 2 quick shake cycles
const YANK_MS = 300;
const PUFF_MS = 500;
const ORIGIN_MARGIN = 24;

interface LineTarget { x1: number; y1: number; x2: number; y2: number; length: number }

const Thwip: FC = () => {
  const effect = useOs(s => s.effect);
  const focusedId = useOs(s => s.focusedId);
  const windows = useOs(s => s.windows);
  const minimizeWindow = useOs(s => s.minimizeWindow);

  const [target, setTarget] = useState<LineTarget | null>(null);
  const [puff, setPuff] = useState(false);
  const timers = useRef<number[]>([]);
  const cancelled = useRef(false);

  useEffect(() => {
    if (effect !== "thwip") return;

    cancelled.current = false;
    const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    clearTimers();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const originX = vw - ORIGIN_MARGIN;
    const originY = ORIGIN_MARGIN;

    const focusedWin = windows.find(w => w.id === focusedId) ?? null;
    let x2: number, y2: number;
    if (focusedWin) {
      const rect = displayRect(focusedWin, vw, vh);
      x2 = rect.x + rect.w / 2;
      y2 = rect.y + HEADER / 2;
    } else {
      x2 = vw - 140;
      y2 = 90;
    }
    const length = Math.hypot(x2 - originX, y2 - originY) || 1;
    setTarget({ x1: originX, y1: originY, x2, y2, length });
    setPuff(false);

    const t1 = window.setTimeout(() => {
      if (cancelled.current) return;
      if (focusedWin) {
        const el = document.querySelector<HTMLElement>(`[data-window-id="${focusedWin.id}"]`);
        if (el) {
          animate(el, { x: [0, -6, 6, -6, 6, 0] }, { duration: SHAKE_MS / 1000, ease: "easeInOut" })
            .then(() => {
              if (cancelled.current) return undefined;
              return animate(el, { x: [0, 40], y: [0, -40], opacity: [1, 0.15] }, { duration: YANK_MS / 1000, ease: "easeIn" });
            })
            .then(() => {
              if (cancelled.current) return;
              minimizeWindow(focusedWin.id);
              setTarget(null);
              // Reset the manual transform hack so a later restore starts clean.
              el.style.transform = "";
              el.style.opacity = "";
            });
        } else {
          minimizeWindow(focusedWin.id);
          setTarget(null);
        }
      } else {
        setPuff(true);
        const t2 = window.setTimeout(() => {
          if (cancelled.current) return;
          setPuff(false);
          setTarget(null);
        }, PUFF_MS);
        timers.current.push(t2);
      }
    }, LINE_MS);
    timers.current.push(t1);

    return () => {
      cancelled.current = true;
      clearTimers();
    };
    // Only re-run when a fresh "thwip" fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect]);

  if (!target) return null;

  return (
    <svg
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 99999, pointerEvents: "none" }}
    >
      <motion.line
        key={`${target.x2}-${target.y2}`}
        x1={target.x1} y1={target.y1} x2={target.x2} y2={target.y2}
        stroke="#fff" strokeWidth={1.5} strokeLinecap="round"
        strokeDasharray={target.length}
        initial={{ strokeDashoffset: target.length }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: LINE_MS / 1000, ease: "easeOut" }}
        style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.85))" }}
      />
      {puff && (
        <motion.text
          x={target.x2}
          y={target.y2 - 10}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0, y: target.y2 - 26 }}
          transition={{ duration: PUFF_MS / 1000, ease: "easeOut" }}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fill="#fff"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          *thwip*
        </motion.text>
      )}
    </svg>
  );
};

export default Thwip;
