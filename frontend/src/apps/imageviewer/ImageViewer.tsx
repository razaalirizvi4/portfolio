import { useRef, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useOs } from "../../os/store";
import { vfs } from "../../os/vfsInstance";
import { HOME, type VfsFile } from "../../os/vfs";

const PICTURES = `${HOME}/Pictures`;

export default function ImageViewer({ props }: AppProps) {
  const theme = useOs(s => s.settings.theme);
  const light = theme === "light";

  const pictures = vfs.list(PICTURES).filter((n): n is VfsFile => n.type === "file" && n.kind === "image");

  const initialUrl = typeof props?.url === "string" ? (props.url as string) : (pictures[0]?.url ?? "");
  const initialName = typeof props?.name === "string" ? (props.name as string) : (pictures[0]?.name ?? "Image Viewer");

  const [current, setCurrent] = useState<{ url: string; name: string }>({ url: initialUrl, name: initialName });
  const [scale, setScale] = useState(1);

  const rootRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setScale(s => Math.min(4, +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale(s => Math.max(0.25, +(s - 0.25).toFixed(2)));

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
          {current.name || "Image Viewer"}
        </span>
        <div style={{ flex: 1 }} />
        <ZoomButton onClick={zoomOut} label="Zoom out">−</ZoomButton>
        <span style={{ fontSize: 12, width: 44, textAlign: "center", opacity: 0.7 }}>{Math.round(scale * 100)}%</span>
        <ZoomButton onClick={zoomIn} label="Zoom in">+</ZoomButton>
      </div>

      {/* Stage */}
      <div style={{
        flex: 1, minHeight: 0, background: "#1B1620", display: "grid", placeItems: "center", overflow: "auto",
      }}>
        {current.url ? (
          <img
            src={current.url}
            alt={current.name}
            style={{ maxWidth: "100%", maxHeight: "100%", transform: `scale(${scale})`, transition: "transform 120ms ease", objectFit: "contain" }}
          />
        ) : (
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>No image to display</span>
        )}
      </div>

      {/* Filmstrip */}
      {pictures.length > 0 && (
        <div style={{
          height: 76, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 10px",
          overflowX: "auto", background: toolbarBg, borderTop: `1px solid ${border}`,
        }}>
          {pictures.map(p => {
            const isCurrent = p.url === current.url;
            return (
              <button
                key={p.name}
                title={p.name}
                onClick={() => { setCurrent({ url: p.url ?? "", name: p.name }); setScale(1); }}
                style={{
                  width: 56, height: 56, flexShrink: 0, borderRadius: 6, cursor: "pointer", padding: 0,
                  border: isCurrent ? "2px solid var(--yaru-accent)" : "2px solid transparent",
                  background: "#000", overflow: "hidden",
                }}
              >
                <img src={p.url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            );
          })}
        </div>
      )}
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
        background: "rgba(255,255,255,0.1)", color: "inherit", fontSize: 16, lineHeight: 1,
        display: "grid", placeItems: "center",
      }}
    >
      {children}
    </button>
  );
}
