import { spawn } from "node:child_process";

const SAMPLE_RATE = 22050; // basic-pitch requires exactly this, mono

/** The video's title, without downloading any media. */
export function fetchTitle(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn("yt-dlp", ["--skip-download", "--no-playlist", "--print", "title", url]);
    let out = "";
    p.stdout.on("data", (c: Buffer) => (out += c));
    p.on("error", () => reject(new Error("yt-dlp is not installed or not on PATH")));
    p.on("close", (code) =>
      code === 0 && out.trim()
        ? resolve(out.trim())
        : reject(new Error("Could not read that video's title")),
    );
  });
}

/**
 * Download just [startSec, endSec) of a video's audio and decode it to mono
 * 22050Hz float samples, ready to hand straight to basic-pitch.
 */
export function fetchClip(
  url: string,
  startSec: number,
  endSec: number,
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", [
      "-f", "bestaudio",
      "--download-sections", `*${startSec}-${endSec}`,
      "--force-keyframes-at-cuts",
      "--no-playlist",
      "--quiet",
      "-o", "-",
      url,
    ]);
    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner", "-loglevel", "error",
      "-i", "pipe:0",
      "-ac", "1",
      "-ar", String(SAMPLE_RATE),
      "-f", "f32le",
      "pipe:1",
    ]);

    ytdlp.stdout.pipe(ffmpeg.stdin);
    // ffmpeg can exit before yt-dlp finishes writing; that EPIPE is expected.
    ytdlp.stdout.on("error", () => {});
    ffmpeg.stdin.on("error", () => {});

    const chunks: Buffer[] = [];
    let stderr = "";
    ffmpeg.stdout.on("data", (c: Buffer) => chunks.push(c));
    ytdlp.stderr.on("data", (c: Buffer) => (stderr += c));
    ffmpeg.stderr.on("data", (c: Buffer) => (stderr += c));

    const fail = (msg: string) =>
      reject(new Error(`${msg}\n${stderr.trim().split("\n").slice(-3).join("\n")}`));

    ytdlp.on("error", () => fail("yt-dlp is not installed or not on PATH"));
    ffmpeg.on("error", () => fail("ffmpeg is not installed or not on PATH"));

    let ytdlpFailed = false;
    ytdlp.on("close", (code) => {
      if (code !== 0) ytdlpFailed = true;
    });

    ffmpeg.on("close", (code) => {
      if (ytdlpFailed) return fail("Could not download that video's audio");
      if (code !== 0) return fail("Could not decode that video's audio");
      const buf = Buffer.concat(chunks);
      if (buf.length < SAMPLE_RATE * 4) return fail("Clip is empty or too short");
      resolve(new Float32Array(buf.buffer, buf.byteOffset, buf.length >> 2));
    });
  });
}
