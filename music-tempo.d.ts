declare module "music-tempo" {
  export default class MusicTempo {
    constructor(
      audioData: ArrayLike<number>,
      params?: { hopSize?: number; timeStep?: number; [k: string]: unknown },
    );
    /** Stringified BPM via toFixed(3), or the number -1 when no beat was found. */
    tempo: string | number;
    beats: number[];
    /** Onset strength per frame, normalised to 0–1. */
    spectralFlux: number[];
  }
}
