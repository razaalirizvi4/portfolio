import { useEffect, useRef, useState } from "react";
import type { AppProps } from "../../os/apps";

/* ------------------------------------------------------------------ *
 * DOOM — shareware, running in-browser via js-dos v8 (DOSBox on WASM).
 *
 * Assets are static files under public/doom/ (fetched once via
 * `node scripts/fetch-doom.mjs`, not part of the JS bundle):
 *   public/doom/doom.jsdos        — the js-dos game bundle (WAD + config)
 *   public/doom/jsdos/js-dos.js   — js-dos v8 player runtime (sets window.Dos)
 *   public/doom/jsdos/js-dos.css  — player chrome styles
 *   public/doom/jsdos/emulators/  — DOSBox WASM backends, loaded via pathPrefix
 *                                    so nothing round-trips to a CDN at runtime.
 *
 * If any asset is missing (script never run, or the CDN fetch failed),
 * this renders a themed "DOOM.WAD not found" screen instead of a blank
 * or broken window — the app stays complete either way.
 * ------------------------------------------------------------------ */

const JSDOS_CSS = "/doom/jsdos/js-dos.css";
const JSDOS_JS = "/doom/jsdos/js-dos.js";
const DOOM_BUNDLE = "/doom/doom.jsdos";
const EMULATORS_PREFIX = "/doom/jsdos/emulators/";

interface DosApi {
  stop(): Promise<void>;
  [key: string]: unknown;
}
interface DosOptions {
  url?: string;
  pathPrefix?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    Dos?: (el: HTMLDivElement, options?: DosOptions) => DosApi;
  }
}

/** Injects js-dos.css + js-dos.js once (module-level, survives remounts) and
 *  resolves once `window.Dos` is callable. */
let jsdosLoad: Promise<void> | null = null;
function loadJsDos(): Promise<void> {
  if (window.Dos) return Promise.resolve();
  if (jsdosLoad) return jsdosLoad;
  jsdosLoad = new Promise((resolve, reject) => {
    if (!document.getElementById("jsdos-css")) {
      const link = document.createElement("link");
      link.id = "jsdos-css";
      link.rel = "stylesheet";
      link.href = JSDOS_CSS;
      document.head.appendChild(link);
    }
    const existing = document.getElementById("jsdos-script") as HTMLScriptElement | null;
    if (existing) {
      if (window.Dos) { resolve(); return; }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("js-dos script failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = "jsdos-script";
    script.src = JSDOS_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("js-dos script failed to load"));
    document.body.appendChild(script);
  });
  return jsdosLoad;
}

type Phase = "checking" | "booting" | "playing" | "unavailable";

export default function Doom(_: AppProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dosRef = useRef<DosApi | null>(null);
  const [phase, setPhase] = useState<Phase>("checking");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      // Verify assets actually exist before touching the DOM/network stack —
      // a 404 here means the fetch script was never run (or the CDN blocked it).
      const [bundleOk, jsOk] = await Promise.all([
        fetch(DOOM_BUNDLE, { method: "HEAD" }).then(r => r.ok).catch(() => false),
        fetch(JSDOS_JS, { method: "HEAD" }).then(r => r.ok).catch(() => false),
      ]);
      if (cancelled) return;
      if (!bundleOk || !jsOk) { setPhase("unavailable"); return; }

      setPhase("booting");
      try {
        await loadJsDos();
        if (cancelled || !stageRef.current || !window.Dos) {
          if (!cancelled) setPhase("unavailable");
          return;
        }
        const dos = window.Dos(stageRef.current, {
          url: DOOM_BUNDLE,
          pathPrefix: EMULATORS_PREFIX,
        });
        dosRef.current = dos;
        if (!cancelled) setPhase("playing");
      } catch {
        if (!cancelled) setPhase("unavailable");
      }
    }
    void boot();

    return () => {
      cancelled = true;
      dosRef.current?.stop().catch(() => {});
      dosRef.current = null;
    };
  }, []);

  const showStage = phase === "booting" || phase === "playing";

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: "#0a0a0a", fontFamily: "var(--font-ui)",
    }}>
      {/* Stage */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {phase === "unavailable" ? (
          <UnavailableScreen />
        ) : (
          <>
            {showStage && (
              <div
                ref={stageRef}
                style={{
                  aspectRatio: "4 / 3", height: "100%", maxWidth: "100%", maxHeight: "100%", width: "auto",
                  background: "#000",
                }}
              />
            )}
            {phase !== "playing" && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 14, pointerEvents: "none",
              }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: "3px solid rgba(233,84,32,0.25)", borderTopColor: "#E95420",
                    animation: "doom-spin 0.9s linear infinite",
                  }}
                />
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, letterSpacing: 0.4 }}>
                  Summoning demons…
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer hint bar */}
      <div style={{
        flexShrink: 0, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
        borderTop: "1px solid rgba(255,255,255,0.08)", background: "#141414",
        fontFamily: "var(--font-mono)", fontSize: 11.5, color: "rgba(255,255,255,0.45)", letterSpacing: 0.2,
      }}>
        Click to capture mouse · Esc to release · IDDQD if you must
      </div>

      <style>{`@keyframes doom-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Themed fallback when DOOM.WAD (or the js-dos runtime) isn't present. */
function UnavailableScreen() {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center",
      background: "radial-gradient(ellipse at center, #1a0505 0%, #0a0a0a 70%)", padding: 24,
    }}>
      <div style={{ fontSize: 13, letterSpacing: 3, color: "#7a1010", fontWeight: 700 }}>
        E1M1 · HANGAR
      </div>
      <div style={{
        fontFamily: "var(--font-ui)", fontSize: 26, fontWeight: 900, letterSpacing: 1,
        color: "#C7302B", textShadow: "0 0 18px rgba(199,48,43,0.55)",
      }}>
        DOOM.WAD NOT FOUND
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", maxWidth: 340, lineHeight: 1.5 }}>
        The demons won this round. Run <code style={{ color: "#E95420", fontFamily: "var(--font-mono)" }}>node scripts/fetch-doom.mjs</code> to
        pull down the shareware WAD and try again.
      </div>
    </div>
  );
}
