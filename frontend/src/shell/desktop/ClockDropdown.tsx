import { useOs } from "../../os/store";
import { AppIcon } from "../../ui/icons";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Builds the 6×7 day grid for the month containing `d`. */
function monthGrid(d: Date): (number | null)[] {
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * GNOME calendar / notifications drop-down anchored under the top-bar clock.
 * Left column: notification drawer with a Clear action. Right: month grid.
 */
export default function ClockDropdown() {
  const drawer = useOs(s => s.drawer);
  const clearDrawer = useOs(s => s.clearDrawer);
  const light = useOs(s => s.settings.theme === "light");

  const now = new Date();
  const today = now.getDate();
  const cells = monthGrid(now);
  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const fg = light ? "#1a1a1a" : "#eeeeee";
  const muted = light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
  const cardBg = light ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)";

  return (
    <div style={{ display: "flex", gap: 14, padding: 14, width: 560 }}>
      {/* Notifications */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: muted }}>Notifications</span>
          {drawer.length > 0 && (
            <button
              onClick={clearDrawer}
              style={{
                fontSize: 12, color: fg, background: cardBg,
                border: "none", borderRadius: 8, padding: "3px 10px", cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>
        {drawer.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180 }}>
            <span style={{ fontSize: 15, color: muted }}>No Notifications</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 260 }}>
            {drawer.map(n => (
              <div
                key={n.id}
                style={{
                  display: "flex", gap: 10, padding: 10, borderRadius: 12,
                  background: cardBg, alignItems: "flex-start",
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  <AppIcon app={n.appId} size={24} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: fg, marginBottom: 10 }}>{monthLabel}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {WEEKDAYS.map(w => (
            <div key={w} style={{ textAlign: "center", fontSize: 11, color: muted, paddingBottom: 4 }}>{w}</div>
          ))}
          {cells.map((day, i) => {
            const isToday = day === today;
            return (
              <div
                key={i}
                style={{
                  height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, borderRadius: "50%",
                  color: day == null ? "transparent" : isToday ? "#fff" : fg,
                  background: isToday ? "var(--yaru-accent)" : "transparent",
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {day ?? ""}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
