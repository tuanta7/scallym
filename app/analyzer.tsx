"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { diatonicChords, PITCH_CLASSES, relativeKey } from "@/lib/key";
import { formatTimestamp, parseTimestamp } from "@/lib/time";
import type { RecentAnalysis } from "@/lib/mongo";
import { analyze, type NoteRow } from "./actions";

const QUICK_LENGTHS = [10, 20, 30];
const HISTORY_PAGE_SIZE = 3;

export default function Analyzer({ history }: { history: RecentAnalysis[] }) {
  const [state, formAction, isPending] = useActionState(analyze, null);
  const [url, setUrl] = useState("");
  const [start, setStart] = useState("0:30");
  const [end, setEnd] = useState("1:00");
  const startSec = parseTimestamp(start);
  const formRef = useRef<HTMLFormElement>(null);
  // Submit only once the picked values have rendered into the inputs.
  const [submitPicked, setSubmitPicked] = useState(false);
  useEffect(() => {
    if (!submitPicked) return;
    // Request submit immediately, but defer clearing the flag to avoid
    // synchronously setting state during the effect (causes cascading renders).
    formRef.current?.requestSubmit();
    const t = setTimeout(() => setSubmitPicked(false), 0);
    return () => clearTimeout(t);
  }, [submitPicked]);
  const result = state && !("error" in state) ? state : null;

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-8 p-6 mt-3">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="url">YouTube URL</Label>
          <Input
            id="url"
            name="url"
            required
            placeholder="https://youtu.be/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="grid gap-2">
            <Label htmlFor="start">Start</Label>
            <Input id="start" name="start" required value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <span className="text-sm leading-none font-medium select-none">Length</span>
            <div role="group" aria-label="Clip length" className="flex gap-1">
              {QUICK_LENGTHS.map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant="outline"
                  disabled={startSec === null}
                  onClick={() => setEnd(formatTimestamp(startSec! + d))}
                >
                  +{d}s
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="end">End</Label>
            <Input id="end" name="end" required value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={isPending} className="w-full h-8">
          {isPending ? "Analyzing…" : "Analyze"}
        </Button>
      </form>

      {isPending && <AITextLoading texts={["Downloading…", "Transcribing…", "Finding the key…"]} interval={4000} />}
      {state && "error" in state && <p className="text-sm text-red-500">{state.error}</p>}
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
              <dd className="text-lg">{result.bpm ? bpmLabel(result.bpm) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Confidence</dt>
              <dd className="text-lg">{result.confidence.toFixed(3)}</dd>
            </div>
          </dl>
          <Histogram values={result.histogram} tonic={result.tonic} />
          <Chords keyName={result.key} relative={relativeKey(result.tonic, result.scale)} />
          <div className="flex border-t pt-4">
            <NoteList notes={result.notes} />
          </div>
        </div>
      )}
      {history.length > 0 && (
        <History
          items={history}
          onPick={(h) => {
            setUrl(`https://youtu.be/${h.videoId}`);
            setStart(formatTimestamp(h.start));
            setEnd(formatTimestamp(h.end));
            setSubmitPicked(true);
          }}
        />
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

/** Previously analysed clips. Clicking one refills the form and submits it; that
 *  is a cache hit, so the stored result comes straight back. */
function History({ items, onPick }: { items: RecentAnalysis[]; onPick: (h: RecentAnalysis) => void }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / HISTORY_PAGE_SIZE);
  // The list shrinks as clips expire out of the cache, so the page can outrun it.
  const current = Math.min(page, pageCount - 1);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium px-2">Recent</h2>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="text-muted-foreground text-sm tabular-nums">
              {current + 1} / {pageCount}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Next page"
              disabled={current === pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
      <ul className="flex flex-col">
        {items.slice(current * HISTORY_PAGE_SIZE, (current + 1) * HISTORY_PAGE_SIZE).map((h) => (
          <li key={h._id}>
            <button
              type="button"
              onClick={() => onPick(h)}
              className="hover:text-emerald-500 flex w-full items-baseline gap-3 rounded-md text-left text-sm p-2 cursor-pointer"
            >
              <span className="flex-1 truncate min-w-10">{h.title ?? h.videoId}</span>
              <span className="lg:w-30 text-muted-foreground shrink-0 tabular-nums text-center">
                {formatTimestamp(h.start)}–{formatTimestamp(h.end)}
              </span>
              <span className="lg:w-30 shrink-0 text-center">{h.key}</span>
              <span className="text-muted-foreground lg:w-30 shrink-0 text-right whitespace-nowrap tabular-nums">
                {h.bpm ? `${h.bpm} BPM` : "—"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The detector cannot tell a pulse from its double, so show the other reading
 *  too whenever it is also a plausible tempo. */
function bpmLabel(bpm: number) {
  const alt = Math.round((bpm > 120 ? bpm / 2 : bpm * 2) * 10) / 10;
  return alt >= 60 && alt <= 200 ? `${bpm} or ${alt}` : String(bpm);
}

function mmss(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;
}

function NoteList({ notes }: { notes: NoteRow[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="self-start">
          Notes ({notes.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>Notes ({notes.length})</SheetTitle>
        </SheetHeader>
        <ul className="overflow-y-auto px-4 pb-4 text-sm">
          {notes.map((n, i) => (
            <li key={i} className="flex justify-between border-b py-1 last:border-0">
              <span className="text-muted-foreground tabular-nums">{mmss(n.time)}</span>
              <span className="font-medium">{n.name}</span>
              <span className="text-muted-foreground tabular-nums">{n.duration.toFixed(2)}s</span>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
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
              PITCH_CLASSES[i] === tonic ? "flex-1 rounded-t bg-emerald-500" : "bg-muted-foreground/30 flex-1 rounded-t"
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
