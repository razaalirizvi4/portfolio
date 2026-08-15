import { useRef, useState, type FC, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
import { useOs } from "../../os/store";
import { IOS_FONT } from "./IosStatusBar";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ---- glyphs ---- */
const AirplaneGlyph: FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21 15.5v-1.8l-7-4.2V4a1.5 1.5 0 0 0-3 0v5.5l-7 4.2v1.8l7-2.1v3.9l-2 1.3V21l3.5-1 3.5 1v-1.4l-2-1.3v-3.9l7 2.1z" />
  </svg>
);
const WifiGlyph: FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 4a14 14 0 0 1 9.5 3.7l-2 2.1A11 11 0 0 0 12 7a11 11 0 0 0-7.5 2.8l-2-2.1A14 14 0 0 1 12 4z" />
    <path d="M12 10.5a8 8 0 0 1 5.4 2.1l-2 2.1A5 5 0 0 0 12 13.5a5 5 0 0 0-3.4 1.2l-2-2.1A8 8 0 0 1 12 10.5z" />
    <circle cx="12" cy="18" r="2" />
  </svg>
);
const BluetoothGlyph: FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 8l8 8-4 3V5l4 3-8 8" />
  </svg>
);
const DarkGlyph: FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20 14A8 8 0 1 1 10 4a6.3 6.3 0 0 0 10 10z" />
  </svg>
);
const SunGlyph: FC = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2} strokeLinecap="round" aria-hidden opacity={0.35}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
  </svg>
);
const SpeakerGlyph: FC = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="#000" aria-hidden opacity={0.35}>
    <path d="M4 9h4l5-4v14l-5-4H4z" />
  </svg>
);

/* ---- round connectivity toggle ---- */
const RoundToggle: FC<{ icon: ReactNode; active: boolean; onClick: () => void; label: string; activeColor?: string }> =
({ icon, active, onClick, label, activeColor = "#30d158" }) => (
  <button
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    style={{
      width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
      background: active ? activeColor : "rgba(255,255,255,0.18)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 160ms ease",
    }}
  >
    {icon}
  </button>
);

/* ---- vertical slider (custom pointer-drag fill bar) ---- */
const VerticalSlider: FC<{ value: number; onChange: (v: number) => void; icon: ReactNode; label: string }> =
({ value, onChange, icon, label }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFrom = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(clamp(1 - (clientY - r.top) / r.height, 0, 1));
  };
  const onDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFrom(e.clientY);
  };
  const onMove = (e: ReactPointerEvent) => { if (dragging.current) setFrom(e.clientY); };
  const onUp = () => { dragging.current = false; };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{
        position: "relative", flex: 1, minHeight: 150, borderRadius: 22, overflow: "hidden",
        background: "rgba(255,255,255,0.18)", cursor: "pointer", touchAction: "none",
      }}
    >
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        height: `${value * 100}%`, background: "#fff",
      }} />
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 12,
        display: "flex", justifyContent: "center", pointerEvents: "none",
      }}>
        {icon}
      </div>
    </div>
  );
};

interface Props {
  onClose: () => void;
  brightness: number;               // filter multiplier, 0.4 – 1.0
  setBrightness: (v: number) => void;
}

/**
 * iOS Control Center: dark vibrancy sheet with connectivity toggles, a real
 * brightness slider (drives filter: brightness on the shell), a cosmetic volume
 * slider, and a Now Playing card.
 */
const ControlCenter: FC<Props> = ({ onClose, brightness, setBrightness }) => {
  const theme = useOs(s => s.settings.theme);
  const setSettings = useOs(s => s.setSettings);

  const [airplane, setAirplane] = useState(false);
  const [wifi, setWifi] = useState(true);
  const [bt, setBt] = useState(true);
  const [volume, setVolume] = useState(0.7);

  // brightness (0.4–1.0) ⇄ slider fraction (0–1)
  const brightFrac = (brightness - 0.4) / 0.6;
  const setBrightFrac = (v: number) => setBrightness(0.4 + v * 0.6);

  return (
    <motion.div
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 36 }}
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 60,
        background: "rgba(20,20,22,0.55)",
        backdropFilter: "blur(30px) saturate(160%)", WebkitBackdropFilter: "blur(30px) saturate(160%)",
        fontFamily: IOS_FONT, color: "#fff",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Content — stop propagation so taps on controls don't close the sheet. */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ padding: "56px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* Connectivity module */}
        <div style={{
          background: "rgba(255,255,255,0.12)", borderRadius: 26, padding: 16,
          display: "flex", justifyContent: "space-around",
        }}>
          <RoundToggle label="Airplane Mode" icon={<AirplaneGlyph />} active={airplane}
            onClick={() => setAirplane(v => !v)} activeColor="#ff9f0a" />
          <RoundToggle label="Wi-Fi" icon={<WifiGlyph />} active={wifi}
            onClick={() => setWifi(v => !v)} activeColor="#0a84ff" />
          <RoundToggle label="Bluetooth" icon={<BluetoothGlyph />} active={bt}
            onClick={() => setBt(v => !v)} activeColor="#0a84ff" />
          <RoundToggle label="Dark Mode" icon={<DarkGlyph />} active={theme === "dark"}
            onClick={() => setSettings({ theme: theme === "dark" ? "light" : "dark" })} activeColor="#5e5ce6" />
        </div>

        {/* Wi-Fi label strip */}
        <div style={{ fontSize: 12, opacity: 0.7, paddingLeft: 6, marginTop: -6 }}>
          {wifi ? "Wi-Fi · FAST-NUCES-Guest" : "Wi-Fi Off"}
        </div>

        {/* Sliders */}
        <div style={{ display: "flex", gap: 14, height: 170 }}>
          <VerticalSlider value={brightFrac} onChange={setBrightFrac} icon={<SunGlyph />} label="Brightness" />
          <VerticalSlider value={volume} onChange={setVolume} icon={<SpeakerGlyph />} label="Volume" />
        </div>

        {/* Now Playing */}
        <div style={{
          background: "rgba(255,255,255,0.12)", borderRadius: 22, padding: 14,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#d90429,#1d3557)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>
            🕷️
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              The Spectacular Spider-Man Theme
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Now Playing</div>
          </div>
        </div>
      </div>

      {/* Close handle / hint */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingBottom: 16 }}>
        <div style={{ fontSize: 12, opacity: 0.6 }}>tap anywhere to close</div>
        <div style={{ width: 134, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.85)" }} />
      </div>
    </motion.div>
  );
};

export default ControlCenter;
