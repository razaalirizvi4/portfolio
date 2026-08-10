import { useEffect, useRef, useState } from "react";
import { useOs } from "../../os/store";

const CURTAIN_MS = 400;

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** GNOME lock screen curtain — any key or click slides it up and unlocks. */
export default function LockScreen() {
  const unlock = useOs(s => s.unlock);
  const wallpaper = useOs(s => s.settings.wallpaper);
  const now = useClock();

  const [unlocking, setUnlocking] = useState(false);
  const unlockTimer = useRef<number | null>(null);

  // Register the dismiss listeners once; cleanup on unmount (StrictMode-safe).
  useEffect(() => {
    const dismiss = () => setUnlocking(true);
    window.addEventListener("keydown", dismiss);
    window.addEventListener("click", dismiss);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("click", dismiss);
    };
  }, []);

  // Once the curtain starts sliding, let the animation play out then unlock.
  useEffect(() => {
    if (!unlocking) return;
    unlockTimer.current = window.setTimeout(() => unlock(), CURTAIN_MS);
    return () => {
      if (unlockTimer.current !== null) clearTimeout(unlockTimer.current);
    };
  }, [unlocking, unlock]);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="h-full relative overflow-hidden select-none bg-black" style={{ fontFamily: "var(--font-ui)" }}>
      <div
        className="absolute inset-0"
        style={{
          transform: unlocking ? "translateY(-100%)" : "translateY(0)",
          transition: `transform ${CURTAIN_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {/* Blurred wallpaper — heavier blur than GDM, oversized to avoid edge bleed. */}
        <img
          src={wallpaper}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            top: "-7.5%",
            left: "-7.5%",
            width: "115%",
            height: "115%",
            objectFit: "cover",
            filter: "blur(40px) brightness(0.45)",
          }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div style={{ fontFamily: "Ubuntu", fontWeight: 300, fontSize: 72, color: "#fff", lineHeight: 1 }}>
            {hh}:{mm}
          </div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.85)" }}>
            {dateStr}
          </div>
          <div style={{ marginTop: 56, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            Click or press any key to unlock
          </div>
        </div>
      </div>
    </div>
  );
}
