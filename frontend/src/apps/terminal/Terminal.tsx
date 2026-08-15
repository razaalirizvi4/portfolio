import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { vfs } from "../../os/vfsInstance";
import { HOME } from "../../os/vfs";
import { runLine, runRepl, complete, type ShellCtx } from "./shell";

const COLORS: Record<string, string> = {
  g: "#26A269", // green
  o: "#E9AD0C", // orange/amber
  r: "#C01C28", // red
  b: "#2A7BDE", // bold-blue (dirs)
  n: "#F2F0EC", // reset / default foreground
};
const FG = "#F2F0EC";

function abbrevCwd(cwd: string): string {
  return cwd === HOME ? "~" : cwd.startsWith(HOME + "/") ? "~" + cwd.slice(HOME.length) : cwd;
}

// Parse a line with §-style tokens into styled React spans.
function renderLine(line: string, key: number) {
  const parts = line.split("§");
  const spans: React.ReactNode[] = [];
  // first part has no marker → default color
  if (parts[0]) spans.push(<span key={`${key}-0`}>{parts[0]}</span>);
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i];
    const marker = seg[0];
    if (marker in COLORS) {
      const text = seg.slice(1);
      const bold = marker === "b";
      spans.push(
        <span key={`${key}-${i}`} style={{ color: COLORS[marker], fontWeight: bold ? 700 : 400 }}>
          {text}
        </span>,
      );
    } else {
      // unknown marker: render literally
      spans.push(<span key={`${key}-${i}`}>§{seg}</span>);
    }
  }
  return (
    <div key={key} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", minHeight: "1.2em" }}>
      {spans.length ? spans : " "}
    </div>
  );
}

// ---- animation sprites ----
const SPIDER_MOBILE = [
  "      ___________",
  "  ___/ |#|#|#|#| \\___",
  " /   SPIDER-MOBILE   \\",
  "|  __      web     __ |",
  " \\/O \\___________/ O\\/",
  "  \\__/           \\__/ ",
];
const BALL_ARC = [0, 2, 4, 5, 6, 4, 2, 0]; // row of `o` per frame
const BALL_H = 7;

export default function Terminal({ windowId }: AppProps) {
  const closeWindow = useOs(s => s.closeWindow);
  const openApp = useOs(s => s.openApp);

  const [buffer, setBuffer] = useState<string[]>([
    "§gWelcome to RazaOS Terminal§n — type §ohelp§n… just kidding, try §oneofetch§n.",
    "",
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState(HOME);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<"shell" | "python">("shell");
  const [anim, setAnim] = useState<string[] | null>(null);
  const animating = anim !== null;

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cwdRef = useRef(cwd);
  cwdRef.current = cwd;

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [buffer, anim, input, mode]);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  useEffect(() => { focusInput(); }, [focusInput]);

  const append = useCallback((lines: string[]) => setBuffer(b => [...b, ...lines]), []);

  const ctx: ShellCtx = {
    cwd,
    setCwd: (p) => setCwd(p),
    openApp: (id) => openApp(id),
    closeWindow: () => closeWindow(windowId),
  };

  const promptEcho = (line: string) =>
    `§graza@ubuntu§n:§b${abbrevCwd(cwdRef.current)}§n$ ${line}`;

  function runAnimation(frames: string[][], intervalMs: number, finalLines: string[]) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let i = 0;
    setAnim(frames[0] ?? []);
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= frames.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setAnim(null);
        if (finalLines.length) append(finalLines);
        focusInput();
        return;
      }
      setAnim(frames[i]);
    }, intervalMs);
  }

  function playSL() {
    const maxLen = Math.max(...SPIDER_MOBILE.map(l => l.length));
    const frames: string[][] = [];
    for (let off = 46; off >= -maxLen; off -= 3) {
      frames.push(
        SPIDER_MOBILE.map(l => {
          if (off >= 0) return " ".repeat(off) + l;
          return l.slice(-off);
        }),
      );
    }
    runAnimation(frames, 70, []);
  }

  function playBall() {
    const frames: string[][] = BALL_ARC.map(row => {
      const grid: string[] = [];
      for (let r = 0; r < BALL_H; r++) grid.push(r === row ? "     o" : "");
      grid.push("   ‾‾‾‾‾");
      return grid;
    });
    runAnimation(frames, 90, ["§oswish.§n"]);
  }

  function handleOutput(out: string[]) {
    const first = out[0];
    if (first === "§CLEAR") { setBuffer([]); return; }
    if (first === "§SL") { playSL(); return; }
    if (first === "§BALL") { playBall(); return; }
    if (first === "§THWIP") { useOs.getState().fireEffect("thwip"); append(["*thwip*"]); return; }
    if (first === "§HISTORY") {
      append(history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`));
      return;
    }
    if (first === "§PYTHON") { setMode("python"); append(out.slice(1)); return; }
    append(out);
  }

  function submit() {
    const line = input;
    if (mode === "python") {
      append([`>>> ${line}`]);
    } else {
      append([promptEcho(line)]);
    }
    if (line.trim()) setHistory(h => [...h, line]);
    setInput("");
    setHistIdx(null);

    if (mode === "python") {
      const { output, exit } = runRepl(line);
      if (exit) setMode("shell");
      else append(output);
      return;
    }
    const out = runLine(line, ctx, vfs);
    handleOutput(out);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      if (mode === "python") { append([`>>> ${input}`, "KeyboardInterrupt"]); }
      else { append([`${promptEcho(input)}^C`]); }
      setInput("");
      setHistIdx(null);
      return;
    }
    if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
      e.preventDefault();
      setBuffer([]);
      return;
    }
    if (animating) { e.preventDefault(); return; }

    if (e.key === "Enter") { e.preventDefault(); submit(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      if (mode === "python") return;
      const res = complete(input, cwd, vfs);
      if (res) setInput(res);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (mode === "python" || history.length === 0) return;
      const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (mode === "python" || histIdx === null) return;
      const idx = histIdx + 1;
      if (idx >= history.length) { setHistIdx(null); setInput(""); }
      else { setHistIdx(idx); setInput(history[idx]); }
      return;
    }
  }

  const promptPrefix = mode === "python" ? null : (
    <>
      <span style={{ color: COLORS.g, fontWeight: 700 }}>raza@ubuntu</span>
      <span style={{ color: FG }}>:</span>
      <span style={{ color: COLORS.b, fontWeight: 700 }}>{abbrevCwd(cwd)}</span>
      <span style={{ color: FG }}>$&nbsp;</span>
    </>
  );

  return (
    <div
      className="term-root"
      onMouseDown={(e) => {
        // let selections work; focus input on plain clicks
        if (window.getSelection()?.toString()) return;
        e.preventDefault();
        focusInput();
      }}
      style={{
        height: "100%",
        background: "var(--terminal-bg)",
        color: FG,
        fontFamily: "var(--font-mono)",
        fontSize: 14,
        lineHeight: 1.35,
        padding: "8px 10px",
        overflow: "hidden",
        cursor: "text",
      }}
    >
      <div ref={scrollRef} style={{ height: "100%", overflowY: "auto" }}>
        {buffer.map((l, i) => renderLine(l, i))}
        {anim && anim.map((l, i) => renderLine(l, 100000 + i))}
        {!animating && (
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {mode === "python"
              ? <span style={{ color: COLORS.g }}>&gt;&gt;&gt;&nbsp;</span>
              : promptPrefix}
            <span>{input}</span>
            <span className="term-cursor" />
          </div>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          style={{
            position: "absolute",
            opacity: 0,
            width: 1,
            height: 1,
            padding: 0,
            border: 0,
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}
