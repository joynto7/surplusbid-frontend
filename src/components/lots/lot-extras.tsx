"use client";

import { useEffect } from "react";
import { LuSparkles } from "react-icons/lu";
import { useAskAi } from "@/components/ai/chat-widget";
import { Button } from "@/components/ui/button";
import { rememberLotView, viewerId } from "@/lib/activity";
import { api } from "@/lib/api/client";

/** Counts the page view once per visitor and remembers the lot for AI recommendations. */
export function LotViewTracker({ lotId, categoryId }: { lotId: string; categoryId: string }) {
  useEffect(() => {
    rememberLotView({ id: lotId, categoryId });
    api.recordView(lotId, viewerId()).catch(() => undefined);
  }, [lotId, categoryId]);
  return null;
}

export function AskAiButton({ title }: { title: string }) {
  const ask = useAskAi();
  return (
    <Button variant="outline" className="w-full" onClick={() => ask(`Tell me about this lot: ${title}`)}>
      <LuSparkles className="text-primary" /> Ask AI about this lot
    </Button>
  );
}
