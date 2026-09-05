"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/time";
import type { RecentAnalysis } from "@/lib/mongo";

const HISTORY_PAGE_SIZE = 3;

function History({ items, onPick }: { items: RecentAnalysis[]; onPick: (item: RecentAnalysis) => void }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / HISTORY_PAGE_SIZE);
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
        {items.slice(current * HISTORY_PAGE_SIZE, (current + 1) * HISTORY_PAGE_SIZE).map((item) => (
          <li key={item._id}>
            <button
              type="button"
              onClick={() => onPick(item)}
              className="hover:text-emerald-500 flex w-full items-baseline gap-3 rounded-md text-left text-sm p-2 cursor-pointer"
            >
              <span className="flex-1 truncate min-w-10">{item.title ?? item.videoId}</span>
              <span className="lg:w-30 text-muted-foreground shrink-0 tabular-nums text-center">
                {formatTimestamp(item.start)}–{formatTimestamp(item.end)}
              </span>
              <span className="lg:w-30 shrink-0 text-center">{item.key}</span>
              <span className="text-muted-foreground lg:w-30 shrink-0 text-right whitespace-nowrap tabular-nums">
                {item.bpm ? `${item.bpm} BPM` : "—"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { History };
