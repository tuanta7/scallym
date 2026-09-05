import { PITCH_CLASSES } from "@/lib/key";

function Histogram({ values, tonic }: { values: number[]; tonic: string }) {
  const max = Math.max(...values);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-32 items-end gap-1">
        {values.map((value, index) => (
          <div
            key={index}
            className={
              PITCH_CLASSES[index] === tonic ? "flex-1 rounded-t bg-emerald-500" : "bg-muted-foreground/30 flex-1 rounded-t"
            }
            style={{ height: `${Math.max((value / max) * 100, 1)}%` }}
          />
        ))}
      </div>
      <div className="flex gap-1">
        {PITCH_CLASSES.map((pitchClass) => (
          <span key={pitchClass} className="text-muted-foreground flex-1 text-center text-[10px]">
            {pitchClass}
          </span>
        ))}
      </div>
    </div>
  );
}

export { Histogram };
