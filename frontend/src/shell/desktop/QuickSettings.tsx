import { useState, type FC, type ReactNode } from "react";
import { useOs } from "../../os/store";
import {
  WifiIcon, VolumeIcon, BatteryIcon, PowerIcon, LockIcon,
  GearIcon, SearchIcon,
} from "../../ui/icons";

/** A small monochrome glyph used inside the pill toggles. */
const BluetoothGlyph: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 8 l10 8 -5 4 V4 l5 4 -10 8" />
  </svg>
);

const PowerModeGlyph: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 3 L5 14 h6 l-1 7 8 -11 h-6 z" />
  </svg>
);

const NightGlyph: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14 A8 8 0 1 1 10 4 a6 6 0 0 0 10 10 z" />
  </svg>
);

const DarkGlyph: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 12 a5 5 0 0 0 0 -10 z" fill="currentColor" stroke="none" />
  </svg>
);

interface PillProps {
  icon: ReactNode;
  label: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
  light: boolean;
}

const TogglePill: FC<PillProps> = ({ icon, label, sub, active, onClick, light }) => {
  const inactiveBg = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  const fg = active ? "#fff" : light ? "#1a1a1a" : "#eee";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 22, border: "none", cursor: "pointer",
        background: active ? "var(--yaru-accent)" : inactiveBg,
        color: fg, textAlign: "left", width: "100%", minWidth: 0,
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "rgba(255,255,255,0.2)" : light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)",
      }}>
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        {sub && <span style={{ display: "block", fontSize: 11, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>}
      </span>
    </button>
  );
};

/** GNOME 46 quick-settings pill-grid panel. */
export default function QuickSettings({ onClose }: { onClose: () => void }) {
  const setSettings = useOs(s => s.setSettings);
  const theme = useOs(s => s.settings.theme);
  const openApp = useOs(s => s.openApp);
  const lock = useOs(s => s.lock);
  const restart = useOs(s => s.restart);
  const shutdown = useOs(s => s.shutdown);
  const light = theme === "light";

  const [wifi, setWifi] = useState(true);
  const [bt, setBt] = useState(false);
  const [perf, setPerf] = useState(false);
  const [night, setNight] = useState(false);
  const [volume, setVolume] = useState(65);
  const [powerMenu, setPowerMenu] = useState(false);

  const fg = light ? "#1a1a1a" : "#eee";
  const muted = light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)";
  const iconBtnBg = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";

  const launch = (id: string, props?: Record<string, unknown>) => { onClose(); openApp(id, props); };

  const iconBtn = (glyph: ReactNode, label: string, onClick: () => void) => (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
        background: iconBtnBg, color: fg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {glyph}
    </button>
  );

  return (
    <div style={{ width: 340, padding: 14, color: fg }}>
      {/* Toggle grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <TogglePill light={light} active={wifi} onClick={() => setWifi(v => !v)}
          icon={<WifiIcon size={18} />} label="Wi-Fi" sub={wifi ? "FAST-NUCES-Guest" : "Off"} />
        <TogglePill light={light} active={bt} onClick={() => setBt(v => !v)}
          icon={<BluetoothGlyph />} label="Bluetooth" sub={bt ? "On" : "Off"} />
        <TogglePill light={light} active={perf} onClick={() => setPerf(v => !v)}
          icon={<PowerModeGlyph />} label="Power Mode" sub={perf ? "Performance" : "Balanced"} />
        <TogglePill light={light} active={theme === "dark"} onClick={() => setSettings({ theme: theme === "dark" ? "light" : "dark" })}
          icon={<DarkGlyph />} label="Dark Style" sub={theme === "dark" ? "On" : "Off"} />
        <TogglePill light={light} active={night} onClick={() => setNight(v => !v)}
          icon={<NightGlyph />} label="Night Light" sub={night ? "On" : "Off"} />
      </div>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
        <VolumeIcon size={18} />
        <input
          type="range" min={0} max={100} value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          aria-label="Volume"
          style={{ flex: 1, accentColor: "var(--yaru-accent)" }}
        />
      </div>

      {/* Battery */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 13 }}>
        <BatteryIcon size={18} />
        <span>85% · 4:20 remaining</span>
      </div>

      {/* Bottom action row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}` }}>
        {iconBtn(<SearchIcon size={18} />, "Screenshot", () => launch("screenshot"))}
        {iconBtn(<GearIcon size={18} />, "Settings", () => launch("settings"))}
        {iconBtn(<LockIcon size={18} />, "Lock", () => { onClose(); lock(); })}
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          {iconBtn(<PowerIcon size={18} />, "Power Off / Log Out", () => setPowerMenu(v => !v))}
          {powerMenu && (
            <div style={{
              position: "absolute", bottom: 46, right: 0, minWidth: 170,
              background: light ? "#ffffff" : "#2b2b2b",
              border: `1px solid ${light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 12, padding: 6, boxShadow: "0 12px 32px rgba(0,0,0,0.4)", zIndex: 10,
            }}>
              {[
                { label: "Suspend", fn: lock },
                { label: "Restart…", fn: restart },
                { label: "Power Off…", fn: shutdown },
              ].map(o => (
                <button
                  key={o.label}
                  onClick={() => { onClose(); o.fn(); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                    borderRadius: 7, border: "none", background: "transparent", color: fg,
                    fontSize: 13, cursor: "pointer",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: muted, marginTop: 8, textAlign: "center" }}>Ubuntu 24.04 LTS</div>
    </div>
  );
}
