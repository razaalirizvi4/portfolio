import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useOs } from "../../os/store";
import { profile } from "../../content/profile";
import {
  UserAvatar,
  AccessibilityIcon,
  WifiIcon,
  VolumeIcon,
  BatteryIcon,
  GearIcon,
  ChevronIcon,
} from "../../ui/icons";

const SESSIONS = ["Ubuntu", "Ubuntu on Xorg", "GNOME Classic"] as const;
const LOGIN_FADE_MS = 350;

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** GDM greeter — Ubuntu 24.04 login screen. */
export default function Gdm() {
  const login = useOs(s => s.login);
  const wallpaper = useOs(s => s.settings.wallpaper);
  const now = useClock();

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<string>(SESSIONS[0]);
  const fadeTimer = useRef<number | null>(null);

  // Cleanup any pending login timer on unmount (StrictMode-safe).
  useEffect(() => {
    return () => {
      if (fadeTimer.current !== null) clearTimeout(fadeTimer.current);
    };
  }, []);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  function submit() {
    if (submitting) return;
    setSubmitting(true);
    fadeTimer.current = window.setTimeout(() => login(), LOGIN_FADE_MS);
  }

  return (
    <div className="h-full relative overflow-hidden select-none" style={{ fontFamily: "var(--font-ui)" }}>
      {/* Blurred wallpaper backdrop — oversized to avoid edge bleed under the blur. */}
      <img
        src={wallpaper}
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          top: "-5%",
          left: "-5%",
          width: "110%",
          height: "110%",
          objectFit: "cover",
          filter: "blur(24px) brightness(0.6)",
        }}
      />

      {/* Top bar strip */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-end gap-3 px-4"
        style={{ height: 28, background: "rgba(0,0,0,0.35)", color: "#fff" }}
      >
        <AccessibilityIcon size={14} />
        <WifiIcon size={14} />
        <VolumeIcon size={14} />
        <BatteryIcon size={14} />
        <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{hh}:{mm}</span>
      </div>

      {/* Center column */}
      <motion.div
        className="h-full flex flex-col items-center justify-center gap-4"
        animate={{ opacity: submitting ? 0 : 1 }}
        transition={{ duration: LOGIN_FADE_MS / 1000 }}
      >
        <UserAvatar size={96} />
        <div style={{ color: "#fff", fontSize: 20 }}>{profile.name}</div>
        <form
          onSubmit={e => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col items-center gap-2"
        >
          <div
            className="flex items-center gap-2"
            style={{
              width: 300,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.12)",
              padding: "6px 6px 6px 16px",
            }}
          >
            <input
              type="password"
              autoFocus
              disabled={submitting}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder=""
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              aria-label="Log in"
              style={{
                width: 24,
                height: 24,
                flexShrink: 0,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              <ChevronIcon size={14} className="-rotate-90" />
            </button>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>just press enter</div>
        </form>
      </motion.div>

      {/* Gear session-switcher, bottom right */}
      <div className="absolute bottom-4 right-4">
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              bottom: 40,
              right: 0,
              background: "rgba(38,38,38,0.92)",
              borderRadius: 8,
              padding: "6px 0",
              minWidth: 170,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            {SESSIONS.map(s => (
              <button
                key={s}
                onClick={() => {
                  setSession(s);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2"
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {session === s && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                  )}
                </span>
                {s}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Session options"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <GearIcon size={16} />
        </button>
      </div>
    </div>
  );
}
