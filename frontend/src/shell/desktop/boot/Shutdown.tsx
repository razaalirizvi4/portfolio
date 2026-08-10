import { useEffect, useState } from "react";
import { useOs } from "../../../os/store";

const REVERSE_MS = 1200;

/** Reverse-Plymouth (fading wordmark) then a BIOS-style black screen
 * that waits for any key/click to power back on via restart(). */
export default function Shutdown() {
  const restart = useOs(s => s.restart);
  const [phase, setPhase] = useState<"reverse" | "black">("reverse");

  useEffect(() => {
    const t = setTimeout(() => setPhase("black"), REVERSE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "black") return;
    const onAny = () => restart();
    window.addEventListener("keydown", onAny);
    window.addEventListener("click", onAny);
    return () => {
      window.removeEventListener("keydown", onAny);
      window.removeEventListener("click", onAny);
    };
  }, [phase, restart]);

  if (phase === "reverse") {
    return (
      <div
        className="h-full flex flex-col items-center justify-center"
        style={{ background: "#2C2137", animation: `shutdown-fade ${REVERSE_MS}ms ease-in forwards` }}
      >
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 300,
            fontSize: 46,
            color: "#ffffff",
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "flex-start",
            lineHeight: 1,
          }}
        >
          ubuntu
          <sup style={{ fontSize: 15, marginTop: 4 }}>&reg;</sup>
        </div>
        <style>{`@keyframes shutdown-fade { from { opacity: 1; } to { opacity: 0; } }`}</style>
      </div>
    );
  }

  return (
    <div className="h-full bg-black p-4" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#d0d0d0" }}>
      <div>It is now safe to close this tab.</div>
      <div style={{ opacity: 0.4, marginTop: 8 }}>[ Press any key to power on ]</div>
    </div>
  );
}
