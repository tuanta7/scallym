"use client";

import { forwardRef, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTimestamp, parseTimestamp } from "@/lib/time";

const QUICK_LENGTHS = [10, 20, 30];

type AnalysisFormProps = {
  action: (formData: FormData) => void;
  url: string;
  start: string;
  end: string;
  isPending: boolean;
  onUrlChange: Dispatch<SetStateAction<string>>;
  onStartChange: Dispatch<SetStateAction<string>>;
  onEndChange: Dispatch<SetStateAction<string>>;
};

const AnalysisForm = forwardRef<HTMLFormElement, AnalysisFormProps>(function AnalysisForm(
  { action, url, start, end, isPending, onUrlChange, onStartChange, onEndChange },
  ref,
) {
  const startSec = parseTimestamp(start);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="url">YouTube URL</Label>
        <Input
          id="url"
          name="url"
          required
          placeholder="https://youtu.be/…"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="start">Start</Label>
          <Input id="start" name="start" required value={start} onChange={(e) => onStartChange(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <span className="text-sm leading-none font-medium select-none">Length</span>
          <div role="group" aria-label="Clip length" className="flex gap-1">
            {QUICK_LENGTHS.map((duration) => (
              <Button
                key={duration}
                type="button"
                variant="outline"
                disabled={startSec === null}
                onClick={() => onEndChange(formatTimestamp(startSec! + duration))}
              >
                +{duration}s
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end">End</Label>
          <Input id="end" name="end" required value={end} onChange={(e) => onEndChange(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full h-8">
        {isPending ? "Analyzing…" : "Analyze"}
      </Button>
    </form>
  );
});

export { AnalysisForm };
