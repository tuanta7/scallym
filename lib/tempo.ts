import MusicTempo from "music-tempo";

const SAMPLE_RATE = 22050;
const HOP_SIZE = 220; // music-tempo defaults to 441 @ 44100Hz; halve it for ours

/**
 * Beat tracking over the raw audio (not the transcribed notes — percussion
 * carries the pulse and basic-pitch does not transcribe it).
 * Returns null if no stable pulse was found.
 */
export function detectBpm(pcm: Float32Array): number | null {
  const { tempo } = new MusicTempo(pcm, {
    hopSize: HOP_SIZE,
    timeStep: HOP_SIZE / SAMPLE_RATE,
  });
  // music-tempo returns a toFixed(3) string, or the number -1 when it finds nothing.
  const bpm = Number(tempo);
  return bpm > 0 ? Math.round(bpm * 10) / 10 : null;
}
