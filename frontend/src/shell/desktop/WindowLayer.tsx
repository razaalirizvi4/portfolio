import { useEffect, useState, type FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOs } from "../../os/store";
import WindowFrame from "./WindowFrame";
import { zoneRect, type PreviewZone } from "./windowGeometry";

/** Tracks the viewport so maximized / snapped windows follow window resizes. */
function useViewport() {
  const [size, setSize] = useState({ vw: window.innerWidth, vh: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

/** Renders every visible window on the active workspace, ordered by z. */
const WindowLayer: FC = () => {
  const windows = useOs(s => s.windows);
  const activeWorkspace = useOs(s => s.activeWorkspace);
  const { vw, vh } = useViewport();
  const [preview, setPreview] = useState<PreviewZone | null>(null);

  const visible = windows
    .filter(w => w.workspace === activeWorkspace && w.mode !== "minimized")
    .sort((a, b) => a.z - b.z);

  const pr = preview ? zoneRect(preview.kind, vw, vh) : null;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, pointerEvents: "none" }}>
      <AnimatePresence>
        {visible.map(w => (
          <WindowFrame key={w.id} w={w} vw={vw} vh={vh} onPreview={setPreview} />
        ))}
      </AnimatePresence>

      {/* Snap / maximize drop-zone preview */}
      <AnimatePresence>
        {pr && (
          <motion.div
            key="snap-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "fixed",
              left: pr.x, top: pr.y, width: pr.w, height: pr.h,
              background: "rgba(233,84,32,0.28)",
              border: "2px solid rgba(233,84,32,0.9)",
              borderRadius: preview?.kind === "max" ? 0 : 8,
              pointerEvents: "none", zIndex: 9999,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WindowLayer;
