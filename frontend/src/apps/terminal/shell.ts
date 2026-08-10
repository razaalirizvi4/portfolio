import type { Vfs, VfsNode } from "../../os/vfs";
import { vfs } from "../../os/vfsInstance";
import { evaluate } from "../../os/arith";
import { COMMANDS, COMMAND_NAMES } from "./commands";

export interface ShellCtx {
  cwd: string;
  setCwd(p: string): void;
  openApp(id: string, props?: Record<string, unknown>): void;
  closeWindow(): void;
}

// Split a line into tokens, respecting single/double quotes.
export function tokenize(line: string): string[] {
  const toks: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  let has = false;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; has = true; continue; }
    if (ch === " " || ch === "\t") {
      if (has) { toks.push(cur); cur = ""; has = false; }
      continue;
    }
    cur += ch; has = true;
  }
  if (has) toks.push(cur);
  return toks;
}

export function runLine(line: string, ctx: ShellCtx, fsOverride?: Vfs): string[] {
  const fs = fsOverride ?? vfs;
  const trimmed = line.trim();
  if (trimmed === "") return [];
  const toks = tokenize(trimmed);
  const cmd = toks[0];
  const args = toks.slice(1);
  const fn = COMMANDS[cmd];
  if (!fn) return [`${cmd}: command not found`];
  return fn(args, ctx, fs);
}

// Python REPL mode — Terminal.tsx keeps the mode flag and routes lines here
// while active. Returns output lines plus whether to leave the REPL.
export function runRepl(line: string): { output: string[]; exit?: boolean } {
  const trimmed = line.trim();
  if (trimmed === "") return { output: [] };
  if (trimmed === "exit()" || trimmed === "quit()" || trimmed === "exit") {
    return { output: [], exit: true };
  }
  try {
    const val = evaluate(trimmed);
    return { output: [String(val)] };
  } catch {
    return { output: ["  File \"<stdin>\", line 1", "SyntaxError: invalid syntax"] };
  }
}

// Tab completion: first token → command names; otherwise → path prefix.
export function complete(partial: string, cwd: string, fsOverride?: Vfs): string | null {
  const fs = fsOverride ?? vfs;
  const toks = tokenize(partial);
  const endsWithSpace = /\s$/.test(partial);
  const completingFirst = toks.length <= 1 && !endsWithSpace;

  if (completingFirst) {
    const frag = toks[0] ?? "";
    const matches = COMMAND_NAMES.filter(c => c.startsWith(frag));
    return uniqueCompletion(matches, frag, partial);
  }

  // path completion on the last token
  const frag = endsWithSpace ? "" : toks[toks.length - 1];
  const slash = frag.lastIndexOf("/");
  const dirPart = slash >= 0 ? frag.slice(0, slash + 1) : "";
  const base = slash >= 0 ? frag.slice(slash + 1) : frag;
  const listPath = dirPart === "" ? "." : dirPart;
  const node = fs.resolve(listPath, cwd);
  if (!node || node.type !== "dir") return null;
  const names = Object.values(node.children)
    .filter((n: VfsNode) => n.name.startsWith(base))
    .map((n: VfsNode) => n.name + (n.type === "dir" ? "/" : ""));
  const completed = commonPrefix(names);
  if (!completed || completed.length <= base.length) {
    return names.length ? null : null;
  }
  const rebuilt = dirPart + completed;
  const prefix = partial.slice(0, partial.length - frag.length);
  return prefix + rebuilt;
}

function uniqueCompletion(matches: string[], frag: string, partial: string): string | null {
  if (matches.length === 0) return null;
  const completed = commonPrefix(matches);
  if (completed.length <= frag.length) return null;
  return partial.slice(0, partial.length - frag.length) + completed;
}

function commonPrefix(strs: string[]): string {
  if (!strs.length) return "";
  let pre = strs[0];
  for (const s of strs) {
    let i = 0;
    while (i < pre.length && i < s.length && pre[i] === s[i]) i++;
    pre = pre.slice(0, i);
  }
  return pre;
}
