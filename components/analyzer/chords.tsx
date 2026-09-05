import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { diatonicChords } from "@/lib/key";

function Chords({ keyName, relative }: { keyName: string; relative: string }) {
  return (
    <Tabs defaultValue={keyName} className="border-t pt-4">
      <TabsList>
        <TabsTrigger value={keyName}>{keyName}</TabsTrigger>
        <TabsTrigger value={relative}>{relative}</TabsTrigger>
      </TabsList>
      {[keyName, relative].map((key) => {
        const [tonic, scale] = key.split(" ") as [string, "major" | "minor"];
        return (
          <TabsContent key={key} value={key} className="mt-3 grid grid-cols-7 gap-1">
            {diatonicChords(tonic, scale).map((chord) => (
              <div key={chord.numeral} className="rounded-md border py-2 text-center">
                <div className="text-muted-foreground text-[10px]">{chord.numeral}</div>
                <div className="text-sm font-medium">{chord.name}</div>
              </div>
            ))}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

export { Chords };
