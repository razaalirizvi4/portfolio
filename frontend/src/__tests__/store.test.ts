import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useOs } from "../os/store";

beforeEach(() => useOs.getState().__reset());

describe("session machine", () => {
  it("boots poweredOff → grub → … → desktop", () => {
    const s = useOs.getState;
    expect(s().session).toBe("poweredOff");
    s().powerOn(); expect(s().session).toBe("grub");
    s().bootTo("kernelLog"); s().bootTo("plymouth"); s().bootTo("gdm");
    s().login(); expect(s().session).toBe("desktop");
  });
  it("lock/unlock cycles desktop ⇄ locked", () => {
    const s = useOs.getState;
    s().powerOn(); s().bootTo("gdm"); s().login();
    s().lock(); expect(s().session).toBe("locked");
    s().unlock(); expect(s().session).toBe("gdm");
  });
  it("restart clears windows and replays boot", () => {
    const s = useOs.getState;
    s().powerOn(); s().bootTo("gdm"); s().login();
    s().openApp("terminal");
    s().restart();
    expect(s().session).toBe("grub");
    expect(s().windows).toHaveLength(0);
  });
});

describe("window manager", () => {
  beforeEach(() => {
    const s = useOs.getState;
    s().powerOn(); s().bootTo("gdm"); s().login();
  });
  it("openApp creates a focused window; focus raises z", () => {
    const s = useOs.getState;
    const a = s().openApp("terminal");
    const b = s().openApp("files");
    expect(s().focusedId).toBe(b);
    s().focusWindow(a);
    const za = s().windows.find(w => w.id === a)!.z;
    const zb = s().windows.find(w => w.id === b)!.z;
    expect(za).toBeGreaterThan(zb);
  });
  it("singleInstance apps refocus instead of duplicating", () => {
    const s = useOs.getState;
    const a = s().openApp("settings");
    const b = s().openApp("settings");
    expect(a).toBe(b);
    expect(s().windows.filter(w => w.appId === "settings")).toHaveLength(1);
  });
  it("maximize stores prevRect and toggle restores it", () => {
    const s = useOs.getState;
    const id = s().openApp("terminal");
    const before = s().windows[0].rect;
    s().toggleMaximize(id);
    expect(s().windows[0].mode).toBe("maximized");
    s().toggleMaximize(id);
    expect(s().windows[0].mode).toBe("normal");
    expect(s().windows[0].rect).toEqual(before);
  });
  it("snap and workspace assignment work", () => {
    const s = useOs.getState;
    const id = s().openApp("terminal");
    s().snapWindow(id, "left");
    expect(s().windows[0].mode).toBe("snap-left");
    s().moveWindowToWorkspace(id, 2);
    expect(s().windows[0].workspace).toBe(2);
  });
  it("unsnapWindow restores prevRect and normal mode", () => {
    const s = useOs.getState;
    const id = s().openApp("terminal");
    const before = s().windows[0].rect;
    s().snapWindow(id, "left");
    expect(s().windows[0].mode).toBe("snap-left");
    s().unsnapWindow(id);
    expect(s().windows[0].mode).toBe("normal");
    expect(s().windows[0].rect).toEqual(before);
    expect(s().windows[0].prevRect).toBeNull();
  });
});

describe("notifications & settings", () => {
  it("notify adds to toasts and drawer; dismiss removes toast only", () => {
    const s = useOs.getState;
    s().notify("sysmon", "Process killed", "with great power…");
    expect(s().notifications).toHaveLength(1);
    expect(s().drawer).toHaveLength(1);
    s().dismissNotification(s().notifications[0].id);
    expect(s().notifications).toHaveLength(0);
    expect(s().drawer).toHaveLength(1);
  });
  it("setSettings merges partials", () => {
    const s = useOs.getState;
    s().setSettings({ theme: "light" });
    expect(s().settings.theme).toBe("light");
    expect(s().settings.wallpaper).toBe("/wallpapers/noble.svg");
  });
});

describe("fireEffect", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sets effect then auto-clears after 1200ms", () => {
    const s = useOs.getState;
    s().fireEffect("thwip");
    expect(s().effect).toBe("thwip");
    vi.advanceTimersByTime(1199);
    expect(s().effect).toBe("thwip");
    vi.advanceTimersByTime(1);
    expect(s().effect).toBeNull();
  });

  it("a second fireEffect while one is active resets the timer instead of racing it", () => {
    const s = useOs.getState;
    s().fireEffect("thwip");
    vi.advanceTimersByTime(1000);
    s().fireEffect("thwip"); // re-fire near the end of the first window
    vi.advanceTimersByTime(1000);
    expect(s().effect).toBe("thwip"); // still active — timer was reset, not doubled up
    vi.advanceTimersByTime(200);
    expect(s().effect).toBeNull();
  });
});
