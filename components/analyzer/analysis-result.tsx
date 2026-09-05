import { Chords } from "./chords";
import { Histogram } from "./histogram";
import { NoteList } from "./note-list";
import { relativeKey } from "@/lib/key";
import type { AnalyzeState } from "@/app/actions";

type AnalysisResultState = Exclude<AnalyzeState, null | { error: string }>;

function AnalysisResult({ result }: { result: AnalysisResultState }) {
  const relative = relativeKey(result.tonic, result.scale);

  return (
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
          <dd className="text-lg">{relative}</dd>
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
      <Chords keyName={result.key} relative={relative} />
      <div className="flex border-t pt-4">
        <NoteList notes={result.notes} />
      </div>
    </div>
  );
}

function bpmLabel(bpm: number) {
  const alt = Math.round((bpm > 120 ? bpm / 2 : bpm * 2) * 10) / 10;
  return alt >= 60 && alt <= 200 ? `${bpm} or ${alt}` : String(bpm);
}

export { AnalysisResult };
