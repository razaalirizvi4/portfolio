import { useEffect, useRef, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { evaluate } from "../../os/arith";
import { swish } from "../../os/sound";

/* ------------------------------------------------------------------ *
 * GNOME Calculator — basic mode.
 * Expression line (small) shows what's being typed; result line
 * (large, right-aligned) shows the live-evaluated value. A history
 * strip above the display keeps the last three evaluations, tagging
 * any result of exactly 23 or 24 with a 🐐 (spec tribute).
 * ------------------------------------------------------------------ */

type Btn = "C" | "(" | ")" | "⌫" | "/" | "7" | "8" | "9" | "×" | "4" | "5" | "6" | "−" | "1" | "2" | "3" | "+" | "0" | "." | "%" | "=";

const GRID: Btn[] = ["C", "(", ")", "⌫", "/", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "%", "="];

// Digits / parens / dot restart a fresh expression right after "=";
// operators continue chaining from the previous result.
const OPERATORS = new Set(["+", "−", "×", "/", "%"]);

function toEvalString(expr: string): string {
  return expr.replace(/×/g, "*").replace(/−/g, "-");
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  if (Number.isInteger(n)) return n.toString();
  const rounded = parseFloat(n.toFixed(10));
  return rounded.toString();
}

function liveValue(expr: string): number | null {
  if (!expr.trim()) return null;
  try {
    const v = evaluate(toEvalString(expr));
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

interface HistoryEntry { expr: string; result: string }

export default function Calculator(_: AppProps) {
  const theme = useOs(s => s.settings.theme);
  const light = theme === "light";

  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const justEvaluatedRef = useRef(false);

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => { rootRef.current?.focus(); }, []);

  function inputDigitOrParen(ch: string) {
    if (justEvaluatedRef.current) {
      justEvaluatedRef.current = false;
      setExpr(ch);
      return;
    }
    setExpr(e => e + ch);
  }

  function inputOperator(op: string) {
    if (justEvaluatedRef.current) {
      justEvaluatedRef.current = false;
      setExpr(e => e + op); // chain from the previous result, which `expr` already holds
      return;
    }
    setExpr(e => (e === "" && op !== "−" ? e : e + op));
  }

  function clearAll() {
    justEvaluatedRef.current = false;
    setExpr("");
  }

  function backspace() {
    justEvaluatedRef.current = false;
    setExpr(e => e.slice(0, -1));
  }

  function doEquals() {
    if (!expr.trim()) return;
    let v: number;
    try {
      v = evaluate(toEvalString(expr));
    } catch {
      return;
    }
    if (!Number.isFinite(v)) return;
    const resultStr = fmt(v);
    const isGoat = v === 23 || v === 24;
    const tagged = isGoat ? `${resultStr} 🐐` : resultStr;
    if (isGoat) swish();
    setHistory(h => [{ expr, result: tagged }, ...h].slice(0, 3));
    setExpr(resultStr);
    justEvaluatedRef.current = true;
  }

  function press(b: Btn) {
    switch (b) {
      case "C": clearAll(); return;
      case "⌫": backspace(); return;
      case "=": doEquals(); return;
      case "+": case "−": case "×": case "/": case "%": inputOperator(b); return;
      default: inputDigitOrParen(b); return;
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const k = e.key;
    if (k >= "0" && k <= "9") { e.preventDefault(); inputDigitOrParen(k); return; }
    if (k === ".") { e.preventDefault(); inputDigitOrParen("."); return; }
    if (k === "(" || k === ")") { e.preventDefault(); inputDigitOrParen(k); return; }
    if (k === "+") { e.preventDefault(); inputOperator("+"); return; }
    if (k === "-") { e.preventDefault(); inputOperator("−"); return; }
    if (k === "*") { e.preventDefault(); inputOperator("×"); return; }
    if (k === "/") { e.preventDefault(); inputOperator("/"); return; }
    if (k === "%") { e.preventDefault(); inputOperator("%"); return; }
    if (k === "Enter" || k === "=") { e.preventDefault(); doEquals(); return; }
    if (k === "Backspace") { e.preventDefault(); backspace(); return; }
    if (k === "Escape") { e.preventDefault(); clearAll(); return; }
  }

  const live = liveValue(expr);
  const resultDisplay = live !== null ? fmt(live) : (expr || "0");

  const bg = light ? "#F4F4F4" : "#241F31";
  const displayBg = light ? "#FFFFFF" : "#1E1926";
  const fg = light ? "#1a1a1a" : "#F2F0EC";
  const dim = light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
  const border = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)";
  const keyBg = light ? "#FFFFFF" : "#332C3E";
  const keyBgOp = light ? "#E7E7E7" : "#3D3648";
  const keyBgUtil = light ? "#E2E2E2" : "#463D53";

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{
        height: "100%", display: "flex", flexDirection: "column", outline: "none",
        fontFamily: "var(--font-ui)", background: bg, color: fg, userSelect: "none",
      }}
    >
      {/* History strip */}
      <div style={{
        flexShrink: 0, padding: "8px 14px 0", display: "flex", flexDirection: "column", gap: 2,
        minHeight: 20 * 3 + 8, justifyContent: "flex-end",
      }}>
        {history.map((h, i) => (
          <div
            key={i}
            style={{
              fontSize: 12, color: dim, textAlign: "right", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis", opacity: 1 - i * 0.28,
            }}
          >
            {h.expr} = {h.result}
          </div>
        ))}
      </div>

      {/* Display */}
      <div style={{
        flexShrink: 0, background: displayBg, borderBottom: `1px solid ${border}`,
        padding: "10px 16px 14px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
      }}>
        <div style={{ fontSize: 14, color: dim, minHeight: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
          {expr || " "}
        </div>
        <div style={{
          fontSize: 34, fontWeight: 500, lineHeight: 1.1, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
          fontFamily: "var(--font-mono)",
        }}>
          {resultDisplay}
        </div>
      </div>

      {/* Button grid */}
      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "1fr",
        gap: 6, padding: 10,
      }}>
        {GRID.map((b, i) => {
          const isEquals = b === "=";
          const isUtil = b === "C" || b === "⌫" || b === "(" || b === ")";
          const isOp = OPERATORS.has(b);
          return (
            <button
              key={i}
              onClick={() => press(b)}
              style={{
                gridColumn: isEquals ? "1 / -1" : undefined,
                border: "none", borderRadius: 10, cursor: "pointer",
                fontSize: 18, fontWeight: isEquals ? 700 : 500,
                background: isEquals ? "var(--yaru-accent)" : isOp ? keyBgOp : isUtil ? keyBgUtil : keyBg,
                color: isEquals ? "#fff" : fg,
                fontFamily: /[0-9.]/.test(b) ? "var(--font-mono)" : "var(--font-ui)",
                transition: "filter 100ms ease",
              }}
              onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.9)")}
              onMouseUp={e => (e.currentTarget.style.filter = "none")}
              onMouseLeave={e => (e.currentTarget.style.filter = "none")}
            >
              {b}
            </button>
          );
        })}
      </div>
    </div>
  );
}
