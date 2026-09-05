"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { AnalysisForm } from "./analysis-form";
import { AnalysisResult } from "./analysis-result";
import { History } from "./history";
import { formatTimestamp } from "@/lib/time";
import type { RecentAnalysis } from "@/lib/mongo";
import { analyze } from "@/app/actions";

export default function Analyzer({ history }: { history: RecentAnalysis[] }) {
  const [state, formAction, isPending] = useActionState(analyze, null);
  const [url, setUrl] = useState("");
  const [start, setStart] = useState("0:30");
  const [end, setEnd] = useState("1:00");
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
      <AnalysisForm
        ref={formRef}
        action={formAction}
        url={url}
        start={start}
        end={end}
        isPending={isPending}
        onUrlChange={setUrl}
        onStartChange={setStart}
        onEndChange={setEnd}
      />

      {isPending && <AITextLoading texts={["Downloading…", "Transcribing…", "Finding the key…"]} interval={4000} />}
      {state && "error" in state && <p className="text-sm text-red-500">{state.error}</p>}
      {result && !isPending && <AnalysisResult result={result} />}
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
