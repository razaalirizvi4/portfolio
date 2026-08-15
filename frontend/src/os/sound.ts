/* ------------------------------------------------------------------ *
 * sound.ts — tiny synthesized SFX for easter eggs. No audio files:
 * everything is generated with the Web Audio API at call time.
 * ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * A short web-swish: a 0.25s burst of filtered white noise, swept through
 * a bandpass filter (2400Hz -> 400Hz) and shaped by a fast gain envelope.
 * Used for thwip / spider-daemon respawns / Konami finale / calculator GOAT.
 */
export function swish(): void {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const duration = 0.25;
  const now = audioCtx.currentTime;

  // White-noise source buffer.
  const bufferSize = Math.ceil(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.setValueAtTime(0.8, now);
  filter.frequency.setValueAtTime(2400, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + duration);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.linearRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start(now);
  noise.stop(now + duration);
}
