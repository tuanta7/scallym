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
};

// Memoised on globalThis so HMR reloads reuse one connection pool. Connecting
// lazily keeps a failed connection from becoming an unhandled rejection at import.
const g = globalThis as typeof globalThis & { _mongo?: Promise<MongoClient> };

export async function analyses() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const client = await (g._mongo ??= new MongoClient(uri).connect());
  return client.db().collection<Analysis>("analyses");
}
