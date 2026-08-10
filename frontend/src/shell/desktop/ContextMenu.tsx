import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useOs } from "../../os/store";

/**
 * A single row in a context menu. Either a divider (`{ separator: true }`)
 * or an action item whose `label` is required at compile time.
 */
export type MenuItem =
  | { separator: true; label?: undefined; onClick?: undefined; danger?: undefined }
  | { separator?: false; label: string; onClick?: () => void; danger?: boolean };

interface MenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

/**
 * Shared right-click menu infrastructure. Reused by the Dock, the desktop,
 * Files and SysMon. Call `open(e, items)` from an onContextMenu handler and
 * render the returned `element` somewhere near the root of your subtree.
 */
export function useContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);

  const open = useCallback((e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const close = useCallback(() => setMenu(null), []);

  const element: ReactNode = menu ? (
    <ContextMenuView menu={menu} onClose={close} />
  ) : null;

  return { open, close, element };
}

function ContextMenuView({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  const light = useOs(s => s.settings.theme === "light");
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: menu.x, y: menu.y });

  // Clamp within the viewport once measured.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const x = Math.min(menu.x, window.innerWidth - width - 8);
    const y = Math.min(menu.y, window.innerHeight - height - 8);
    setPos({ x: Math.max(4, x), y: Math.max(4, y) });
  }, [menu.x, menu.y]);

  // Dismiss on outside click, Escape, scroll or resize.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    window.addEventListener("blur", onClose);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  const bg = light ? "#ffffff" : "#2b2b2b";
  const fg = light ? "#1a1a1a" : "#eeeeee";
  const hover = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  const divider = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)";

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 600,
        minWidth: 190,
        padding: 6,
        borderRadius: 12,
        background: bg,
        color: fg,
        border: `1px solid ${divider}`,
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        fontFamily: "var(--font-ui)",
        fontSize: 13,
        userSelect: "none",
      }}
    >
      {menu.items.map((item, i) =>
        item.separator ? (
          <div key={i} style={{ height: 1, margin: "5px 4px", background: divider }} />
        ) : (
          <button
            key={i}
            role="menuitem"
            onClick={() => { onClose(); item.onClick?.(); }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "7px 12px",
              borderRadius: 7,
              border: "none",
              background: "transparent",
              color: item.danger ? "#f16060" : fg,
              fontSize: 13,
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = hover)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
