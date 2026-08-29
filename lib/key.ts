// Krumhansl-Schmuckler key finding: correlate a duration-weighted pitch-class
// histogram against the 24 major/minor key profiles and take the best match.

export const PITCH_CLASSES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export type Note = { pitchMidi: number; durationSeconds: number };

export type KeyResult = {
  tonic: string;
  scale: "major" | "minor";
  key: string;
  confidence: number;
  histogram: number[];
};

function correlate(a: number[], b: number[]): number {
  const ma = a.reduce((s, x) => s + x, 0) / a.length;
  const mb = b.reduce((s, x) => s + x, 0) / b.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

export function detectKey(notes: Note[]): KeyResult | null {
  const histogram = new Array(12).fill(0);
  for (const n of notes) histogram[n.pitchMidi % 12] += n.durationSeconds;
  if (histogram.every((x) => x === 0)) return null;

  const scored: { tonic: number; scale: "major" | "minor"; score: number }[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    // Rotate the histogram so `tonic` sits at index 0, then compare to the profiles.
    const rotated = histogram.map((_, i) => histogram[(i + tonic) % 12]);
    scored.push({ tonic, scale: "major", score: correlate(rotated, MAJOR) });
    scored.push({ tonic, scale: "minor", score: correlate(rotated, MINOR) });
  }
  scored.sort((a, b) => b.score - a.score);

  const [best, runnerUp] = scored;
  return {
    tonic: PITCH_CLASSES[best.tonic],
    scale: best.scale,
    key: `${PITCH_CLASSES[best.tonic]} ${best.scale}`,
    confidence: best.score - runnerUp.score,
    histogram,
  };
}

/** The relative minor of a major key, or the relative major of a minor one. */
export function relativeKey(tonic: string, scale: "major" | "minor"): string {
  const i = PITCH_CLASSES.indexOf(tonic);
  return scale === "major"
    ? `${PITCH_CLASSES[(i + 9) % 12]} minor`
    : `${PITCH_CLASSES[(i + 3) % 12]} major`;
}

// Scale degrees and triad qualities. Natural minor is the major pattern rotated
// to start on its sixth degree, which is why relative keys share their chords.
const SCALES = {
  major: {
    steps: [0, 2, 4, 5, 7, 9, 11],
    qualities: ["", "m", "m", "", "", "m", "dim"],
    numerals: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  },
  minor: {
    steps: [0, 2, 3, 5, 7, 8, 10],
    qualities: ["m", "dim", "", "m", "m", "", ""],
    numerals: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
  },
} as const;

export type Chord = { numeral: string; name: string };

/** The seven diatonic triads of a key, in scale-degree order. */
export function diatonicChords(tonic: string, scale: "major" | "minor"): Chord[] {
  const root = PITCH_CLASSES.indexOf(tonic);
  const { steps, qualities, numerals } = SCALES[scale];
  return steps.map((step, i) => ({
    numeral: numerals[i],
    name: PITCH_CLASSES[(root + step) % 12] + qualities[i],
  }));
}
