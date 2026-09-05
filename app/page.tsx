import { recent, type RecentAnalysis } from "@/lib/mongo";
import Analyzer from "@/components/analyzer";

export default async function Page() {
  let history: RecentAnalysis[] = [];
  try {
    history = await recent();
  } catch {
    // A database outage should only cost the history list.
    history = [];
  }
  return <Analyzer history={history} />;
}
