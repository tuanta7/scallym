import assert from "node:assert/strict";
import { detectMeter } from "./tempo.ts";

const TIME_STEP = 220 / 22050;

// Beats every 0.5s for 12s, with every `accentEvery`-th one twice as loud;
// accentEvery 0 means a flat pulse with no accents at all.
const pulse = (accentEvery: number) => {
  const beats = Array.from({ length: 24 }, (_, i) => i * 0.5);
  const flux = new Array(Math.ceil(12 / TIME_STEP)).fill(0);
  beats.forEach((t, i) => {
    flux[Math.round(t / TIME_STEP)] = accentEvery && i % accentEvery === 0 ? 1 : 0.5;
  });
  return [beats, flux] as const;
};

assert.equal(detectMeter(...pulse(3)), 3);
assert.equal(detectMeter(...pulse(4)), 4);
// No accent to find, and not enough beats to average over: no guess either way.
assert.equal(detectMeter(...pulse(0)), null);
assert.equal(detectMeter(pulse(3)[0].slice(0, 8), pulse(3)[1]), null);
