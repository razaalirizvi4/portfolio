import { useRef, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";

function basename(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? path : path.slice(idx + 1);
}

export default function DocumentViewer({ props }: AppProps) {
  const theme = useOs(s => s.settings.theme);
  const light = theme === "light";

  const url = typeof props?.url === "string" ? (props.url as string) : "/resume.pdf";
  const name = basename(url);
  const [zoom, setZoom] = useState(100);
  const [failed, setFailed] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom(z => Math.min(200, z + 10));
  const zoomOut = () => setZoom(z => Math.max(40, z - 10));

  const toolbarBg = light ? "#F4F4F4" : "#2A2434";
  const border = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)";
  const fg = light ? "#1a1a1a" : "#eee";

  return (
    <div ref={rootRef} tabIndex={-1} style={{ height: "100%", display: "flex", flexDirection: "column", outline: "none", fontFamily: "var(--font-ui)" }}>
      {/* Toolbar */}
      <div style={{
        height: 46, flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "0 12px",
        background: toolbarBg, borderBottom: `1px solid ${border}`, color: fg,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name} — 1 of 1
        </span>
        <div style={{ flex: 1 }} />
        <ZoomButton onClick={zoomOut} label="Zoom out">−</ZoomButton>
        <span style={{ fontSize: 12, width: 44, textAlign: "center", opacity: 0.7 }}>{zoom}%</span>
        <ZoomButton onClick={zoomIn} label="Zoom in">+</ZoomButton>
        <a
          href={url}
          download="Syed-Raza-Ali-Rizvi-Resume.pdf"
          style={{
            marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
            background: "var(--yaru-orange)", color: "#fff", textDecoration: "none",
          }}
        >
          Download
        </a>
      </div>

      {/* Stage */}
      <div style={{ flex: 1, minHeight: 0, background: "#4A4A4A", display: "flex", justifyContent: "center", overflow: "auto", padding: "18px 0" }}>
        {!failed ? (
          <iframe
            title="resume"
            src={`${url}#toolbar=0`}
            onError={() => setFailed(true)}
            style={{ width: `${zoom}%`, height: "100%", minHeight: 500, border: "none", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
          />
        ) : (
          <div style={{ color: "#eee", fontSize: 14, alignSelf: "flex-start", padding: 24, textAlign: "center" }}>
            <p>This PDF couldn't be previewed in the browser.</p>
            <a href={url} download="Syed-Raza-Ali-Rizvi-Resume.pdf" style={{ color: "var(--yaru-orange)" }}>
              Download {name} instead
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ZoomButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
        background: "rgba(0,0,0,0.08)", color: "inherit", fontSize: 16, lineHeight: 1,
        display: "grid", placeItems: "center",
      }}
    >
      {children}
    </button>
  );
}
