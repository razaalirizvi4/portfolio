import { useState, type FC, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import type { OsSettings } from "../../os/types";
import { profile } from "../../content/profile";
import { WifiIcon, VolumeIcon, PowerIcon, SearchIcon, UserAvatar } from "../../ui/icons";

/* ------------------------------------------------------------------ *
 * Tiny inline nav glyphs — 24x24, stroke=currentColor. GNOME Settings
 * categories that don't already have an icon in ui/icons.tsx.
 * ------------------------------------------------------------------ */
const navSym = (size = 18) => ({
  width: size, height: size, viewBox: "0 0 24 24",
  fill: "none" as const, stroke: "currentColor", strokeWidth: 2,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
});

const BluetoothIcon: FC = () => (
  <svg {...navSym()}><path d="M7 8 l10 8 -5 4 V4 l5 4 -10 8" /></svg>
);
const AppearanceIcon: FC = () => (
  <svg {...navSym()}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.6" fill="currentColor" stroke="none" />
    <path d="M3.5 15.5 l4.5 -4.5 3.5 3.5 4.5 -4.5 4.5 4.5" />
  </svg>
);
const BellIcon: FC = () => (
  <svg {...navSym()}>
    <path d="M6 10 a6 6 0 0 1 12 0 c0 4 1.5 5.5 2 6.5 H4 c0.5 -1 2 -2.5 2 -6.5z" />
    <path d="M10 19 a2 2 0 0 0 4 0" />
  </svg>
);
const UsersIcon: FC = () => (
  <svg {...navSym()}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20 c0 -4 3 -6 6 -6 s6 2 6 6" />
    <circle cx="17.5" cy="9.5" r="2.3" />
    <path d="M15.7 14.2 c2.6 0.5 4.3 2.5 4.3 5.8" />
  </svg>
);
const ShieldIcon: FC = () => (
  <svg {...navSym()}>
    <path d="M12 3 l7 3 v6 c0 4.5 -3 7.5 -7 9 c-4 -1.5 -7 -4.5 -7 -9 V6 z" />
    <path d="M9 12 l2 2 4 -4" />
  </svg>
);
const DisplaysIcon: FC = () => (
  <svg {...navSym()}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M9 20 h6 M12 16 v4" />
  </svg>
);
const InfoIcon: FC = () => (
  <svg {...navSym()}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);
const LockGlyph: FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
  </svg>
);
const CheckGlyph: FC<{ size?: number; color?: string }> = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5,13 10,18 19,7" />
  </svg>
);

/* ------------------------------------------------------------------ *
 * Data
 * ------------------------------------------------------------------ */
interface NavItem { id: string; label: string; icon: ReactNode }
const NAV: NavItem[] = [
  { id: "wifi", label: "Wi-Fi", icon: <WifiIcon size={18} /> },
  { id: "bluetooth", label: "Bluetooth", icon: <BluetoothIcon /> },
  { id: "appearance", label: "Appearance", icon: <AppearanceIcon /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon /> },
  { id: "search", label: "Search", icon: <SearchIcon size={18} /> },
  { id: "users", label: "Users", icon: <UsersIcon /> },
  { id: "privacy", label: "Privacy", icon: <ShieldIcon /> },
  { id: "sound", label: "Sound", icon: <VolumeIcon size={18} /> },
  { id: "power", label: "Power", icon: <PowerIcon size={18} /> },
  { id: "displays", label: "Displays", icon: <DisplaysIcon /> },
  { id: "about", label: "About", icon: <InfoIcon /> },
];
const YARU_ACCENTS: { name: string; hex: string }[] = [
  { name: "Orange", hex: "#E95420" },
  { name: "Bark", hex: "#787859" },
  { name: "Sage", hex: "#657B69" },
  { name: "Olive", hex: "#4B8501" },
  { name: "Viridian", hex: "#03875B" },
  { name: "Prussian", hex: "#308280" },
  { name: "Blue", hex: "#0073E5" },
  { name: "Purple", hex: "#7764D8" },
  { name: "Magenta", hex: "#B34CB3" },
  { name: "Red", hex: "#DA3450" },
];

const WALLPAPERS: { src: string; label: string }[] = [
  { src: "/wallpapers/noble.svg", label: "Noble Numbat" },
  { src: "/wallpapers/dark.svg", label: "Midnight" },
  { src: "/wallpapers/spiderman.svg", label: "Spider-Man" },
  { src: "/wallpapers/court.svg", label: "MSG Courtside" },
];

const CONNECTED_SSID = "FAST-NUCES-Guest";
interface NetworkDef { ssid: string; strength: "strong" | "weak"; secured: boolean }
const NETWORKS: NetworkDef[] = [
  { ssid: "Stark_Industries_5G", strength: "strong", secured: true },
  { ssid: "Daily Bugle Free WiFi", strength: "weak", secured: false },
  { ssid: "MSG-Court-Side", strength: "weak", secured: true },
];

/* ------------------------------------------------------------------ *
 * Shared bits
 * ------------------------------------------------------------------ */
interface Ctx { light: boolean; fg: string; dim: string; border: string; card: string }

const SectionHeader: FC<{ title: string }> = ({ title }) => (
  <h1 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 20px" }}>{title}</h1>
);

const GroupLabel: FC<{ children: ReactNode; dim: string }> = ({ children, dim }) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: dim, textTransform: "uppercase", letterSpacing: 0.5, margin: "22px 2px 8px" }}>
    {children}
  </div>
);

const Card: FC<{ children: ReactNode; ctx: Ctx }> = ({ children, ctx }) => (
  <div style={{ borderRadius: 10, border: `1px solid ${ctx.border}`, background: ctx.card, overflow: "hidden" }}>
    {children}
  </div>
);

const InfoRow: FC<{ label: string; value: ReactNode; ctx: Ctx; last?: boolean }> = ({ label, value, ctx, last }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    padding: "11px 14px", borderBottom: last ? "none" : `1px solid ${ctx.border}`, fontSize: 13,
  }}>
    <span style={{ color: ctx.dim }}>{label}</span>
    <span style={{ textAlign: "right", wordBreak: "break-word" }}>{value}</span>
  </div>
);

const Switch: FC<{ checked: boolean; onChange: () => void; ariaLabel: string }> = ({ checked, onChange, ariaLabel }) => (
  <button
    role="switch" aria-checked={checked} aria-label={ariaLabel} onClick={onChange}
    style={{
      width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
      background: checked ? "var(--yaru-accent)" : "rgba(128,128,128,0.4)", flexShrink: 0,
      transition: "background 150ms ease", padding: 0,
    }}
  >
    <span style={{
      position: "absolute", top: 2, left: checked ? 20 : 2, width: 20, height: 20, borderRadius: "50%",
      background: "#fff", transition: "left 150ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
    }} />
  </button>
);

const EmptyState: FC<{ icon: ReactNode; ctx: Ctx }> = ({ icon, ctx }) => (
  <div style={{
    height: "100%", minHeight: 320, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", color: ctx.dim,
  }}>
    <div style={{ opacity: 0.45, transform: "scale(2.4)" }}>{icon}</div>
    <div style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 260 }}>
      This panel is decorative.<br />Like most settings.
    </div>
  </div>
);

/* ------------------------------------------------------------------ *
 * Wi-Fi panel
 * ------------------------------------------------------------------ */
const SignalBars: FC<{ strength: "strong" | "weak" | "full"; color: string }> = ({ strength, color }) => {
  const bars = strength === "weak" ? 1 : strength === "strong" ? 2 : 3;
  return (
    <svg width={17} height={13} viewBox="0 0 17 13" aria-hidden>
      {[0, 1, 2].map(i => (
        <rect key={i} x={i * 6} y={13 - (i + 1) * 4} width={4} height={(i + 1) * 4} rx={1}
          fill={i < bars ? color : "rgba(128,128,128,0.35)"} />
      ))}
    </svg>
  );
};

const NetworkRow: FC<{
  ssid: string; strength: "strong" | "weak" | "full"; secured: boolean; connected?: boolean;
  onClick: () => void; ctx: Ctx; last?: boolean;
}> = ({ ssid, strength, secured, connected, onClick, ctx, last }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
      border: "none", cursor: "pointer", background: "transparent", color: ctx.fg,
      padding: "11px 14px", borderBottom: last ? "none" : `1px solid ${ctx.border}`, fontSize: 13,
    }}
  >
    <span style={{ width: 18, flexShrink: 0, display: "flex", justifyContent: "center" }}>
      {connected ? <CheckGlyph size={15} color="var(--yaru-accent)" /> : <span style={{ width: 15 }} />}
    </span>
    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {ssid}{connected && <span style={{ color: ctx.dim, fontWeight: 400 }}> — Connected</span>}
    </span>
    {secured && <LockGlyph size={13} />}
    <SignalBars strength={strength} color={ctx.fg} />
  </button>
);

const PasswordDialog: FC<{ ssid: string; onClose: () => void; ctx: Ctx }> = ({ ssid, onClose, ctx }) => {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  function tryConnect(e: React.FormEvent) {
    e.preventDefault();
    setError(true);
    setAttempt(a => a + 1);
  }

  const inputBg = ctx.light ? "#f2f2f2" : "#1E1926";

  return (
    <div
      onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center" }}
    >
      <motion.form
        key={attempt}
        onMouseDown={e => e.stopPropagation()}
        onSubmit={tryConnect}
        animate={error ? { x: [0, -9, 9, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{
          width: 340, borderRadius: 12, background: ctx.card === "transparent" ? (ctx.light ? "#fff" : "#2b2b2b") : ctx.card,
          color: ctx.fg, padding: 20, boxShadow: "0 16px 44px rgba(0,0,0,0.5)", border: `1px solid ${ctx.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <WifiIcon size={20} />
          <div style={{ fontWeight: 600, fontSize: 14 }}>Authentication required</div>
        </div>
        <div style={{ fontSize: 12.5, color: ctx.dim, marginBottom: 14 }}>
          A password is required to connect to &quot;{ssid}&quot;.
        </div>
        <input
          type="password" autoFocus value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          placeholder="Password"
          style={{
            width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: 8,
            border: `1px solid ${error ? "#DA3450" : ctx.border}`, background: inputBg, color: ctx.fg,
            fontSize: 13, outline: "none",
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: "#DA3450", marginTop: 8, lineHeight: 1.4 }}>
            Authentication failed: incorrect password (it&apos;s not &quot;password123&quot;, I tried).
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            type="button" onClick={onClose}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, background: "transparent", color: ctx.fg }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: "var(--yaru-accent)", color: "#fff" }}
          >
            Connect
          </button>
        </div>
      </motion.form>
    </div>
  );
};

const WifiPanel: FC<{ ctx: Ctx }> = ({ ctx }) => {
  const [wifiOn, setWifiOn] = useState(true);
  const [dialogSsid, setDialogSsid] = useState<string | null>(null);

  return (
    <div>
      <SectionHeader title="Wi-Fi" />
      <Card ctx={ctx}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
          <span style={{ fontWeight: 500, fontSize: 13.5 }}>Wi-Fi</span>
          <Switch checked={wifiOn} onChange={() => setWifiOn(v => !v)} ariaLabel="Wi-Fi" />
        </div>
      </Card>

      {wifiOn && (
        <>
          <GroupLabel dim={ctx.dim}>Visible Networks</GroupLabel>
          <Card ctx={ctx}>
            <NetworkRow ssid={CONNECTED_SSID} strength="full" secured connected onClick={() => {}} ctx={ctx} />
            {NETWORKS.map((n, i) => (
              <NetworkRow
                key={n.ssid} ssid={n.ssid} strength={n.strength} secured={n.secured}
                onClick={() => setDialogSsid(n.ssid)} ctx={ctx} last={i === NETWORKS.length - 1}
              />
            ))}
          </Card>
        </>
      )}

      {dialogSsid && <PasswordDialog ssid={dialogSsid} onClose={() => setDialogSsid(null)} ctx={ctx} />}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Appearance panel
 * ------------------------------------------------------------------ */
const StyleCard: FC<{ label: string; active: boolean; onClick: () => void; dark: boolean }> = ({ label, active, onClick, dark }) => (
  <button
    onClick={onClick}
    style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
  >
    <div style={{
      width: 128, height: 82, borderRadius: 10, overflow: "hidden",
      outline: active ? "3px solid var(--yaru-accent)" : "1px solid rgba(128,128,128,0.35)", outlineOffset: active ? -3 : -1,
      background: dark ? "#241F31" : "#FAFAFA",
    }}>
      <div style={{ height: 14, background: dark ? "#303030" : "#EBEBEB" }} />
      <div style={{ padding: 9, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 6, width: "68%", borderRadius: 3, background: dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.16)" }} />
        <div style={{ height: 6, width: "48%", borderRadius: 3, background: dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.1)" }} />
      </div>
    </div>
    <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400 }}>{label}</span>
  </button>
);

const AppearancePanel: FC<{ ctx: Ctx; settings: OsSettings; setSettings: (p: Partial<OsSettings>) => void }> = ({ ctx, settings, setSettings }) => (
  <div>
    <SectionHeader title="Appearance" />

    <GroupLabel dim={ctx.dim}>Style</GroupLabel>
    <div style={{ display: "flex", gap: 18 }}>
      <StyleCard label="Light" dark={false} active={settings.theme === "light"} onClick={() => setSettings({ theme: "light" })} />
      <StyleCard label="Dark" dark active={settings.theme === "dark"} onClick={() => setSettings({ theme: "dark" })} />
    </div>

    <GroupLabel dim={ctx.dim}>Accent Color</GroupLabel>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {YARU_ACCENTS.map(a => {
        const active = settings.accent.toLowerCase() === a.hex.toLowerCase();
        return (
          <button
            key={a.hex} title={a.name} aria-label={a.name} onClick={() => setSettings({ accent: a.hex })}
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer", background: a.hex,
              outline: active ? `2px solid ${ctx.fg}` : "2px solid transparent", outlineOffset: 3,
              display: "grid", placeItems: "center",
            }}
          >
            {active && <CheckGlyph size={14} color="#fff" />}
          </button>
        );
      })}
    </div>

    <GroupLabel dim={ctx.dim}>Background</GroupLabel>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
      {WALLPAPERS.map(w => {
        const active = settings.wallpaper === w.src;
        return (
          <button
            key={w.src} onClick={() => setSettings({ wallpaper: w.src })}
            style={{
              padding: 0, border: "none", borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "transparent",
              outline: active ? "3px solid var(--yaru-accent)" : `1px solid ${ctx.border}`, outlineOffset: active ? -3 : -1,
            }}
          >
            <img src={w.src} alt={w.label} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
            <div style={{ fontSize: 11.5, padding: "6px 4px", color: ctx.dim, textAlign: "center", background: ctx.card }}>{w.label}</div>
          </button>
        );
      })}
    </div>
  </div>
);

/* ------------------------------------------------------------------ *
 * Users panel
 * ------------------------------------------------------------------ */
const UsersPanel: FC<{ ctx: Ctx }> = ({ ctx }) => (
  <div>
    <SectionHeader title="Users" />
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
      <UserAvatar size={76} />
      <div>
        <div style={{ fontSize: 19, fontWeight: 600 }}>{profile.name}</div>
        <span style={{
          display: "inline-block", marginTop: 6, padding: "3px 10px", borderRadius: 12,
          fontSize: 11, fontWeight: 700, letterSpacing: 0.3, background: "var(--yaru-accent)", color: "#fff",
        }}>
          ADMINISTRATOR
        </span>
      </div>
    </div>
    <Card ctx={ctx}>
      <InfoRow ctx={ctx} label="Username" value={profile.username} />
      <InfoRow ctx={ctx} label="School" value={profile.education.school} />
      <InfoRow ctx={ctx} label="Role" value={`${profile.experience[0].role} · ${profile.experience[0].company}`} />
      <InfoRow ctx={ctx} label="Location" value={profile.location} />
      <InfoRow ctx={ctx} label="Email" value={profile.email} last />
    </Card>
  </div>
);

/* ------------------------------------------------------------------ *
 * About panel
 * ------------------------------------------------------------------ */
const AboutPanel: FC<{ ctx: Ctx; notify: (appId: string, title: string, body: string) => void }> = ({ ctx, notify }) => (
  <div>
    <SectionHeader title="About" />
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--yaru-accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <span style={{ color: "#fff", fontSize: 22, fontWeight: 700, fontFamily: "Ubuntu, sans-serif" }}>W</span>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>web-slinger</div>
        <div style={{ fontSize: 12.5, color: ctx.dim }}>Ubuntu 24.04.1 LTS (Noble Numbat)</div>
      </div>
    </div>

    <Card ctx={ctx}>
      <InfoRow ctx={ctx} label="Device Name" value="web-slinger" />
      <InfoRow ctx={ctx} label="OS Name" value="Ubuntu 24.04.1 LTS (Noble Numbat)" />
      <InfoRow ctx={ctx} label="Windowing System" value="Wayland (allegedly)" />
      <InfoRow ctx={ctx} label="Processor" value="Ryzen Web 9 5950HX" />
      <InfoRow ctx={ctx} label="Memory" value="16.0 GiB (of your RAM, sorry)" />
      <InfoRow ctx={ctx} label="Graphics" value="Mesa WebGL" />
      <InfoRow ctx={ctx} label="Disk Capacity" value="sufficient" last />
    </Card>

    <GroupLabel dim={ctx.dim}>System Details</GroupLabel>
    <Card ctx={ctx}>
      <InfoRow
        ctx={ctx} label="GitHub"
        value={<a href={profile.github} target="_blank" rel="noreferrer" style={{ color: "var(--yaru-accent)", textDecoration: "none" }}>{profile.githubUser}</a>}
      />
      <InfoRow
        ctx={ctx} label="Email"
        value={<a href={`mailto:${profile.email}`} style={{ color: "var(--yaru-accent)", textDecoration: "none" }}>{profile.email}</a>}
        last
      />
    </Card>

    <button
      onClick={() => notify("settings", "Software Updater", "You're up to date. Unlike WebKit.")}
      style={{
        marginTop: 22, padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
        background: "var(--yaru-accent)", color: "#fff", fontSize: 13, fontWeight: 600,
      }}
    >
      Check for Updates
    </button>
  </div>
);

/* ------------------------------------------------------------------ *
 * Root
 * ------------------------------------------------------------------ */
export default function SettingsApp(_: AppProps) {
  const settings = useOs(s => s.settings);
  const setSettings = useOs(s => s.setSettings);
  const notify = useOs(s => s.notify);
  const light = settings.theme === "light";

  const [section, setSection] = useState("appearance");
  const [navQuery, setNavQuery] = useState("");

  const fg = light ? "#1a1a1a" : "#eee";
  const dim = light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const border = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)";
  const sidebarBg = light ? "#EDEDED" : "#28222F";
  const mainBg = light ? "#FAFAFA" : "#241F31";
  const card = light ? "#ffffff" : "rgba(255,255,255,0.04)";
  const ctx: Ctx = { light, fg, dim, border, card };

  const filteredNav = navQuery.trim()
    ? NAV.filter(n => n.label.toLowerCase().includes(navQuery.trim().toLowerCase()))
    : NAV;

  const activeItem = NAV.find(n => n.id === section) ?? NAV[0];

  let panel: ReactNode;
  if (section === "wifi") panel = <WifiPanel ctx={ctx} />;
  else if (section === "appearance") panel = <AppearancePanel ctx={ctx} settings={settings} setSettings={setSettings} />;
  else if (section === "users") panel = <UsersPanel ctx={ctx} />;
  else if (section === "about") panel = <AboutPanel ctx={ctx} notify={notify} />;
  else panel = <EmptyState icon={activeItem.icon} ctx={ctx} />;

  return (
    <div style={{ height: "100%", display: "flex", fontFamily: "var(--font-ui)", color: fg, background: mainBg }}>
      {/* Left nav */}
      <div style={{ width: 214, flexShrink: 0, background: sidebarBg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", padding: "12px 10px", overflowY: "auto" }}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: dim, display: "flex" }}>
            <SearchIcon size={14} />
          </span>
          <input
            value={navQuery} onChange={e => setNavQuery(e.target.value)} placeholder="Search settings"
            style={{
              width: "100%", boxSizing: "border-box", padding: "7px 10px 7px 30px", borderRadius: 8,
              border: `1px solid ${border}`, background: light ? "#fff" : "#1E1926", color: fg, fontSize: 12.5, outline: "none",
            }}
          />
        </div>
        {filteredNav.length === 0 && (
          <div style={{ fontSize: 12.5, color: dim, padding: "8px 10px" }}>No results</div>
        )}
        {filteredNav.map(n => {
          const active = n.id === section;
          return (
            <button
              key={n.id} onClick={() => { setSection(n.id); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: "none", cursor: "pointer",
                borderRadius: 8, padding: "8px 10px", fontSize: 13, marginBottom: 2,
                background: active ? "var(--yaru-accent)" : "transparent", color: active ? "#fff" : fg,
              }}
            >
              <span style={{ display: "flex", flexShrink: 0, opacity: active ? 1 : 0.85 }}>{n.icon}</span>
              {n.label}
            </button>
          );
        })}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 34px" }}>
        {panel}
      </div>
    </div>
  );
}
