import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const DB_NAME = "scallym";

/** How long a stored analysis stays valid. The pipeline is deterministic, but
 *  yt-dlp may serve a different `bestaudio` rendition later, so results are not
 *  pinned to the input forever. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const analysisSchema = new Schema(
  {
    _id: String, // `${videoId}:${start}-${end}`
    videoId: { type: String, required: true },
    title: String,
    bpm: Number,
    key: { type: String, required: true },
    tonic: { type: String, required: true },
    scale: { type: String, required: true, enum: ["major", "minor"] },
    confidence: { type: Number, required: true },
    histogram: { type: [Number], required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    noteCount: { type: Number, required: true },
    url: { type: String, required: true },
    midi: { type: Buffer, required: true },
    // Mongo expires the documents itself; expires:0 means "at expiresAt".
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export type Analysis = InferSchemaType<typeof analysisSchema>;

// Memoised on globalThis so HMR reloads reuse one connection and one model.
const g = globalThis as typeof globalThis & { _mongoose?: Promise<Model<Analysis>> };

async function connect(): Promise<Model<Analysis>> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  // dbName wins over whatever path the URI carries.
  await mongoose.connect(uri, { dbName: DB_NAME });
  return (mongoose.models.Analysis ??
    mongoose.model("Analysis", analysisSchema)) as Model<Analysis>;
}

export function analyses(): Promise<Model<Analysis>> {
  return (g._mongoose ??= connect().catch((e) => {
    // Never cache a failed connection, or a Mongo blip at startup would poison
    // every later request.
    g._mongoose = undefined;
    throw e;
  }));
}
