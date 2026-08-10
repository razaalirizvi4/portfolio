import { useEffect, useState } from "react";
import { useOs } from "../../../os/store";
import { easterEggs } from "../../../content/easterEggs";

const ENTRIES = [
  "*Ubuntu",
  " Advanced options for Ubuntu",
  " Memory test (memtest86+x64.efi)",
  " Web-Slinger OS (experimental)",
];
const WEB_SLINGER_INDEX = ENTRIES.length - 1;
const AUTO_BOOT_SECONDS = 5;

const monoStyle: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 14 };

export default function Grub() {
  const bootTo = useOs(s => s.bootTo);
  const [selected, setSelected] = useState(0);
  const [countdown, setCountdown] = useState(AUTO_BOOT_SECONDS);
  const [cancelled, setCancelled] = useState(false);
  const [panic, setPanic] = useState(false);
  const [panicVisible, setPanicVisible] = useState<string[]>([]);

  function activate(index: number) {
    setCancelled(true);
    if (index === WEB_SLINGER_INDEX) setPanic(true);
    else bootTo("kernelLog");
  }

  // Auto-boot countdown — ticks once per second while nothing has cancelled it.
  useEffect(() => {
    if (cancelled || panic) return;
    if (countdown <= 0) {
      activate(selected);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, cancelled, panic]);

  // Arrow keys move the selection, Enter boots, any key cancels the countdown.
  useEffect(() => {
    if (panic) return;
    const onKey = (e: KeyboardEvent) => {
      setCancelled(true);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected(s => (s + 1) % ENTRIES.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected(s => (s - 1 + ENTRIES.length) % ENTRIES.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        activate(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panic, selected]);

  // Kernel-panic type-out, 80ms/line.
  useEffect(() => {
    if (!panic) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setPanicVisible(easterEggs.kernelPanicLines.slice(0, i));
      if (i >= easterEggs.kernelPanicLines.length) clearInterval(iv);
    }, 80);
    return () => clearInterval(iv);
  }, [panic]);

  // Once every panic line is on screen, hold 2.5s then boot anyway.
  useEffect(() => {
    if (!panic || panicVisible.length < easterEggs.kernelPanicLines.length) return;
    const t = setTimeout(() => bootTo("kernelLog"), 2500);
    return () => clearTimeout(t);
  }, [panic, panicVisible.length, bootTo]);

  if (panic) {
    return (
      <div className="h-full bg-black p-6" style={monoStyle}>
        {panicVisible.map((line, i) => (
          <div key={i} style={{ color: "#ff5c5c" }}>{line}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white flex flex-col items-center pt-10" style={monoStyle}>
      <div className="w-full max-w-3xl px-6">
        <p className="mb-6">GNU GRUB&nbsp;&nbsp;version 2.12</p>

        <div
          style={{ border: "3px double #ffffff" }}
          className="px-0 py-2"
        >
          {ENTRIES.map((label, i) => (
            <div
              key={label}
              onClick={() => activate(i)}
              onMouseEnter={() => setSelected(i)}
              style={{
                padding: "2px 12px",
                whiteSpace: "pre",
                cursor: "pointer",
                background: i === selected ? "#ffffff" : "transparent",
                color: i === selected ? "#000000" : "#ffffff",
              }}
            >
              {label}
            </div>
          ))}
          {/* padding rows to match a real GRUB menu box's fixed height */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`pad${i}`} style={{ padding: "2px 12px" }}>&nbsp;</div>
          ))}
        </div>

        <div className="mt-6 text-sm" style={{ color: "#b0b0b0" }}>
          <p>
            Use the ↑ and ↓ keys to select which entry is highlighted.
          </p>
          <p>
            Press enter to boot the selected OS, `e&apos; to edit the commands
            before booting or `c&apos; for a command line.
          </p>
        </div>

        {!cancelled && (
          <p className="mt-4 text-sm" style={{ color: "#b0b0b0" }}>
            The highlighted entry will be executed automatically in {countdown}s.
          </p>
        )}
      </div>
    </div>
  );
}
