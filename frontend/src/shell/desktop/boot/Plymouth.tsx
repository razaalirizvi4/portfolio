import { useEffect } from "react";
import { useOs } from "../../../os/store";

const DOT_COUNT = 5;
const HOLD_MS = 2200;

export default function Plymouth() {
  const bootTo = useOs(s => s.bootTo);

  // Auto-advance to GDM after the splash has had its moment.
  useEffect(() => {
    const t = setTimeout(() => bootTo("gdm"), HOLD_MS);
    return () => clearTimeout(t);
  }, [bootTo]);

  // Any key or click skips straight to GDM.
  useEffect(() => {
    const skip = () => bootTo("gdm");
    window.addEventListener("keydown", skip);
    window.addEventListener("click", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
  }, [bootTo]);

  return (
    <div
      className="h-full flex flex-col items-center justify-center gap-10"
      style={{ background: "#2C2137" }}
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
      <div className="flex gap-4">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: "1px solid #E95420",
              display: "inline-block",
              animation: "plymouth-dot-fill 1.6s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes plymouth-dot-fill {
          0%, 60%, 100% { background-color: transparent; }
          25% { background-color: #E95420; }
        }
      `}</style>
    </div>
  );
}
