export type SessionState = "poweredOff" | "grub" | "kernelLog" | "plymouth" | "gdm" | "desktop" | "locked" | "shuttingDown";
export type WindowMode = "normal" | "maximized" | "minimized" | "snap-left" | "snap-right";
export interface Rect { x: number; y: number; w: number; h: number }
export interface OsWindow {
  id: string; appId: string; rect: Rect; z: number;
  mode: WindowMode; prevRect: Rect | null; prevMode: WindowMode | null; workspace: number;
  props?: Record<string, unknown>;
}
// prevRect: rect to restore when leaving maximized/snapped.
// prevMode: mode to restore when un-minimizing (minimize saves it, restore reads it).
export interface Notification { id: string; appId: string; title: string; body: string; time: number }
export interface OsSettings { wallpaper: string; theme: "dark" | "light"; accent: string }
