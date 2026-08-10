import { useEffect, useRef, useState, type ReactNode } from "react";
import { useOs } from "../../os/store";
import { WifiIcon, VolumeIcon, BatteryIcon } from "../../ui/icons";
import ClockDropdown from "./ClockDropdown";
import QuickSettings from "./QuickSettings";

/**
 * Shared outside-click helper. Attach the returned ref to a container that
 * wraps BOTH the trigger and its dropdown; when `active`, any mousedown
 * outside that container calls `onClose`. StrictMode-safe (cleans up).
 */
export function useClickOutside<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, onClose]);
  return ref;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

type OpenMenu = "clock" | "quick" | null;

/** Floating panel body shared by the clock and quick-settings dropdowns. */
function Panel({ align, children }: { align: "left" | "center" | "right"; children: ReactNode }) {
  const light = useOs(s => s.settings.theme === "light");
  const pos =
    align === "center" ? { left: "50%", transform: "translateX(-50%)" } :
    align === "right" ? { right: 6 } : { left: 6 };
  return (
    <div
      style={{
        position: "absolute",
        top: 34,
        ...pos,
        zIndex: 360,
        borderRadius: 16,
        background: light ? "#f2f2f2" : "#2b2b2b",
        color: light ? "#1a1a1a" : "#eee",
        border: `1px solid ${light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {children}
    </div>
  );
}

/** GNOME 46 top bar — Activities pill, centred clock, status cluster. */
export default function TopBar() {
  const setOverview = useOs(s => s.setOverview);
  const overviewOpen = useOs(s => s.overviewOpen);
  const now = useClock();
  const [open, setOpen] = useState<OpenMenu>(null);

  const close = () => setOpen(null);
  const clockRef = useClickOutside<HTMLDivElement>(open === "clock", close);
  const quickRef = useClickOutside<HTMLDivElement>(open === "quick", close);

  const dateLabel = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  const barBtn = (children: ReactNode, extra: React.CSSProperties = {}, props: React.ButtonHTMLAttributes<HTMLButtonElement> = {}) => (
    <button
      {...props}
      style={{
        height: 22, display: "flex", alignItems: "center", gap: 8,
        padding: "0 8px", borderRadius: 8, border: "none", cursor: "pointer",
        background: "transparent", color: "#fff", fontSize: 13, fontWeight: 500,
        fontFamily: "var(--font-ui)", ...extra,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 28, zIndex: 350,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 6px", background: "rgba(0,0,0,0.85)", color: "#fff",
        fontFamily: "var(--font-ui)", fontSize: 13, userSelect: "none",
      }}
    >
      {/* Left — Activities */}
      {barBtn("Activities", {}, { onClick: () => setOverview(!overviewOpen) })}

      {/* Center — clock + dropdown */}
      <div ref={clockRef} style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        {barBtn(
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{dateLabel}&nbsp;&nbsp;{hh}:{mm}</span>,
          {},
          { onClick: () => setOpen(o => (o === "clock" ? null : "clock")) }
        )}
        {open === "clock" && <Panel align="center"><ClockDropdown /></Panel>}
      </div>

      {/* Right — status cluster + quick settings */}
      <div ref={quickRef} style={{ position: "relative" }}>
        {barBtn(
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <WifiIcon size={15} />
            <VolumeIcon size={15} />
            <BatteryIcon size={15} />
          </span>,
          {},
          { onClick: () => setOpen(o => (o === "quick" ? null : "quick")), "aria-label": "Quick settings" }
        )}
        {open === "quick" && <Panel align="right"><QuickSettings onClose={close} /></Panel>}
      </div>
    </div>
  );
}
