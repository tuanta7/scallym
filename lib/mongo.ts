import { MongoClient } from "mongodb";
import type { KeyResult } from "./key";

export type Analysis = KeyResult & {
  _id: string; // `${videoId}:${start}-${end}`
  videoId: string;
  title?: string;
  bpm?: number | null;
  start: number;
  end: number;
  noteCount: number;
  url: string;
  midi: Buffer;
  createdAt: Date;
  expiresAt: Date;
};

/** How long a stored analysis stays valid. The pipeline is deterministic, but
 *  yt-dlp may serve a different `bestaudio` rendition later, so results are not
 *  pinned to the input forever. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Memoised on globalThis so HMR reloads reuse one connection pool. Connecting
// lazily keeps a failed connection from becoming an unhandled rejection at import.
const g = globalThis as typeof globalThis & {
  _mongo?: Promise<MongoClient>;
  _ttlIndex?: Promise<string>;
};

export async function analyses() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const client = await (g._mongo ??= new MongoClient(uri).connect());
  const col = client.db().collection<Analysis>("analyses");
  // Mongo expires the documents itself; expireAfterSeconds:0 means "at expiresAt".
  await (g._ttlIndex ??= col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }));
  return col;
}
