# Scallym

Identify a song's key, tonic, and scale from a YouTube clip.

Paste a link and a start/end timestamp (30s max).

- The server pulls that segment with `yt-dlp`
- Transcribes it to notes with [basic-pitch](https://github.com/spotify/basic-pitch-ts)
- Derives the key with the Krumhansl-Schmuckler algorithm

Results (and the transcribed MIDI) are stored in MongoDB, which doubles as a cache.

Transcription is CPU-bound and runs synchronously: expect ~60s for a 30s clip.

## Dependencies

- MongoDB: [https://cloud.mongodb.com]() — set `MONGODB_URI` in `.env.local`; the database name is pinned to `scallym`, so any path on the URI is ignored
- Audio processing tools: `yt-dlp` and `ffmpeg`
