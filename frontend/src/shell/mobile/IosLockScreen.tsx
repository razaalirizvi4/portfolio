import { useEffect, useState, type FC } from "react";
import { motion } from "framer-motion";
import { useOs } from "../../os/store";
import { IOS_FONT } from "./IosStatusBar";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Decorative rounded pill button (flashlight / camera). Non-functional. */
const PillButton: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div
    aria-hidden
    style={{
      width: 50, height: 50, borderRadius: "50%",
      background: "rgba(0,0,0,0.35)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff",
    }}
    title={label}
  >
    {children}
  </div>
);

const FlashlightGlyph: FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3h8l-1 5H9L8 3z" />
    <path d="M9 8h6v3l-1 9h-4l-1-9V8z" />
    <line x1="12" y1="13" x2="12" y2="15" />
  </svg>
);

const CameraGlyph: FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

/**
 * iOS lock screen: blurred wallpaper, oversized thin clock + date, a decorative
 * notification card, flashlight/camera pills, and a swipe-up / tap handle.
 * Any tap or upward swipe unlocks.
 */
const IosLockScreen: FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const wallpaper = useOs(s => s.settings.wallpaper);
  const now = useClock();

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div
      onClick={onUnlock}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.5}
      onDragEnd={(_, info) => { if (info.offset.y < -60) onUnlock(); }}
      style={{
        position: "absolute", inset: 0, overflow: "hidden",
        fontFamily: IOS_FONT, cursor: "pointer", touchAction: "pan-y",
      }}
    >
      {/* Wallpaper */}
      <img
        src={wallpaper}
        alt=""
        aria-hidden
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />

      {/* Clock + date */}
      <div style={{
        position: "absolute", top: 96, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}>
        <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: 0.5 }}>{dateStr}</div>
        <div style={{ fontSize: 88, fontWeight: 200, lineHeight: 1, letterSpacing: -1, marginTop: 2 }}>
          {hh}:{mm}
        </div>
      </div>

      {/* Notification card (decorative) */}
      <div style={{
        position: "absolute", left: 16, right: 16, top: 300,
        borderRadius: 20, padding: "14px 16px",
        background: "rgba(255,255,255,0.16)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: "#34C759", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff" aria-hidden>
              <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-4 3V6a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.85 }}>
              <span style={{ fontWeight: 600 }}>Messages</span>
              <span>now</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>recruiter@dream-job.com</div>
            <div style={{ fontSize: 14, opacity: 0.92 }}>1 new message · &ldquo;we should talk&rdquo;</div>
          </div>
        </div>
      </div>

      {/* Flashlight / camera pills */}
      <div style={{
        position: "absolute", bottom: 68, left: 0, right: 0,
        display: "flex", justifyContent: "space-between", padding: "0 44px",
      }}>
        <PillButton label="Flashlight"><FlashlightGlyph /></PillButton>
        <PillButton label="Camera"><CameraGlyph /></PillButton>
      </div>

      {/* Swipe-up hint + home indicator */}
      <div style={{
        position: "absolute", bottom: 22, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        color: "rgba(255,255,255,0.9)",
      }}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          swipe up to open
        </motion.div>
        <div style={{ width: 134, height: 5, borderRadius: 3, background: "#fff", opacity: 0.9 }} />
      </div>
    </motion.div>
  );
};

export default IosLockScreen;
