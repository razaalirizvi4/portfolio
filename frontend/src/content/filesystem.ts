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
        dir("Projects", [...profile.projects].map(p =>
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
