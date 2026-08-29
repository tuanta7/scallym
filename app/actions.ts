"use server";

import { revalidatePath } from "next/cache";
import { Midi } from "@tonejs/midi";
import { fetchClip, fetchTitle } from "@/lib/audio";
import { transcribe } from "@/lib/basicPitch";
import { detectBpm } from "@/lib/tempo";
import { detectKey, type KeyResult } from "@/lib/key";
import { analyses, CACHE_TTL_MS, type Analysis } from "@/lib/mongo";
import { parseTimestamp } from "@/lib/time";

const MAX_CLIP_SECONDS = 30;

export type NoteRow = { time: number; name: string; duration: number };

export type AnalyzeState =
  | { error: string }
  | (KeyResult & {
      videoId: string;
      title?: string | null;
      bpm?: number | null;
      start: number;
      end: number;
      noteCount: number;
      notes: NoteRow[];
      cached: boolean;
    })
  | null;

/**
 * The subset of a stored analysis the client needs: no _id, and the MIDI blob
 * unpacked into a note list rather than sent down as bytes.
 */
function toState(a: Analysis, cached: boolean): AnalyzeState {
  const { key, tonic, scale, confidence, histogram, videoId, title, bpm, start, end, noteCount } = a;
  // Mongo hands back a Binary unless promoteBuffers is on; both wrap a Buffer.
  const bytes = a.midi instanceof Uint8Array ? a.midi : (a.midi as { buffer: Buffer }).buffer;
  const notes = new Midi(bytes).tracks[0].notes.map(({ time, name, duration }) => ({
    time,
    name,
    duration,
  }));
  return {
    key, tonic, scale, confidence, histogram,
    videoId, title, bpm, start, end, noteCount, notes, cached,
  };
}

function videoId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

export async function analyze(
  _prev: AnalyzeState,
  formData: FormData,
): Promise<AnalyzeState> {
  // A server action is reachable by direct POST, so validate everything here.
  const id = videoId(String(formData.get("url") ?? ""));
  if (!id) return { error: "Not a YouTube video URL" };

  const start = parseTimestamp(String(formData.get("start") ?? ""));
  const end = parseTimestamp(String(formData.get("end") ?? ""));
  if (start === null || end === null) return { error: "Timestamps must be mm:ss or seconds" };
  if (end <= start) return { error: "End must be after start" };
  if (end - start > MAX_CLIP_SECONDS) {
    return { error: `Clip must be ${MAX_CLIP_SECONDS}s or shorter` };
  }

  const _id = `${id}:${start}-${end}`;
  const col = await analyses();
  const hit = await col.findOne({ _id }).lean<Analysis>();
  if (hit) return toState(hit, true);

  try {
    const url = `https://youtu.be/${id}`;
    const [title, pcm] = await Promise.all([
      fetchTitle(url),
      fetchClip(url, start, end),
    ]);
    const notes = await transcribe(pcm);
    const bpm = detectBpm(pcm);
    const result = detectKey(notes);
    if (!result) return { error: "No pitched notes found in that clip" };

    // Same note events the key came from, kept as a MIDI artifact.
    const midi = new Midi();
    const track = midi.addTrack();
    track.name = _id;
    for (const n of notes) {
      track.addNote({
        midi: n.pitchMidi,
        time: n.startTimeSeconds,
        duration: n.durationSeconds,
        velocity: n.amplitude,
      });
    }

    const doc: Omit<Analysis, "createdAt"> = {
      _id,
      ...result,
      videoId: id,
      title,
      bpm,
      start,
      end,
      noteCount: notes.length,
      url,
      midi: Buffer.from(midi.toArray()),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    };
    const saved = await col.create(doc);
    revalidatePath("/"); // so the new clip shows up in the history list
    return toState(saved.toObject(), false);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Analysis failed" };
  }
}
