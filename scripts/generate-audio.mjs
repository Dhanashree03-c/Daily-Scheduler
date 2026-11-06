#!/usr/bin/env node
/**
 * Generates royalty-free sample songs bundled into the app (public/audio/*.wav).
 * Original melodies synthesized here — no external files, no copyright issues.
 * Run: node scripts/generate-audio.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 22050;

function wavHeader(durationSec) {
  const dataSize = Math.floor(durationSec * SR) * 2;
  const buf = Buffer.alloc(44);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  return buf;
}

function renderSong(notes, totalSec) {
  const n = Math.floor(totalSec * SR);
  const samples = new Int16Array(n);
  for (const note of notes) {
    const start = Math.floor(note.t0 * SR);
    const len = Math.floor(note.dur * SR);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= n) break;
      const t = i / SR;
      const env = Math.min(1, i / (SR * 0.02)) * Math.pow(1 - i / len, 1.2);
      let v = 0;
      if (note.kind === "lead") {
        v = Math.sin(2 * Math.PI * note.f * t) * 0.45 + Math.sin(2 * Math.PI * note.f * 2 * t) * 0.12;
      } else if (note.kind === "bass") {
        v = Math.sin(2 * Math.PI * note.f * t) * 0.35;
      } else if (note.kind === "pad") {
        v = (Math.sin(2 * Math.PI * note.f * t) + Math.sin(2 * Math.PI * note.f * 1.01 * t)) * 0.14;
      } else if (note.kind === "hat") {
        v = (Math.random() * 2 - 1) * 0.08 * Math.exp(-t * 30);
      }
      const out = Math.round(Math.max(-1, Math.min(1, v * env)) * 32767);
      samples[idx] = Math.max(-32767, Math.min(32767, samples[idx] + out));
    }
  }
  const body = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) body.writeInt16LE(samples[i], i * 2);
  return Buffer.concat([wavHeader(totalSec), body]);
}

// Song 1 — Hello Day (bright C major, 24s)
const hello = [];
const bpm1 = 0.42;
const melody1 = [523.25, 659.25, 783.99, 659.25, 523.25, 587.33, 659.25, 587.33, 440, 523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25];
melody1.forEach((f, i) => hello.push({ t0: i * bpm1, dur: 0.38, f, kind: "lead" }));
[130.81, 98.0, 110.0, 130.81].forEach((f, i) => hello.push({ t0: i * 6 * bpm1, dur: 2.2, f, kind: "bass" }));
hello.push({ t0: 0, dur: 24, f: 261.63, kind: "pad" }, { t0: 0, dur: 24, f: 329.63, kind: "pad" });

// Song 2 — Calm Evening (gentle A minor, 24s)
const calm = [];
const bpm2 = 0.55;
const melody2 = [440, 523.25, 659.25, 523.25, 440, 391.99, 440, 523.25, 440, 391.99, 349.23, 391.99, 440, 349.23, 261.63, 329.63];
melody2.forEach((f, i) => calm.push({ t0: i * bpm2, dur: 0.5, f, kind: "lead" }));
[110, 87.31, 98, 110].forEach((f, i) => calm.push({ t0: i * 6 * bpm2, dur: 2.6, f, kind: "bass" }));
calm.push({ t0: 0, dur: 24, f: 220, kind: "pad" }, { t0: 0, dur: 24, f: 261.63, kind: "pad" });

// Song 3 — Focus Flow (hoppier G major, 24s)
const focus = [];
const bpm3 = 0.36;
const melody3 = [392, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 587.33, 392, 587.33, 493.88, 587.33, 659.25, 587.33, 523.25, 440];
melody3.forEach((f, i) => focus.push({ t0: i * bpm3, dur: 0.32, f, kind: "lead" }));
[98, 130.81, 146.83, 98].forEach((f, i) => focus.push({ t0: i * 6 * bpm3, dur: 1.8, f, kind: "bass" }));
for (let i = 0; i < 48; i++) focus.push({ t0: i * 0.5, dur: 0.06, f: 0, kind: "hat" });
focus.push({ t0: 0, dur: 24, f: 246.94, kind: "pad" });

mkdirSync("public/audio", { recursive: true });
writeFileSync("public/audio/hello-day.wav", renderSong(hello, 24));
writeFileSync("public/audio/calm-evening.wav", renderSong(calm, 24));
writeFileSync("public/audio/focus-flow.wav", renderSong(focus, 24));
console.log("Wrote public/audio/hello-day.wav, calm-evening.wav, focus-flow.wav");
