import MusicTempo from "music-tempo";

const SAMPLE_RATE = 22050;
const HOP_SIZE = 220; // music-tempo defaults to 441 @ 44100Hz; halve it for ours
const TIME_STEP = HOP_SIZE / SAMPLE_RATE;

/** Beat groupings we try to tell apart. See detectMeter for what this can't do. */
const METERS = [3, 4] as const;
export type Meter = (typeof METERS)[number];

export type Tempo = { bpm: number | null; meter: Meter | null };

/**
 * Beat tracking over the raw audio (not the transcribed notes — percussion
 * carries the pulse and basic-pitch does not transcribe it).
 *
 * The detector's window spans 60–200 BPM, wider than an octave, so it can
 * report either metrical level: a soft 83 BPM ballad often comes back as 166.
 * That ambiguity is real (nothing in the audio says which level is "the"
 * tempo), so it is surfaced in the UI rather than folded away here.
 */
export function detectTempo(pcm: Float32Array): Tempo {
  const mt = new MusicTempo(pcm, { hopSize: HOP_SIZE, timeStep: TIME_STEP });
  // music-tempo returns a toFixed(3) string, or the number -1 when it finds nothing.
  const tempo = Number(mt.tempo);
  if (!(tempo > 0)) return { bpm: null, meter: null };
  return {
    bpm: Math.round(tempo * 10) / 10,
    meter: detectMeter(mt.beats, mt.spectralFlux),
  };
}

/**
 * How the beats group, from where the accents land: score every phase of every
 * candidate grouping and keep the strongest, if it stands out at all.
 *
 * Only the numerator is recoverable, and only roughly — 3 covers 3/4 and 6/8,
 * 4 covers 4/4, 2/4 and 12/8. The denominator is a notation choice that leaves
 * no trace in the audio, and anything irregular (5/4, 7/8) is not tried at all,
 * so it comes back as whichever of 3 or 4 fits worst-least, or null.
 */
export function detectMeter(beats: number[], flux: number[]): Meter | null {
  // Under ~3 bars of beats the phase averages are noise.
  if (beats.length < 12) return null;

  // Onset strength per beat: the loudest flux frame around the beat time, since
  // a tracked beat lands a frame or two off the onset that caused it.
  const strength = beats.map((t) => {
    const i = Math.round(t / TIME_STEP);
    let peak = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(flux.length - 1, i + 2); j++) {
      peak = Math.max(peak, flux[j]);
    }
    return peak;
  });
  const mean = strength.reduce((a, b) => a + b, 0) / strength.length;
  if (mean <= 0) return null;

  let best: Meter | null = null;
  let bestContrast = 0;
  for (const m of METERS) {
    for (let phase = 0; phase < m; phase++) {
      const downbeats = strength.filter((_, i) => i % m === phase);
      const contrast = downbeats.reduce((a, b) => a + b, 0) / downbeats.length / mean;
      // ponytail: 4 gets four phases to 3's three, so ties lean 4/4. Fine while
      // 4/4 is the prior anyway; weight per-meter if that stops being true.
      if (contrast > bestContrast) [bestContrast, best] = [contrast, m];
    }
  }
  // A flat accent pattern means no meter was found, not 4/4 by default.
  return bestContrast > 1.1 ? best : null;
}
