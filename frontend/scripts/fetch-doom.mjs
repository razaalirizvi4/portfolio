#!/usr/bin/env node
// One-time asset fetcher for the DOOM app (Task 17).
//
// Run manually: `node scripts/fetch-doom.mjs`
//
// Downloads the shareware DOOM js-dos bundle from dos.zone's CDN and
// copies the js-dos v8 player runtime (already installed via
// `npm i js-dos`) into public/doom/, so Doom.tsx can load everything
// as plain static assets — no bundler involvement, no CDN calls at
// runtime (pathPrefix points DOSBox's wasm loader at the local copy).
//
// If the download fails (registry unreachable, CDN blocked/404), this
// script exits non-zero but does not throw — Doom.tsx detects missing
// assets at runtime and falls back to a themed "DOOM.WAD not found"
// screen, so the app stays functional either way.

import { mkdir, cp, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOOM_DIR = path.join(ROOT, "public", "doom");
const JSDOS_SRC = path.join(ROOT, "node_modules", "js-dos", "dist");
const JSDOS_DEST = path.join(DOOM_DIR, "jsdos");

// Known-good shareware DOOM js-dos bundles on dos.zone's CDN, tried in order.
const BUNDLE_URLS = [
  "https://cdn.dos.zone/custom/dos/doom.jsdos",
];

async function fetchBundle() {
  await mkdir(DOOM_DIR, { recursive: true });
  const dest = path.join(DOOM_DIR, "doom.jsdos");
  for (const url of BUNDLE_URLS) {
    try {
      console.log(`Fetching ${url} ...`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      console.log(`  wrote ${dest} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
      return true;
    } catch (err) {
      console.warn(`  failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  return false;
}

async function copyRuntime() {
  if (!existsSync(JSDOS_SRC)) {
    console.warn(`js-dos is not installed (expected ${JSDOS_SRC}); run "npm i js-dos" first.`);
    return false;
  }
  await mkdir(JSDOS_DEST, { recursive: true });
  await cp(JSDOS_SRC, JSDOS_DEST, { recursive: true });
  console.log(`Copied js-dos runtime -> ${JSDOS_DEST}`);
  return true;
}

const gotBundle = await fetchBundle();
const gotRuntime = await copyRuntime();

if (!gotBundle || !gotRuntime) {
  console.warn(
    '\nDOOM assets incomplete — Doom.tsx will render the themed "DOOM.WAD not found" ' +
    "fallback screen at runtime until this script succeeds for both parts.",
  );
  process.exitCode = 1;
} else {
  console.log("\nDOOM assets ready: public/doom/doom.jsdos + public/doom/jsdos/*");
}
