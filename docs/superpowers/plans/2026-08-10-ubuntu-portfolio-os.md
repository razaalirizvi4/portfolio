# Ubuntu Portfolio OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing Windows-style desktop portfolio with a pixel-faithful Ubuntu 24.04 (GNOME 46 / Yaru) desktop experience populated with Raza's resume content, plus an iOS-style shell on phones, with Spider-Man and basketball easter eggs throughout.

**Architecture:** Three layers under `frontend/src/`: a **content core** (`content/` — typed resume data + virtual filesystem shared by all apps), an **OS kernel** (`os/` — one zustand store for session state machine, window registry, notifications, settings, plus the app registry), and two **shells** (`shell/desktop/` Ubuntu, `shell/mobile/` iOS) hosting shell-agnostic app components (`apps/`). Spec: `docs/superpowers/specs/2026-08-10-ubuntu-portfolio-design.md`.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind 4, framer-motion, zustand, @fontsource/ubuntu + @fontsource/ubuntu-mono, shiki (lazy), js-dos v8 (lazy), html-to-image, Vitest, Playwright.

## Global Constraints

- All work happens in `frontend/`; the Vercel build must remain a static Vite build (`npm run build` = `tsc -b && vite build`).
- **Delete** old UI (`src/components/`, `src/apps/`, `src/App.css`) — do not restyle it. `src/apps/ShooterApp.tsx` is removed permanently.
- No CDN/network fonts or assets: remove Google Fonts from `index.html`; bundle Ubuntu fonts via @fontsource packages.
- Yaru palette: Ubuntu orange `#E95420`, dark surface `#241F31`, light surface `#FAFAFA`, GNOME headerbar dark `#303030`, terminal purple `#300A24`. Animation timing: 250ms ease-out default.
- Banned aesthetics: glassmorphism, gradient-on-glass, purple-default AI look.
- All apps lazy-loaded via `React.lazy`. shiki and js-dos load only on first app launch.
- The user is `raza`, hostname `ubuntu`, home dir `/home/raza`. Terminal prompt: `raza@ubuntu:~$`.
- Easter eggs must be discoverable, never in-your-face (spec: "reads as a serious Ubuntu install until poked").
- Commit after every task (at minimum). No `Co-Authored-By` trailers (user global preference).
- Run commands from `frontend/` unless stated otherwise. PowerShell 5.1: no `&&` — chain with `;` or run separately.

## File Structure

```
frontend/src/
  main.tsx                     (unchanged except CSS/font imports)
  App.tsx                      (shell chooser: desktop vs mobile + session router)
  index.css                    (Tailwind 4 + Yaru design tokens + font imports)
  content/
    profile.ts                 (typed resume data — single source of truth)
    easterEggs.ts              (egg copy: secrets files, quotes, panic trace)
    filesystem.ts              (builds VFS tree from profile + eggs)
    fakeInternet.tsx           (Firefox's internal sites registry)
    codeSamples.ts             (curated project source strings for VS Code)
  os/
    types.ts                   (SessionState, WindowState, AppManifest, ...)
    store.ts                   (zustand store: session/windows/notifications/settings)
    vfs.ts                     (VFS engine class: resolve/list/read/write/mkdir/rm)
    apps.tsx                   (app registry: manifests for all apps)
  ui/
    icons.tsx                  (hand-built Yaru-geometry SVG icons)
  shell/desktop/
    DesktopShell.tsx           (session router for desktop: boot→gdm→desktop)
    boot/Grub.tsx  boot/KernelLog.tsx  boot/Plymouth.tsx  boot/Shutdown.tsx
    Gdm.tsx  LockScreen.tsx
    Desktop.tsx                (wallpaper, desktop icons, window layer, overlays)
    TopBar.tsx  ClockDropdown.tsx  QuickSettings.tsx
    Dock.tsx
    WindowFrame.tsx  WindowLayer.tsx  WindowSwitcher.tsx
    Activities.tsx             (overview: window grid, workspaces, search, app grid)
    ContextMenu.tsx
  shell/mobile/
    MobileShell.tsx  IosLockScreen.tsx  Springboard.tsx
    IosStatusBar.tsx  ControlCenter.tsx  IosAppFrame.tsx
  apps/
    terminal/Terminal.tsx  terminal/shell.ts  terminal/commands.tsx
    files/Files.tsx
    firefox/Firefox.tsx
    vscode/VsCode.tsx
    texteditor/TextEditor.tsx
    settings/SettingsApp.tsx
    sysmon/SystemMonitor.tsx
    calculator/Calculator.tsx
    imageviewer/ImageViewer.tsx
    screenshot/Screenshot.tsx
    doom/Doom.tsx
    evince/DocumentViewer.tsx
frontend/src/__tests__/        (vitest: vfs, store, terminal shell)
frontend/e2e/                  (playwright smoke tests)
frontend/public/
  resume.pdf                   (copied from repo root PDF)
  wallpapers/*.svg             (hand-made: noble.svg, spiderman.svg, court.svg, dark.svg)
  doom/                        (js-dos bundle, task 17)
```

---

### Task 1: Demolition, dependencies, design tokens, test harness

**Files:**
- Delete: `frontend/src/components/` (all), `frontend/src/apps/` (all incl. `ShooterApp.tsx`), `frontend/src/App.css`, `frontend/src/assets/react.svg`
- Modify: `frontend/package.json`, `frontend/index.html`, `frontend/src/index.css`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/vite.config.ts`
- Create: `frontend/vitest.config.ts`, `frontend/public/resume.pdf`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: CSS custom properties every later task uses: `--yaru-orange: #E95420`, `--surface-dark: #241F31`, `--surface-light: #FAFAFA`, `--headerbar: #303030`, `--terminal-bg: #300A24`, font families `Ubuntu` (var `--font-ui`) and `Ubuntu Mono` (var `--font-mono`); `npm test` runs Vitest.

- [ ] **Step 1: Install dependencies**

```powershell
cd frontend
npm i zustand @fontsource/ubuntu @fontsource/ubuntu-mono html-to-image
npm i -D vitest @vitest/ui jsdom @testing-library/react @playwright/test
```

Expected: exit 0, packages in `package.json`. (shiki and js-dos are installed in their own tasks.)

- [ ] **Step 2: Delete the old UI**

```powershell
Remove-Item -Recurse -Force src/components, src/apps, src/App.css, src/assets
```

- [ ] **Step 3: Copy the resume PDF into public/**

```powershell
Copy-Item "..\Syed Raza Ali Rizvi Resume (1).pdf" public/resume.pdf
```

- [ ] **Step 4: Rewrite `index.html`** — remove Google Fonts links, set the title and a temporary favicon (replaced in Task 5):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="description" content="Syed Raza Ali Rizvi — Software Engineer. An Ubuntu desktop you can use." />
    <title>razaOS — Syed Raza Ali Rizvi</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Rewrite `src/index.css`** with fonts + Yaru tokens:

```css
@import "@fontsource/ubuntu/300.css";
@import "@fontsource/ubuntu/400.css";
@import "@fontsource/ubuntu/500.css";
@import "@fontsource/ubuntu/700.css";
@import "@fontsource/ubuntu-mono/400.css";
@import "@fontsource/ubuntu-mono/700.css";
@import "tailwindcss";

:root {
  --yaru-orange: #E95420;
  --yaru-accent: #E95420; /* runtime-overridden by Settings accent picker */
  --surface-dark: #241F31;
  --surface-light: #FAFAFA;
  --headerbar: #303030;
  --headerbar-light: #EBEBEB;
  --terminal-bg: #300A24;
  --font-ui: "Ubuntu", system-ui, sans-serif;
  --font-mono: "Ubuntu Mono", monospace;
}

html, body, #root { height: 100%; overflow: hidden; }
body {
  font-family: var(--font-ui);
  background: #000;
  user-select: none;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 6: Stub `src/App.tsx`** (temporary — replaced in Task 8/19):

```tsx
export default function App() {
  return (
    <div className="h-full grid place-items-center text-white" style={{ background: "var(--surface-dark)" }}>
      <p style={{ fontFamily: "var(--font-mono)" }}>razaOS: rebuilding…</p>
    </div>
  );
}
```

Also delete the `import './App.css'` line from `src/App.tsx`'s old version (the rewrite above removes it) and keep `src/main.tsx` as-is (it already imports `./index.css`).

- [ ] **Step 7: Add Vitest config + script**

Create `frontend/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", include: ["src/__tests__/**/*.test.{ts,tsx}"] },
});
```

In `package.json` scripts add: `"test": "vitest run"` and `"test:e2e": "npx playwright test"`.

- [ ] **Step 8: Verify build and dev server**

```powershell
npm run build
```

Expected: PASS (tsc + vite build succeed, no references to deleted files remain).

- [ ] **Step 9: Commit**

```powershell
git add -A; git commit -m "chore: demolish old UI, add Yaru tokens, fonts, test harness"
```

---

### Task 2: Content core — profile, easter-egg copy, resume data

**Files:**
- Create: `frontend/src/content/profile.ts`, `frontend/src/content/easterEggs.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `profile` object (shape below) imported by filesystem/terminal/Firefox/VS Code/Settings/iOS apps; `easterEggs` object with `secretsFiles: {name: string; content: string}[]`, `kernelPanicLines: string[]`, `bugleHeadlines: {title: string; body: string}[]`, `nbaScores: {home: string; away: string; homePts: number; awayPts: number; note: string}[]`.

- [ ] **Step 1: Write `src/content/profile.ts`** — the full resume, typed. This is the single source of truth; later tasks import from here and NEVER hardcode resume facts.

```ts
export interface Project {
  id: string; name: string; tagline: string;
  tech: string[]; github: string; bullets: string[];
}

export const profile = {
  name: "Syed Raza Ali Rizvi",
  username: "raza",
  hostname: "ubuntu",
  title: "Software Engineer",
  location: "Lahore, Pakistan",
  email: "razaalirizvi4@gmail.com",
  phone: "+92 332 4805552",
  github: "https://github.com/razaalirizvi4",
  githubUser: "razaalirizvi4",
  education: {
    school: "FAST-NUCES",
    location: "Lahore, Pakistan",
    degree: "BSc Software Engineering",
    cgpa: "3.44",
    expected: "Aug 2027",
    coursework: [
      "Data Structures & Algorithms", "Object-Oriented Programming",
      "Design & Analysis of Algorithms", "Database Systems",
      "Artificial Intelligence", "Natural Language Processing",
    ],
  },
  experience: [{
    company: "Eyra Tech Corp.",
    location: "Lahore, Pakistan",
    role: "Software Engineering Intern",
    period: "Oct 2025 – Present",
    bullets: [
      "Worked within tekTracking's SITE and TIMPS systems, developing and enhancing reports and application form workflows to improve data capture, validation, and the accuracy and usability of report outputs used by enterprise rail customers.",
      "Built AI agents with Claude Code to automate report and application form generation, validating output correctness through multiple automated Playwright test suites.",
      "Implemented dynamic localization for all server-driven content, enabling data received from the server to be displayed in the user's language at runtime.",
      "Debugged production issues and delivered documented support patches for enterprise transit customers including IOC and LIRR (Long Island Rail Road).",
      "Planned and executed data/system migrations for customers including ACTA, PATH, and ETR while preserving data integrity in live production environments.",
    ],
  }],
  projects: [
    {
      id: "deep-emotion",
      name: "Deep-Emotion",
      tagline: "Paper replication & bug fix — FER2013 accuracy ~50% → ~70%",
      tech: ["Python", "PyTorch"],
      github: "https://github.com/razaalirizvi4/deep-emotion",
      bullets: [
        "Identified that the reference implementation applied dropout via PyTorch's functional API without gating it on train/eval mode, leaving dropout active during evaluation and suppressing test-time accuracy to a ~50% plateau.",
        "Fixed the train/eval mode inconsistency and, in a controlled before/after comparison, raised FER2013 evaluation accuracy from ~50% to ~70%, reproducing the paper's reported results; benchmarked against six baselines (ResNet50, VGG19, MobileNet, EfficientNet, AlexNet-tiny, cascade CNN).",
      ],
    },
    {
      id: "twin",
      name: "Twin",
      tagline: "Natural language → shell commands. 44 paid sales in 2 weeks.",
      tech: ["Python", "Shell", "Ollama"],
      github: "https://github.com/razaalirizvi4/twin",
      bullets: [
        "Developed an AI-powered command line assistant that transforms natural language prompts into executable shell commands.",
        "Integrated with the Ollama framework, leveraging the gemma3 model to interpret and generate shell instructions.",
        "Achieved 44 paid sales within the first 2 weeks, validating real-world demand for the tool.",
      ],
    },
    {
      id: "agri-pro",
      name: "Agri-Pro",
      tagline: "Full-stack farm management with geospatial mapping",
      tech: ["React.js", "Node.js", "Express.js", "MongoDB", "Mapbox"],
      github: "https://github.com/razaalirizvi4/agriclone2",
      bullets: [
        "Built a full-stack farm management platform with a React/Redux frontend and Node.js/Express/MongoDB backend, including JWT-based authentication and role/permission handling.",
        "Implemented interactive geospatial farm mapping with Mapbox GL and Turf.js, enabling users to draw, edit, and manage farm and field boundaries.",
        "Automated backend workflows with scheduled jobs (node-cron), transactional email notifications, and webhook-based event streaming.",
      ],
    },
    {
      id: "voya",
      name: "VOYA",
      tagline: "Cross-platform travel companion app for Pakistan",
      tech: ["React Native", "TypeScript", "Express.js", "Supabase"],
      github: "https://github.com/Eishal-Fatima-Qadri/VOYA",
      bullets: [
        "Co-developed a cross-platform travel companion app for Pakistan with a React Native (Expo) frontend, an Express.js API layer, and Supabase for authentication and real-time data.",
        "Built real-time features including a live motorway status tracker with community reporting, emergency SOS contacts, and flight tracking with push notifications.",
        "Implemented an AI-powered tour guide generating personalized multi-day itineraries with interactive map pins and categorized local-phrase translations.",
      ],
    },
  ] satisfies Project[],
  skills: {
    languages: ["Java", "Python", "C/C++", "SQL", "JavaScript", "TypeScript", "HTML/CSS"],
    frameworks: ["React.js", "React Native", "Node.js", "Express.js", "PyTorch", "Tailwind CSS", "Bootstrap"],
    tools: ["Git", "Claude Code", "Playwright", "Ollama", "Visual Studio Code", "IntelliJ", "PyCharm", "Firebase", "Supabase", "Linux"],
  },
} as const;
export type Profile = typeof profile;
```

- [ ] **Step 2: Write `src/content/easterEggs.ts`**

```ts
export const easterEggs = {
  secretsFiles: [
    {
      name: "peter_parker_alibi.txt",
      content: "ALIBI LOG — do not open, JJJ\n\nOct 12: was 'debugging' during the Vulture incident. Verified by git log.\nNov 3: cannot have been at the bank robbery. Was pushing to main. On a Friday. That IS the crime.\nDec 25: with great power comes great responsibility. And unit tests.",
    },
    {
      name: "the_plan.md",
      content: "# The Plan\n1. Graduate FAST-NUCES (Aug 2027)\n2. Ship things people pay for (44 and counting)\n3. Hit a game-winner in a pickup game\n4. Never leave dropout enabled during eval again\n",
    },
  ],
  kernelPanicLines: [
    "web-slinger: spider_sense module tainted: P     W  O",
    "Call Trace: <TASK> thwip_dispatch+0x62/0x90 [web_shooter]",
    " ??? great_power+0x0/0xff [responsibility not loaded]",
    "Kernel panic - not syncing: With great power comes great responsibility.",
    "---[ end Kernel panic. Booting regular Ubuntu instead. ]---",
  ],
  bugleHeadlines: [
    { title: "LOCAL DEVELOPER SHIPS BUG-FREE CODE — MENACE?", body: "Sources confirm Lahore-based engineer Syed Raza Ali Rizvi pushed to production on a Friday and NOTHING BROKE. This masked menace must be stopped. Pictures of Spider-Man on page 6." },
    { title: "SPIDER-MAN SEEN NEAR FAST-NUCES CAMPUS", body: "Eyewitnesses report web-like structures on the CS building. University claims it is 'just the LAN topology diagram'." },
    { title: "OPINION: node_modules IS THE REAL VILLAIN", body: "At 400MB, it has done more damage to this city's disks than Doc Ock ever did." },
  ],
  nbaScores: [
    { home: "Lakers", away: "Bulls", homePts: 110, awayPts: 112, note: "MJ with the game-winner. Again. In 2026. Don't ask." },
    { home: "Warriors", away: "Cavs", homePts: 118, awayPts: 121, note: "Blocked. Chased down from behind. You know the one." },
    { home: "Raptors", away: "Sixers", homePts: 92, awayPts: 90, note: "Bounce... bounce... bounce... bounce... in." },
  ],
} as const;
```

- [ ] **Step 3: Verify it typechecks**

```powershell
npx tsc -b
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/content; git commit -m "feat: content core - typed resume profile and easter egg copy"
```

---

### Task 3: VFS engine (TDD) + filesystem builder

**Files:**
- Create: `frontend/src/os/vfs.ts`, `frontend/src/content/filesystem.ts`, `frontend/src/__tests__/vfs.test.ts`

**Interfaces:**
- Consumes: `profile` from `content/profile.ts`, `easterEggs` from `content/easterEggs.ts`.
- Produces:
  - `type VfsFileKind = "text" | "markdown" | "pdf" | "image" | "code" | "desktop"`
  - `interface VfsFile { type: "file"; name: string; kind: VfsFileKind; content: string; url?: string }` (`url` set for pdf/image assets, e.g. `/resume.pdf`)
  - `interface VfsDir { type: "dir"; name: string; children: Record<string, VfsNode> }`
  - `type VfsNode = VfsFile | VfsDir`
  - `class Vfs { constructor(root: VfsDir); resolve(path: string, cwd?: string): VfsNode | null; normalize(path: string, cwd?: string): string; list(path: string, cwd?: string): VfsNode[]; read(path: string, cwd?: string): string; write(path: string, content: string, cwd?: string): void; mkdir(path: string, cwd?: string): void; rm(path: string, cwd?: string): { ok: boolean; error?: string }; isProtected(path: string): boolean }`
  - `buildFilesystem(): Vfs` from `content/filesystem.ts` — the populated home tree.
  - Paths support `~` (= `/home/raza`), `.`, `..`, relative resolution against `cwd`.
  - Protected paths (rm refuses with snark): `/home/raza/Documents/resume.pdf`, everything outside `/home/raza`.

- [ ] **Step 1: Write failing tests** `src/__tests__/vfs.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { Vfs } from "../os/vfs";
import { buildFilesystem } from "../content/filesystem";

let vfs: Vfs;
beforeEach(() => { vfs = buildFilesystem(); });

describe("path resolution", () => {
  it("resolves ~ to /home/raza", () => {
    expect(vfs.normalize("~")).toBe("/home/raza");
    expect(vfs.normalize("~/Documents")).toBe("/home/raza/Documents");
  });
  it("resolves relative paths against cwd", () => {
    expect(vfs.normalize("Projects", "/home/raza")).toBe("/home/raza/Projects");
    expect(vfs.normalize("..", "/home/raza/Projects")).toBe("/home/raza");
    expect(vfs.normalize("./x/../y", "/home/raza")).toBe("/home/raza/y");
  });
  it("returns null for nonexistent paths", () => {
    expect(vfs.resolve("/nope")).toBeNull();
  });
});

describe("content tree", () => {
  it("has the resume in Documents", () => {
    const f = vfs.resolve("~/Documents/resume.pdf");
    expect(f?.type).toBe("file");
    expect((f as any).kind).toBe("pdf");
    expect((f as any).url).toBe("/resume.pdf");
  });
  it("has one folder per project with a README", () => {
    for (const id of ["deep-emotion", "twin", "agri-pro", "voya"]) {
      expect(vfs.resolve(`~/Projects/${id}/README.md`)?.type).toBe("file");
    }
  });
  it("hides .secrets as a dotdir with the alibi file", () => {
    expect(vfs.read("~/.secrets/peter_parker_alibi.txt")).toContain("JJJ");
  });
});

describe("mutation", () => {
  it("mkdir + write + read round-trips", () => {
    vfs.mkdir("~/tmp");
    vfs.write("~/tmp/note.txt", "hello");
    expect(vfs.read("~/tmp/note.txt")).toBe("hello");
  });
  it("rm removes normal files but refuses protected ones", () => {
    vfs.write("~/junk.txt", "x");
    expect(vfs.rm("~/junk.txt").ok).toBe(true);
    const res = vfs.rm("~/Documents/resume.pdf");
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });
  it("refuses rm outside home", () => {
    expect(vfs.rm("/usr").ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npm test
```

Expected: FAIL — cannot resolve `../os/vfs`.

- [ ] **Step 3: Implement `src/os/vfs.ts`**

```ts
export type VfsFileKind = "text" | "markdown" | "pdf" | "image" | "code" | "desktop";
export interface VfsFile { type: "file"; name: string; kind: VfsFileKind; content: string; url?: string }
export interface VfsDir { type: "dir"; name: string; children: Record<string, VfsNode> }
export type VfsNode = VfsFile | VfsDir;

export const HOME = "/home/raza";

export function dir(name: string, children: VfsNode[] = []): VfsDir {
  return { type: "dir", name, children: Object.fromEntries(children.map(c => [c.name, c])) };
}
export function file(name: string, kind: VfsFileKind, content: string, url?: string): VfsFile {
  return { type: "file", name, kind, content, url };
}

export class Vfs {
  constructor(public root: VfsDir) {}

  normalize(path: string, cwd: string = HOME): string {
    let p = path.trim();
    if (p === "" ) p = cwd;
    if (p === "~") p = HOME;
    else if (p.startsWith("~/")) p = HOME + p.slice(1);
    if (!p.startsWith("/")) p = cwd.replace(/\/$/, "") + "/" + p;
    const out: string[] = [];
    for (const seg of p.split("/")) {
      if (seg === "" || seg === ".") continue;
      if (seg === "..") out.pop();
      else out.push(seg);
    }
    return "/" + out.join("/");
  }

  resolve(path: string, cwd?: string): VfsNode | null {
    const norm = this.normalize(path, cwd);
    if (norm === "/") return this.root;
    let node: VfsNode = this.root;
    for (const seg of norm.slice(1).split("/")) {
      if (node.type !== "dir") return null;
      const next: VfsNode | undefined = node.children[seg];
      if (!next) return null;
      node = next;
    }
    return node;
  }

  list(path: string, cwd?: string): VfsNode[] {
    const node = this.resolve(path, cwd);
    if (!node || node.type !== "dir") return [];
    return Object.values(node.children).sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1);
  }

  read(path: string, cwd?: string): string {
    const node = this.resolve(path, cwd);
    if (!node) throw new Error(`No such file: ${path}`);
    if (node.type === "dir") throw new Error(`Is a directory: ${path}`);
    return node.content;
  }

  private parentOf(path: string, cwd?: string): { parent: VfsDir; name: string } | null {
    const norm = this.normalize(path, cwd);
    const idx = norm.lastIndexOf("/");
    const parentPath = idx === 0 ? "/" : norm.slice(0, idx);
    const name = norm.slice(idx + 1);
    const parent = this.resolve(parentPath);
    if (!parent || parent.type !== "dir" || !name) return null;
    return { parent, name };
  }

  write(path: string, content: string, cwd?: string): void {
    const pn = this.parentOf(path, cwd);
    if (!pn) throw new Error(`No such directory`);
    const existing = pn.parent.children[pn.name];
    if (existing?.type === "dir") throw new Error(`Is a directory: ${path}`);
    const kind: VfsFileKind = pn.name.endsWith(".md") ? "markdown" : "text";
    pn.parent.children[pn.name] = existing
      ? { ...existing, content }
      : file(pn.name, kind, content);
  }

  mkdir(path: string, cwd?: string): void {
    const pn = this.parentOf(path, cwd);
    if (!pn) throw new Error(`No such directory`);
    if (!pn.parent.children[pn.name]) pn.parent.children[pn.name] = dir(pn.name);
  }

  isProtected(path: string): boolean {
    const norm = this.normalize(path);
    if (!norm.startsWith(HOME + "/")) return true;
    return norm === `${HOME}/Documents/resume.pdf`;
  }

  rm(path: string, cwd?: string): { ok: boolean; error?: string } {
    const norm = this.normalize(path, cwd);
    if (this.isProtected(norm)) {
      return { ok: false, error: norm.endsWith("resume.pdf")
        ? "rm: cannot remove 'resume.pdf': Nice try. That took HOURS in LaTeX."
        : `rm: cannot remove '${path}': Permission denied (and my spider-sense is tingling)` };
    }
    const pn = this.parentOf(norm);
    if (!pn || !pn.parent.children[pn.name]) return { ok: false, error: `rm: cannot remove '${path}': No such file or directory` };
    delete pn.parent.children[pn.name];
    return { ok: true };
  }
}
```

- [ ] **Step 4: Implement `src/content/filesystem.ts`** — builds the tree from content:

```ts
import { Vfs, dir, file, type VfsDir } from "../os/vfs";
import { profile } from "./profile";
import { easterEggs } from "./easterEggs";

function projectReadme(p: (typeof profile.projects)[number]): string {
  return `# ${p.name}\n\n> ${p.tagline}\n\n**Tech:** ${p.tech.join(", ")}\n**GitHub:** ${p.github}\n\n${p.bullets.map(b => `- ${b}`).join("\n")}\n`;
}

export function buildFilesystem(): Vfs {
  const root: VfsDir = dir("", [
    dir("home", [
      dir("raza", [
        dir("Documents", [
          file("resume.pdf", "pdf", "", "/resume.pdf"),
          file("about-me.md", "markdown",
            `# ${profile.name}\n\n${profile.title} — ${profile.location}\n\n${profile.email} · ${profile.github}\n\nBSc Software Engineering @ ${profile.education.school} (CGPA ${profile.education.cgpa}, expected ${profile.education.expected}).\nCurrently: ${profile.experience[0].role} @ ${profile.experience[0].company}.\n`),
        ]),
        dir("Projects", profile.projects.map(p =>
          dir(p.id, [file("README.md", "markdown", projectReadme(p))]))),
        dir("Pictures", [
          file("wallpaper-noble.svg", "image", "", "/wallpapers/noble.svg"),
          file("wallpaper-spiderman.svg", "image", "", "/wallpapers/spiderman.svg"),
          file("wallpaper-court.svg", "image", "", "/wallpapers/court.svg"),
          file("spider_bite_incident.jpg", "image", "", "/wallpapers/spider-bite.svg"),
          file("buzzer_beater.gif", "image", "", "/wallpapers/buzzer-beater.svg"),
        ]),
        dir("Downloads", []),
        dir(".local", [dir("Trash", [
          file("old_portfolio_design.txt", "text", "It was Windows-styled. We don't talk about it."),
        ])]),
        dir(".secrets", easterEggs.secretsFiles.map(s => file(s.name, "text", s.content))),
        file(".bashrc", "text", "# ~/.bashrc\nalias goat='echo 23'\nexport SPIDER_SENSE=on\n"),
      ]),
    ]),
    dir("usr", [dir("bin", [])]),
    dir("etc", [file("hostname", "text", profile.hostname)]),
  ]);
  return new Vfs(root);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```powershell
npm test
```

Expected: PASS (all vfs tests green).

- [ ] **Step 6: Commit**

```powershell
git add src/os/vfs.ts src/content/filesystem.ts src/__tests__/vfs.test.ts
git commit -m "feat: virtual filesystem engine and content tree (TDD)"
```

---

### Task 4: OS kernel store (TDD) — session, windows, notifications, settings

**Files:**
- Create: `frontend/src/os/types.ts`, `frontend/src/os/store.ts`, `frontend/src/__tests__/store.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure state).
- Produces (exact — every shell/app task uses these):

```ts
// os/types.ts
export type SessionState = "poweredOff" | "grub" | "kernelLog" | "plymouth" | "gdm" | "desktop" | "locked" | "shuttingDown";
export type WindowMode = "normal" | "maximized" | "minimized" | "snap-left" | "snap-right";
export interface Rect { x: number; y: number; w: number; h: number }
export interface OsWindow {
  id: string; appId: string; rect: Rect; z: number;
  mode: WindowMode; prevRect: Rect | null; prevMode: WindowMode | null; workspace: number;
  props?: Record<string, unknown>;
}
// prevRect: rect to restore when leaving maximized/snapped.
// prevMode: mode to restore when un-minimizing (minimize saves it, restore reads it).
export interface Notification { id: string; appId: string; title: string; body: string; time: number }
export interface OsSettings { wallpaper: string; theme: "dark" | "light"; accent: string }
```

```ts
// os/store.ts — zustand store `useOs` with state:
//   session: SessionState; windows: OsWindow[]; activeWorkspace: number (0-based, 3 workspaces);
//   focusedId: string | null; notifications: Notification[]; drawer: Notification[];
//   settings: OsSettings; overviewOpen: boolean;
// and actions (all top-level store functions):
//   powerOn(), bootTo(s: SessionState), login(), lock(), unlock(), shutdown(), restart(),
//   openApp(appId: string, props?: Record<string, unknown>): string /* window id */,
//   closeWindow(id), focusWindow(id), minimizeWindow(id), toggleMaximize(id),
//   snapWindow(id, side: "left" | "right"), restoreWindow(id),
//   moveWindow(id, x, y), resizeWindow(id, rect: Rect),
//   setWorkspace(n), moveWindowToWorkspace(id, n),
//   notify(appId, title, body), dismissNotification(id), clearDrawer(),
//   setSettings(partial: Partial<OsSettings>), setOverview(open: boolean)
// openApp: if manifest.singleInstance and a window for appId exists, focus it (and un-minimize) instead of opening a second.
// New windows cascade: x = 120 + 32*(count % 8), y = 64 + 24*(count % 8), size = manifest.defaultSize, workspace = activeWorkspace.
// focusWindow sets z to (max z + 1) and focusedId. restart() resets windows and returns to "grub". shutdown() → "shuttingDown".
```

Default settings: `{ wallpaper: "/wallpapers/noble.svg", theme: "dark", accent: "#E95420" }`. Initial session: `"poweredOff"`... `powerOn()` → `"grub"`.

- [ ] **Step 1: Write failing tests** `src/__tests__/store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useOs } from "../os/store";

beforeEach(() => useOs.getState().__reset());

describe("session machine", () => {
  it("boots poweredOff → grub → … → desktop", () => {
    const s = useOs.getState;
    expect(s().session).toBe("poweredOff");
    s().powerOn(); expect(s().session).toBe("grub");
    s().bootTo("kernelLog"); s().bootTo("plymouth"); s().bootTo("gdm");
    s().login(); expect(s().session).toBe("desktop");
  });
  it("lock/unlock cycles desktop ⇄ locked", () => {
    const s = useOs.getState;
    s().powerOn(); s().bootTo("gdm"); s().login();
    s().lock(); expect(s().session).toBe("locked");
    s().unlock(); expect(s().session).toBe("gdm");
  });
  it("restart clears windows and replays boot", () => {
    const s = useOs.getState;
    s().powerOn(); s().bootTo("gdm"); s().login();
    s().openApp("terminal");
    s().restart();
    expect(s().session).toBe("grub");
    expect(s().windows).toHaveLength(0);
  });
});

describe("window manager", () => {
  beforeEach(() => {
    const s = useOs.getState;
    s().powerOn(); s().bootTo("gdm"); s().login();
  });
  it("openApp creates a focused window; focus raises z", () => {
    const s = useOs.getState;
    const a = s().openApp("terminal");
    const b = s().openApp("files");
    expect(s().focusedId).toBe(b);
    s().focusWindow(a);
    const za = s().windows.find(w => w.id === a)!.z;
    const zb = s().windows.find(w => w.id === b)!.z;
    expect(za).toBeGreaterThan(zb);
  });
  it("singleInstance apps refocus instead of duplicating", () => {
    const s = useOs.getState;
    const a = s().openApp("settings");
    const b = s().openApp("settings");
    expect(a).toBe(b);
    expect(s().windows.filter(w => w.appId === "settings")).toHaveLength(1);
  });
  it("maximize stores prevRect and toggle restores it", () => {
    const s = useOs.getState;
    const id = s().openApp("terminal");
    const before = s().windows[0].rect;
    s().toggleMaximize(id);
    expect(s().windows[0].mode).toBe("maximized");
    s().toggleMaximize(id);
    expect(s().windows[0].mode).toBe("normal");
    expect(s().windows[0].rect).toEqual(before);
  });
  it("snap and workspace assignment work", () => {
    const s = useOs.getState;
    const id = s().openApp("terminal");
    s().snapWindow(id, "left");
    expect(s().windows[0].mode).toBe("snap-left");
    s().moveWindowToWorkspace(id, 2);
    expect(s().windows[0].workspace).toBe(2);
  });
});

describe("notifications & settings", () => {
  it("notify adds to toasts and drawer; dismiss removes toast only", () => {
    const s = useOs.getState;
    s().notify("sysmon", "Process killed", "with great power…");
    expect(s().notifications).toHaveLength(1);
    expect(s().drawer).toHaveLength(1);
    s().dismissNotification(s().notifications[0].id);
    expect(s().notifications).toHaveLength(0);
    expect(s().drawer).toHaveLength(1);
  });
  it("setSettings merges partials", () => {
    const s = useOs.getState;
    s().setSettings({ theme: "light" });
    expect(s().settings.theme).toBe("light");
    expect(s().settings.wallpaper).toBe("/wallpapers/noble.svg");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL** (`../os/store` missing). Note: the store must expose a test-only `__reset()` action restoring initial state.

- [ ] **Step 3: Implement `src/os/types.ts` and `src/os/store.ts`**

`types.ts` exactly as in the Interfaces block above. `store.ts`:

```ts
import { create } from "zustand";
import type { SessionState, OsWindow, Notification, OsSettings, Rect, WindowMode } from "./types";
import { getManifest } from "./apps";

interface OsStore {
  session: SessionState;
  windows: OsWindow[];
  activeWorkspace: number;
  focusedId: string | null;
  notifications: Notification[];
  drawer: Notification[];
  settings: OsSettings;
  overviewOpen: boolean;
  powerOn(): void; bootTo(s: SessionState): void; login(): void;
  lock(): void; unlock(): void; shutdown(): void; restart(): void;
  openApp(appId: string, props?: Record<string, unknown>): string;
  closeWindow(id: string): void; focusWindow(id: string): void;
  minimizeWindow(id: string): void; toggleMaximize(id: string): void;
  snapWindow(id: string, side: "left" | "right"): void; restoreWindow(id: string): void;
  moveWindow(id: string, x: number, y: number): void; resizeWindow(id: string, rect: Rect): void;
  setWorkspace(n: number): void; moveWindowToWorkspace(id: string, n: number): void;
  notify(appId: string, title: string, body: string): void;
  dismissNotification(id: string): void; clearDrawer(): void;
  setSettings(p: Partial<OsSettings>): void; setOverview(open: boolean): void;
  __reset(): void;
}

const initial = {
  session: "poweredOff" as SessionState,
  windows: [] as OsWindow[],
  activeWorkspace: 0,
  focusedId: null as string | null,
  notifications: [] as Notification[],
  drawer: [] as Notification[],
  settings: { wallpaper: "/wallpapers/noble.svg", theme: "dark", accent: "#E95420" } as OsSettings,
  overviewOpen: false,
};

let seq = 0;
const nid = () => `w${++seq}`;

export const useOs = create<OsStore>((set, get) => ({
  ...initial,
  powerOn: () => set({ session: "grub" }),
  bootTo: (s) => set({ session: s }),
  login: () => set({ session: "desktop" }),
  lock: () => set({ session: "locked" }),
  unlock: () => set({ session: "gdm" }),
  shutdown: () => set({ session: "shuttingDown" }),
  restart: () => set({ ...initial, session: "grub", settings: get().settings }),

  openApp: (appId, props) => {
    const m = getManifest(appId);
    const st = get();
    if (m.singleInstance) {
      const existing = st.windows.find(w => w.appId === appId);
      if (existing) {
        get().restoreWindow(existing.id);
        get().focusWindow(existing.id);
        return existing.id;
      }
    }
    const n = st.windows.length;
    const zMax = Math.max(0, ...st.windows.map(w => w.z));
    const win: OsWindow = {
      id: nid(), appId, z: zMax + 1, mode: "normal", prevRect: null, prevMode: null,
      workspace: st.activeWorkspace, props,
      rect: { x: 120 + 32 * (n % 8), y: 64 + 24 * (n % 8), w: m.defaultSize.w, h: m.defaultSize.h },
    };
    set({ windows: [...st.windows, win], focusedId: win.id });
    return win.id;
  },
  closeWindow: (id) => set(s => ({ windows: s.windows.filter(w => w.id !== id), focusedId: s.focusedId === id ? null : s.focusedId })),
  focusWindow: (id) => set(s => {
    const zMax = Math.max(0, ...s.windows.map(w => w.z));
    return { focusedId: id, windows: s.windows.map(w => w.id === id ? { ...w, z: zMax + 1 } : w) };
  }),
  minimizeWindow: (id) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, mode: "minimized" as WindowMode, prevMode: w.mode } : w), focusedId: s.focusedId === id ? null : s.focusedId })),
  restoreWindow: (id) => set(s => ({ windows: s.windows.map(w => w.id === id && w.mode === "minimized" ? { ...w, mode: w.prevMode ?? "normal", prevMode: null } : w) })),
  toggleMaximize: (id) => set(s => ({ windows: s.windows.map(w => {
    if (w.id !== id) return w;
    if (w.mode === "maximized") return { ...w, mode: "normal" as WindowMode, rect: w.prevRect ?? w.rect, prevRect: null };
    return { ...w, mode: "maximized" as WindowMode, prevRect: w.rect };
  })})),
  snapWindow: (id, side) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, mode: side === "left" ? "snap-left" : "snap-right", prevRect: w.mode === "normal" ? w.rect : w.prevRect } : w) })),
  moveWindow: (id, x, y) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, rect: { ...w.rect, x, y } } : w) })),
  resizeWindow: (id, rect) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, rect } : w) })),
  setWorkspace: (n) => set({ activeWorkspace: n }),
  moveWindowToWorkspace: (id, n) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, workspace: n } : w) })),

  notify: (appId, title, body) => set(s => {
    const note = { id: nid(), appId, title, body, time: Date.now() };
    return { notifications: [...s.notifications, note], drawer: [note, ...s.drawer] };
  }),
  dismissNotification: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
  clearDrawer: () => set({ drawer: [] }),
  setSettings: (p) => set(s => ({ settings: { ...s.settings, ...p } })),
  setOverview: (open) => set({ overviewOpen: open }),
  __reset: () => set({ ...initial }),
}));
```

Note: `getManifest` doesn't exist yet — create a minimal `src/os/apps.tsx` stub in this task that Task 5 replaces:

```tsx
export interface AppManifest {
  id: string; name: string;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  singleInstance?: boolean;
}
const FALLBACK: Record<string, Partial<AppManifest>> = {
  settings: { singleInstance: true },
};
export function getManifest(id: string): AppManifest {
  return { id, name: id, defaultSize: { w: 800, h: 560 }, ...FALLBACK[id] };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```powershell
npm test
```

- [ ] **Step 5: Commit**

```powershell
git add src/os src/__tests__/store.test.ts
git commit -m "feat: OS kernel store - session machine, window manager, notifications (TDD)"
```

---
### Task 5: App registry, Yaru icons, wallpapers

**Files:**
- Create: `frontend/src/ui/icons.tsx`, `frontend/public/wallpapers/noble.svg`, `frontend/public/wallpapers/dark.svg`, `frontend/public/wallpapers/spiderman.svg`, `frontend/public/wallpapers/court.svg`, `frontend/public/wallpapers/spider-bite.svg`, `frontend/public/wallpapers/buzzer-beater.svg`, `frontend/public/favicon.svg`
- Modify: `frontend/src/os/apps.tsx` (replace Task 4 stub), `frontend/index.html` (favicon link)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `src/ui/icons.tsx` exports `AppIcon: React.FC<{ app: string; size?: number }>` rendering a Yaru-style squircle SVG icon for each app id (`terminal`, `files`, `firefox`, `vscode`, `texteditor`, `settings`, `sysmon`, `calculator`, `imageviewer`, `screenshot`, `doom`, `evince`, `trash`), plus symbolic glyph components used by shells: `WifiIcon`, `VolumeIcon`, `BatteryIcon`, `PowerIcon`, `LockIcon`, `SearchIcon`, `GridIcon`, `CloseIcon`, `MinimizeIcon`, `MaximizeIcon`, `RestoreIcon`, `ChevronIcon`, `UserAvatar` (circle with initials "SR" that on hover overlays a subtle spider-web line drawing — spec easter egg).
  - `src/os/apps.tsx` final registry (below). All later tasks reference apps ONLY by these ids.

- [ ] **Step 1: Build `src/ui/icons.tsx`.** Yaru geometry rules: 100×100 viewBox, squircle background `rx=22`, flat two-tone fills, no gradients except subtle vertical duotone. Terminal = dark aubergine `#3D3846` squircle with `>_` in white Ubuntu Mono; Files = Yaru manila folder `#F6B84C`; Firefox = simplified fox-swirl orange/yellow circle; VS Code = blue `#2C9CDB` angular mark; Settings = grey gear; SysMon = green pulse line on dark; Calculator = teal with `+−×÷` grid; ImageViewer = photo landscape; Screenshot = camera aperture; Doom = the DOOM logo lettermark on dark red; Evince = paper sheet with folded corner; TextEditor = pencil on paper. Each is a `<symbol>`-free standalone `<svg>` returned from one `switch`. This file is large but pure JSX — no logic to test. `UserAvatar`: orange circle, initials "SR", `onMouseEnter` overlays `<WebOverlay/>` (five concentric arcs + radial lines, `opacity 0.35`, 250ms fade).
- [ ] **Step 2: Create the wallpapers** as hand-made SVGs (1920×1080 viewBox each):
  - `noble.svg` — Ubuntu Noble-style: deep aubergine→charcoal diagonal (#2C2137→#77216F→#E95420 low-poly triangular facets, big subtle numbat-like curl silhouette bottom-right).
  - `dark.svg` — plain `#241F31` with faint concentric Yaru rings.
  - `spiderman.svg` — abstract red (#B11313)/blue (#1F3A93) split field with a fine white web-line pattern radiating from top-left corner (geometric, no character art).
  - `court.svg` — hardwood-tone (#C68642 planks) half-court: center circle, key/paint in `#B11313`, three-point arc, subtle vignette.
  - `spider-bite.svg` — cartoon forearm with a small red dot + two tiny fang marks, caption text "day 0".
  - `buzzer-beater.svg` — stylized scoreboard "HOME 92 — 90 GUEST · 00:00.0" with a ball mid-arc toward a hoop.
  - `favicon.svg` — the Ubuntu circle-of-friends in orange, reused in `index.html`: `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`.
- [ ] **Step 3: Replace `src/os/apps.tsx`** with the real registry:

```tsx
import { lazy, type LazyExoticComponent, type FC } from "react";

export interface AppProps { windowId: string; props?: Record<string, unknown> }
export interface AppManifest {
  id: string; name: string;
  component: LazyExoticComponent<FC<AppProps>>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  singleInstance?: boolean;
  pinned?: boolean;      // shows in dock
  desktopHidden?: boolean; // not in app grid (evince opens via files only)
}

export const APPS: AppManifest[] = [
  { id: "firefox",    name: "Firefox",           component: lazy(() => import("../apps/firefox/Firefox")),          defaultSize: { w: 980, h: 640 }, minSize: { w: 560, h: 400 }, pinned: true },
  { id: "terminal",   name: "Terminal",          component: lazy(() => import("../apps/terminal/Terminal")),        defaultSize: { w: 760, h: 480 }, minSize: { w: 420, h: 280 }, pinned: true },
  { id: "files",      name: "Files",             component: lazy(() => import("../apps/files/Files")),              defaultSize: { w: 880, h: 560 }, minSize: { w: 560, h: 380 }, pinned: true },
  { id: "vscode",     name: "Visual Studio Code",component: lazy(() => import("../apps/vscode/VsCode")),            defaultSize: { w: 1020, h: 660 }, minSize: { w: 640, h: 420 }, pinned: true, singleInstance: true },
  { id: "settings",   name: "Settings",          component: lazy(() => import("../apps/settings/SettingsApp")),     defaultSize: { w: 880, h: 600 }, minSize: { w: 700, h: 440 }, pinned: true, singleInstance: true },
  { id: "sysmon",     name: "System Monitor",    component: lazy(() => import("../apps/sysmon/SystemMonitor")),     defaultSize: { w: 780, h: 560 }, minSize: { w: 560, h: 400 }, singleInstance: true },
  { id: "calculator", name: "Calculator",        component: lazy(() => import("../apps/calculator/Calculator")),    defaultSize: { w: 340, h: 520 }, minSize: { w: 300, h: 460 }, singleInstance: true },
  { id: "texteditor", name: "Text Editor",       component: lazy(() => import("../apps/texteditor/TextEditor")),    defaultSize: { w: 720, h: 520 }, minSize: { w: 420, h: 320 } },
  { id: "imageviewer",name: "Image Viewer",      component: lazy(() => import("../apps/imageviewer/ImageViewer")),  defaultSize: { w: 800, h: 560 }, minSize: { w: 480, h: 360 } },
  { id: "screenshot", name: "Screenshot",        component: lazy(() => import("../apps/screenshot/Screenshot")),    defaultSize: { w: 420, h: 260 }, minSize: { w: 420, h: 260 }, singleInstance: true },
  { id: "doom",       name: "DOOM",              component: lazy(() => import("../apps/doom/Doom")),                defaultSize: { w: 800, h: 560 }, minSize: { w: 660, h: 480 }, pinned: true, singleInstance: true },
  { id: "evince",     name: "Document Viewer",   component: lazy(() => import("../apps/evince/DocumentViewer")),    defaultSize: { w: 760, h: 720 }, minSize: { w: 480, h: 400 }, desktopHidden: true },
];

export function getManifest(id: string): AppManifest {
  const m = APPS.find(a => a.id === id);
  if (!m) throw new Error(`Unknown app: ${id}`);
  return m;
}
```

The 12 `import()` targets don't exist yet — create placeholder components now so the build passes, one per app path, each:

```tsx
import type { AppProps } from "../../os/apps";
export default function Placeholder(_: AppProps) {
  return <div className="p-4 text-white/70">Coming soon…</div>;
}
```

(Each app task replaces its own placeholder.)

- [ ] **Step 4: Verify** `npm test` still PASSes (store tests now exercise the real registry — `settings` is `singleInstance`) and `npm run build` PASSes.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: app registry, Yaru icon set, hand-made wallpapers"`

---

### Task 6: Boot sequence — GRUB, kernel log, Plymouth + desktop session router

**Files:**
- Create: `frontend/src/shell/desktop/DesktopShell.tsx`, `frontend/src/shell/desktop/boot/Grub.tsx`, `frontend/src/shell/desktop/boot/KernelLog.tsx`, `frontend/src/shell/desktop/boot/Plymouth.tsx`, `frontend/src/shell/desktop/boot/Shutdown.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useOs` (`session`, `powerOn`, `bootTo`, `restart`), `easterEggs.kernelPanicLines`.
- Produces: `DesktopShell` — renders the correct screen for every `SessionState`; `App.tsx` mounts `DesktopShell` (mobile branch added in Task 19). Boot is skippable: any key/click during kernelLog/plymouth jumps to `gdm`; if `matchMedia("(prefers-reduced-motion: reduce)")` matches, `powerOn()` fast-forwards straight to `gdm`.

- [ ] **Step 1: `DesktopShell.tsx`** — session router:

```tsx
import { useEffect } from "react";
import { useOs } from "../../os/store";
import Grub from "./boot/Grub";
import KernelLog from "./boot/KernelLog";
import Plymouth from "./boot/Plymouth";
import Shutdown from "./boot/Shutdown";
import Gdm from "./Gdm";
import LockScreen from "./LockScreen";
import Desktop from "./Desktop";

export default function DesktopShell() {
  const session = useOs(s => s.session);
  const powerOn = useOs(s => s.powerOn);
  const bootTo = useOs(s => s.bootTo);
  useEffect(() => {
    if (session === "poweredOff") {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) bootTo("gdm");
      else powerOn();
    }
  }, [session, powerOn, bootTo]);
  switch (session) {
    case "poweredOff": return <div className="h-full bg-black" />;
    case "grub": return <Grub />;
    case "kernelLog": return <KernelLog />;
    case "plymouth": return <Plymouth />;
    case "gdm": return <Gdm />;
    case "locked": return <LockScreen />;
    case "shuttingDown": return <Shutdown />;
    case "desktop": return <Desktop />;
  }
}
```

`App.tsx` becomes `export default function App() { return <DesktopShell />; }` for now. Also create a temporary `Desktop.tsx`, `Gdm.tsx`, `LockScreen.tsx` (each a full-screen div with a "continue" button calling `login()`/`unlock()`) so this task compiles standalone; Tasks 7–8 replace them.

- [ ] **Step 2: `Grub.tsx`** — full-screen black, Ubuntu Mono 14px, GRUB 2.12 header text, menu box drawn with CSS borders (double-line look), entries:

```
*Ubuntu
 Advanced options for Ubuntu
 Memory test (memtest86+x64.efi)
 Web-Slinger OS (experimental)
```

State: `selected` index (ArrowUp/ArrowDown wraps, Enter activates, also clickable), 5-second auto-boot countdown line ("The highlighted entry will be executed automatically in Ns.") cancelled on first keypress. Activating "Ubuntu"/"Advanced"/"Memory test" → `bootTo("kernelLog")`. Activating "Web-Slinger OS" → sets local `panic=true`: render `easterEggs.kernelPanicLines` typed out 80ms/line in red-tinted mono, hold 2.5s, then `bootTo("kernelLog")` (spec: "kernel-panics… then boots Ubuntu anyway"). Keyboard listener attached on `window` in `useEffect` with cleanup.

- [ ] **Step 3: `KernelLog.tsx`** — black screen, streams ~40 dmesg lines (hardcoded array in the file) at 30ms intervals with `[ ok ]` green tags, including the seeded fakes: `Basketball Vibration Sensor detected on bus 23`, `spider-sense: calibrated (tingle threshold = 0.42)`, `systemd[1]: Started hoops.service - Daily Free Throw Practice.`, plus real-looking lines (`EXT4-fs (sda2): mounted filesystem`, `NetworkManager: starting`, etc.). Autoscrolls; on completion (or any keypress/click) → `bootTo("plymouth")`.
- [ ] **Step 4: `Plymouth.tsx`** — centered white "ubuntu" wordmark (font-weight 300, lowercase, with ® superscript) above the classic 5-dot loader animating orange fill left-to-right, on `#2C2137`... after 2.2s (or click) → `bootTo("gdm")`.
- [ ] **Step 5: `Shutdown.tsx`** — reverse Plymouth (1.2s) then full-black BIOS-style text top-left in mono: `It is now safe to close this tab.` and a faint `[ Press any key to power on ]` — any key/click calls `restart()` (it clears windows and returns the session to `grub`).
- [ ] **Step 6: Manual verify** — `npm run dev`, watch full boot: GRUB (arrows work, Web-Slinger panics then continues) → kernel log → Plymouth → stub GDM. `npm test` PASS.
- [ ] **Step 7: Commit** — `git add -A; git commit -m "feat: boot sequence - GRUB with Web-Slinger panic, kernel log, Plymouth"`

---

### Task 7: GDM login, lock screen, power-off polish

**Files:**
- Create/Replace: `frontend/src/shell/desktop/Gdm.tsx`, `frontend/src/shell/desktop/LockScreen.tsx`

**Interfaces:**
- Consumes: `useOs` (`login`, `unlock`, `settings.wallpaper`), `profile.name`, `UserAvatar` from `ui/icons`.
- Produces: the GDM screen (Task 6's router already mounts it).

- [ ] **Step 1: `Gdm.tsx`** — layout per Ubuntu 24.04:
  - Background: `settings.wallpaper` at `filter: blur(24px) brightness(0.6)`, cover.
  - Top bar strip: 28px translucent black; right side shows a11y/network/volume/battery glyphs + clock "HH:MM".
  - Center column: `UserAvatar` 96px, `profile.name` in 20px white, password `<input type="password">` in a 300px pill (autofocus; placeholder empty; caption below in 12px white/60: "just press enter"), Enter or arrow-button submits → 350ms fade → `login()`. Any password accepted.
  - Bottom-right: gear button → popover menu `Ubuntu`, `Ubuntu on Xorg`, `GNOME Classic` (radio-checked first item; selecting is cosmetic).
- [ ] **Step 2: `LockScreen.tsx`** — GNOME curtain: wallpaper blurred harder, huge thin clock (`72px Ubuntu Light` HH:MM, date line under), "Click or press any key to unlock" hint; any key/click slides curtain up 400ms then `unlock()` (→ GDM per store).
- [ ] **Step 3: Manual verify** boot → GDM → enter → (stub) desktop; lock from store devtools if desktop stub has no button yet.
- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: GDM login and GNOME lock screen"`

---

### Task 8: Desktop scaffold — wallpaper, TopBar, calendar/notifications, QuickSettings, Dock, desktop icons

**Files:**
- Replace: `frontend/src/shell/desktop/Desktop.tsx`
- Create: `frontend/src/shell/desktop/TopBar.tsx`, `frontend/src/shell/desktop/ClockDropdown.tsx`, `frontend/src/shell/desktop/QuickSettings.tsx`, `frontend/src/shell/desktop/Dock.tsx`, `frontend/src/shell/desktop/ContextMenu.tsx`

**Interfaces:**
- Consumes: `useOs` (windows/openApp/notifications/settings/lock/shutdown/restart/setOverview), `APPS` registry, `AppIcon` + glyphs from `ui/icons`.
- Produces:
  - `Desktop` composes: wallpaper layer → desktop icons → `WindowLayer` (Task 9; render `null` placeholder until then) → `Dock` → `TopBar` → dropdowns/toasts → `Activities` (Task 10 placeholder).
  - `ContextMenu` exports `useContextMenu()` hook returning `{ open(e: React.MouseEvent, items: MenuItem[]), element }` where `MenuItem = { label: string; onClick?: () => void; danger?: boolean; separator?: boolean }` — reused by Dock, desktop right-click, Files, SysMon.
  - Toast component: bottom-center stack rendering `notifications`, auto-dismiss 4s.

- [ ] **Step 1: `TopBar.tsx`** — 28px bar, `background: rgba(0,0,0,0.85)`, white 13px Ubuntu:
  - Left: "Activities" pill → `setOverview(true)`.
  - Center: `Mon Aug 10  21:30` button → `ClockDropdown` (calendar month grid for current date + notification list from `drawer` with per-app icons, "Clear" button → `clearDrawer()`; empty state "No Notifications").
  - Right: wifi/volume/battery glyph cluster → `QuickSettings` popover: grid of GNOME 46-style toggle pills — Wi-Fi ("FAST-NUCES-Guest", on), Bluetooth (off), Power Mode ("Balanced"), Dark Style (toggles `settings.theme`), Night Light (cosmetic) — volume slider, battery row "85% · 4:20 remaining", bottom row: screenshot button (opens `screenshot` app), settings gear (opens `settings`), lock (→`lock()`), power → submenu Suspend (→lock), Restart… (→`restart()`), Power Off… (→`shutdown()`).
  - Dropdowns close on outside click (shared `useClickOutside` helper defined in `TopBar.tsx`).
- [ ] **Step 2: `Dock.tsx`** — left edge, 64px wide, full-height rounded-right panel `rgba(0,0,0,0.7)`; icons 48px for `APPS.filter(a => a.pinned)` + separator + trash ("Symbiote Containment" tooltip, opens `files` at `~/.local/Trash` — pass `props: { path }`). Running apps (any window with matching appId) get an orange dot on the left edge; click = `openApp` (which refocuses single-instance); right-click = context menu (`New Window` where not singleInstance, `Pin/Unpin` cosmetic, `Quit` closes all that app's windows). Bottom: 9-dot grid button → `setOverview(true)` (app grid page).
- [ ] **Step 3: `Desktop.tsx`** — wallpaper `<img src={settings.wallpaper}>` cover (with 300ms crossfade on change); desktop icons top-right column ("Home" → files app, "resume.pdf" → evince with `props:{ url: "/resume.pdf" }`, "Trash"): double-click opens, single click selects (orange outline). Right-click empty desktop → context menu: `Change Background…` (settings app), `Display Settings…` (settings), `Open Terminal` (terminal app). Also mounts the Konami listener: `useEffect` keydown sequence `↑↑↓↓←→←→BA` → sets local state `rain=true` for 8s rendering 25 falling basketball emoji/SVGs that decelerate into a web-line pattern at random heights (absolutely-positioned, framer-motion), then cleans up.
- [ ] **Step 4: Wire `Ctrl+Alt+T`** in `Desktop.tsx`: keydown listener → `openApp("terminal")`, `preventDefault`.
- [ ] **Step 5: Manual verify** — boot → login → desktop shows wallpaper, working topbar dropdowns, dock opens placeholder windows? No — WindowLayer is Task 9; verify dock click calls `openApp` (state visible in devtools) without crashing, quick settings toggles theme, notifications toast renders (trigger via `useOs.getState().notify(...)` in console).
- [ ] **Step 6: Commit** — `git add -A; git commit -m "feat: desktop shell - top bar, quick settings, calendar, dock, desktop icons"`

---

### Task 9: Window manager — WindowFrame, WindowLayer, switcher

**Files:**
- Create: `frontend/src/shell/desktop/WindowFrame.tsx`, `frontend/src/shell/desktop/WindowLayer.tsx`, `frontend/src/shell/desktop/WindowSwitcher.tsx`
- Modify: `frontend/src/shell/desktop/Desktop.tsx` (mount WindowLayer + switcher)

**Interfaces:**
- Consumes: `useOs` window state + actions (exact names from Task 4), `getManifest`, `AppIcon`, glyph icons.
- Produces: `WindowLayer` renders every `windows[w.workspace === activeWorkspace && mode !== "minimized"]` as a `WindowFrame`; `WindowFrame` provides the `AppProps` surface (`windowId`, `props`) via `<Suspense>` around the lazy app component. Top bar area (y < 28) and dock (x < 64) are not valid window territory: maximized rect = `{x: 64, y: 28, w: innerWidth-64, h: innerHeight-28}`; snap-left/right split that region.

- [ ] **Step 1: `WindowFrame.tsx`** — the core component:
  - Outer `motion.div` absolutely positioned from `w.rect` (or computed rect for maximized/snapped), `borderRadius 12px` (0 when maximized), Yaru shadow `0 4px 24px rgba(0,0,0,0.55)`, ring `1px solid rgba(255,255,255,0.1)`; unfocused windows get `brightness(0.97)` headerbar and lighter shadow.
  - Headerbar 38px `var(--headerbar)` (light theme: `var(--headerbar-light)`): centered app title, right-aligned Yaru controls — minimize (−), maximize/restore (□), close (×, hover = `#E95420` circle). Double-click headerbar → `toggleMaximize`.
  - Drag: `onPointerDown` on headerbar captures pointer, moves via `moveWindow`; while dragging near top edge (y < 8) show full-screen orange preview overlay → release = `toggleMaximize`; near left/right edge (x < 12 / > innerWidth-12) show half-screen preview → release = `snapWindow(id, side)`. Dragging a maximized/snapped window first restores it under the cursor.
  - Resize: 8 invisible 6px handles (edges + corners) with correct cursors; `resizeWindow` clamped to `minSize`.
  - Open/close animations: framer-motion scale 0.96→1 / opacity, 200ms; minimize animates toward the dock icon (scale 0.1 + translate toward `(32, innerHeight/2)`, 250ms) before the store hides it — use `AnimatePresence` exit.
  - Mount `onPointerDown` capture → `focusWindow(id)`.
- [ ] **Step 2: `WindowLayer.tsx`** — maps visible windows sorted by `z` into `WindowFrame`s inside `AnimatePresence`; wraps each app component in `<Suspense fallback={<AdwaitaSpinner/>}>` (spinner: GNOME-style circular).
- [ ] **Step 3: `WindowSwitcher.tsx`** — since browsers eat Alt+Tab: listen for `` Alt+` `` and `F2`… simpler per spec: an on-screen affordance. Implement: holding `Alt` shows centered switcher strip (app icons of open windows, highlight cycles on repeated `Tab` press if the browser lets it through, or on `Alt+ArrowRight`); releasing Alt (or click) focuses selection. Also always available from Activities (Task 10).
- [ ] **Step 4: Manual verify** — open Terminal placeholder + Files placeholder from dock: drag, resize all edges, snap left/right with preview, maximize by top-drag and double-click, minimize animates to dock, dock dot indicators, focus rings, z-order.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: window manager - drag, resize, snap, maximize, minimize, switcher"`

---

### Task 10: Activities overview — window grid, workspaces, search, app grid

**Files:**
- Create: `frontend/src/shell/desktop/Activities.tsx`
- Modify: `frontend/src/shell/desktop/Desktop.tsx` (mount), `frontend/src/content/profile.ts` only if search needs a helper (it doesn't — write helper inside Activities).

**Interfaces:**
- Consumes: `useOs` (`overviewOpen`, `setOverview`, `windows`, `activeWorkspace`, `setWorkspace`, `moveWindowToWorkspace`, `focusWindow`, `openApp`), `APPS`, `AppIcon`, `profile` (for content search).
- Produces: full-screen overlay when `overviewOpen`; Escape or background click closes.

- [ ] **Step 1: Layout** — darkened wallpaper backdrop (`scale 1.02`, `brightness(0.4)`); top search bar (autofocused pill, "Type to search"); middle: current workspace's windows as live-ish cards (static snapshot = render app name + big AppIcon on a headerbar-colored card — NOT live component remounts) in a centered flex grid, click = `focusWindow` + close overview, hover shows an × to close the window; bottom: workspace strip — 3 thumbnails (mini rectangles per window), click switches `activeWorkspace`, drag a window card onto a thumbnail → `moveWindowToWorkspace`.
- [ ] **Step 2: App grid page** — a second page toggled by the 9-dot button / swiping down indicator: all `APPS.filter(a => !a.desktopHidden)` in a 6-col icon grid, click opens + closes overview.
- [ ] **Step 3: Search** — filter as you type across: app names, project names/taglines/tech (`profile.projects`), skills, and terminal commands ("neofetch"). Results grouped rows: Apps | Projects | Skills. Selecting a project result opens `files` at `~/Projects/<id>`; a skill result opens `settings` About; Enter activates first result. Test the spec example: typing "pytorch" must surface Deep-Emotion.
- [ ] **Step 4: Manual verify** — Activities pill and 9-dot grid both open it; window cards focus; workspace drag works; "pytorch" finds Deep-Emotion.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: activities overview - workspaces, app grid, content search"`

---
### Task 11: Terminal (TDD on the command shell)

**Files:**
- Create: `frontend/src/apps/terminal/shell.ts`, `frontend/src/apps/terminal/commands.tsx`, `frontend/src/__tests__/shell.test.ts`
- Replace: `frontend/src/apps/terminal/Terminal.tsx` placeholder

**Interfaces:**
- Consumes: `Vfs` + `buildFilesystem` (Task 3), `profile`, `easterEggs`, `useOs` (`openApp`, `closeWindow`, `notify`).
- Produces:
  - A module-level singleton `export const vfs = buildFilesystem()` lives in `src/os/vfsInstance.ts` (create it here; Files/VS Code/TextEditor import the same instance so all apps share one tree — move it out of terminal so there is no app→app import).
  - `shell.ts`: `export interface ShellCtx { cwd: string; setCwd(p: string): void; openApp(id: string, props?: Record<string, unknown>): void; closeWindow(): void }` and `export function runLine(line: string, ctx: ShellCtx, fsOverride?: Vfs): string[]` (uses `fsOverride ?? vfs` singleton; returns output lines; ANSI-ish styling via tokens `§g` green / `§o` orange / `§r` red / `§b` bold prefix that Terminal.tsx renders as spans) and `export function complete(partial: string, cwd: string): string | null` (tab completion for commands + paths).

- [ ] **Step 1: Create `src/os/vfsInstance.ts`:**

```ts
import { buildFilesystem } from "../content/filesystem";
export const vfs = buildFilesystem();
```

- [ ] **Step 2: Write failing tests** `src/__tests__/shell.test.ts` (ctx helper creates fresh state; note `runLine` is pure over the shared vfs — tests import a fresh `buildFilesystem` and inject it via `runLine`'s optional third arg `fsOverride?: Vfs`):

```ts
import { describe, it, expect } from "vitest";
import { runLine } from "../apps/terminal/shell";
import { buildFilesystem } from "../content/filesystem";

function ctx(cwd = "/home/raza") {
  const c = { cwd, setCwd: (p: string) => { c.cwd = p; }, openApp: () => {}, closeWindow: () => {} };
  return c;
}

describe("filesystem commands", () => {
  it("ls lists home dirs", () => {
    const out = runLine("ls", ctx(), buildFilesystem()).join("\n");
    expect(out).toContain("Documents");
    expect(out).toContain("Projects");
    expect(out).not.toContain(".secrets"); // hidden without -a
  });
  it("ls -a reveals dotfiles", () => {
    expect(runLine("ls -a", ctx(), buildFilesystem()).join("\n")).toContain(".secrets");
  });
  it("cd + pwd", () => {
    const c = ctx(); const fs = buildFilesystem();
    runLine("cd Projects/twin", c, fs);
    expect(runLine("pwd", c, fs)[0]).toBe("/home/raza/Projects/twin");
  });
  it("cat prints file content and errors on missing", () => {
    const fs = buildFilesystem();
    expect(runLine("cat ~/Documents/about-me.md", ctx(), fs).join("\n")).toContain("Syed Raza Ali Rizvi");
    expect(runLine("cat nope.txt", ctx(), fs)[0]).toContain("No such file");
  });
});

describe("portfolio commands", () => {
  it("neofetch shows RazaOS and FAST-NUCES", () => {
    const out = runLine("neofetch", ctx(), buildFilesystem()).join("\n");
    expect(out).toContain("RazaOS");
    expect(out).toContain("FAST-NUCES");
  });
  it("projects lists all four", () => {
    const out = runLine("projects", ctx(), buildFilesystem()).join("\n");
    for (const n of ["Deep-Emotion", "Twin", "Agri-Pro", "VOYA"]) expect(out).toContain(n);
  });
});

describe("flavor", () => {
  it("sudo reports to JJJ", () => {
    expect(runLine("sudo rm -rf /", ctx(), buildFilesystem()).join("\n")).toContain("J. Jonah Jameson");
  });
  it("unknown command errors bash-style", () => {
    expect(runLine("frobnicate", ctx(), buildFilesystem())[0]).toBe("frobnicate: command not found");
  });
  it("great power quote completes", () => {
    expect(runLine("with great power", ctx(), buildFilesystem())[0]).toContain("comes great responsibility");
  });
});
```

- [ ] **Step 3: Run `npm test`** — expect FAIL (shell.ts missing).
- [ ] **Step 4: Implement `shell.ts` + `commands.tsx`.** `runLine(line, ctx, fsOverride?)` uses `fsOverride ?? vfs` (the singleton). Structure: tokenize (split on spaces, respect quotes), dispatch table `Record<string, (args: string[], ctx, fs) => string[]>`. Commands to implement (all from spec):
  - **VFS:** `ls` (`-a`, `-l` variants; dirs in `§b` blue-bold), `cd`, `pwd`, `cat`, `mkdir`, `rm` (uses `fs.rm`, prints snark error), `tree` (recursive box-drawing), `grep <pat> <file>`, `echo`, `touch` (via `fs.write(p, "")`).
  - **Session:** `clear` (returns `["§CLEAR"]` sentinel Terminal.tsx interprets), `history`, `whoami` → `raza`, `hostname`, `exit` → `ctx.closeWindow()`, `man <cmd>` (one-paragraph descriptions; `man man` included; unknown → `No manual entry for x`).
  - **Portfolio:** `neofetch` — ASCII circle-of-friends art (~18 lines, `§o`) beside: `raza@ubuntu`, `OS: RazaOS 1.0 (Ubuntu 24.04.1 LTS)`, `Host: FAST-NUCES`, `Kernel: 6.8.0-spider`, `Uptime: since 2004`, `Shell: bash 5.2.21`, `Resolution: your viewport`, `DE: GNOME 46 (Yaru)`, `CPU: Ryzen Web 9`, `Memory: enough for node_modules (barely)`, plus education/role lines from `profile`; `resume` (formatted sections), `projects` (each project: `§b` name — tagline, tech, GitHub URL), `skills`, `contact`, `open <app-id>` → `ctx.openApp`.
  - **Flavor:** `sudo …` → `[sudo] password for raza: `, `raza is not in the sudoers file. This incident will be reported… to J. Jonah Jameson.`; `apt`/`apt-get install x` → fake progress then `E: Package 'x' has no installation candidate (have you tried npm?)`; `htop` (static text table reusing SysMon's process names — define the shared list in `src/content/easterEggs.ts` as `processes: {name: string; cpu: number; mem: number}[]` — ADD IT in this task with: gnome-shell 2.1/384, spider-daemon 3.0/64, hoops.service 0.8/23, web-crawler 1.2/88, jarvis 0.5/512, systemd 0.1/12, firefox 8.4/1024, code 6.2/768); `cowsay <msg>` (ASCII cow); `sl` (returns `["§SL"]` sentinel — Terminal.tsx animates an ASCII Spider-Mobile driving right-to-left across the buffer); `thwip` (returns `["§THWIP"]` sentinel — Desktop-level effect, Task 18; until then prints `*thwip*`); `ball` (returns `["§BALL"]` sentinel — ASCII ball bounce animation in-terminal: 6 frames of a `o` at varying heights, then rim sound line `swish.`); `python3` → enters mini-REPL mode (prompt `>>>`; evaluates arithmetic via a hand-rolled recursive-descent parser over `+-*/()% **` and integers/floats — NO `eval`; `exit()` leaves); `with great power` (exact prefix match) → `…comes great responsibility. — Uncle Ben (and every senior engineer reviewing my PRs)`.
  - `complete(partial, cwd)`: if first token, match command names; else match path prefix in vfs.
- [ ] **Step 5: Run `npm test`** — expect PASS.
- [ ] **Step 6: Implement `Terminal.tsx`** — GNOME Terminal look: `var(--terminal-bg)` background, Ubuntu Mono 14px, block cursor (blinking CSS animation), scrollback `div` + current prompt line `raza@ubuntu:<cwd-with-~>$ `. Hidden `<input>` keeps focus (click anywhere focuses it); Enter → append prompt+line to buffer, run `runLine`, append output (parse `§` style tokens into colored spans; handle `§CLEAR`/`§SL`/`§BALL`/`§THWIP` sentinels); ↑/↓ history; Tab → `complete`; `Ctrl+C` prints `^C` new prompt; `Ctrl+L` clears. State per window instance (cwd lives in component state → two terminals have independent cwds over the shared vfs singleton).
- [ ] **Step 7: Manual verify** — `Ctrl+Alt+T`, run: `neofetch`, `ls -a`, `cd .secrets`, `cat peter_parker_alibi.txt`, `sudo ls`, `sl`, `python3` → `2**10` → `1024` → `exit()`, `exit` closes window.
- [ ] **Step 8: Commit** — `git add -A; git commit -m "feat: GNOME Terminal with virtual shell, neofetch, flavor commands (TDD)"`

---

### Task 12: Files (Nautilus) + Text Editor + Image Viewer + Document Viewer

**Files:**
- Replace placeholders: `frontend/src/apps/files/Files.tsx`, `frontend/src/apps/texteditor/TextEditor.tsx`, `frontend/src/apps/imageviewer/ImageViewer.tsx`, `frontend/src/apps/evince/DocumentViewer.tsx`

**Interfaces:**
- Consumes: `vfs` singleton, `useOs.openApp`, `useContextMenu`, `AppIcon` + glyphs, `VfsNode` types.
- Produces: opening conventions used across the OS — `openApp("texteditor", { path })`, `openApp("imageviewer", { url, name })`, `openApp("evince", { url: "/resume.pdf" })`, `openApp("files", { path })`. Files' `openNode(node, path)` helper implements the kind→app mapping (pdf→evince, markdown/text→texteditor, image→imageviewer, code→vscode with `{ path }`).

- [ ] **Step 1: `Files.tsx`** — Nautilus 46 layout:
  - Headerbar merged into window content top (WindowFrame keeps its own bar — Files adds a 46px toolbar): back/forward chevrons (history stack in state), breadcrumb path segments (clickable), search icon, grid/list toggle, hamburger menu (Show Hidden Files `Ctrl+H`, New Folder).
  - Left sidebar 180px: Home, Documents, Projects, Pictures, Downloads, `Web-Shooters` bookmark (→ `~/.secrets` — the joke is the bookmark name), Trash row at bottom labeled with tooltip "Symbiote Containment". Orange active-row highlight.
  - Main pane: grid view (icons 64px: folder = manila Yaru folder SVG, files by kind — pdf red sheet, image thumbnail via `url`, md/txt lined sheet, code blue sheet) or list view (name/size/modified fake columns). Single-click select, double-click → dir: navigate; file: `openNode`. Right-click: Open, Open With Text Editor (files), Rename (inline input → `fs` write+rm), Move to Trash (`fs.rm`; protected files show the snark error via `notify("files", "Permission denied", error)`), Properties (modal with fake size/permissions `-rw-r--r--`).
  - `Ctrl+H` toggles dotfiles; initial `props.path` respected (`files` opened at `~/Projects/deep-emotion` from Activities search).
- [ ] **Step 2: `TextEditor.tsx`** — GNOME Text Editor look: toolbar (open-file name + modified dot, save button), `<textarea>` (Ubuntu Mono 13px, `#1E1E28` bg, no spellcheck) bound to `vfs.read(props.path)`; Save → `vfs.write` + `notify("texteditor", "Saved", name)`. If `props.path` missing → untitled buffer; Save writes `~/Documents/untitled.md`.
- [ ] **Step 3: `ImageViewer.tsx`** — dark charcoal stage, centered `<img src={props.url}>` `max 100%`, bottom filmstrip of all `~/Pictures` entries (click switches), title shows name, zoom +/− buttons (CSS transform scale).
- [ ] **Step 4: `DocumentViewer.tsx`** — Evince: slim toolbar ("resume.pdf — 1 of 1", zoom −/+, and a prominent orange **Download** button → `<a href="/resume.pdf" download="Syed-Raza-Ali-Rizvi-Resume.pdf">`), body = `<iframe src="/resume.pdf#toolbar=0" title="resume">` full-size grey stage. Fallback text with download link if iframe PDF rendering unavailable.
- [ ] **Step 5: Manual verify** — Files: navigate all dirs, `Ctrl+H` shows `.secrets`, open alibi in Text Editor, open resume → Evince renders PDF + Download works, Pictures → Image Viewer filmstrip, Rename + Trash behaviors, protected-file snark notification.
- [ ] **Step 6: Commit** — `git add -A; git commit -m "feat: Nautilus files, text editor, image viewer, Evince resume viewer"`

---

### Task 13: Settings app

**Files:**
- Replace: `frontend/src/apps/settings/SettingsApp.tsx`

**Interfaces:**
- Consumes: `useOs` (`settings`, `setSettings`), `profile`, `UserAvatar`.
- Produces: theme side-effect — `SettingsApp` is display+controls only; the actual application of theme/accent happens in `Desktop.tsx`: add a `useEffect` on `settings` that sets `document.documentElement.dataset.theme` and `--yaru-accent` (do that wiring in this task). Accent set (Yaru): orange `#E95420`, bark `#787859`, sage `#657B69`, olive `#4B8501`, viridian `#03875B`, prussian `#308280`, blue `#0073E5`, purple `#7764D8`, magenta `#B34CB3`, red `#DA3450`.

- [ ] **Step 1: Layout** — GNOME Settings: left nav list (icon + label): Wi-Fi, Bluetooth, Appearance, Notifications, Search, Users, Privacy, Sound, Power, Displays, About — only Wi-Fi, Appearance, Users, About have real panels; others render a centered "This panel is decorative. Like most settings." placeholder in GNOME empty-state style.
- [ ] **Step 2: Panels:**
  - **Wi-Fi:** toggle ON, "Visible Networks" list: `FAST-NUCES-Guest` (connected ✓, lock icon), `Stark_Industries_5G` (strong), `Daily Bugle Free WiFi` (weak), `MSG-Court-Side` (weak); clicking others → password dialog that always fails with "incorrect password (it's not 'password123', I tried)".
  - **Appearance:** Style row (Light/Dark preview cards toggling `theme`), Accent color row (10 Yaru dots, sets `accent`), Wallpaper grid (`/wallpapers/noble.svg`, `dark.svg`, `spiderman.svg`, `court.svg` thumbnails → `setSettings({wallpaper})`).
  - **Users:** avatar + name, "Administrator" badge, bio rows from `profile` (school, role, location, email as rows).
  - **About:** device "web-slinger", OS "Ubuntu 24.04.1 LTS (Noble Numbat)", Windowing "Wayland (allegedly)", Processor "Ryzen Web 9 5950HX", Memory "16.0 GiB (of your RAM, sorry)", Graphics "Mesa WebGL", Disk "sufficient", **System Details** rows: GitHub → `profile.github` (real external link, `target="_blank"`), Email → `mailto:`. "Check for Updates" button → toast notification "You're up to date. Unlike WebKit."
- [ ] **Step 3: Manual verify** — dark/light flips the shell (headerbars, menus), accent changes dock dots/highlights, wallpaper changes with crossfade, About links open externally.
- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: GNOME Settings - appearance, wifi, users, about"`

---

### Task 14: System Monitor + Calculator

**Files:**
- Replace: `frontend/src/apps/sysmon/SystemMonitor.tsx`, `frontend/src/apps/calculator/Calculator.tsx`
- Modify: `frontend/src/content/easterEggs.ts` (only if Task 11 didn't add `processes` — it did; reuse it)

**Interfaces:**
- Consumes: `easterEggs.processes`, `useOs.notify`, `useContextMenu`.
- Produces: nothing consumed later.

- [ ] **Step 1: `SystemMonitor.tsx`** — two tabs (Processes / Resources):
  - **Resources:** CPU per-core (4 fake cores) line charts + Memory chart drawn on `<canvas>`, 60 samples, ticking every 500ms with `requestAnimationFrame`-batched updates. CPU = random walk 5–40%; firefox core spikes when a firefox window exists. **Memory occasionally draws a shot-arc** (spec): every ~45s, 12 samples follow a parabola up-and-in then resume the walk.
  - **Processes:** table (Process Name, User, %CPU, Memory) from `easterEggs.processes` + one live row per open window's app; sortable by column click; cpu values jitter ±0.4 every tick except `spider-daemon` which is ALWAYS exactly 3.0 (spec). Right-click / End Process button on selection: killing an app row closes its windows; killing `spider-daemon` → row respawns after 2s + `notify("sysmon", "spider-daemon respawned", "With great power comes great responsibility.")`; killing `hoops.service` → it respawns too ("ball is life").
- [ ] **Step 2: `Calculator.tsx`** — GNOME Calculator basic mode: display (expression line small + result line large, right-aligned), button grid: `C ( ) ⌫ / 7 8 9 × 4 5 6 − 1 2 3 + 0 . % =`. Implementation: build expression string, evaluate with the SAME recursive-descent arithmetic parser from Task 11 — move it to `src/os/arith.ts` in this task, import from both terminal shell and calculator (DRY). Keyboard input works when focused. **History strip** above display shows last 3 evaluations; when a result (not input) equals exactly 23 or 24, append ` 🐐` to that history entry (spec tribute; both numbers honored).
- [ ] **Step 3: Quick test** — add to `src/__tests__/shell.test.ts` (arith is already covered via python3 REPL tests? No — add a small direct suite) `src/__tests__/arith.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { evaluate } from "../os/arith";
describe("arith", () => {
  it("respects precedence and parens", () => {
    expect(evaluate("2+3*4")).toBe(14);
    expect(evaluate("(2+3)*4")).toBe(20);
    expect(evaluate("2**10")).toBe(1024);
    expect(evaluate("10%3")).toBe(1);
    expect(evaluate("7/2")).toBe(3.5);
  });
  it("throws on garbage", () => {
    expect(() => evaluate("2+")).toThrow();
  });
});
```

Run `npm test` — PASS (after moving parser to `os/arith.ts` and re-pointing terminal's python3 REPL at it).
- [ ] **Step 4: Manual verify** — graphs animate, sort works, spider-daemon pinned at 3.0 and respawns with the quote toast, calculator computes and 23/24 shows 🐐.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: system monitor with easter-egg processes, GNOME calculator with GOAT tribute"`

---

### Task 15: Firefox + the fake internet

**Files:**
- Create: `frontend/src/content/fakeInternet.tsx`
- Replace: `frontend/src/apps/firefox/Firefox.tsx`

**Interfaces:**
- Consumes: `profile`, `easterEggs` (`bugleHeadlines`, `nbaScores`), `AppIcon`.
- Produces: `fakeInternet.tsx` exports `SITES: Record<string, { title: string; component: FC }>` keyed by normalized host+path (`"raza.dev"`, `"raza.dev/projects/deep-emotion"` … one per project, `"github.com/razaalirizvi4"`, `"dailybugle.com"`, `"nba.com/scores"`) and `resolveUrl(input: string): { key: string } | { external: string } | { notFound: string }` — bare words search-fallback to `raza.dev`, anything matching a real external URL pattern (`https?://` not in SITES) → external.

- [ ] **Step 1: `fakeInternet.tsx` site components** (each a scrollable page, its own deliberate "web" design — these are the ONE place allowed to not look like Yaru):
  - **raza.dev** — clean personal homepage: name, title, location, chips for skills, project cards linking to `raza.dev/projects/<id>`, contact footer (real `mailto:` + GitHub external). Typography-led, off-white background, orange accents.
  - **raza.dev/projects/<id>** — generated from `profile.projects`: hero (name + tagline), tech pill row, bullet story, "View source on GitHub" button (real external link).
  - **github.com/razaalirizvi4** — convincing GitHub profile: dark GitHub palette, avatar, bio, pinned repo cards (the 4 projects with language dots), fake contribution graph (SVG grid, heavier recent columns), header button "Open real profile ↗" → `window.open(profile.github)`; each repo card links out to its real GitHub URL.
  - **dailybugle.com** — newspaper: masthead "THE DAILY BUGLE", serif headlines from `easterEggs.bugleHeadlines`, columns, "EXCLUSIVE PHOTOS" grey boxes, spinning "SUBSCRIBE (J.J. needs money)" banner.
  - **nba.com/scores** — scoreboard cards from `easterEggs.nbaScores` with the `note` as caption, "GOAT-o-meter" sidebar poll (23 vs 24, both at 50%, voting nudges it back to 50/50 with toast "the debate must never end").
- [ ] **Step 2: `Firefox.tsx`** — chrome: tab strip (tabs with favicon+title+×, `+` new tab), toolbar (back/forward/reload from per-tab history stack, awesome-bar showing current URL, padlock), each tab = `{ id, history: string[], pos: number }`. Enter in awesome-bar → `resolveUrl`: SITES → render component; external → `window.open(url, "_blank")` + stay; notFound → Firefox error page ("Hmm. We're having trouble finding that site." + "Did you make a typo? It happens to the best of us. Not to Spider-Man though."). New-tab page: Firefox-style search box + shortcut tiles (raza.dev, GitHub, Daily Bugle, NBA). Default first tab: `raza.dev`.
- [ ] **Step 3: Manual verify** — navigate all sites, back/forward, external GitHub opens real tab, unknown URL error page, multiple tabs.
- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: Firefox with fake internet - raza.dev, GitHub, Daily Bugle, NBA scores"`

---

### Task 16: VS Code + code samples

**Files:**
- Create: `frontend/src/content/codeSamples.ts`
- Replace: `frontend/src/apps/vscode/VsCode.tsx`
- Modify: `frontend/src/content/filesystem.ts` (add code files into project folders)

**Interfaces:**
- Consumes: `vfs` singleton, `profile`, Terminal component (`import Terminal from "../terminal/Terminal"` — reused as the integrated terminal), shiki (`npm i shiki`, dynamic `import()` inside the editor only).
- Produces: `codeSamples.ts` exports `samples: { path: string; language: "python" | "diff" | "typescript" | "javascript"; code: string }[]` where `path` is a VFS path under `~/Projects/...`; `filesystem.ts` registers each as `file(name, "code", code)`.

- [ ] **Step 1: `codeSamples.ts`** — three curated, REAL-feeling samples (write them fully in this file; ~30–60 lines each):
  - `~/Projects/deep-emotion/fix_dropout.diff` (language `diff`) — the actual bug story: `- x = F.dropout(x, p=0.5)` → `+ x = F.dropout(x, p=0.5, training=self.training)` with surrounding `forward()` context and a commit-message-style header explaining the ~50%→~70% result.
  - `~/Projects/twin/twin.py` (python) — CLI entry: argparse, prompt → Ollama `gemma3` call, safety confirm before `subprocess.run`, matching the resume bullets.
  - `~/Projects/agri-pro/FieldMap.jsx` (javascript) — Mapbox GL draw/edit field boundaries with Turf area calc.
- [ ] **Step 2: `VsCode.tsx`** — Code OSS dark: 48px activity bar (Explorer/Search/SCM/Debug/**Extensions** icons), 220px explorer tree of `~/Projects` from vfs (collapsible folders), tab strip, editor pane: shiki `codeToHtml` with `github-dark` theme (dynamic import + `useState` cache; plain `<pre>` fallback while loading), line numbers, minimap-ish decorative strip, breadcrumbs, status bar (branch `main`, `Ln 1, Col 1`, language, "Prettier ✓"). **Extensions panel:** static list — "Spider-Sense Linter · detects danger in your code · ★★★★★", "GitHub Copilot (declined — does his own reps)", "Basketball Court Theme", "Vim (installed, never exited)". Bottom panel toggle (`Ctrl+``): renders the SAME `<Terminal windowId={...}/>` component (spec: integrated terminal = Terminal component). If `props.path` is provided (Files opens `code` files via `openApp("vscode", { path })`), open that file as the initial tab and reveal it in the explorer.
- [ ] **Step 3: Manual verify** — tree shows projects incl. code files (also visible in Files/`cat` now), open the diff (highlighted), integrated terminal runs `neofetch`, extensions panel jokes render.
- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: VS Code with curated project sources, shiki highlighting, integrated terminal"`

---

### Task 17: Screenshot tool + DOOM

**Files:**
- Replace: `frontend/src/apps/screenshot/Screenshot.tsx`, `frontend/src/apps/doom/Doom.tsx`
- Create: `frontend/public/doom/` assets (see Step 2), `frontend/scripts/fetch-doom.mjs`

**Interfaces:**
- Consumes: `html-to-image` (`toPng`), js-dos v8 (`npm i js-dos`), `useOs.notify`.
- Produces: nothing consumed later.

- [ ] **Step 1: `Screenshot.tsx`** — GNOME 46 screenshot dialog look: pill window (no headerbar content needed beyond WindowFrame), Screen/Window/Selection segmented control (Screen implemented; others disabled with tooltip "someday"), big round capture button. Capture: briefly `visibility: hidden` the screenshot window itself (add `data-screenshot-hide` attr; pass `filter` option to `toPng` excluding it), `toPng(document.getElementById("root"))`, white flash overlay 120ms, then trigger download `razaos-screenshot-<timestamp>.png` + `notify("screenshot", "Screenshot captured", "Saved to Downloads")` and also `vfs.write("~/Downloads/screenshot-<ts>.png.txt", "(you downloaded the real one)")` for coherence.
- [ ] **Step 2: DOOM assets** — `npm i js-dos`; write `frontend/scripts/fetch-doom.mjs` (node script, run once manually): downloads the shareware DOOM js-dos bundle `https://cdn.dos.zone/custom/dos/doom.jsdos` to `public/doom/doom.jsdos`, and copies `node_modules/js-dos/dist/*` (js-dos.js, js-dos.css, emulators/) to `public/doom/jsdos/`. Run: `node scripts/fetch-doom.mjs`. Expected: files exist; `public/doom/` ~3MB. **Fallback if the CDN URL 404s at execution time:** any shareware `doom.jsdos` bundle from dos.zone works; last resort, keep the app but render a themed "DOOM.WAD not found — the demons won this round" screen (do not block the task on the asset).
- [ ] **Step 3: `Doom.tsx`** — loads `public/doom/jsdos/js-dos.css` + `js-dos.js` via dynamic `<link>`/`<script>` injection on mount (once), then `Dos(divRef.current, { url: "/doom/doom.jsdos", ... })` per js-dos v8 API; dark stage with centered 4:3 canvas; footer hint bar: "Click to capture mouse · Esc to release · IDDQD if you must". Unmount → `dos.stop()`. First-load spinner with "Summoning demons…" label.
- [ ] **Step 4: Manual verify** — screenshot downloads a real PNG of the desktop; DOOM boots to the shareware title screen and plays (keyboard + pointer lock).
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: working screenshot tool and real DOOM via js-dos"` (ensure `public/doom/**` is committed; it's static-asset-sized and Vercel serves it).

---
### Task 18: Easter-egg wiring — thwip, swish, remaining eggs audit

**Files:**
- Create: `frontend/src/shell/desktop/effects/Thwip.tsx`, `frontend/src/os/sound.ts`
- Modify: `frontend/src/os/store.ts` (add `effect` state + `fireEffect` action), `frontend/src/apps/terminal/Terminal.tsx` (dispatch `§THWIP`), `frontend/src/shell/desktop/Desktop.tsx` (mount effect layer)

**Interfaces:**
- Consumes: `useOs` (windows, `minimizeWindow`, `focusedId`), a tiny event bus — add to `os/store.ts`: `effect: string | null` state + `fireEffect(name: string)` action (auto-clears after 1200ms via setTimeout in the action).
- Produces: `sound.ts` exports `swish()` — Web Audio API synthesized swish (no audio files: 0.25s filtered white-noise burst with falling bandpass sweep); used by SysMon respawn toast and Konami rain finale.

- [ ] **Step 1: Event plumbing** — `fireEffect("thwip")` in store; Terminal's `§THWIP` sentinel calls it (replacing Task 11's `*thwip*` print — keep the print too: `*thwip*`).
- [ ] **Step 2: `Thwip.tsx`** — mounted in `Desktop.tsx`; when `effect === "thwip"`: SVG overlay draws a white web-line from top-right corner to the center of the focused window's headerbar (300ms draw via `stroke-dashoffset`), then the focused window animates a grab-shake (translate ±6px, 2 cycles) and gets yanked up-right off-screen → `minimizeWindow(focusedId)` (it "returns" from the dock — reversible, non-destructive). If no focused window, the line snaps at empty space with a small `*thwip*` text puff.
- [ ] **Step 3: `sound.ts` `swish()`** — `AudioContext` singleton; white-noise buffer → bandpass (freq 2400→400 sweep, Q 0.8) → gain envelope (0.3→0, 250ms). Call it: SysMon spider-daemon/hoops respawn, Konami finale, Calculator 🐐 append. Guard: create context lazily on first user-gesture-driven call (browser autoplay policy).
- [ ] **Step 4: Egg audit checklist** — verify each spec egg exists (implemented across prior tasks); fix any missing NOW:
  - [ ] GRUB Web-Slinger panic (T6) — [ ] boot log Basketball Vibration Sensor + hoops.service (T6) — [ ] avatar web-spin on hover (T5/T7) — [ ] trash "Symbiote Containment" (T8/T12) — [ ] Konami basketball-web rain (T8) — [ ] `spider-daemon` 3.0% + respawn quote (T14) — [ ] `hoops.service` (T11/T14) — [ ] shot-arc memory graph (T14) — [ ] Calculator 23/24 🐐 (T14) — [ ] `.secrets/peter_parker_alibi.txt` (T3) — [ ] `thwip` (this task) — [ ] `ball` (T11) — [ ] `sl` Spider-Mobile (T11) — [ ] `with great power` completion (T11) — [ ] sudo→JJJ (T11) — [ ] Daily Bugle (T15) — [ ] NBA scores (T15) — [ ] `buzzer_beater.gif` + `spider_bite_incident.jpg` in Pictures (T3/T5) — [ ] Spider-Man + court wallpapers (T5/T13) — [ ] swish sound on an egg (this task).
- [ ] **Step 5: Manual verify** — `thwip` in terminal yanks the terminal itself into the dock with the web-line; swish plays on calculator 23.
- [ ] **Step 6: Commit** — `git add -A; git commit -m "feat: thwip effect, synthesized swish, easter-egg audit"`

---

### Task 19: iOS mobile shell

**Files:**
- Create: `frontend/src/shell/mobile/MobileShell.tsx`, `IosLockScreen.tsx`, `Springboard.tsx`, `IosStatusBar.tsx`, `ControlCenter.tsx`, `IosAppFrame.tsx` (all under `frontend/src/shell/mobile/`)
- Modify: `frontend/src/App.tsx` (shell chooser)

**Interfaces:**
- Consumes: `useOs` (settings, notify, openApp NOT used — mobile keeps its own light nav state), `APPS` manifests + `AppIcon`, app components directly (they receive `AppProps`; pass `windowId: "mobile"`).
- Produces: `App.tsx` final form:

```tsx
import { useMemo } from "react";
import DesktopShell from "./shell/desktop/DesktopShell";
import MobileShell from "./shell/mobile/MobileShell";

export default function App() {
  const isMobile = useMemo(
    () => window.matchMedia("(max-width: 768px)").matches && "ontouchstart" in window,
    []);
  return isMobile ? <MobileShell /> : <DesktopShell />;
}
```

- [ ] **Step 1: `MobileShell.tsx`** — local state machine: `"locked" | "home" | { appId: string }`; renders `IosStatusBar` always on top; lock → springboard on swipe-up/tap; opening an app = fullscreen `IosAppFrame` (spring slide-up, framer-motion); home indicator bar at bottom — drag/tap returns home; Control Center on drag down from top-right (or chevron button).
- [ ] **Step 2: `IosStatusBar.tsx`** — 44px safe-area bar: time left (bold SF-style — use system font stack `-apple-system, "SF Pro Text", Ubuntu` on mobile shell only), right: signal bars + "Jazz 5G" + wifi + battery pill "85". Dark/light per `settings.theme`.
- [ ] **Step 3: `IosLockScreen.tsx`** — wallpaper (`settings.wallpaper`), huge thin clock + date, flashlight/camera pill buttons (decorative), "swipe up to open" — any tap/swipe unlocks. Notification card: "1 new message · recruiter@dream-job.com: 'we should talk'".
- [ ] **Step 4: `Springboard.tsx`** — iOS home: 4-col icon grid with iOS-radius (`22%`) reuse of `AppIcon` (visually adapted: rounded-square mask + label under), page-dots, bottom dock (4: Firefox→"Safari" label but same fake internet, Terminal, Files, Resume(evince)); DOOM included; icons open apps. Long-press wiggles icons (cosmetic, framer-motion rotate keyframes) with an × that shows toast "App Store refunds not available".
- [ ] **Step 5: `IosAppFrame.tsx`** — fullscreen sheet: iOS nav bar (back chevron "Home", centered app name), content = the shared app component with `windowId="mobile"`; apps already handle small sizes reasonably (flex layouts); Terminal keeps a visible input so the OS keyboard opens; Evince shows the PDF with a share/download button.
- [ ] **Step 6: `ControlCenter.tsx`** — iOS panel: blurred dark sheet, toggle tiles (Airplane, Wi-Fi "FAST-NUCES-Guest", Bluetooth, Dark Mode → `setSettings({theme})`), brightness/volume sliders (brightness slider actually applies a `filter: brightness()` on the shell — a real control), music card "Now Playing: The Spectacular Spider-Man Theme".
- [ ] **Step 7: Manual verify** — Chrome DevTools iPhone viewport (+ touch emulation): lock → home → open Terminal (keyboard usable), Files, resume, Control Center dark-mode toggle affects shell, home indicator returns.
- [ ] **Step 8: Commit** — `git add -A; git commit -m "feat: iOS mobile shell - lock screen, springboard, control center"`

---

### Task 20: E2E smoke tests, build hygiene, README, deploy check

**Files:**
- Create: `frontend/playwright.config.ts`, `frontend/e2e/desktop.spec.ts`, `frontend/e2e/mobile.spec.ts`
- Modify: `frontend/README.md`, root `package-lock.json` situation (untracked root lockfile: delete it — the app lives in `frontend/`)

**Interfaces:**
- Consumes: everything.
- Produces: green `npm run build`, green `npm test`, green `npm run test:e2e`.

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  webServer: { command: "npm run dev", url: "http://localhost:5173", reuseExistingServer: true },
  use: { baseURL: "http://localhost:5173" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
```

- [ ] **Step 2: `e2e/desktop.spec.ts`** (skip in mobile project via `test.skip(({ isMobile }) => isMobile)`):

```ts
import { test, expect } from "@playwright/test";
test.skip(({ isMobile }) => isMobile);

test("boot → login → desktop", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Enter");            // GRUB: boot Ubuntu
  await page.keyboard.press("Enter");            // skip kernel log
  await page.getByRole("textbox").press("Enter"); // GDM password
  await expect(page.getByText("Activities")).toBeVisible();
});

test("terminal neofetch", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.getByRole("textbox").press("Enter");
  await page.keyboard.press("Control+Alt+t");
  await page.keyboard.type("neofetch");
  await page.keyboard.press("Enter");
  await expect(page.getByText("RazaOS")).toBeVisible();
  await expect(page.getByText("FAST-NUCES")).toBeVisible();
});

test("files opens resume in document viewer", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.getByRole("textbox").press("Enter");
  await page.getByRole("button", { name: "Files" }).click();   // dock button (give dock buttons aria-labels = app names)
  await page.getByText("Documents").dblclick();
  await page.getByText("resume.pdf").dblclick();
  await expect(page.getByRole("link", { name: /Download/i })).toBeVisible();
});
```

If the GRUB/kernel skip timing is flaky, add a `?fastboot=1` query param handled in `DesktopShell` (jump straight to gdm) and use it in `beforeEach` — that param is also handy for demos. Implement the param regardless (guarded: only affects session start).

- [ ] **Step 3: `e2e/mobile.spec.ts`:**

```ts
import { test, expect } from "@playwright/test";
test.skip(({ isMobile }) => !isMobile);

test("lock screen → springboard → app", async ({ page }) => {
  await page.goto("/");
  await page.getByText(/swipe up/i).tap();
  await expect(page.getByText("Terminal")).toBeVisible();
  await page.getByText("Terminal").tap();
  await page.keyboard.type("whoami");
  await page.keyboard.press("Enter");
  await expect(page.getByText("raza", { exact: true })).toBeVisible();
});
```

Run `npx playwright install chromium` first if browsers missing. Run `npm run test:e2e` — expect all PASS.

- [ ] **Step 4: Hygiene** — delete stray root `package-lock.json` (untracked; app installs live in `frontend/`). Rewrite `frontend/README.md`: what this is (Ubuntu 24.04 replica portfolio), architecture map (content/os/shell/apps), dev commands, easter-egg-free teaser ("there are at least 20 secrets. `ls -a` is a good start."). Verify `npm run build` output size: initial JS chunk < 300KB gz (spec budget) — check `vite build` report; if over, confirm shiki/js-dos/apps are all in lazy chunks.
- [ ] **Step 5: Full verification** — `npm test` PASS; `npm run test:e2e` PASS; `npm run build` PASS + budget; `npm run preview` manual smoke of boot→login→3 apps.
- [ ] **Step 6: Commit and push** — `git add -A; git commit -m "test: e2e smoke suite, README, build hygiene"; git push` → verify the Vercel deployment goes green and the production URL boots to GRUB. (If Vercel project root isn't `frontend/`, fix the project's Root Directory setting in the Vercel dashboard — do not restructure the repo.)

---

## Execution notes

- Tasks 1–5 are strictly sequential (foundation). Tasks 6–7 depend on 4; 8–10 depend on 5+7; app tasks 11–17 depend on 9 (windows) but are independent of each other EXCEPT: 14 and 16 depend on 11 (arith/processes, Terminal reuse); 18 depends on 11+14; 19 depends on all apps it surfaces (11, 12, 15, 17 minimum); 20 is last.
- Manual-verify steps that need a browser: use `npm run dev` + the `?fastboot=1` param (Task 20 introduces it, but implementing it early during Task 6 is allowed and encouraged — it's 5 lines).
- If a subagent cannot run a browser, mark manual-verify steps for the human checkpoint and rely on unit tests + typecheck.
