# Ubuntu Portfolio OS — Design Spec

**Date:** 2026-08-10
**Owner:** Syed Raza Ali Rizvi (razaalirizvi4@gmail.com)
**Repo:** `D:\work\portfolio` (frontend in `frontend/`, deployed to Vercel as a static Vite build)

## Goal

Replace the existing Windows-style desktop portfolio with a faithful, "extremely impressive" replica of the full Ubuntu 24.04 (GNOME 46, Yaru theme) desktop experience, populated with Raza's real resume content, plus discoverable Spider-Man and basketball easter eggs. On phones, the site renders an iOS-style shell instead. All existing UI components and styles are **deleted**, not restyled.

**Design bar:** screenshots of the desktop should be mistakable for real Ubuntu.

## Decisions made

- **Approach:** fully custom GNOME shell in React (no templates, no OS emulation), on the existing stack: React 19, Vite 7, Tailwind 4, framer-motion. New deps: `zustand` (OS store), a lazy-loaded syntax highlighter (shiki), `js-dos` (DOOM), `html-to-image` (screenshot tool).
- **Phasing:** Ubuntu desktop shell is built first and is the headline; the iOS mobile shell is phase 2 of the same plan, reusing the content core and app internals.
- **Apps:** Terminal, Files, Firefox, VS Code, Text Editor, Settings, System Monitor, Calculator, Image Viewer, Screenshot tool, DOOM (real shareware via js-dos, self-hosted), Document Viewer for the resume PDF.
- **Old ShooterApp:** removed (DOOM replaces it as the installed game).
- **Mobile:** iOS-style shell (springboard, lock screen, status bar, Control Center), same content core.
- **Deployment:** Vercel, unchanged — output stays a static Vite build.
- **Resume source:** `Syed Raza Ali Rizvi Resume (1).pdf` (already in repo root); copied into `public/` for in-app viewing + download.

## Architecture

Three layers under `frontend/src/`:

### 1. Content core — `src/content/`

- `profile.ts` — typed resume data, single source of truth:
  - **Identity:** Syed Raza Ali Rizvi, Lahore, Pakistan, razaalirizvi4@gmail.com, +92 332 4805552, github.com/razaalirizvi4.
  - **Education:** FAST-NUCES Lahore, BSc Software Engineering, CGPA 3.44, expected Aug 2027; coursework list.
  - **Experience:** Eyra Tech Corp., Software Engineering Intern, Oct 2025–Present — tekTracking SITE/TIMPS report & form workflows; Claude Code AI agents validated with Playwright suites; dynamic server-content localization; production support for IOC and LIRR; data/system migrations for ACTA, PATH, ETR.
  - **Projects:** Deep-Emotion (PyTorch train/eval dropout bug fix, FER2013 ~50%→~70%, 6 baselines), Twin (NL→shell CLI on Ollama/gemma3, 44 paid sales in 2 weeks), Agri-Pro (React/Redux + Node/Express/MongoDB, Mapbox GL + Turf.js, JWT auth, node-cron/webhooks), VOYA (React Native/Expo + Express + Supabase travel app, motorway tracker, SOS, AI tour guide). Each with GitHub URL and tech list.
  - **Skills:** languages / frameworks / tools exactly as on the resume.
- `filesystem.ts` — builds the **virtual filesystem** (VFS) from `profile.ts`: an in-memory tree rooted at `/` with `/home/raza/{Documents,Projects,Pictures,Downloads,.secrets,...}`. `Documents/resume.pdf`, one folder per project with README + curated source files, Pictures (wallpapers, `spider_bite_incident.jpg`, `buzzer_beater.gif`), hidden dotfiles with easter-egg content. Terminal, Files, VS Code, Text Editor, and Image Viewer all read/write this one tree (session-only mutations; no persistence).
- `easterEggs.ts` — egg copy/content in one place.

### 2. OS kernel — `src/os/`

One zustand store managing:

- **Session state machine:** `poweredOff → grub → kernelLog → plymouth → gdm → desktop ⇄ locked → shuttingDown → poweredOff`; restart replays boot.
- **Window registry:** id, appId, position, size, z-order, state (normal/maximized/minimized/snapped-left/right), workspace assignment.
- **App registry:** manifest per app (id, name, Yaru icon, component (lazy), default/min size, single-instance flag).
- **Notifications:** toast + drawer entries.
- **Settings:** wallpaper, accent color, dark/light — consumed by both shells.

### 3. Shells — `src/shell/desktop/` (Ubuntu) and `src/shell/mobile/` (iOS)

Chosen once at load via viewport width + touch detection. Apps are shell-agnostic components receiving a "surface" (window on desktop, fullscreen sheet on iOS).

## Ubuntu shell — session flow (A→Z)

1. **Power-on:** black screen → **GRUB menu** — entries: "Ubuntu", "Advanced options for Ubuntu", "Memory test", **"Web-Slinger OS (experimental)"** (easter egg: selecting it shows a Spider-Man-themed kernel panic trace, then boots Ubuntu anyway). Arrow keys + Enter work; auto-boot countdown.
2. **Kernel log:** scrolling dmesg-style lines with fake hardware ("Basketball Vibration Sensor detected on bus 23").
3. **Plymouth splash:** Ubuntu logo + spinner dots.
4. **GDM login:** blurred wallpaper, clock, avatar + "Syed Raza Ali Rizvi", password accepts anything (hint: "just press enter"), gear menu ("Ubuntu", "Ubuntu on Xorg", "GNOME Classic").
5. **Desktop:**
   - **Top bar:** Activities pill; center clock → calendar + notification drawer; right tray (network/volume/battery) → quick-settings panel.
   - **Dock (left, Yaru):** pinned apps, running-dot indicators, right-click menus.
   - Desktop icons; default Noble-Numbat-style wallpaper.
6. **Window manager:** drag; resize all edges/corners; snap left/right with orange preview overlay; maximize via top-edge drag or double-click titlebar; minimize-to-dock animation; focus rings; on-screen window switcher (browsers eat Alt+Tab); Yaru CSD headerbars.
7. **Activities overview:** zoom-out window grid; workspace strip (2–3 workspaces, drag windows between); search over apps **and** content (e.g. "pytorch" → Deep-Emotion); app grid page.
8. **Session end:** power menu → lock screen (clock curtain → GDM); restart (replays boot); shutdown → BIOS-style "It is now safe to close this tab."
9. **Shortcuts:** `Ctrl+Alt+T` terminal; arrow keys in GRUB; others where the browser permits.

## Apps

All lazy-loaded. Registered in the app registry.

1. **Terminal (GNOME Terminal)** — prompt `raza@ubuntu:~$`; history (↑/↓), tab completion, `Ctrl+C`, `Ctrl+L`. VFS commands: `ls`, `cd`, `cat`, `pwd`, `mkdir`, `rm` (protected files snark), `tree`, `grep`, `history`, `clear`, `echo`, `whoami`, `man`. Portfolio commands: `neofetch` (ASCII + "OS: RazaOS 1.0 · Host: FAST-NUCES · Uptime: since 2004"), `resume`, `projects`, `skills`, `contact`. Flavor: `sudo` → "razaalirizvi4 is not in the sudoers file. This incident will be reported… to J. Jonah Jameson"; `htop`; `cowsay`; `sl` (Spider-Mobile locomotive); minimal `python3` REPL (arithmetic); `thwip`; `ball`; `exit` closes window.
2. **Files (Nautilus)** — sidebar (Home, Documents, Projects, Pictures, Trash="Symbiote Containment", "Web-Shooters" bookmark); grid/list toggle; breadcrumbs; context menus; `Ctrl+H` hidden files (`.secrets/`). Opens files in correct app (pdf → Document Viewer, md/txt → Text Editor, images → Image Viewer).
3. **Firefox** — tabs + awesome-bar over an internal fake internet: `raza.dev` (portfolio homepage), per-project product pages, `github.com/razaalirizvi4` profile page (links out to the real GitHub in a real new tab), `dailybugle.com` ("LOCAL DEVELOPER SHIPS BUG-FREE CODE — MENACE?"), `nba.com/scores` (fake box scores). Unknown URL → Firefox error page. External real links open real tabs.
4. **VS Code (Code OSS)** — activity bar, explorer bound to `~/Projects`, tabs, syntax highlighting (lazy), curated real code: Deep-Emotion dropout fix as a diff, Twin pipeline, Agri-Pro map code. Integrated terminal = same Terminal component. Fake extensions panel ("Spider-Sense Linter").
5. **Text Editor** — GNOME 46 look; edits VFS md/txt in-session.
6. **Settings** — working: Appearance (dark/light, Yaru accent colors, wallpaper picker incl. Spider-Man + basketball-court wallpapers), About (device "web-slinger", "Ubuntu 24.04.1 LTS", Processor "Ryzen Web 9", GitHub/email in System Details), Users (bio). Cosmetic: Wi-Fi ("FAST-NUCES-Guest" connected) and other panels listed for completeness.
7. **System Monitor** — animated fake CPU/memory graphs (memory occasionally draws a shot-arc); sortable process table: `spider-daemon` (fixed 3%), `hoops.service`, `gnome-shell`, `web-crawler`, `jarvis`. Killing `spider-daemon` → "with great power…" notification.
8. **Calculator** — fully working basic calculator; entering `23 =` or `24 =` shows "🐐" tribute in history strip.
9. **Image Viewer (Eye of GNOME)** — browses Pictures/.
10. **Screenshot tool** — GNOME screenshot overlay; captures desktop via `html-to-image` and downloads the PNG.
11. **DOOM** — real shareware DOOM via self-hosted `js-dos` + `DOOM1.WAD`, lazy-loaded on launch, windowed with pointer-lock. Pinned in dock.
12. **Document Viewer (Evince)** — embeds the real resume PDF with a prominent **Download** button.

## iOS shell (mobile)

- Lock screen (clock, swipe up) → springboard (iOS icon grid + dock) → fullscreen apps with iOS nav bars; back via nav-bar chevron/swipe.
- Status bar: time, carrier "Jazz 5G", battery. Pull-down Control Center mapping to the same settings store.
- Same apps reskinned: Terminal fullscreen (works with on-screen keyboard), Files as iOS Files app look, Safari-styled browser over the same fake internet, resume viewer with share/download.
- Same wallpaper family + content core; zero duplicated data.

## Easter eggs

Discoverable, never in-your-face; the desktop reads as a serious Ubuntu install until poked.

- **Spider-Man:** GRUB "Web-Slinger OS" panic; `spider-daemon`; `.secrets/peter_parker_alibi.txt`; `thwip` (web line yanks active window); Daily Bugle; Spider-Man wallpaper; typing `with great power` in terminal auto-completes the quote; trash = "Symbiote Containment"; avatar hover spins a web.
- **Basketball:** `hoops.service`; Calculator 23/24 🐐; `buzzer_beater.gif`; `ball` ASCII bounce; swish notification sound on one egg; fake NBA scores; shot-arc memory graph; "Basketball Vibration Sensor" boot line.
- **Combined:** Konami code on desktop rains basketballs that stick to webs.

## Visual system

- Delete all existing components/styles (`App.css`, old `apps/*`, old `components/*`).
- Pixel-reference Ubuntu 24.04 / GNOME 46 / Yaru: `#E95420` orange, Yaru accent set, GNOME surfaces (`#241F31` dark / `#FAFAFA` light), real **Ubuntu** and **Ubuntu Mono** fonts bundled locally (no CDN), hand-built Yaru-geometry SVG icons for key apps, GNOME corner radii/shadows/spacing, framer-motion tuned to GNOME curves (~250ms ease-out).
- Banned: glassmorphism, gradient-on-glass, purple-default AI aesthetics.

## Error handling & performance

- Session state machine guards impossible transitions; unknown terminal commands → bash-style `command not found`; unknown Firefox URLs → error page; VFS ops validate paths.
- All apps lazy-loaded (`React.lazy`); DOOM/js-dos and highlighter only fetched on first use; boot sequence skippable (any key / "Skip" affordance) and auto-skipped for `prefers-reduced-motion`.
- First-paint budget: shell < 300KB gz before fonts/wallpaper.

## Testing

- **Vitest:** VFS operations, terminal command parser, session state machine, window-manager reducer (snap/z-order/workspace logic).
- **Playwright smoke flows:** boot → login → desktop; `Ctrl+Alt+T` → `neofetch` output; Files → resume.pdf → Document Viewer; Settings wallpaper change; mobile viewport → lock screen → springboard → open an app.
- Manual pass on Vercel preview before merge.

## Out of scope

- Real backend/persistence (all state session-only).
- Multi-user, real auth, real package manager.
- Ubuntu Touch fidelity on mobile (iOS shell chosen instead, per owner).
- Old ShooterApp (removed).
