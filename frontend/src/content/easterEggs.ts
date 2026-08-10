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
  processes: [
    { name: "gnome-shell", cpu: 2.1, mem: 384 },
    { name: "spider-daemon", cpu: 3.0, mem: 64 },
    { name: "hoops.service", cpu: 0.8, mem: 23 },
    { name: "web-crawler", cpu: 1.2, mem: 88 },
    { name: "jarvis", cpu: 0.5, mem: 512 },
    { name: "systemd", cpu: 0.1, mem: 12 },
    { name: "firefox", cpu: 8.4, mem: 1024 },
    { name: "code", cpu: 6.2, mem: 768 },
  ],
  nbaScores: [
    { home: "Lakers", away: "Bulls", homePts: 110, awayPts: 112, note: "MJ with the game-winner. Again. In 2026. Don't ask." },
    { home: "Warriors", away: "Cavs", homePts: 118, awayPts: 121, note: "Blocked. Chased down from behind. You know the one." },
    { home: "Raptors", away: "Sixers", homePts: 92, awayPts: 90, note: "Bounce... bounce... bounce... bounce... in." },
  ],
} as const;
