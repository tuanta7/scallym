"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { diatonicChords, PITCH_CLASSES, relativeKey } from "@/lib/key";
import { formatTimestamp, parseTimestamp } from "@/lib/time";
import { analyze, type NoteRow } from "./actions";

const QUICK_LENGTHS = [10, 20, 30];

export default function Page() {
  const [state, formAction, isPending] = useActionState(analyze, null);
  const [start, setStart] = useState("0:30");
  const [end, setEnd] = useState("1:00");
  const startSec = parseTimestamp(start);
  const result = state && !("error" in state) ? state : null;

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-8 p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="url">YouTube URL</Label>
          <Input id="url" name="url" required placeholder="https://youtu.be/…" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="start">Start</Label>
            <Input
              id="start"
              name="start"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="end">End</Label>
            <Input
              id="end"
              name="end"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {QUICK_LENGTHS.map((d) => (
            <Button
              key={d}
              type="button"
              variant="outline"
              size="sm"
              disabled={startSec === null}
              onClick={() => setEnd(formatTimestamp(startSec! + d))}
            >
              +{d}s
            </Button>
          ))}
        </div>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Analyzing…" : "Analyze"}
        </Button>
      </form>

      {isPending && (
        <AITextLoading
          texts={["Downloading…", "Transcribing…", "Finding the key…"]}
          interval={4000}
        />
      )}

      {state && "error" in state && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      {result && !isPending && (
        <div className="flex flex-col gap-6 rounded-xl border p-6">
          {result.title && (
            <a
              href={`https://youtu.be/${result.videoId}?t=${result.start}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground -mb-4 text-sm hover:underline"
            >
              {result.title}
            </a>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-semibold tracking-tight">{result.key}</span>
            <span className="text-muted-foreground text-sm">
              {result.noteCount} notes{result.cached && " · cached"}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
            <div>
              <dt className="text-muted-foreground">Tonic</dt>
              <dd className="text-lg">{result.tonic}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Scale</dt>
              <dd className="text-lg">{result.scale}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Relative</dt>
              <dd className="text-lg">{relativeKey(result.tonic, result.scale)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">BPM</dt>
              <dd className="text-lg">{result.bpm ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Confidence</dt>
              <dd className="text-lg">{result.confidence.toFixed(3)}</dd>
            </div>
          </dl>
          <Histogram values={result.histogram} tonic={result.tonic} />
          <Chords keyName={result.key} relative={relativeKey(result.tonic, result.scale)} />
          <NoteList notes={result.notes} />
        </div>
      )}
    </main>
  );
}

/** Diatonic chords of the detected key and of its relative, one tab each. */
function Chords({ keyName, relative }: { keyName: string; relative: string }) {
  return (
    <Tabs defaultValue={keyName} className="border-t pt-4">
      <TabsList>
        <TabsTrigger value={keyName}>{keyName}</TabsTrigger>
        <TabsTrigger value={relative}>{relative}</TabsTrigger>
      </TabsList>
      {[keyName, relative].map((k) => {
        const [tonic, scale] = k.split(" ") as [string, "major" | "minor"];
        return (
          <TabsContent key={k} value={k} className="mt-3 grid grid-cols-7 gap-1">
            {diatonicChords(tonic, scale).map((c) => (
              <div key={c.numeral} className="rounded-md border py-2 text-center">
                <div className="text-muted-foreground text-[10px]">{c.numeral}</div>
                <div className="text-sm font-medium">{c.name}</div>
              </div>
            ))}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function mmss(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;
}

function NoteList({ notes }: { notes: NoteRow[] }) {
  return (
    <details className="group border-t pt-4">
      <summary className="cursor-pointer text-sm select-none">
        Notes ({notes.length})
      </summary>
      <ul className="mt-3 max-h-64 overflow-y-auto text-sm">
        {notes.map((n, i) => (
          <li key={i} className="flex justify-between border-b py-1 last:border-0">
            <span className="text-muted-foreground tabular-nums">{mmss(n.time)}</span>
            <span className="font-medium">{n.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {n.duration.toFixed(2)}s
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Histogram({ values, tonic }: { values: number[]; tonic: string }) {
  const max = Math.max(...values);
  return (
    <div className="flex flex-col gap-1">
      {/* Bars are direct children so their % height resolves against h-32. */}
      <div className="flex h-32 items-end gap-1">
        {values.map((v, i) => (
          <div
            key={i}
            className={
              PITCH_CLASSES[i] === tonic
                ? "flex-1 rounded-t bg-emerald-500"
                : "bg-muted-foreground/30 flex-1 rounded-t"
            }
            style={{ height: `${Math.max((v / max) * 100, 1)}%` }}
          />
        ))}
      </div>
      <div className="flex gap-1">
        {PITCH_CLASSES.map((p) => (
          <span key={p} className="text-muted-foreground flex-1 text-center text-[10px]">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
