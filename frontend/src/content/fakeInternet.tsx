import { createContext, useContext, useState, type FC, type CSSProperties } from "react";
import { profile } from "./profile";
import { easterEggs } from "./easterEggs";

/* ------------------------------------------------------------------ *
 * The fake internet.
 *
 * A tiny in-browser "web": a handful of hand-built sites keyed by
 * normalized host(+path). Each site is a self-contained page that is
 * deliberately NOT Yaru-styled — this is the one corner of the OS
 * allowed to look like the real web.
 *
 * `resolveUrl` maps whatever the user types in the awesome-bar to one
 * of three outcomes:
 *   { key }      → render SITES[key].component
 *   { external } → a real http(s) URL we don't host → window.open
 *   { notFound } → a domain-shaped miss → Firefox error page
 * Bare words (no dot) fall back to the raza.dev homepage, so the
 * awesome-bar doubles as a "search box" that always lands somewhere.
 * ------------------------------------------------------------------ */

export interface BrowserApi {
  /** Navigate the current tab to an internal site key or URL. */
  navigate: (url: string) => void;
  /** Fire an OS toast from firefox. */
  notify: (title: string, body: string) => void;
  /** The current tab's location key (e.g. "raza.dev/projects/twin"). */
  location: string;
}

export const BrowserContext = createContext<BrowserApi>({
  navigate: () => {},
  notify: () => {},
  location: "raza.dev",
});

export const useBrowser = (): BrowserApi => useContext(BrowserContext);

/* Per-language dot colors, GitHub-style. */
const LANG_COLORS: Record<string, string> = {
  Python: "#3572A5",
  PyTorch: "#EE4C2C",
  "React.js": "#61DAFB",
  "React Native": "#61DAFB",
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  "Node.js": "#68A063",
  "Express.js": "#68A063",
  Shell: "#89E051",
  Ollama: "#B6B6B6",
  MongoDB: "#4DB33D",
  Mapbox: "#4264FB",
  Supabase: "#3ECF8E",
};
const langColor = (t: string): string => LANG_COLORS[t] ?? "#8b949e";

/* ==================================================================
 * raza.dev — personal homepage
 * ================================================================== */

const pageRoot: CSSProperties = {
  fontFamily: "'Ubuntu', system-ui, sans-serif",
  minHeight: "100%",
  boxSizing: "border-box",
};

const RazaHome: FC = () => {
  const { navigate } = useBrowser();
  return (
    <div style={{ ...pageRoot, background: "#faf7f2", color: "#1f1b16" }}>
      {/* hero */}
      <header style={{ maxWidth: 860, margin: "0 auto", padding: "72px 32px 40px" }}>
        <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#E95420", fontWeight: 600 }}>
          {profile.location}
        </div>
        <h1 style={{ fontSize: 52, lineHeight: 1.05, margin: "12px 0 8px", fontWeight: 700, letterSpacing: -1 }}>
          {profile.name}
        </h1>
        <p style={{ fontSize: 22, color: "#5b524a", margin: 0 }}>{profile.title}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
          {[...profile.skills.languages, ...profile.skills.frameworks.slice(0, 3)].map((s) => (
            <span
              key={s}
              style={{
                fontSize: 13,
                padding: "5px 12px",
                borderRadius: 999,
                background: "#fff",
                border: "1px solid #e7ddd1",
                color: "#4a423a",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </header>

      {/* projects */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "8px 32px 40px" }}>
        <h2 style={{ fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: "#9a8f82", fontWeight: 600, marginBottom: 16 }}>
          Selected work
        </h2>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {profile.projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`raza.dev/projects/${p.id}`)}
              style={{
                textAlign: "left",
                background: "#fff",
                border: "1px solid #ece3d7",
                borderRadius: 14,
                padding: "20px 22px",
                cursor: "pointer",
                transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
                font: "inherit",
                color: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(233,84,32,0.12)";
                e.currentTarget.style.borderColor = "#E95420";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#ece3d7";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>{p.name}</span>
                <span style={{ color: "#E95420", fontSize: 18 }}>&rarr;</span>
              </div>
              <p style={{ margin: "8px 0 14px", color: "#6b6157", fontSize: 14.5, lineHeight: 1.4 }}>{p.tagline}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {p.tech.map((t) => (
                  <span key={t} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 6, background: "#faf4ec", color: "#8a7d6d" }}>
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* contact footer */}
      <footer style={{ borderTop: "1px solid #ece3d7", background: "#fbf9f5" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#6b6157", fontSize: 14 }}>Let&apos;s build something.</div>
          <div style={{ display: "flex", gap: 12 }}>
            <a href={`mailto:${profile.email}`} style={btnPrimary}>
              {profile.email}
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer" style={btnGhost}>
              GitHub &#8599;
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const btnPrimary: CSSProperties = {
  padding: "9px 16px",
  borderRadius: 10,
  background: "#E95420",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};
const btnGhost: CSSProperties = {
  padding: "9px 16px",
  borderRadius: 10,
  background: "#fff",
  border: "1px solid #e7ddd1",
  color: "#4a423a",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};

/* ==================================================================
 * raza.dev/projects/<id> — one page per project
 * ================================================================== */

/* A single top-level component (Fast-Refresh safe) that renders whichever
 * project the current tab location points at, e.g. ".../projects/twin". */
const ProjectPage: FC = () => {
    const { navigate, location } = useBrowser();
    const id = location.split("/").pop() ?? "";
    const p = profile.projects.find((x) => x.id === id) ?? profile.projects[0];
    return (
      <div style={{ ...pageRoot, background: "#faf7f2", color: "#1f1b16" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px 64px" }}>
          <button onClick={() => navigate("raza.dev")} style={{ background: "none", border: "none", color: "#E95420", cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 28, fontWeight: 600 }}>
            &larr; raza.dev
          </button>

          <h1 style={{ fontSize: 44, margin: "0 0 12px", fontWeight: 700, letterSpacing: -0.5 }}>{p.name}</h1>
          <p style={{ fontSize: 20, color: "#5b524a", margin: "0 0 22px", lineHeight: 1.35 }}>{p.tagline}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 34 }}>
            {p.tech.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, padding: "5px 12px", borderRadius: 999, background: "#fff", border: "1px solid #e7ddd1" }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: langColor(t) }} />
                {t}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
            {p.bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 14 }}>
                <span style={{ color: "#E95420", fontWeight: 700, fontSize: 18, lineHeight: 1.5 }}>{String(i + 1).padStart(2, "0")}</span>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#3a332c" }}>{b}</p>
              </div>
            ))}
          </div>

          <a href={p.github} target="_blank" rel="noreferrer" style={{ ...btnPrimary, display: "inline-block" }}>
            View source on GitHub &#8599;
          </a>
        </div>
      </div>
    );
};

/* ==================================================================
 * github.com/razaalirizvi4 — GitHub profile replica
 * ================================================================== */

const ContribGraph: FC = () => {
  const cols = 52;
  const rows = 7;
  const cell = 11;
  const gap = 3;
  const levels = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
  return (
    <svg width={cols * (cell + gap)} height={rows * (cell + gap)} style={{ display: "block" }}>
      {Array.from({ length: cols }).map((_, c) =>
        Array.from({ length: rows }).map((_, r) => {
          // heavier, greener toward recent (right) columns; deterministic-ish
          const recency = c / cols;
          const seed = (c * 7 + r * 13) % 5;
          const bias = recency > 0.7 ? 3 : recency > 0.45 ? 2 : recency > 0.2 ? 1 : 0;
          const lvl = Math.min(4, Math.max(0, Math.round((seed / 5) * 2 + bias) - (r % 2)));
          return (
            <rect
              key={`${c}-${r}`}
              x={c * (cell + gap)}
              y={r * (cell + gap)}
              width={cell}
              height={cell}
              rx={2}
              fill={levels[Math.min(4, Math.max(0, lvl))]}
            />
          );
        })
      )}
    </svg>
  );
};

const GithubProfile: FC = () => {
  const repos = profile.projects;
  return (
    <div style={{ ...pageRoot, background: "#0d1117", color: "#c9d1d9", fontFamily: "-apple-system, 'Segoe UI', 'Ubuntu', sans-serif" }}>
      {/* top bar */}
      <div style={{ background: "#161b22", borderBottom: "1px solid #30363d", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
          <svg height="26" viewBox="0 0 16 16" width="26" fill="#c9d1d9"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
          <span>{profile.githubUser}</span>
        </div>
        <a href={profile.github} target="_blank" rel="noreferrer" style={{ padding: "6px 14px", borderRadius: 6, background: "#238636", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(240,246,252,0.1)" }}>
          Open real profile &#8599;
        </a>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "296px 1fr", gap: 24 }}>
        {/* sidebar */}
        <aside>
          <div style={{ width: 260, height: 260, borderRadius: "50%", background: "#E95420", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 96, fontWeight: 700, border: "1px solid #30363d" }}>
            SR
          </div>
          <h1 style={{ fontSize: 26, margin: "16px 0 0", fontWeight: 600, color: "#e6edf3" }}>{profile.name}</h1>
          <div style={{ fontSize: 20, color: "#8b949e", fontWeight: 300 }}>{profile.githubUser}</div>
          <p style={{ fontSize: 14, color: "#c9d1d9", margin: "16px 0" }}>{profile.title} &middot; shipping things people pay for.</p>
          <div style={{ fontSize: 14, color: "#8b949e", display: "flex", flexDirection: "column", gap: 6 }}>
            <div>&#128205; {profile.location}</div>
            <div>&#127891; {profile.education.school}</div>
          </div>
        </aside>

        {/* main */}
        <main>
          <h2 style={{ fontSize: 16, fontWeight: 400, color: "#e6edf3", marginBottom: 12 }}>Pinned</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            {repos.map((p) => (
              <a
                key={p.id}
                href={p.github}
                target="_blank"
                rel="noreferrer"
                style={{ display: "block", border: "1px solid #30363d", borderRadius: 8, padding: 16, textDecoration: "none", color: "inherit", background: "#0d1117" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <svg height="16" viewBox="0 0 16 16" width="16" fill="#8b949e"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z" /></svg>
                  <span style={{ color: "#2f81f7", fontWeight: 600, fontSize: 14 }}>{p.github.split("/").pop()}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#8b949e", border: "1px solid #30363d", borderRadius: 999, padding: "1px 7px" }}>Public</span>
                </div>
                <p style={{ fontSize: 12.5, color: "#8b949e", margin: "0 0 16px", lineHeight: 1.45 }}>{p.tagline}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8b949e" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: langColor(p.tech[0]) }} />
                  {p.tech[0]}
                </div>
              </a>
            ))}
          </div>

          <div style={{ border: "1px solid #30363d", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, color: "#8b949e", marginBottom: 12 }}>1,337 contributions in the last year</div>
            <div style={{ overflowX: "auto" }}>
              <ContribGraph />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: 11, color: "#8b949e", marginTop: 8 }}>
              Less
              {["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"].map((c) => (
                <span key={c} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
              ))}
              More
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ==================================================================
 * dailybugle.com — J. Jonah Jameson's finest
 * ================================================================== */

const DailyBugle: FC = () => {
  const heads = easterEggs.bugleHeadlines;
  return (
    <div style={{ ...pageRoot, background: "#f4f1e8", color: "#1a1a1a", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 28px 60px" }}>
        {/* masthead */}
        <div style={{ textAlign: "center", borderBottom: "4px double #1a1a1a", paddingBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", display: "flex", justifyContent: "space-between", paddingBottom: 6 }}>
            <span>Vol. MMXXVI</span>
            <span>New York City</span>
            <span>Price: 5&cent;</span>
          </div>
          <h1 style={{ fontSize: 68, margin: 0, fontWeight: 900, letterSpacing: -1, fontFamily: "'UnifrakturCook', 'Old English Text MT', Georgia, serif" }}>
            THE DAILY BUGLE
          </h1>
          <div style={{ fontSize: 13, fontStyle: "italic", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "4px 0", marginTop: 8 }}>
            &ldquo;The only paper brave enough to tell the TRUTH about the wall-crawling menace&rdquo;
          </div>
        </div>

        {/* spinning subscribe banner */}
        <div style={{ display: "flex", justifyContent: "center", margin: "18px 0" }}>
          <div style={{ background: "#b11313", color: "#fff", fontWeight: 700, padding: "8px 22px", borderRadius: 4, animation: "bugle-spin 3.5s linear infinite", display: "inline-block", fontFamily: "'Ubuntu', sans-serif", letterSpacing: 0.5 }}>
            SUBSCRIBE NOW (J.J. needs money)
          </div>
        </div>

        {/* headline columns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {heads.map((h, i) => (
            <article key={i} style={{ borderTop: i === 0 ? "none" : undefined }}>
              <h2 style={{ fontSize: i === 0 ? 30 : 22, fontWeight: 900, lineHeight: 1.08, margin: "0 0 10px", letterSpacing: -0.3 }}>
                {h.title}
              </h2>
              {i === 0 && (
                <div style={{ background: "#d8d3c5", border: "1px solid #b8b2a2", height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "#7a7466", fontSize: 12, letterSpacing: 2, marginBottom: 12, fontFamily: "'Ubuntu', sans-serif" }}>
                  EXCLUSIVE PHOTOS
                </div>
              )}
              <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0, textAlign: "justify", columnCount: i === 0 ? 2 : 1, columnGap: 18 }}>
                <span style={{ float: "left", fontSize: 42, lineHeight: 0.8, paddingRight: 6, fontWeight: 900 }}>{h.body.charAt(0)}</span>
                {h.body.slice(1)}
              </p>
              {i !== 0 && (
                <div style={{ background: "#d8d3c5", border: "1px solid #b8b2a2", height: 90, display: "flex", alignItems: "center", justifyContent: "center", color: "#7a7466", fontSize: 11, letterSpacing: 2, marginTop: 12, fontFamily: "'Ubuntu', sans-serif" }}>
                  EXCLUSIVE PHOTOS
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ==================================================================
 * nba.com/scores — scoreboard + GOAT-o-meter
 * ================================================================== */

const NbaScores: FC = () => {
  const { notify } = useBrowser();
  const games = easterEggs.nbaScores;
  const [goat, setGoat] = useState(50); // % for #23
  const vote = () => {
    // it never actually moves — nudge then settle back to 50/50
    setGoat(50 + (Math.random() > 0.5 ? 6 : -6));
    setTimeout(() => setGoat(50), 260);
    notify("GOAT-o-meter", "the debate must never end");
  };

  return (
    <div style={{ ...pageRoot, background: "#f5f6f8", color: "#12203a", fontFamily: "'Ubuntu', system-ui, sans-serif" }}>
      {/* header band */}
      <div style={{ background: "#1d428a", color: "#fff", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 30, height: 44, borderRadius: 6, background: "linear-gradient(#c8102e 0 50%, #fff 50% 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "50%", top: 4, width: 10, height: 36, transform: "translateX(-50%)", background: "#1d428a", borderRadius: 6 }} />
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>NBA</span>
        <span style={{ fontSize: 14, opacity: 0.8, marginLeft: 4 }}>Scores</span>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        {/* scoreboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8a93a6", textTransform: "uppercase", letterSpacing: 1 }}>Final</div>
          {games.map((g, i) => {
            const awayWon = g.awayPts > g.homePts;
            return (
              <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e3e7ee", padding: "16px 20px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                <Row name={g.away} pts={g.awayPts} winner={awayWon} />
                <div style={{ height: 1, background: "#eef1f5", margin: "8px 0" }} />
                <Row name={g.home} pts={g.homePts} winner={!awayWon} />
                <div style={{ marginTop: 12, fontSize: 12.5, color: "#6b7488", fontStyle: "italic", borderLeft: "3px solid #E95420", paddingLeft: 10 }}>
                  {g.note}
                </div>
              </div>
            );
          })}
        </div>

        {/* GOAT-o-meter */}
        <aside>
          <div style={{ position: "sticky", top: 16, background: "#0b1b34", color: "#fff", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5, textAlign: "center" }}>&#127942; GOAT-o-meter</div>
            <div style={{ fontSize: 11.5, opacity: 0.65, textAlign: "center", marginTop: 4, marginBottom: 18 }}>Settle it. (You won&apos;t.)</div>

            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
              <span>#23</span>
              <span>#24</span>
            </div>
            <div style={{ height: 14, borderRadius: 999, background: "#7a3ea1", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${goat}%`, background: "#552583", transition: "width .25s ease" }} />
              <div style={{ flex: 1, background: "#fdb927" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              <span>{Math.round(goat)}%</span>
              <span>{100 - Math.round(goat)}%</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={vote} style={voteBtn("#552583")}>Vote #23</button>
              <button onClick={vote} style={voteBtn("#fdb927", "#12203a")}>Vote #24</button>
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, textAlign: "center", marginTop: 14 }}>1,000,000 votes cast &middot; forever tied</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Row: FC<{ name: string; pts: number; winner: boolean }> = ({ name, pts, winner }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#eef1f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#5a6478" }}>
        {name.slice(0, 3).toUpperCase()}
      </div>
      <span style={{ fontWeight: winner ? 800 : 500, fontSize: 16 }}>{name}</span>
    </div>
    <span style={{ fontWeight: winner ? 800 : 500, fontSize: 20, color: winner ? "#12203a" : "#8a93a6" }}>{pts}</span>
  </div>
);

const voteBtn = (bg: string, color = "#fff"): CSSProperties => ({
  flex: 1,
  padding: "9px 0",
  borderRadius: 8,
  border: "none",
  background: bg,
  color,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
});

/* ==================================================================
 * SITES registry + resolveUrl
 * ================================================================== */

export const SITES: Record<string, { title: string; component: FC }> = {
  "raza.dev": { title: `${profile.name} — ${profile.title}`, component: RazaHome },
  ...Object.fromEntries(
    profile.projects.map((p) => [
      `raza.dev/projects/${p.id}`,
      { title: `${p.name} — raza.dev`, component: ProjectPage },
    ])
  ),
  "github.com/razaalirizvi4": { title: `${profile.githubUser} · GitHub`, component: GithubProfile },
  "dailybugle.com": { title: "The Daily Bugle", component: DailyBugle },
  "nba.com/scores": { title: "NBA Scores", component: NbaScores },
};

export type Resolved = { key: string } | { external: string } | { notFound: string };

/** Strip protocol, leading www., and trailing slashes; lowercase. */
function normalizeKey(input: string): string {
  return input
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/**
 * Map awesome-bar input to a navigation outcome.
 *  - empty / bare search terms → raza.dev homepage
 *  - known SITES key → { key }
 *  - explicit http(s):// URL not in SITES → { external } (real window.open)
 *  - domain-shaped miss (e.g. example.com) → { notFound } (Firefox error page)
 */
export function resolveUrl(input: string): Resolved {
  const raw = input.trim();
  if (!raw) return { key: "raza.dev" };

  const hasProtocol = /^https?:\/\//i.test(raw);
  const key = normalizeKey(raw);

  if (key in SITES) return { key };

  // explicit external URL we don't host → open for real
  if (hasProtocol) return { external: raw };

  // domain-shaped but unknown → error page (avoid window.open on typos)
  const host = key.split("/")[0];
  const domainLike = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) && /\.[a-z]{2,}$/.test(host);
  if (domainLike) return { notFound: raw };

  // bare words → search-fallback to the homepage
  return { key: "raza.dev" };
}
