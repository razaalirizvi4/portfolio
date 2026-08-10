import type { Vfs, VfsNode } from "../../os/vfs";
import { HOME } from "../../os/vfs";
import { profile } from "../../content/profile";
import { easterEggs } from "../../content/easterEggs";
import type { ShellCtx } from "./shell";

// Style tokens rendered by Terminal.tsx: §g green, §o orange, §r red,
// §b bold-blue, §n reset-to-default. Whole-line sentinels: §CLEAR, §SL,
// §BALL, §THWIP, §PYTHON, §HISTORY.
const G = "§g", O = "§o", R = "§r", B = "§b", N = "§n";

export type CommandFn = (args: string[], ctx: ShellCtx, fs: Vfs) => string[];

function abbrev(p: string): string {
  return p === HOME ? "~" : p.startsWith(HOME + "/") ? "~" + p.slice(HOME.length) : p;
}

// ---------- filesystem ----------

const ls: CommandFn = (args, ctx, fs) => {
  const all = args.includes("-a");
  const long = args.includes("-l");
  const target = args.find(a => !a.startsWith("-")) ?? ".";
  const node = fs.resolve(target, ctx.cwd);
  if (!node) return [`ls: cannot access '${target}': No such file or directory`];
  let entries: VfsNode[];
  if (node.type === "file") {
    entries = [node];
  } else {
    entries = fs.list(target, ctx.cwd);
    if (!all) entries = entries.filter(e => !e.name.startsWith("."));
  }
  const paint = (e: VfsNode) => (e.type === "dir" ? `${B}${e.name}${N}` : e.name);
  if (long) {
    const lines: string[] = [];
    for (const e of entries) {
      const perms = e.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
      const size = e.type === "file" ? String(e.content.length) : "4096";
      lines.push(`${perms} raza raza ${size.padStart(6)} ${paint(e)}`);
    }
    return lines.length ? lines : [""];
  }
  if (node.type === "dir" && all) {
    entries = [{ type: "dir", name: ".", children: {} }, { type: "dir", name: "..", children: {} }, ...entries];
  }
  return entries.length ? [entries.map(paint).join("  ")] : [""];
};

const cd: CommandFn = (args, ctx, fs) => {
  const target = args[0] ?? "~";
  const node = fs.resolve(target, ctx.cwd);
  if (!node) return [`cd: no such file or directory: ${target}`];
  if (node.type !== "dir") return [`cd: not a directory: ${target}`];
  ctx.setCwd(fs.normalize(target, ctx.cwd));
  return [];
};

const pwd: CommandFn = (_a, ctx) => [ctx.cwd];

const cat: CommandFn = (args, ctx, fs) => {
  if (!args.length) return ["cat: missing file operand"];
  const out: string[] = [];
  for (const a of args) {
    const node = fs.resolve(a, ctx.cwd);
    if (!node) { out.push(`cat: ${a}: No such file or directory`); continue; }
    if (node.type === "dir") { out.push(`cat: ${a}: Is a directory`); continue; }
    out.push(...node.content.split("\n"));
  }
  return out;
};

const mkdir: CommandFn = (args, ctx, fs) => {
  if (!args.length) return ["mkdir: missing operand"];
  for (const a of args) {
    try { fs.mkdir(a, ctx.cwd); } catch (e) { return [`mkdir: cannot create directory '${a}': ${(e as Error).message}`]; }
  }
  return [];
};

const rm: CommandFn = (args, ctx, fs) => {
  const targets = args.filter(a => !a.startsWith("-"));
  if (!targets.length) return ["rm: missing operand"];
  const out: string[] = [];
  for (const t of targets) {
    const res = fs.rm(t, ctx.cwd);
    if (!res.ok && res.error) out.push(`${R}${res.error}${N}`);
  }
  return out;
};

const touch: CommandFn = (args, ctx, fs) => {
  if (!args.length) return ["touch: missing file operand"];
  for (const a of args) {
    const existing = fs.resolve(a, ctx.cwd);
    if (existing) continue;
    try { fs.write(a, "", ctx.cwd); } catch (e) { return [`touch: cannot touch '${a}': ${(e as Error).message}`]; }
  }
  return [];
};

const echo: CommandFn = (args) => [args.join(" ")];

const grep: CommandFn = (args, ctx, fs) => {
  const rest = args.filter(a => !a.startsWith("-"));
  if (rest.length < 2) return ["usage: grep <pattern> <file>"];
  const [pat, ...files] = rest;
  const out: string[] = [];
  for (const f of files) {
    const node = fs.resolve(f, ctx.cwd);
    if (!node || node.type !== "file") { out.push(`grep: ${f}: No such file or directory`); continue; }
    for (const line of node.content.split("\n")) {
      if (line.includes(pat)) {
        const painted = line.split(pat).join(`${R}${pat}${N}`);
        out.push(files.length > 1 ? `${f}:${painted}` : painted);
      }
    }
  }
  return out;
};

const tree: CommandFn = (args, ctx, fs) => {
  const start = args.find(a => !a.startsWith("-")) ?? ".";
  const root = fs.resolve(start, ctx.cwd);
  if (!root) return [`${start} [error opening dir]`];
  const out: string[] = [abbrev(fs.normalize(start, ctx.cwd))];
  let dirs = 0, filesN = 0;
  const walk = (node: VfsNode, prefix: string) => {
    if (node.type !== "dir") return;
    const kids = Object.values(node.children).sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1);
    kids.forEach((k, i) => {
      const last = i === kids.length - 1;
      const branch = last ? "└── " : "├── ";
      const label = k.type === "dir" ? `${B}${k.name}${N}` : k.name;
      out.push(prefix + branch + label);
      if (k.type === "dir") { dirs++; walk(k, prefix + (last ? "    " : "│   ")); }
      else filesN++;
    });
  };
  walk(root, "");
  out.push("", `${dirs} directories, ${filesN} files`);
  return out;
};

// ---------- session ----------

const whoami: CommandFn = () => ["raza"];
const hostname: CommandFn = () => [profile.hostname];
const clear: CommandFn = () => ["§CLEAR"];
const history: CommandFn = () => ["§HISTORY"];
const exitCmd: CommandFn = (_a, ctx) => { ctx.closeWindow(); return []; };

const MANPAGES: Record<string, string> = {
  ls: "ls - list directory contents. Use -a to show hidden files, -l for long format.",
  cd: "cd - change the working directory.",
  pwd: "pwd - print name of current/working directory.",
  cat: "cat - concatenate files and print on the standard output.",
  mkdir: "mkdir - make directories.",
  rm: "rm - remove files or directories. Protected files fight back.",
  touch: "touch - create empty files or update timestamps.",
  echo: "echo - display a line of text.",
  grep: "grep - print lines matching a pattern. Usage: grep <pattern> <file>.",
  tree: "tree - list contents of directories in a tree-like format.",
  neofetch: "neofetch - display system information with a tasteful ASCII logo.",
  resume: "resume - print my resume, formatted for humans.",
  projects: "projects - list my projects with tech and links.",
  skills: "skills - list languages, frameworks and tools I use.",
  contact: "contact - how to reach me.",
  sudo: "sudo - execute a command as superuser. You are not on the list.",
  cowsay: "cowsay - a cow says whatever you tell it to.",
  sl: "sl - you probably meant ls. Enjoy the ride.",
  python3: "python3 - a very small arithmetic REPL. exit() to leave.",
  man: "man - an interface to the system reference manuals. You are reading it now.",
};

const man: CommandFn = (args) => {
  const cmd = args[0];
  if (!cmd) return ["What manual page do you want?"];
  const page = MANPAGES[cmd];
  return page ? [`${B}${cmd.toUpperCase()}(1)${N}`, "", "  " + page] : [`No manual entry for ${cmd}`];
};

// ---------- portfolio ----------

const NEOFETCH_ART = [
  "         .-/+oossssoo+/-.",
  "     `:+ssssssssssssssssss+:`",
  "   -+ssssssssssssssssssyyssss+-",
  " .ossssssssssssssssssdMMMNysssso.",
  "/ssssssssssshdmmNNmmyNMMMMhssssss/",
  "+ssssssssshmydMMMMMMMNddddyssssssss+",
  "/sssssssshNMMMyhhyyyyhmNMMMNhssssssss/",
  ".ssssssssdMMMNhsssssssssshNMMMdssssssss.",
  "+sssshhhyNMMNyssssssssssssyNMMMysssssss+",
  "ossyNMMMNyMMhsssssssssssssshmmmhssssssso",
  "ossyNMMMNyMMhsssssssssssssshmmmhssssssso",
  "+sssshhhyNMMNyssssssssssssyNMMMysssssss+",
  ".ssssssssdMMMNhsssssssssshNMMMdssssssss.",
  "/sssssssshNMMMyhhyyyyhdNMMMNhssssssss/",
  " +sssssssssdmydMMMMMMMMddddyssssssss+",
  "  /ssssssssssshdmNNNNmyNMMMMhssssss/",
  "   .ossssssssssssssssssdMMMNysssso.",
  "     `:+ssssssssssssssssssyyyssss+-",
  "         .-/+oossssoo+/-.",
];

const neofetch: CommandFn = () => {
  const info: string[] = [
    `${O}raza${N}@${O}ubuntu${N}`,
    "-----------",
    `${O}OS:${N} RazaOS 1.0 (Ubuntu 24.04.1 LTS)`,
    `${O}Host:${N} FAST-NUCES`,
    `${O}Kernel:${N} 6.8.0-spider`,
    `${O}Uptime:${N} since 2004`,
    `${O}Shell:${N} bash 5.2.21`,
    `${O}Resolution:${N} your viewport`,
    `${O}DE:${N} GNOME 46 (Yaru)`,
    `${O}CPU:${N} Ryzen Web 9`,
    `${O}Memory:${N} enough for node_modules (barely)`,
    `${O}Education:${N} ${profile.education.degree} @ ${profile.education.school}`,
    `${O}Role:${N} ${profile.experience[0].role} @ ${profile.experience[0].company}`,
  ];
  const width = Math.max(...NEOFETCH_ART.map(l => l.length));
  const rows = Math.max(NEOFETCH_ART.length, info.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) {
    const art = (NEOFETCH_ART[i] ?? "").padEnd(width);
    const line = info[i] ?? "";
    out.push(`${O}${art}${N}   ${line}`);
  }
  return out;
};

const resume: CommandFn = () => {
  const out: string[] = [];
  out.push(`${B}${profile.name}${N} — ${profile.title}`);
  out.push(`${profile.email} · ${profile.phone} · ${profile.github}`);
  out.push("");
  out.push(`${O}EDUCATION${N}`);
  out.push(`  ${profile.education.degree}, ${profile.education.school} (${profile.education.location})`);
  out.push(`  CGPA ${profile.education.cgpa} · expected ${profile.education.expected}`);
  out.push("");
  out.push(`${O}EXPERIENCE${N}`);
  for (const e of profile.experience) {
    out.push(`  ${B}${e.role}${N} @ ${e.company} (${e.period})`);
    for (const b of e.bullets) out.push(`    - ${b}`);
  }
  out.push("");
  out.push(`${O}PROJECTS${N}`);
  for (const p of profile.projects) out.push(`  ${B}${p.name}${N} — ${p.tagline}`);
  out.push("");
  out.push(`${O}SKILLS${N}`);
  out.push(`  Languages: ${profile.skills.languages.join(", ")}`);
  out.push(`  Frameworks: ${profile.skills.frameworks.join(", ")}`);
  out.push(`  Tools: ${profile.skills.tools.join(", ")}`);
  return out;
};

const projects: CommandFn = () => {
  const out: string[] = [];
  for (const p of profile.projects) {
    out.push(`${B}${p.name}${N} — ${p.tagline}`);
    out.push(`  ${O}tech:${N} ${p.tech.join(", ")}`);
    out.push(`  ${O}github:${N} ${p.github}`);
    out.push("");
  }
  return out;
};

const skills: CommandFn = () => [
  `${O}Languages:${N}  ${profile.skills.languages.join(", ")}`,
  `${O}Frameworks:${N} ${profile.skills.frameworks.join(", ")}`,
  `${O}Tools:${N}      ${profile.skills.tools.join(", ")}`,
];

const contact: CommandFn = () => [
  `${O}Email:${N}  ${profile.email}`,
  `${O}Phone:${N}  ${profile.phone}`,
  `${O}GitHub:${N} ${profile.github}`,
  `${O}Where:${N}  ${profile.location}`,
];

const open: CommandFn = (args, ctx) => {
  const id = args[0];
  if (!id) return ["open: usage: open <app-id>"];
  ctx.openApp(id);
  return [`${G}Opening ${id}…${N}`];
};

// ---------- flavor ----------

const sudo: CommandFn = () => [
  "[sudo] password for raza: ",
  "raza is not in the sudoers file. This incident will be reported… to J. Jonah Jameson.",
];

const apt: CommandFn = (args) => {
  const idx = args.findIndex(a => a === "install");
  const pkg = idx >= 0 ? args[idx + 1] : undefined;
  if (!pkg) return ["E: Invalid operation. Try 'apt install <package>'."];
  return [
    "Reading package lists... Done",
    "Building dependency tree... Done",
    `E: Package '${pkg}' has no installation candidate (have you tried npm?)`,
  ];
};

const htop: CommandFn = () => {
  const out: string[] = [];
  out.push(`${G}  PID USER      CPU%   MEM(MB)  COMMAND${N}`);
  let pid = 1000;
  for (const p of easterEggs.processes) {
    pid += 111;
    out.push(
      `${String(pid).padStart(5)} raza     ${p.cpu.toFixed(1).padStart(5)}  ${String(p.mem).padStart(7)}  ${p.name}`,
    );
  }
  return out;
};

const cowsay: CommandFn = (args) => {
  const msg = args.length ? args.join(" ") : "moo";
  const top = " " + "_".repeat(msg.length + 2);
  const bottom = " " + "-".repeat(msg.length + 2);
  return [
    top,
    `< ${msg} >`,
    bottom,
    "        \\   ^__^",
    "         \\  (oo)\\_______",
    "            (__)\\       )\\/\\",
    "                ||----w |",
    "                ||     ||",
  ];
};

const sl: CommandFn = () => ["§SL"];
const ball: CommandFn = () => ["§BALL"];
const thwip: CommandFn = () => ["§THWIP"];
const python3: CommandFn = () => [
  "§PYTHON",
  "Python 3.12.3 (RazaOS) — a very small calculator.",
  'Type "exit()" to leave.',
];

const withCmd: CommandFn = (args) => {
  if (args[0] === "great" && args[1] === "power") {
    return ["…comes great responsibility. — Uncle Ben (and every senior engineer reviewing my PRs)"];
  }
  return ["with: command not found"];
};

export const COMMANDS: Record<string, CommandFn> = {
  ls, cd, pwd, cat, mkdir, rm, touch, echo, grep, tree,
  whoami, hostname, clear, history, exit: exitCmd, man,
  neofetch, resume, projects, skills, contact, open,
  sudo, apt, "apt-get": apt, htop, cowsay, sl, ball, thwip, python3,
  with: withCmd,
};

export const COMMAND_NAMES = Object.keys(COMMANDS);
