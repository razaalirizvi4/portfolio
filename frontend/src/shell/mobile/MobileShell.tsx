import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOs } from "../../os/store";
import IosStatusBar, { IOS_FONT, STATUS_BAR_H } from "./IosStatusBar";
import IosLockScreen from "./IosLockScreen";
import Springboard, { type OpenApp } from "./Springboard";
import IosAppFrame from "./IosAppFrame";
import ControlCenter from "./ControlCenter";

type OpenState = { appId: string; title: string; props?: Record<string, unknown> };
type Mode = "locked" | "home" | OpenState;

/**
 * iOS mobile shell. A small local nav state machine (locked → home → app) that
 * reuses the shared `settings` (wallpaper / theme / accent) but not the
 * desktop's window/session machinery.
 */
export default function MobileShell() {
  const wallpaper = useOs(s => s.settings.wallpaper);
  const theme = useOs(s => s.settings.theme);
  const accent = useOs(s => s.settings.accent);

  const [mode, setMode] = useState<Mode>("locked");
  const [ccOpen, setCcOpen] = useState(false);
  const [brightness, setBrightness] = useState(1); // filter multiplier, 0.4 – 1.0

  // Keep the shared CSS vars in sync so app components render with the right
  // accent/theme, exactly as the desktop shell does.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--yaru-accent", accent);
  }, [theme, accent]);

  const openApp: OpenApp = (appId, title, props) => setMode({ appId, title, props });
  const goHome = () => setMode("home");

  const appOpen = typeof mode === "object";
  const overWallpaper = mode === "locked" || mode === "home";

  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      background: "#000", fontFamily: IOS_FONT,
      filter: `brightness(${brightness})`,
    }}>
      {/* Wallpaper (home) — lock screen paints its own. */}
      {mode === "home" && (
        <img
          src={wallpaper}
          alt=""
          aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      {/* Springboard (home) */}
      {mode === "home" && (
        <div style={{ position: "absolute", top: STATUS_BAR_H, left: 0, right: 0, bottom: 0 }}>
          <Springboard onOpen={openApp} />
        </div>
      )}

      {/* App sheet */}
      <AnimatePresence>
        {appOpen && (
          <div key="appframe" style={{ position: "absolute", top: STATUS_BAR_H, left: 0, right: 0, bottom: 0 }}>
            <IosAppFrame
              appId={(mode as OpenState).appId}
              title={(mode as OpenState).title}
              appProps={(mode as OpenState).props}
              theme={theme}
              onHome={goHome}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Home indicator over an open app — tap or swipe up returns home. */}
      {appOpen && (
        <motion.div
          onClick={goHome}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.4}
          onDragEnd={(_, info) => { if (info.offset.y < -40) goHome(); }}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 24,
            display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 8,
            cursor: "pointer", zIndex: 40, touchAction: "pan-y",
          }}
        >
          <div style={{
            width: 134, height: 5, borderRadius: 3,
            background: theme === "light" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.85)",
          }} />
        </motion.div>
      )}

      {/* Lock screen */}
      <AnimatePresence>
        {mode === "locked" && (
          <motion.div
            key="lock"
            exit={{ y: "-100%", opacity: 0.6 }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            style={{ position: "absolute", inset: 0, zIndex: 30 }}
          >
            <IosLockScreen onUnlock={goHome} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Center */}
      <AnimatePresence>
        {ccOpen && (
          <ControlCenter
            key="cc"
            onClose={() => setCcOpen(false)}
            brightness={brightness}
            setBrightness={setBrightness}
          />
        )}
      </AnimatePresence>

      {/* Status bar — always on top. */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <IosStatusBar variant={overWallpaper ? "wallpaper" : "app"} theme={theme} />
      </div>

      {/* Control Center trigger — top-right corner: tap or drag down to open.
          Hidden on the lock screen (where any tap unlocks). */}
      {mode !== "locked" ? (
        <motion.div
          onClick={() => setCcOpen(true)}
          drag="y"
          dragSnapToOrigin
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.5}
          onDragEnd={(_, info) => { if (info.offset.y > 24) setCcOpen(true); }}
          aria-label="Open Control Center"
          style={{
            position: "absolute", top: 0, right: 0, width: 96, height: STATUS_BAR_H,
            zIndex: 55, cursor: "pointer", touchAction: "none",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <svg width={18} height={10} viewBox="0 0 18 10" aria-hidden style={{ marginBottom: 2, opacity: 0.55 }}>
            <polyline points="2,2 9,8 16,2" fill="none" stroke={overWallpaper ? "#fff" : (theme === "light" ? "#111" : "#fff")} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      ) : null}
    </div>
  );
}
