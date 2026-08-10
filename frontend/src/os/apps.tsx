export interface AppManifest {
  id: string; name: string;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  singleInstance?: boolean;
}
const FALLBACK: Record<string, Partial<AppManifest>> = {
  settings: { singleInstance: true },
};
export function getManifest(id: string): AppManifest {
  return { id, name: id, defaultSize: { w: 800, h: 560 }, ...FALLBACK[id] };
}
