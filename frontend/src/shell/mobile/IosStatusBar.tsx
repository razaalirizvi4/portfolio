import { useEffect, useState, type FC } from "react";

export const IOS_FONT =
  '-apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Ubuntu, sans-serif';

/** iOS status bar height (also the top safe-area inset we reserve). */
export const STATUS_BAR_H = 44;

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Four ascending signal bars (decorative). */
const SignalBars: FC<{ color: string }> = ({ color }) => (
  <svg width={18} height={12} viewBox="0 0 18 12" aria-hidden fill={color}>
    <rect x="0" y="8" width="3" height="4" rx="1" />
    <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
    <rect x="10" y="3" width="3" height="9" rx="1" />
    <rect x="15" y="0.5" width="3" height="11.5" rx="1" />
  </svg>
);

/** Compact wifi glyph. */
const WifiGlyph: FC<{ color: string }> = ({ color }) => (
  <svg width={16} height={12} viewBox="0 0 16 12" aria-hidden fill={color}>
    <path d="M8 2.2c2.5 0 4.8 1 6.5 2.6l-1.4 1.5A7.4 7.4 0 0 0 8 4.3 7.4 7.4 0 0 0 2.9 6.3L1.5 4.8A9.4 9.4 0 0 1 8 2.2z" opacity="0.9" />
    <path d="M8 5.8c1.5 0 2.9.6 4 1.6l-1.5 1.5A3.5 3.5 0 0 0 8 7.9c-.9 0-1.8.3-2.5.9L4 7.4A5.5 5.5 0 0 1 8 5.8z" opacity="0.9" />
    <circle cx="8" cy="10.4" r="1.4" />
  </svg>
);

/** Battery pill fixed at 85% (decorative). */
const BatteryPill: FC<{ color: string }> = ({ color }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
    <span style={{ fontSize: 15, fontWeight: 500 }}>85</span>
    <span style={{ position: "relative", display: "inline-block", width: 24, height: 12 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: 3,
        border: `1px solid ${color}`, opacity: 0.5,
      }} />
      <span style={{
        position: "absolute", left: 1.5, top: 1.5, bottom: 1.5, width: 17,
        borderRadius: 1.5, background: color,
      }} />
      <span style={{
        position: "absolute", right: -2.5, top: 3.5, bottom: 3.5, width: 1.5,
        borderRadius: 1, background: color, opacity: 0.5,
      }} />
    </span>
  </span>
);

interface Props {
  /** "wallpaper" → always white content (lock/springboard); "app" → theme-based. */
  variant: "wallpaper" | "app";
  theme: "dark" | "light";
}

/**
 * Always-mounted iOS status bar. Real ticking clock on the left; decorative
 * carrier / wifi / battery cluster on the right.
 */
const IosStatusBar: FC<Props> = ({ variant, theme }) => {
  const now = useClock();
  const color = variant === "wallpaper" ? "#fff" : theme === "light" ? "#111" : "#fff";
  const shadow = variant === "wallpaper" ? "0 1px 2px rgba(0,0,0,0.35)" : "none";

  const h = now.getHours();
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  const time = `${hr12}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div
      style={{
        height: STATUS_BAR_H, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", color, textShadow: shadow,
        fontFamily: IOS_FONT, userSelect: "none",
        position: "relative", zIndex: 50,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.2 }}>{time}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <SignalBars color={color} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Jazz 5G</span>
        <WifiGlyph color={color} />
        <BatteryPill color={color} />
      </div>
    </div>
  );
};

export default IosStatusBar;
