import { Suspense, type FC } from "react";
import { motion } from "framer-motion";
import { getManifest } from "../../os/apps";
import { IOS_FONT } from "./IosStatusBar";

/** Simple centered spinner for lazy app chunks. */
const Spinner: FC = () => (
  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration: 0.9 }}
      style={{
        width: 30, height: 30, borderRadius: "50%",
        border: "3px solid rgba(150,150,150,0.25)", borderTopColor: "#0a84ff",
      }}
    />
  </div>
);

const ChevronLeft: FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,5 8,12 15,19" />
  </svg>
);

interface Props {
  appId: string;
  title: string;
  appProps?: Record<string, unknown>;
  theme: "dark" | "light";
  onHome: () => void;
}

/**
 * Fullscreen iOS app sheet: spring slide-up, an iOS nav bar (back chevron +
 * "Home" + centered app name), and the shared app component mounted directly
 * with windowId="mobile".
 */
const IosAppFrame: FC<Props> = ({ appId, title, appProps, theme, onHome }) => {
  const manifest = getManifest(appId);
  const Comp = manifest.component;
  const light = theme === "light";

  const navBg = light ? "rgba(249,249,249,0.92)" : "rgba(28,28,30,0.92)";
  const fg = light ? "#111" : "#fff";
  const border = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)";
  const bodyBg = light ? "#ffffff" : "#1c1c1e";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        background: bodyBg, borderTopLeftRadius: 12, borderTopRightRadius: 12,
        overflow: "hidden", fontFamily: IOS_FONT,
      }}
    >
      {/* iOS nav bar */}
      <div style={{
        height: 46, flexShrink: 0, position: "relative",
        display: "flex", alignItems: "center", padding: "0 8px",
        background: navBg, borderBottom: `1px solid ${border}`, color: fg,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        <button
          onClick={onHome}
          style={{
            display: "flex", alignItems: "center", gap: 1, border: "none", background: "none",
            color: "#0a84ff", cursor: "pointer", fontSize: 16, fontFamily: IOS_FONT, padding: "4px 6px",
          }}
        >
          <ChevronLeft />
          <span>Home</span>
        </button>
        <div style={{
          position: "absolute", left: 0, right: 0, textAlign: "center",
          fontSize: 16, fontWeight: 600, pointerEvents: "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 90px",
        }}>
          {title}
        </div>
      </div>

      {/* App content — shared component, mounted directly (no window chrome). */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: bodyBg }}>
        <Suspense fallback={<Spinner />}>
          <Comp windowId="mobile" props={appProps} />
        </Suspense>
      </div>
    </motion.div>
  );
};

export default IosAppFrame;
