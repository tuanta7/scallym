import assert from "node:assert/strict";
import { detectKey, diatonicChords, relativeKey, type Note } from "./key.ts";

// Build notes whose total duration per pitch class matches a key profile, so a
// correct implementation must recover that key.
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const notesFor = (profile: number[], tonic: number): Note[] =>
  profile.map((d, i) => ({ pitchMidi: 60 + ((i + tonic) % 12), durationSeconds: d }));

const cMajor = detectKey(notesFor(MAJOR, 0))!;
assert.equal(cMajor.key, "C major");
assert.ok(cMajor.confidence > 0);

assert.equal(detectKey(notesFor(MINOR, 9))!.key, "A minor");
assert.equal(detectKey(notesFor(MAJOR, 7))!.key, "G major");
assert.equal(detectKey([]), null);



assert.equal(relativeKey("C", "major"), "A minor");
assert.equal(relativeKey("A", "minor"), "C major");
assert.equal(relativeKey("E", "major"), "C# minor");


assert.deepEqual(
  diatonicChords("C", "major").map((c) => c.name),
  ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
);
assert.deepEqual(
  diatonicChords("E", "minor").map((c) => c.name),
  ["Em", "F#dim", "G", "Am", "Bm", "C", "D"],
);
// Relative keys are the same seven chords, just rotated.
assert.deepEqual(
  new Set(diatonicChords("A", "minor").map((c) => c.name)),
  new Set(diatonicChords("C", "major").map((c) => c.name)),
);
console.log("ok");
