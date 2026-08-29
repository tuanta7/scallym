/** Accepts "83", "1:23" or "1:02:03"; returns whole seconds, or null if malformed. */
export function parseTimestamp(raw: string): number | null {
  if (!/^\d+(:[0-5]?\d){0,2}$/.test(raw.trim())) return null;
  return raw
    .trim()
    .split(":")
    .reduce((acc, part) => acc * 60 + Number(part), 0);
}

/** Inverse of parseTimestamp, as "m:ss". */
export function formatTimestamp(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
