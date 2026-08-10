import { useState, type FC } from "react";

/* ------------------------------------------------------------------ *
 * Yaru-style app icons.
 * Geometry rules: 100×100 viewBox, squircle background (rx≈22),
 * flat two-tone fills, confident geometric shapes — no glow, no
 * generic gradients. Each app id maps to a standalone <svg>.
 * ------------------------------------------------------------------ */

const RX = 22;

/** Rounded-rect squircle tile used as every app-icon background. */
const Tile: FC<{ fill: string; children?: React.ReactNode }> = ({ fill, children }) => (
  <>
    <rect x="4" y="4" width="92" height="92" rx={RX} fill={fill} />
    {children}
  </>
);

function iconBody(app: string): React.ReactNode {
  switch (app) {
    /* Terminal — dark aubergine tile, white `>_` prompt in mono. */
    case "terminal":
      return (
        <Tile fill="#3D3846">
          <path d="M26 40 L40 50 L26 60" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="46" y1="62" x2="70" y2="62" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        </Tile>
      );

    /* Files — Yaru manila folder, two-tone. */
    case "files":
      return (
        <Tile fill="#5E5C64">
          <path d="M22 34 h20 l6 8 h30 a4 4 0 0 1 4 4 v4 H18 v-16 a4 4 0 0 1 4-4z" fill="#E0A63C" />
          <path d="M18 46 h64 v26 a4 4 0 0 1 -4 4 H22 a4 4 0 0 1 -4 -4 z" fill="#F6B84C" />
        </Tile>
      );

    /* Firefox — indigo tile, orange fox disc with a yellow flame swirl. */
    case "firefox":
      return (
        <Tile fill="#29234E">
          <circle cx="50" cy="52" r="24" fill="#E95420" />
          <path d="M50 28 a24 24 0 0 1 22 14 a16 16 0 0 0 -20 -6 a14 14 0 0 1 -2 -8z" fill="#FFB144" />
          <path d="M50 28 a24 24 0 0 0 -20 34 a16 16 0 0 1 6 -22 a12 12 0 0 0 14 -12z" fill="#FF7A2F" />
          <circle cx="58" cy="46" r="4" fill="#2A1A0A" />
        </Tile>
      );

    /* VS Code — blue tile with the folded-ribbon lettermark. */
    case "vscode":
      return (
        <Tile fill="#2C9CDB">
          <path d="M70 26 v48 l-22 -18 -14 12 -8 -5 12 -11 -12 -11 8 -5 14 12 z" fill="#FFFFFF" />
          <path d="M70 26 L52 40 v20 L70 74 z" fill="#E8F4FC" />
        </Tile>
      );

    /* Text Editor — dark tile, white sheet with an orange pencil. */
    case "texteditor":
      return (
        <Tile fill="#3D3846">
          <rect x="26" y="24" width="40" height="52" rx="4" fill="#FAFAFA" />
          <line x1="33" y1="36" x2="53" y2="36" stroke="#C6C0BE" strokeWidth="4" strokeLinecap="round" />
          <line x1="33" y1="46" x2="59" y2="46" stroke="#C6C0BE" strokeWidth="4" strokeLinecap="round" />
          <line x1="33" y1="56" x2="49" y2="56" stroke="#C6C0BE" strokeWidth="4" strokeLinecap="round" />
          <path d="M58 66 l16 -16 6 6 -16 16 -8 2 z" fill="#E95420" />
          <path d="M72 52 l6 6 3 -3 -6 -6 z" fill="#F6B84C" />
        </Tile>
      );

    /* Settings — grey tile with a white gear. */
    case "settings":
      return (
        <Tile fill="#5E5C64">
          <path
            fill="#FFFFFF"
            d="M50 30 l4 8 9 -2 2 9 8 4 -4 8 4 8 -8 4 -2 9 -9 -2 -4 8 -8 -4 -8 4 -4 -8 -9 2 -2 -9 -8 -4 4 -8 -4 -8 8 -4 2 -9 9 2 z"
          />
          <circle cx="50" cy="52" r="10" fill="#5E5C64" />
        </Tile>
      );

    /* System Monitor — dark tile, green EKG pulse line. */
    case "sysmon":
      return (
        <Tile fill="#241F31">
          <polyline
            points="22,52 34,52 40,36 48,68 56,44 62,52 78,52"
            fill="none"
            stroke="#33D17A"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Tile>
      );

    /* Calculator — teal tile, display bar + operator grid. */
    case "calculator":
      return (
        <Tile fill="#159A8C">
          <rect x="26" y="24" width="48" height="16" rx="3" fill="#0C6E63" />
          <text x="50" y="60" textAnchor="middle" fontSize="20" fontWeight="700" fill="#FFFFFF" fontFamily="Ubuntu, sans-serif">+−</text>
          <text x="50" y="78" textAnchor="middle" fontSize="20" fontWeight="700" fill="#FFFFFF" fontFamily="Ubuntu, sans-serif">×÷</text>
        </Tile>
      );

    /* Image Viewer — sky tile, sun + mountain landscape. */
    case "imageviewer":
      return (
        <Tile fill="#3584E4">
          <circle cx="66" cy="38" r="8" fill="#F9E37A" />
          <path d="M18 76 L38 50 L52 66 L64 52 L82 76 Z" fill="#26A269" />
          <path d="M18 76 L38 50 L48 62 L36 76 Z" fill="#1C7B4F" />
        </Tile>
      );

    /* Screenshot — dark tile, red camera aperture. */
    case "screenshot":
      return (
        <Tile fill="#3D3846">
          <circle cx="50" cy="52" r="22" fill="none" stroke="#ED5D5D" strokeWidth="5" />
          <g stroke="#ED5D5D" strokeWidth="4" strokeLinecap="round">
            <line x1="50" y1="52" x2="50" y2="30" />
            <line x1="50" y1="52" x2="69" y2="63" />
            <line x1="50" y1="52" x2="31" y2="63" />
          </g>
          <circle cx="50" cy="52" r="5" fill="#ED5D5D" />
        </Tile>
      );

    /* DOOM — dark-red tile, silver lettermark. */
    case "doom":
      return (
        <Tile fill="#5A0A0A">
          <text
            x="50"
            y="60"
            textAnchor="middle"
            fontSize="20"
            fontWeight="900"
            letterSpacing="1"
            fill="#C7C7C7"
            stroke="#7A1010"
            strokeWidth="1"
            fontFamily="Ubuntu, Impact, sans-serif"
          >
            DOOM
          </text>
        </Tile>
      );

    /* Document Viewer (evince) — light tile, page with folded corner. */
    case "evince":
      return (
        <Tile fill="#5E5C64">
          <path d="M30 22 h28 l14 14 v42 a2 2 0 0 1 -2 2 H30 a2 2 0 0 1 -2 -2 V24 a2 2 0 0 1 2 -2z" fill="#FAFAFA" />
          <path d="M58 22 v12 a2 2 0 0 0 2 2 h12 z" fill="#C6C0BE" />
          <g stroke="#B11313" strokeWidth="4" strokeLinecap="round">
            <line x1="37" y1="48" x2="63" y2="48" />
          </g>
          <g stroke="#C6C0BE" strokeWidth="4" strokeLinecap="round">
            <line x1="37" y1="58" x2="63" y2="58" />
            <line x1="37" y1="68" x2="55" y2="68" />
          </g>
        </Tile>
      );

    /* Trash — dark tile, white bin glyph. */
    case "trash":
      return (
        <Tile fill="#5E5C64">
          <path d="M34 38 h32 l-3 38 a4 4 0 0 1 -4 4 H41 a4 4 0 0 1 -4 -4 z" fill="#FAFAFA" />
          <rect x="30" y="30" width="40" height="7" rx="3" fill="#FAFAFA" />
          <rect x="42" y="24" width="16" height="7" rx="3" fill="#FAFAFA" />
          <g stroke="#5E5C64" strokeWidth="3" strokeLinecap="round">
            <line x1="44" y1="46" x2="44" y2="72" />
            <line x1="50" y1="46" x2="50" y2="72" />
            <line x1="56" y1="46" x2="56" y2="72" />
          </g>
        </Tile>
      );

    /* Fallback — neutral tile with the app's first initial. */
    default:
      return (
        <Tile fill="#5E5C64">
          <text x="50" y="62" textAnchor="middle" fontSize="34" fontWeight="700" fill="#FFFFFF" fontFamily="Ubuntu, sans-serif">
            {(app[0] ?? "?").toUpperCase()}
          </text>
        </Tile>
      );
  }
}

export const AppIcon: FC<{ app: string; size?: number }> = ({ app, size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${app} icon`}>
    {iconBody(app)}
  </svg>
);

/* ------------------------------------------------------------------ *
 * Symbolic glyphs — monochrome, stroke inherits `currentColor`.
 * 24×24 viewBox, used across the top bar, window controls and menus.
 * ------------------------------------------------------------------ */

type Glyph = FC<{ size?: number; className?: string }>;

const sym = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const WifiIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <path d="M3 9 a15 15 0 0 1 18 0" />
    <path d="M6.5 12.5 a10 10 0 0 1 11 0" />
    <path d="M10 16 a5 5 0 0 1 4 0" />
    <circle cx="12" cy="19" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const VolumeIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <path d="M4 9 h4 l5 -4 v14 l-5 -4 H4 z" fill="currentColor" stroke="none" />
    <path d="M16 9 a4 4 0 0 1 0 6" />
    <path d="M18.5 6.5 a8 8 0 0 1 0 11" />
  </svg>
);

export const BatteryIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <rect x="3" y="8" width="16" height="8" rx="2" />
    <rect x="5" y="10" width="9" height="4" rx="1" fill="currentColor" stroke="none" />
    <line x1="21" y1="10.5" x2="21" y2="13.5" />
  </svg>
);

export const PowerIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <path d="M12 4 v7" />
    <path d="M7 6.5 a7 7 0 1 0 10 0" />
  </svg>
);

export const LockIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
  </svg>
);

export const SearchIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <circle cx="11" cy="11" r="6" />
    <line x1="15.5" y1="15.5" x2="20" y2="20" />
  </svg>
);

export const GridIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <g fill="currentColor" stroke="none">
      <circle cx="6" cy="6" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </g>
  </svg>
);

export const CloseIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

export const MinimizeIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <line x1="6" y1="12" x2="18" y2="12" />
  </svg>
);

export const MaximizeIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </svg>
);

export const RestoreIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <rect x="7" y="9" width="9" height="9" rx="1.5" />
    <path d="M9.5 9 V6.5 h9 v9 H16" />
  </svg>
);

export const ChevronIcon: Glyph = ({ size, className }) => (
  <svg {...sym(size)} className={className}>
    <polyline points="7,10 12,15 17,10" />
  </svg>
);

/* ------------------------------------------------------------------ *
 * UserAvatar — orange disc with "SR" initials. On hover a subtle
 * spider-web line drawing fades in (spec easter egg).
 * ------------------------------------------------------------------ */

const WebOverlay: FC = () => (
  <g stroke="#FFFFFF" strokeWidth="0.7" fill="none" opacity="0.35">
    {/* radial threads from the top-left anchor */}
    {[10, 30, 55, 80, 100].map((a) => {
      const r = (a * Math.PI) / 180;
      return <line key={a} x1="20" y1="20" x2={20 + 90 * Math.cos(r)} y2={20 + 90 * Math.sin(r)} />;
    })}
    {/* concentric capture spirals */}
    {[14, 26, 38, 50, 62].map((rad) => (
      <path
        key={rad}
        d={`M${20 + rad} 20 A${rad} ${rad} 0 0 1 20 ${20 + rad}`}
      />
    ))}
  </g>
);

export const UserAvatar: FC<{ size?: number; initials?: string }> = ({ size = 40, initials = "SR" }) => {
  const [hover, setHover] = useState(false);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="User avatar"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <defs>
        <clipPath id="avatar-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#E95420" />
      <text x="50" y="62" textAnchor="middle" fontSize="40" fontWeight="700" fill="#FFFFFF" fontFamily="Ubuntu, sans-serif">
        {initials}
      </text>
      <g clipPath="url(#avatar-clip)" style={{ opacity: hover ? 1 : 0, transition: "opacity 250ms ease" }}>
        <WebOverlay />
      </g>
    </svg>
  );
};
