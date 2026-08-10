import { useState, type FC } from "react";
import { useOs } from "../../os/store";
import { APPS } from "../../os/apps";
import { AppIcon, GridIcon } from "../../ui/icons";
import { useContextMenu, type MenuItem } from "./ContextMenu";

const TRASH_PATH = "~/.local/Trash";

interface DockButtonProps {
  label: string;
  running: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

const DockButton: FC<DockButtonProps> = ({ label, running, onClick, onContextMenu, children }) => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      {/* running indicator */}
      {running && (
        <span style={{
          position: "absolute", left: -7, top: "50%", transform: "translateY(-50%)",
          width: 4, height: 16, borderRadius: 2, background: "var(--yaru-accent)",
        }} />
      )}
      <button
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={label}
        style={{
          width: 48, height: 48, padding: 0, border: "none", cursor: "pointer",
          background: "transparent", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 120ms ease",
          transform: hover ? "scale(1.08)" : "scale(1)",
        }}
      >
        {children}
      </button>
      {/* tooltip */}
      {hover && (
        <span style={{
          position: "absolute", left: 60, top: "50%", transform: "translateY(-50%)",
          whiteSpace: "nowrap", background: "rgba(0,0,0,0.9)", color: "#fff",
          fontSize: 12, padding: "4px 9px", borderRadius: 7, pointerEvents: "none", zIndex: 5,
        }}>
          {label}
        </span>
      )}
    </div>
  );
};

/** Ubuntu dock — pinned apps, trash, and the app-grid button. */
export default function Dock() {
  const windows = useOs(s => s.windows);
  const openApp = useOs(s => s.openApp);
  const closeWindow = useOs(s => s.closeWindow);
  const setOverview = useOs(s => s.setOverview);
  const { open: openMenu, element: menuElement } = useContextMenu();

  const pinned = APPS.filter(a => a.pinned);
  const isRunning = (appId: string) => windows.some(w => w.appId === appId);

  const appMenu = (e: React.MouseEvent, appId: string) => {
    const manifest = APPS.find(a => a.id === appId)!;
    const items: MenuItem[] = [];
    if (!manifest.singleInstance) {
      items.push({ label: "New Window", onClick: () => openApp(appId) });
    }
    // The dock only shows pinned apps, so the pin action is always "Unpin" (cosmetic).
    items.push({ label: "Unpin from Dash" });
    if (isRunning(appId)) {
      items.push({ separator: true });
      items.push({
        label: "Quit",
        danger: true,
        onClick: () => windows.filter(w => w.appId === appId).forEach(w => closeWindow(w.id)),
      });
    }
    openMenu(e, items);
  };

  return (
    <>
      <div
        style={{
          position: "absolute", top: 28, left: 0, bottom: 0, width: 64, zIndex: 200,
          background: "rgba(0,0,0,0.7)",
          borderTopRightRadius: 16, borderBottomRightRadius: 16,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "10px 0",
        }}
      >
        {/* Pinned apps + trash */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, overflowY: "auto", overflowX: "visible", width: "100%" }}>
          {pinned.map(app => (
            <DockButton
              key={app.id}
              label={app.name}
              running={isRunning(app.id)}
              onClick={() => openApp(app.id)}
              onContextMenu={e => appMenu(e, app.id)}
            >
              <AppIcon app={app.id} size={48} />
            </DockButton>
          ))}

          {/* separator */}
          <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.2)", margin: "4px 0" }} />

          <DockButton
            label="Symbiote Containment"
            running={isRunning("files") && windows.some(w => w.appId === "files" && (w.props as { path?: string } | undefined)?.path === TRASH_PATH)}
            onClick={() => openApp("files", { path: TRASH_PATH })}
          >
            <AppIcon app="trash" size={48} />
          </DockButton>
        </div>

        {/* App-grid button */}
        <button
          onClick={() => setOverview(true)}
          aria-label="Show Applications"
          style={{
            width: 48, height: 48, marginTop: 8, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <GridIcon size={22} />
        </button>
      </div>
      {menuElement}
    </>
  );
}
