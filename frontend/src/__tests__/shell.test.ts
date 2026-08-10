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
