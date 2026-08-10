import { useEffect, useRef, useState } from "react";
import { useOs } from "../../../os/store";

interface LogLine { text: string; ok?: boolean }

/** Hardcoded dmesg/systemd-style boot log — mixes real-looking kernel
 * messages with the seeded easter eggs. `ok` lines render like a
 * systemd unit-start line with a green "[ OK ]" tag; the rest render
 * like raw dmesg lines with a monotonically increasing timestamp. */
const LINES: LogLine[] = [
  { text: "Linux version 6.8.0-51-generic (buildd@lcy02-amd64-119) (Ubuntu 13.2.0-23ubuntu4) #52-Ubuntu SMP PREEMPT_DYNAMIC" },
  { text: "Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-51-generic root=UUID=8f14e45f-ceea-4a67-b7c1-3a2f0e9d1b2c ro quiet splash" },
  { text: "KERNEL supported cpus: Intel, AMD, Centaur, Zhaoxin" },
  { text: "BIOS-provided physical RAM map:" },
  { text: "BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable" },
  { text: "BIOS-e820: [mem 0x0000000000100000-0x00000000bffdffff] usable" },
  { text: "NX (Execute Disable) protection: active" },
  { text: "SMBIOS 3.2.0 present." },
  { text: "DMI: QEMU Standard PC (Q35 + ICH9, 2009), BIOS 1.16.3-debian-1.16.3-2 04/01/2014" },
  { text: "tsc: Fast TSC calibration using PIT" },
  { text: "Zone ranges: DMA [mem 0x0000000000001000-0x0000000000ffffff]" },
  { text: "ACPI: Early table checksum verification disabled" },
  { text: "ACPI: RSDP 0x00000000000F5140 000024 (v02 BOCHS )" },
  { text: "SRAT: PXM 0 -> APIC 0x00 -> Node 0" },
  { text: "PM: Registered nosave memory: [mem 0x000a0000-0x000fffff]" },
  { text: "Basketball Vibration Sensor detected on bus 23" },
  { text: "spider-sense: calibrated (tingle threshold = 0.42)" },
  { text: "usb 1-1: new high-speed USB device number 2 using xhci_hcd" },
  { text: "usb 1-1: New USB device found, idVendor=046d, idProduct=c52b" },
  { text: "input: Logitech USB Receiver as /devices/pci0000:00/0000:00:14.0/usb1/1-1/1-1:1.0/input/input4" },
  { text: "EXT4-fs (sda2): mounted filesystem with ordered data mode. Quota mode: none." },
  { text: "systemd[1]: Inserted module 'autofs4'" },
  { text: "random: crng init done" },
  { text: "Started Journal Service.", ok: true },
  { text: "Starting Load Kernel Modules..." },
  { text: "Finished Load Kernel Modules.", ok: true },
  { text: "Mounting /boot/efi..." },
  { text: "Mounted /boot/efi.", ok: true },
  { text: "NetworkManager: starting" },
  { text: "Started Network Manager.", ok: true },
  { text: "Starting Network Manager Wait Online..." },
  { text: "Started D-Bus System Message Bus.", ok: true },
  { text: "bluetoothd[812]: Bluetooth daemon 5.66" },
  { text: "Started Bluetooth service.", ok: true },
  { text: "thermal_sys: CPU0: Package temperature/speed normal" },
  { text: "systemd[1]: Started hoops.service - Daily Free Throw Practice." },
  { text: "Starting Accounts Service..." },
  { text: "Started Accounts Service.", ok: true },
  { text: "Reached target Graphical Interface.", ok: true },
  { text: "Starting GNOME Display Manager..." },
  { text: "gdm-launch-environment]: pam_unix(gdm-launch-environment:session): session opened" },
  { text: "Started GNOME Display Manager.", ok: true },
];

const STEP_MS = 30;
const SKIP_AFTER_MS = 300;

export default function KernelLog() {
  const bootTo = useOs(s => s.bootTo);
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stream one line every 30ms.
  useEffect(() => {
    if (count >= LINES.length) return;
    const t = setTimeout(() => setCount(c => c + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [count]);

  // Autoscroll to the newest line.
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  // Natural completion boots on to Plymouth after a brief hold.
  useEffect(() => {
    if (count < LINES.length) return;
    const t = setTimeout(() => bootTo("plymouth"), SKIP_AFTER_MS);
    return () => clearTimeout(t);
  }, [count, bootTo]);

  // Any key or click skips straight to Plymouth.
  useEffect(() => {
    const skip = () => bootTo("plymouth");
    window.addEventListener("keydown", skip);
    window.addEventListener("click", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
  }, [bootTo]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto bg-black p-4"
      style={{ fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.5 }}
    >
      {LINES.slice(0, count).map((l, i) => (
        <div key={i} className="whitespace-pre-wrap" style={{ color: "#d0d0d0" }}>
          {l.ok ? (
            <span style={{ color: "#4ADE80" }}>[  OK  ]</span>
          ) : (
            <span style={{ color: "#7a7a7a" }}>{`[${(i * 0.083217).toFixed(6).padStart(9, " ")}]`}</span>
          )}{" "}
          {l.text}
        </div>
      ))}
    </div>
  );
}
