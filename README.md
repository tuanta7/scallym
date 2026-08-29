# Scallym

Identify a song's key, tonic, and scale from a YouTube clip.

Paste a link and a start/end timestamp (30s max). The server pulls that segment with
`yt-dlp`, transcribes it to notes with [basic-pitch](https://github.com/spotify/basic-pitch-ts),
and derives the key with the Krumhansl-Schmuckler algorithm. Results (and the transcribed
MIDI) are stored in MongoDB, which doubles as a cache.

## Requirements

- `yt-dlp` and `ffmpeg` on `PATH`
- MongoDB — e.g. `docker run -d -p 27017:27017 mongo:8`

## Setup

```sh
pnpm install
echo 'MONGODB_URI=mongodb://localhost:27017/scallym' > .env.local
pnpm dev
```

Transcription is CPU-bound and runs synchronously: expect ~60s for a 30s clip.

## Tests

```sh
node --experimental-strip-types lib/key.test.ts
```
