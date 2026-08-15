import { useState } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { vfs } from "../../os/vfsInstance";

/* ------------------------------------------------------------------ *
 * Screenshot — GNOME 46 "screenshot dialog" look: a small pill window
 * with a Screen/Window/Selection segmented control (only Screen is
 * wired up; the rest are disabled with a "someday" tooltip) and one
 * big round capture button.
 *
 * Capture excludes this very window from its own screenshot two ways:
 *   1. `data-window-id` (stamped on every window's root node by
 *      WindowFrame) locates this window in the DOM; we flag it with
 *      `data-screenshot-hide` and toPng's `filter` skips any node
 *      whose closest ancestor carries that attribute.
 *   2. Belt-and-braces: the same node is briefly `visibility: hidden`
 *      on the live page for the (near-instant) duration of the
 *      capture, in case a browser still bakes it into the render.
 * ------------------------------------------------------------------ */

type Mode = "screen" | "window" | "selection";

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

export default function Screenshot({ windowId }: AppProps) {
  const theme = useOs(s => s.settings.theme);
  const notify = useOs(s => s.notify);
  const light = theme === "light";

  const [mode, setMode] = useState<Mode>("screen");
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  async function capture() {
    if (capturing || mode !== "screen") return;
    setCapturing(true);
    const root = document.getElementById("root");
    const windowEl = document.querySelector<HTMLElement>(`[data-window-id="${windowId}"]`);
    try {
      if (!root) return;
      windowEl?.setAttribute("data-screenshot-hide", "true");
      const prevVisibility = windowEl?.style.visibility;
      if (windowEl) windowEl.style.visibility = "hidden";

      const dataUrl = await toPng(root, {
        filter: (node) => !node.closest?.("[data-screenshot-hide]"),
      });

      if (windowEl) windowEl.style.visibility = prevVisibility ?? "";
      windowEl?.removeAttribute("data-screenshot-hide");

      setFlash(true);
      setTimeout(() => setFlash(false), 120);

      const ts = timestamp();
      const filename = `razaos-screenshot-${ts}.png`;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Narrative coherence only — the real PNG went to the browser's
      // actual Downloads folder via the <a download> click above.
      vfs.write(`~/Downloads/${filename}.txt`, "(you downloaded the real one)");
      notify("screenshot", "Screenshot captured", "Saved to Downloads");
    } catch (err) {
      console.error("Screenshot capture failed:", err);
    } finally {
      if (windowEl) {
        windowEl.style.visibility = "";
        windowEl.removeAttribute("data-screenshot-hide");
      }
      setCapturing(false);
    }
  }

  const bg = light ? "#F4F4F4" : "#2A2530";
  const fg = light ? "#1a1a1a" : "#F2F0EC";
  const dim = light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const segBg = light ? "#E2E2E2" : "#1E1926";
  const segDisabledFg = light ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)";

  const MODES: { id: Mode; label: string }[] = [
    { id: "screen", label: "Screen" },
    { id: "window", label: "Window" },
    { id: "selection", label: "Selection" },
  ];

  return (
    <>
      <div style={{
        height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 22, background: bg, color: fg,
        fontFamily: "var(--font-ui)", padding: 20, userSelect: "none",
      }}>
        {/* Segmented control */}
        <div style={{ display: "flex", background: segBg, borderRadius: 999, padding: 4, gap: 2 }}>
          {MODES.map(({ id, label }) => {
            const disabled = id !== "screen";
            const active = mode === id;
            return (
              <button
                key={id}
                disabled={disabled}
                title={disabled ? "someday" : undefined}
                onClick={() => setMode(id)}
                style={{
                  border: "none", borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 600,
                  cursor: disabled ? "not-allowed" : "pointer",
                  background: active ? "var(--yaru-accent)" : "transparent",
                  color: active ? "#fff" : disabled ? segDisabledFg : fg,
                  transition: "background 120ms ease",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 12.5, color: dim, textAlign: "center", minHeight: 16 }}>
          {mode === "screen" ? "Capture the whole desktop" : "Not implemented yet"}
        </div>

        {/* Big round capture button */}
        <button
          onClick={capture}
          disabled={capturing || mode !== "screen"}
          aria-label="Take screenshot"
          style={{
            width: 76, height: 76, borderRadius: "50%",
            border: `4px solid ${light ? "#ffffff" : "#3D3648"}`,
            background: capturing ? (light ? "#cfcfcf" : "#4a4353") : "var(--yaru-accent)",
            cursor: capturing || mode !== "screen" ? "default" : "pointer",
            display: "grid", placeItems: "center", padding: 0,
            boxShadow: light ? "0 2px 10px rgba(0,0,0,0.18)" : "0 2px 14px rgba(0,0,0,0.5)",
            transition: "filter 120ms ease",
          }}
          onMouseDown={e => { if (!capturing) e.currentTarget.style.filter = "brightness(0.9)"; }}
          onMouseUp={e => (e.currentTarget.style.filter = "none")}
          onMouseLeave={e => (e.currentTarget.style.filter = "none")}
        >
          <div style={{ width: 26, height: 26, borderRadius: "50%", border: "3px solid #fff" }} />
        </button>
      </div>

      {/* White flash overlay, 120ms */}
      {flash && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 999999, pointerEvents: "none" }} />,
        document.body,
      )}
    </>
  );
}
