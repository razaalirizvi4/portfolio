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
