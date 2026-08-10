import { useOs } from "../../os/store";

/** Temporary stub — replaced by the real desktop shell in Task 7. */
export default function Desktop() {
  const lock = useOs(s => s.lock);
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 bg-black text-white">
      <p style={{ fontFamily: "var(--font-mono)" }}>desktop</p>
      <button
        onClick={lock}
        className="px-4 py-2 rounded"
        style={{ background: "var(--yaru-orange)", color: "#fff" }}
      >
        Lock
      </button>
    </div>
  );
}
