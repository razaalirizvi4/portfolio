import { useOs } from "../../os/store";

/** Temporary stub — replaced by the real lock screen in Task 7/8. */
export default function LockScreen() {
  const unlock = useOs(s => s.unlock);
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 bg-black text-white">
      <p style={{ fontFamily: "var(--font-mono)" }}>locked</p>
      <button
        onClick={unlock}
        className="px-4 py-2 rounded"
        style={{ background: "var(--yaru-orange)", color: "#fff" }}
      >
        Unlock
      </button>
    </div>
  );
}
