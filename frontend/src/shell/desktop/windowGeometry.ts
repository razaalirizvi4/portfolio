import type { OsWindow, Rect } from "../../os/types";

/* Chrome geometry (Yaru). Top bar = 28px, dock = 64px are off-limits. */
export const HEADER = 38;
export const TOPBAR = 28;
export const DOCK = 64;
export const EDGE = 6;

export interface PreviewZone { kind: "max" | "left" | "right" }

/** Rect a window actually occupies given its mode + the current viewport. */
export function displayRect(w: OsWindow, vw: number, vh: number): Rect {
  const fullW = vw - DOCK;
  const fullH = vh - TOPBAR;
  switch (w.mode) {
    case "maximized": return { x: DOCK, y: TOPBAR, w: fullW, h: fullH };
    case "snap-left": return { x: DOCK, y: TOPBAR, w: fullW / 2, h: fullH };
    case "snap-right": return { x: DOCK + fullW / 2, y: TOPBAR, w: fullW / 2, h: fullH };
    default: return w.rect;
  }
}

/** Preview rect for a drop zone (full screen for max, half for snap). */
export function zoneRect(kind: PreviewZone["kind"], vw: number, vh: number): Rect {
  const fullW = vw - DOCK;
  const fullH = vh - TOPBAR;
  if (kind === "max") return { x: DOCK, y: TOPBAR, w: fullW, h: fullH };
  if (kind === "left") return { x: DOCK, y: TOPBAR, w: fullW / 2, h: fullH };
  return { x: DOCK + fullW / 2, y: TOPBAR, w: fullW / 2, h: fullH };
}
