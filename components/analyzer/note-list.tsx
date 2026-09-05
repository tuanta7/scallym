import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NoteRow } from "@/app/actions";

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
          {notes.map((note, index) => (
            <li key={index} className="flex justify-between border-b py-1 last:border-0">
              <span className="text-muted-foreground tabular-nums">{formatNoteTime(note.time)}</span>
              <span className="font-medium">{note.name}</span>
              <span className="text-muted-foreground tabular-nums">{note.duration.toFixed(2)}s</span>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

function formatNoteTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;
}

export { NoteList };
