import { recent, type RecentAnalysis } from "@/lib/mongo";
import Analyzer from "./analyzer";

export default async function Page() {
  // A database outage should cost the history list, not the whole page.
  let history: RecentAnalysis[] = [];
  try {
    history = await recent();
  } catch {
    history = [];
  }
  return <Analyzer history={history} />;
}
