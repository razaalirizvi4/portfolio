import { useOs } from "../../os/store";

/** Temporary stub — replaced by the real GDM login screen in Task 8. */
export default function Gdm() {
  const login = useOs(s => s.login);
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 bg-black text-white">
      <p style={{ fontFamily: "var(--font-mono)" }}>gdm: awaiting login…</p>
      <button
        onClick={login}
        className="px-4 py-2 rounded"
        style={{ background: "var(--yaru-orange)", color: "#fff" }}
      >
        Log in
      </button>
    </div>
  );
}
