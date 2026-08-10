import { lazy, type LazyExoticComponent, type FC } from "react";

export interface AppProps { windowId: string; props?: Record<string, unknown> }
export interface AppManifest {
  id: string; name: string;
  component: LazyExoticComponent<FC<AppProps>>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  singleInstance?: boolean;
  pinned?: boolean;      // shows in dock
  desktopHidden?: boolean; // not in app grid (evince opens via files only)
}

export const APPS: AppManifest[] = [
  { id: "firefox",    name: "Firefox",           component: lazy(() => import("../apps/firefox/Firefox")),          defaultSize: { w: 980, h: 640 }, minSize: { w: 560, h: 400 }, pinned: true },
  { id: "terminal",   name: "Terminal",          component: lazy(() => import("../apps/terminal/Terminal")),        defaultSize: { w: 760, h: 480 }, minSize: { w: 420, h: 280 }, pinned: true },
  { id: "files",      name: "Files",             component: lazy(() => import("../apps/files/Files")),              defaultSize: { w: 880, h: 560 }, minSize: { w: 560, h: 380 }, pinned: true },
  { id: "vscode",     name: "Visual Studio Code",component: lazy(() => import("../apps/vscode/VsCode")),            defaultSize: { w: 1020, h: 660 }, minSize: { w: 640, h: 420 }, pinned: true, singleInstance: true },
  { id: "settings",   name: "Settings",          component: lazy(() => import("../apps/settings/SettingsApp")),     defaultSize: { w: 880, h: 600 }, minSize: { w: 700, h: 440 }, pinned: true, singleInstance: true },
  { id: "sysmon",     name: "System Monitor",    component: lazy(() => import("../apps/sysmon/SystemMonitor")),     defaultSize: { w: 780, h: 560 }, minSize: { w: 560, h: 400 }, singleInstance: true },
  { id: "calculator", name: "Calculator",        component: lazy(() => import("../apps/calculator/Calculator")),    defaultSize: { w: 340, h: 520 }, minSize: { w: 300, h: 460 }, singleInstance: true },
  { id: "texteditor", name: "Text Editor",       component: lazy(() => import("../apps/texteditor/TextEditor")),    defaultSize: { w: 720, h: 520 }, minSize: { w: 420, h: 320 } },
  { id: "imageviewer",name: "Image Viewer",      component: lazy(() => import("../apps/imageviewer/ImageViewer")),  defaultSize: { w: 800, h: 560 }, minSize: { w: 480, h: 360 } },
  { id: "screenshot", name: "Screenshot",        component: lazy(() => import("../apps/screenshot/Screenshot")),    defaultSize: { w: 420, h: 260 }, minSize: { w: 420, h: 260 }, singleInstance: true },
  { id: "doom",       name: "DOOM",              component: lazy(() => import("../apps/doom/Doom")),                defaultSize: { w: 800, h: 560 }, minSize: { w: 660, h: 480 }, pinned: true, singleInstance: true },
  { id: "evince",     name: "Document Viewer",   component: lazy(() => import("../apps/evince/DocumentViewer")),    defaultSize: { w: 760, h: 720 }, minSize: { w: 480, h: 400 }, desktopHidden: true },
];

export function getManifest(id: string): AppManifest {
  const m = APPS.find(a => a.id === id);
  if (!m) throw new Error(`Unknown app: ${id}`);
  return m;
}
