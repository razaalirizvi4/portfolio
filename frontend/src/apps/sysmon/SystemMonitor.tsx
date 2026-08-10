import { useEffect, useRef, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { easterEggs } from "../../content/easterEggs";
import { useContextMenu, type MenuItem } from "../../shell/desktop/ContextMenu";

/* ------------------------------------------------------------------ *
 * GNOME System Monitor 46-ish replica — two tabs:
 *  - Resources: canvas line charts, 4 fake CPU cores + Memory, 60
 *    samples, ticking every 500ms. A core spikes while Firefox is
 *    open; Memory occasionally traces a basketball shot-arc.
 *  - Processes: sortable table sourced from easterEggs.processes plus
 *    one live row per open window. spider-daemon is pinned at exactly
 *    3.0% CPU always; killing it (or hoops.service) respawns with a
 *    themed toast.
 * ------------------------------------------------------------------ */

const SAMPLES = 60;
const TICK_MS = 500;
const CORE_COUNT = 4;
const MEM_COLOR = "#3584E4";

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}
function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
function walk(prev: number, min: number, max: number, step: number): number {
  return clamp(prev + (Math.random() - 0.5) * step, min, max);
}
function seedSeries(n: number, gen: () => number): number[] {
  return Array.from({ length: n }, gen);
}
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

interface StaticProc { name: string; cpu: number; mem: number; hidden: boolean }
type SortKey = "name" | "user" | "cpu" | "mem";
interface Row { key: string; name: string; user: string; cpu: number; mem: number; live: boolean; windowId?: string }

/* ------------------------------------------------------------------ *
 * Chart drawing — pure canvas, theme-aware, GNOME-ish accent colors.
 * ------------------------------------------------------------------ */
function sizeCanvas(canvas: HTMLCanvasElement): { w: number; h: number } {
  const parent = canvas.parentElement!;
  const rect = parent.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return { w, h };
}

function drawChart(canvas: HTMLCanvasElement, series: { data: number[]; color: string; fill?: boolean }[], light: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.09)";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = Math.round((h / 4) * g) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const n = SAMPLES;
  for (const s of series) {
    const pts = s.data.map((v, i) => ({ x: (i / (n - 1)) * w, y: h - (clamp(v, 0, 100) / 100) * h }));
    if (pts.length === 0) continue;
    if (s.fill) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, h);
      for (const p of pts) ctx.lineTo(p.x, p.y);
      ctx.lineTo(pts[pts.length - 1].x, h);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(s.color, 0.16);
      ctx.fill();
    }
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

export default function SystemMonitor(_: AppProps) {
  const theme = useOs(s => s.settings.theme);
  const accent = useOs(s => s.settings.accent);
  const windows = useOs(s => s.windows);
  const closeWindow = useOs(s => s.closeWindow);
  const notify = useOs(s => s.notify);
  const light = theme === "light";
  const { open, element } = useContextMenu();

  const [tab, setTab] = useState<"processes" | "resources">("processes");
  const [staticProcs, setStaticProcs] = useState<StaticProc[]>(() =>
    easterEggs.processes.map(p => ({ name: p.name, cpu: p.cpu, mem: p.mem, hidden: false })),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("cpu");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const windowsRef = useRef(windows);
  windowsRef.current = windows;
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const liveStatsRef = useRef<Map<string, { cpu: number; mem: number }>>(new Map());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Resources data — mutated in place, drawn imperatively (no re-render per sample).
  const coresRef = useRef<number[][]>(
    Array.from({ length: CORE_COUNT }, () => seedSeries(SAMPLES, () => rand(5, 40))),
  );
  const memRef = useRef<number[]>(seedSeries(SAMPLES, () => rand(15, 65)));
  const arcRef = useRef<{ active: boolean; idx: number; base: number }>({ active: false, idx: 0, base: 0 });
  const ticksRef = useRef(0);
  const nextArcAtRef = useRef(randInt(80, 100));

  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const memCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const drawAll = () => {
    if (cpuCanvasRef.current) {
      const opacities = [1, 0.75, 0.55, 0.35];
      drawChart(
        cpuCanvasRef.current,
        coresRef.current.map((data, i) => ({ data, color: hexToRgba(accent, opacities[i] ?? 0.4) })),
        light,
      );
    }
    if (memCanvasRef.current) {
      drawChart(memCanvasRef.current, [{ data: memRef.current, color: MEM_COLOR, fill: true }], light);
    }
  };
  // The mount-only interval below would otherwise capture the first render's
  // drawAll (stale accent/theme); keep a ref pointing at the latest instance.
  const drawAllRef = useRef(drawAll);
  drawAllRef.current = drawAll;

  // Seed live stats immediately for newly-opened windows (don't wait for the next tick).
  useEffect(() => {
    for (const w of windows) {
      if (!liveStatsRef.current.has(w.id)) {
        liveStatsRef.current.set(w.id, { cpu: rand(0.4, 6), mem: rand(40, 320) });
      }
    }
  }, [windows]);

  // Main simulation loop — runs regardless of which tab is visible so
  // respawn timers / notifications keep working in the background.
  useEffect(() => {
    const id = setInterval(() => {
      const firefoxOpen = windowsRef.current.some(w => w.appId === "firefox");

      coresRef.current = coresRef.current.map((arr, i) => {
        const spiking = i === 0 && firefoxOpen;
        const [mn, mx] = spiking ? [70, 90] : [5, 40];
        const next = walk(arr[arr.length - 1], mn, mx, spiking ? 9 : 5);
        return [...arr.slice(1), next];
      });

      ticksRef.current++;
      let nextMem: number;
      if (arcRef.current.active) {
        const t = arcRef.current.idx / 11;
        const shape = 4 * t * (1 - t); // 0 -> 1 -> 0 parabola: a shot arc
        nextMem = clamp(arcRef.current.base + 40 * shape + (Math.random() - 0.5) * 2, 0, 100);
        arcRef.current.idx++;
        if (arcRef.current.idx >= 12) {
          arcRef.current.active = false;
          nextArcAtRef.current = ticksRef.current + randInt(80, 100);
        }
      } else {
        nextMem = walk(memRef.current[memRef.current.length - 1], 15, 65, 3.5);
        if (ticksRef.current >= nextArcAtRef.current) {
          arcRef.current = { active: true, idx: 0, base: nextMem };
        }
      }
      memRef.current = [...memRef.current.slice(1), nextMem];

      if (tabRef.current === "resources") {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawAllRef.current());
      }

      // Live window rows jitter too.
      const ids = new Set(windowsRef.current.map(w => w.id));
      for (const wid of liveStatsRef.current.keys()) {
        if (!ids.has(wid)) liveStatsRef.current.delete(wid);
      }
      for (const w of windowsRef.current) {
        const cur = liveStatsRef.current.get(w.id);
        if (!cur) liveStatsRef.current.set(w.id, { cpu: rand(0.4, 6), mem: rand(40, 320) });
        else cur.cpu = clamp(cur.cpu + (Math.random() - 0.5) * 0.8, 0.1, 100);
      }

      // Static process cpu jitter — spider-daemon is pinned, always.
      setStaticProcs(prev =>
        prev.map(p => {
          if (p.hidden) return p;
          if (p.name === "spider-daemon") return { ...p, cpu: 3.0 };
          return { ...p, cpu: clamp(p.cpu + (Math.random() - 0.5) * 0.8, 0.1, 100) };
        }),
      );
    }, TICK_MS);

    return () => {
      clearInterval(id);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Size + draw the canvases whenever the Resources tab mounts, and keep
  // them crisp across window resizes.
  useEffect(() => {
    if (tab !== "resources") return;
    const cpuCanvas = cpuCanvasRef.current;
    const memCanvas = memCanvasRef.current;
    if (!cpuCanvas || !memCanvas) return;
    const resize = () => {
      sizeCanvas(cpuCanvas);
      sizeCanvas(memCanvas);
      drawAllRef.current();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cpuCanvas.parentElement!);
    ro.observe(memCanvas.parentElement!);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, accent, theme]);

  function endProcess(row: Row) {
    if (row.live && row.windowId) {
      closeWindow(row.windowId);
      setSelected(null);
      return;
    }
    const name = row.name;
    if (name === "spider-daemon" || name === "hoops.service") {
      setStaticProcs(prev => prev.map(p => (p.name === name ? { ...p, hidden: true } : p)));
      const t = setTimeout(() => {
        setStaticProcs(prev => prev.map(p => (p.name === name ? { ...p, hidden: false, cpu: name === "spider-daemon" ? 3.0 : p.cpu } : p)));
        if (name === "spider-daemon") {
          notify("sysmon", "spider-daemon respawned", "With great power comes great responsibility.");
        } else {
          notify("sysmon", "hoops.service respawned", "ball is life");
        }
      }, 2000);
      timeoutsRef.current.push(t);
    } else {
      setStaticProcs(prev => prev.filter(p => p.name !== name));
    }
    setSelected(null);
  }

  const rows: Row[] = [
    ...staticProcs.filter(p => !p.hidden).map(p => ({ key: `s:${p.name}`, name: p.name, user: "raza", cpu: p.cpu, mem: p.mem, live: false })),
    ...windows.map(w => {
      const st = liveStatsRef.current.get(w.id) ?? { cpu: 1, mem: 64 };
      return { key: `w:${w.id}`, name: w.appId, user: "raza", cpu: st.cpu, mem: st.mem, live: true, windowId: w.id };
    }),
  ];
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "user") cmp = a.user.localeCompare(b.user);
    else if (sortKey === "cpu") cmp = a.cpu - b.cpu;
    else cmp = a.mem - b.mem;
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const bg = light ? "#F4F4F4" : "#241F31";
  const panelBg = light ? "#FFFFFF" : "#2A2434";
  const fg = light ? "#1a1a1a" : "#F2F0EC";
  const dim = light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const border = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)";
  const rowHover = light ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)";

  const selectedRow = sorted.find(r => r.key === selected) ?? null;

  function rowMenuItems(row: Row): MenuItem[] {
    return [{ label: "End Process", danger: true, onClick: () => endProcess(row) }];
  }

  const lastCores = coresRef.current.map(c => c[c.length - 1]);
  const lastMem = memRef.current[memRef.current.length - 1];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "var(--font-ui)", background: bg, color: fg }}>
      {/* Tab bar */}
      <div style={{ flexShrink: 0, display: "flex", gap: 4, padding: "10px 14px 0", borderBottom: `1px solid ${border}` }}>
        {(["processes", "resources"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              border: "none", background: "transparent", cursor: "pointer",
              padding: "8px 4px", marginRight: 18, fontSize: 13.5,
              color: tab === t ? fg : dim, fontWeight: tab === t ? 600 : 400,
              borderBottom: tab === t ? "2px solid var(--yaru-accent)" : "2px solid transparent",
            }}
          >
            {t === "processes" ? "Processes" : "Resources"}
          </button>
        ))}
      </div>

      {tab === "processes" ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>
            <button
              disabled={!selectedRow}
              onClick={() => selectedRow && endProcess(selectedRow)}
              style={{
                border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12.5, cursor: selectedRow ? "pointer" : "default",
                background: selectedRow ? "#C01C28" : (light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"),
                color: selectedRow ? "#fff" : dim,
              }}
            >
              End Process
            </button>
          </div>
          <div style={{ flex: 1, overflow: "auto" }} onClick={() => setSelected(null)}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: bg, color: dim, textAlign: "left" }}>
                  <SortHeader label="Process Name" col="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="left" />
                  <SortHeader label="User" col="user" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} width={80} align="left" />
                  <SortHeader label="% CPU" col="cpu" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} width={80} align="right" />
                  <SortHeader label="Memory" col="mem" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} width={100} align="right" />
                </tr>
              </thead>
              <tbody>
                {sorted.map(row => {
                  const isSelected = selected === row.key;
                  return (
                    <tr
                      key={row.key}
                      onClick={e => { e.stopPropagation(); setSelected(row.key); }}
                      onContextMenu={e => { e.stopPropagation(); setSelected(row.key); open(e, rowMenuItems(row)); }}
                      style={{
                        cursor: "default",
                        background: isSelected ? "color-mix(in srgb, var(--yaru-accent) 22%, transparent)" : "transparent",
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = rowHover; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                        {row.name}
                        {row.live && <span style={{ fontSize: 10, color: dim, border: `1px solid ${border}`, borderRadius: 4, padding: "1px 5px" }}>window</span>}
                      </td>
                      <td style={{ padding: "6px 10px", color: dim }}>{row.user}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{row.cpu.toFixed(1)}%</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", color: dim, fontFamily: "var(--font-mono)" }}>{Math.round(row.mem)} MB</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, padding: 14, overflow: "auto", minHeight: 0 }}>
          <ChartPanel
            title="CPU"
            legend={lastCores.map((v, i) => ({ label: `Core ${i + 1}`, value: `${v.toFixed(0)}%`, color: hexToRgba(accent, [1, 0.75, 0.55, 0.35][i] ?? 0.4) }))}
            panelBg={panelBg} fg={fg} dim={dim} border={border}
          >
            <canvas ref={cpuCanvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
          </ChartPanel>
          <ChartPanel
            title="Memory"
            legend={[{ label: "Memory", value: `${lastMem.toFixed(0)}%`, color: MEM_COLOR }]}
            panelBg={panelBg} fg={fg} dim={dim} border={border}
          >
            <canvas ref={memCanvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
          </ChartPanel>
        </div>
      )}

      {element}
    </div>
  );
}

function SortHeader({ label, col, sortKey, sortDir, onClick, width, align }: {
  label: string; col: SortKey; sortKey: SortKey; sortDir: "asc" | "desc";
  onClick: (col: SortKey) => void; width?: number; align: "left" | "right";
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onClick(col)}
      style={{ fontWeight: 500, padding: "6px 10px", width, cursor: "pointer", userSelect: "none", textAlign: align, whiteSpace: "nowrap" }}
    >
      {label} {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
  );
}

function ChartPanel({ title, legend, panelBg, fg, dim, border, children }: {
  title: string;
  legend: { label: string; value: string; color: string }[];
  panelBg: string; fg: string; dim: string; border: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ flex: 1, minHeight: 150, display: "flex", flexDirection: "column", background: panelBg, borderRadius: 10, border: `1px solid ${border}`, padding: 12 }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>{title}</span>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {legend.map(l => (
            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: dim, fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: "inline-block" }} />
              {l.label} {l.value}
            </span>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</div>
    </div>
  );
}
