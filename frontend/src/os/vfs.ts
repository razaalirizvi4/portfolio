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
  root: VfsDir;
  constructor(root: VfsDir) {
    this.root = root;
  }

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
