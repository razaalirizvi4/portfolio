import { create } from "zustand";
import type { SessionState, OsWindow, Notification, OsSettings, Rect, WindowMode } from "./types";
import { getManifest } from "./apps";

interface OsStore {
  session: SessionState;
  windows: OsWindow[];
  activeWorkspace: number;
  focusedId: string | null;
  notifications: Notification[];
  drawer: Notification[];
  settings: OsSettings;
  overviewOpen: boolean;
  powerOn(): void; bootTo(s: SessionState): void; login(): void;
  lock(): void; unlock(): void; shutdown(): void; restart(): void;
  openApp(appId: string, props?: Record<string, unknown>): string;
  closeWindow(id: string): void; focusWindow(id: string): void;
  minimizeWindow(id: string): void; toggleMaximize(id: string): void;
  snapWindow(id: string, side: "left" | "right"): void; restoreWindow(id: string): void;
  moveWindow(id: string, x: number, y: number): void; resizeWindow(id: string, rect: Rect): void;
  setWorkspace(n: number): void; moveWindowToWorkspace(id: string, n: number): void;
  notify(appId: string, title: string, body: string): void;
  dismissNotification(id: string): void; clearDrawer(): void;
  setSettings(p: Partial<OsSettings>): void; setOverview(open: boolean): void;
  __reset(): void;
}

const initial = {
  session: "poweredOff" as SessionState,
  windows: [] as OsWindow[],
  activeWorkspace: 0,
  focusedId: null as string | null,
  notifications: [] as Notification[],
  drawer: [] as Notification[],
  settings: { wallpaper: "/wallpapers/noble.svg", theme: "dark", accent: "#E95420" } as OsSettings,
  overviewOpen: false,
};

let seq = 0;
const nid = () => `w${++seq}`;

export const useOs = create<OsStore>((set, get) => ({
  ...initial,
  powerOn: () => set({ session: "grub" }),
  bootTo: (s) => set({ session: s }),
  login: () => set({ session: "desktop" }),
  lock: () => set({ session: "locked" }),
  unlock: () => set({ session: "gdm" }),
  shutdown: () => set({ session: "shuttingDown" }),
  restart: () => set({ ...initial, session: "grub", settings: get().settings }),

  openApp: (appId, props) => {
    const m = getManifest(appId);
    const st = get();
    if (m.singleInstance) {
      const existing = st.windows.find(w => w.appId === appId);
      if (existing) {
        get().restoreWindow(existing.id);
        get().focusWindow(existing.id);
        return existing.id;
      }
    }
    const n = st.windows.length;
    const zMax = Math.max(0, ...st.windows.map(w => w.z));
    const win: OsWindow = {
      id: nid(), appId, z: zMax + 1, mode: "normal", prevRect: null, prevMode: null,
      workspace: st.activeWorkspace, props,
      rect: { x: 120 + 32 * (n % 8), y: 64 + 24 * (n % 8), w: m.defaultSize.w, h: m.defaultSize.h },
    };
    set({ windows: [...st.windows, win], focusedId: win.id });
    return win.id;
  },
  closeWindow: (id) => set(s => ({ windows: s.windows.filter(w => w.id !== id), focusedId: s.focusedId === id ? null : s.focusedId })),
  focusWindow: (id) => set(s => {
    const zMax = Math.max(0, ...s.windows.map(w => w.z));
    return { focusedId: id, windows: s.windows.map(w => w.id === id ? { ...w, z: zMax + 1 } : w) };
  }),
  minimizeWindow: (id) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, mode: "minimized" as WindowMode, prevMode: w.mode } : w), focusedId: s.focusedId === id ? null : s.focusedId })),
  restoreWindow: (id) => set(s => ({ windows: s.windows.map(w => w.id === id && w.mode === "minimized" ? { ...w, mode: w.prevMode ?? "normal", prevMode: null } : w) })),
  toggleMaximize: (id) => set(s => ({ windows: s.windows.map(w => {
    if (w.id !== id) return w;
    if (w.mode === "maximized") return { ...w, mode: "normal" as WindowMode, rect: w.prevRect ?? w.rect, prevRect: null };
    return { ...w, mode: "maximized" as WindowMode, prevRect: w.rect };
  })})),
  snapWindow: (id, side) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, mode: side === "left" ? "snap-left" : "snap-right", prevRect: w.mode === "normal" ? w.rect : w.prevRect } : w) })),
  moveWindow: (id, x, y) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, rect: { ...w.rect, x, y } } : w) })),
  resizeWindow: (id, rect) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, rect } : w) })),
  setWorkspace: (n) => set({ activeWorkspace: n }),
  moveWindowToWorkspace: (id, n) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, workspace: n } : w) })),

  notify: (appId, title, body) => set(s => {
    const note = { id: nid(), appId, title, body, time: Date.now() };
    return { notifications: [...s.notifications, note], drawer: [note, ...s.drawer] };
  }),
  dismissNotification: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
  clearDrawer: () => set({ drawer: [] }),
  setSettings: (p) => set(s => ({ settings: { ...s.settings, ...p } })),
  setOverview: (open) => set({ overviewOpen: open }),
  __reset: () => set({ ...initial }),
}));
